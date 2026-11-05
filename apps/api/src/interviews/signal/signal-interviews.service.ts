import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ExperienceLevel,
  SignalActionInput,
  SignalDimensionScore,
  SignalSession,
  SignalSessionSummary,
  SignalVariant,
} from '@tayyari/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StartSignalInterviewDto } from './dto/start-signal-interview.dto';
import { SignalActionDto } from './dto/signal-action.dto';
import { SignalReplayDto } from './dto/signal-replay.dto';
import { ScenarioRuntime, type HiddenState } from './scenario-runtime';
import {
  SIGNAL_RUBRIC_VERSION,
  evaluateSignalSession,
} from './signal-evaluation';

type SessionRow = Prisma.SignalSessionGetPayload<{
  include: {
    events: true;
    hypotheses: true;
    decisions: true;
    evaluation: true;
  };
}>;

@Injectable()
export class SignalInterviewsService {
  private readonly runtime = new ScenarioRuntime();

  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    input: StartSignalInterviewDto,
  ): Promise<SignalSession> {
    const scenarioId = input.scenarioId?.trim() || 'checkout-latency';
    const variant = (input.variant ?? 'delayed_incomplete') as SignalVariant;
    const scenario = this.runtime.load(scenarioId);
    const hidden = this.runtime.initialHiddenState(scenarioId, variant);
    const briefingMessage = scenario.briefing;

    const created = await this.prisma.signalSession.create({
      data: {
        userId,
        scenarioId: scenario.id,
        scenarioVersion: scenario.version,
        variant,
        role: input.role?.trim() || 'Backend Engineer',
        experienceLevel: input.experienceLevel ?? 'junior',
        status: 'in_progress',
        phase: 'investigate',
        simulatedTimeSeconds: 0,
        hiddenState: hidden as unknown as Prisma.InputJsonValue,
        events: {
          create: {
            sequence: 0,
            eventType: 'session_started',
            payload: { variant, scenarioId: scenario.id },
            simulatedTimeSeconds: 0,
            summary: 'Signal Integrity session started',
          },
        },
      },
      include: {
        events: { orderBy: { sequence: 'asc' } },
        hypotheses: { orderBy: { sequence: 'asc' } },
        decisions: { orderBy: { sequence: 'asc' } },
        evaluation: true,
      },
    });

    return this.toSessionResponse(created, briefingMessage);
  }

  async listForUser(userId: string): Promise<SignalSessionSummary[]> {
    const rows = await this.prisma.signalSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
    return rows.map((row) => {
      const scenario = this.runtime.load(row.scenarioId);
      return {
        id: row.id,
        scenarioId: row.scenarioId,
        scenarioTitle: scenario.title,
        variant: row.variant as SignalVariant,
        status: row.status as SignalSessionSummary['status'],
        role: row.role,
        experienceLevel: row.experienceLevel as ExperienceLevel,
        startedAt: row.startedAt.toISOString(),
        completedAt: row.completedAt?.toISOString() ?? null,
      };
    });
  }

  async getForUser(userId: string, sessionId: string): Promise<SignalSession> {
    const session = await this.findSession(userId, sessionId);
    return this.toSessionResponse(session);
  }

  async applyAction(
    userId: string,
    sessionId: string,
    dto: SignalActionDto,
  ): Promise<SignalSession> {
    const session = await this.findSession(userId, sessionId);
    if (session.status === 'completed') {
      throw new BadRequestException('Signal session already completed');
    }

    const action = this.toActionInput(dto);
    const hidden = session.hiddenState as unknown as HiddenState;
    const scenario = this.runtime.load(session.scenarioId);
    let result;
    try {
      result = this.runtime.apply(
        {
          scenario,
          variant: session.variant as SignalVariant,
          simulatedTimeSeconds: session.simulatedTimeSeconds,
          unlockedEvidenceKeys: hidden.unlockedEvidenceKeys ?? [],
          lastInterviewerMessage: hidden.lastInterviewerMessage,
        },
        action,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid action',
      );
    }

    const nextSequence =
      session.events.reduce((max, event) => Math.max(max, event.sequence), -1) +
      1;

    await this.prisma.$transaction(async (tx) => {
      await tx.signalEvent.create({
        data: {
          sessionId: session.id,
          sequence: nextSequence,
          eventType: result.eventType,
          payload: result.eventPayload as Prisma.InputJsonValue,
          simulatedTimeSeconds: result.simulatedTimeSeconds,
          summary: result.eventSummary,
        },
      });

      if (
        action.type === 'submit_hypothesis' ||
        action.type === 'revise_hypothesis'
      ) {
        const latest = session.hypotheses.at(-1);
        await tx.signalHypothesis.create({
          data: {
            sessionId: session.id,
            claim: action.claim,
            supportingEvidenceKeys: action.supportingEvidenceKeys,
            missingEvidence: action.missingEvidence ?? null,
            confidence: action.confidence ?? null,
            sequence: nextSequence,
            supersedesId:
              action.type === 'revise_hypothesis' ? (latest?.id ?? null) : null,
          },
        });
      }

      if (result.decisionOutcome && action.type === 'commit_decision') {
        await tx.signalDecision.create({
          data: {
            sessionId: session.id,
            decisionKey: result.decisionOutcome.decisionKey,
            description: result.decisionOutcome.description,
            reasoning: action.reasoning,
            expectedEffect: action.expectedEffect,
            verificationPlan: action.verificationPlan,
            supportingEvidenceKeys: action.supportingEvidenceKeys,
            outcomeSummary: result.decisionOutcome.outcomeSummary,
            sequence: nextSequence,
          },
        });
      }

      const phase =
        result.phaseHint === 'outcome' ? 'outcome' : result.phaseHint;

      await tx.signalSession.update({
        where: { id: session.id },
        data: {
          simulatedTimeSeconds: result.simulatedTimeSeconds,
          hiddenState: result.hiddenState as unknown as Prisma.InputJsonValue,
          phase,
          ...(result.phaseHint === 'outcome'
            ? { status: 'completed', completedAt: new Date(), phase: 'debrief' }
            : {}),
        },
      });
    });

    if (result.phaseHint === 'outcome') {
      await this.writeEvaluation(userId, sessionId);
    }

    return this.getForUser(userId, sessionId);
  }

  async replay(
    userId: string,
    sessionId: string,
    dto: SignalReplayDto,
  ): Promise<SignalSession> {
    const session = await this.findSession(userId, sessionId);
    if (session.status !== 'completed') {
      throw new BadRequestException('Replay is available after the debrief');
    }
    const decision = session.decisions.find(
      (item) => item.id === dto.decisionId,
    );
    if (!decision) {
      throw new NotFoundException('Decision not found');
    }

    const notes =
      dto.keepOrChange === 'keep'
        ? 'Candidate kept the original decision on replay.'
        : `Candidate would change to ${dto.revisedDecisionKey ?? 'another action'} on replay.`;

    await this.prisma.signalReplay.create({
      data: {
        sessionId: session.id,
        decisionId: decision.id,
        keepOrChange: dto.keepOrChange,
        revisedDecisionKey: dto.revisedDecisionKey ?? null,
        reasoning: dto.reasoning,
        comparisonNotes: notes,
      },
    });

    await this.prisma.signalEvent.create({
      data: {
        sessionId: session.id,
        sequence:
          session.events.reduce(
            (max, event) => Math.max(max, event.sequence),
            -1,
          ) + 1,
        eventType: 'decision_replayed',
        payload: {
          decisionId: decision.id,
          keepOrChange: dto.keepOrChange,
          revisedDecisionKey: dto.revisedDecisionKey ?? null,
        },
        simulatedTimeSeconds: session.simulatedTimeSeconds,
        summary: notes,
      },
    });

    return this.getForUser(userId, sessionId);
  }

  private async writeEvaluation(userId: string, sessionId: string) {
    const session = await this.findSession(userId, sessionId);
    const scenario = this.runtime.load(session.scenarioId);
    const hidden = session.hiddenState as unknown as HiddenState;
    const evidenceRequested = session.events
      .filter((event) => event.eventType === 'evidence_requested')
      .map((event) => {
        const payload = event.payload as { evidenceKey?: string };
        return payload.evidenceKey ?? '';
      })
      .filter(Boolean);
    const askedQuestions = session.events.filter(
      (event) => event.eventType === 'question_asked',
    ).length;
    const unlocked = hidden.unlockedEvidenceKeys ?? [];
    const visible = this.runtime.visibleEvidence(
      scenario,
      session.variant as SignalVariant,
      unlocked,
      session.simulatedTimeSeconds,
    );
    const sawDelayedOrPartial = visible.some((item) =>
      ['delayed', 'partial', 'conflicting', 'unavailable'].includes(
        item.status,
      ),
    );
    const revisedAfterEvidence = session.hypotheses.some(
      (item) => item.supersedesId != null,
    );
    const lastDecision = session.decisions.at(-1);
    const decisionMeta = lastDecision
      ? scenario.decisions.find((item) => item.key === lastDecision.decisionKey)
      : null;

    const report = evaluateSignalSession({
      scenario,
      unlockedEvidenceKeys: unlocked,
      evidenceRequested,
      hypotheses: session.hypotheses.map((item) => ({
        claim: item.claim,
        supportingEvidenceKeys: item.supportingEvidenceKeys,
        confidence: item.confidence,
        isRevision: item.supersedesId != null,
      })),
      decision: lastDecision
        ? {
            decisionKey: lastDecision.decisionKey,
            reasoning: lastDecision.reasoning,
            verificationPlan: lastDecision.verificationPlan,
            supportingEvidenceKeys: lastDecision.supportingEvidenceKeys,
            quality: decisionMeta?.quality ?? 'weak',
          }
        : null,
      askedQuestions,
      sawDelayedOrPartial,
      revisedAfterEvidence,
      eventIds: session.events.map((event) => event.id),
    });

    await this.prisma.signalEvaluation.upsert({
      where: { sessionId: session.id },
      create: {
        sessionId: session.id,
        rubricVersion: SIGNAL_RUBRIC_VERSION,
        dimensions: report.dimensions as unknown as Prisma.InputJsonValue,
        strengths: report.strengths,
        gaps: report.gaps,
        recommendedPractice: report.recommendedPractice,
        overallSummary: report.overallSummary,
        scenarioExplanation: report.scenarioExplanation,
      },
      update: {
        dimensions: report.dimensions as unknown as Prisma.InputJsonValue,
        strengths: report.strengths,
        gaps: report.gaps,
        recommendedPractice: report.recommendedPractice,
        overallSummary: report.overallSummary,
        scenarioExplanation: report.scenarioExplanation,
      },
    });
  }

  private toActionInput(dto: SignalActionDto): SignalActionInput {
    switch (dto.type) {
      case 'request_evidence':
        return { type: 'request_evidence', evidenceKey: dto.evidenceKey! };
      case 'ask_question':
        return { type: 'ask_question', question: dto.question! };
      case 'submit_hypothesis':
        return {
          type: 'submit_hypothesis',
          claim: dto.claim!,
          supportingEvidenceKeys: dto.supportingEvidenceKeys ?? [],
          missingEvidence: dto.missingEvidence,
          confidence: dto.confidence,
        };
      case 'revise_hypothesis':
        return {
          type: 'revise_hypothesis',
          claim: dto.claim!,
          supportingEvidenceKeys: dto.supportingEvidenceKeys ?? [],
          missingEvidence: dto.missingEvidence,
          confidence: dto.confidence,
          reason: dto.reason!,
        };
      case 'commit_decision':
        return {
          type: 'commit_decision',
          decisionKey: dto.decisionKey!,
          reasoning: dto.reasoning!,
          expectedEffect: dto.expectedEffect!,
          verificationPlan: dto.verificationPlan!,
          supportingEvidenceKeys: dto.supportingEvidenceKeys ?? [],
        };
      case 'advance_clock':
        return { type: 'advance_clock', seconds: dto.seconds ?? 30 };
      default:
        throw new BadRequestException('Unsupported action');
    }
  }

  private async findSession(
    userId: string,
    sessionId: string,
  ): Promise<SessionRow> {
    const session = await this.prisma.signalSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        events: { orderBy: { sequence: 'asc' } },
        hypotheses: { orderBy: { sequence: 'asc' } },
        decisions: { orderBy: { sequence: 'asc' } },
        evaluation: true,
      },
    });
    if (!session) {
      throw new NotFoundException('Signal interview session not found');
    }
    return session;
  }

  private toSessionResponse(
    session: SessionRow,
    interviewerOverride?: string,
  ): SignalSession {
    const scenario = this.runtime.load(session.scenarioId);
    const hidden = session.hiddenState as unknown as HiddenState;
    const unlocked = hidden.unlockedEvidenceKeys ?? [];
    const unlockedEvidence = this.runtime.visibleEvidence(
      scenario,
      session.variant as SignalVariant,
      unlocked,
      session.simulatedTimeSeconds,
    );

    return {
      id: session.id,
      scenarioId: session.scenarioId,
      scenarioTitle: scenario.title,
      variant: session.variant as SignalVariant,
      status: session.status as SignalSession['status'],
      phase: session.phase as SignalSession['phase'],
      role: session.role,
      experienceLevel: session.experienceLevel as ExperienceLevel,
      briefing: scenario.briefing,
      simulatedTimeSeconds: session.simulatedTimeSeconds,
      visibleSignals: scenario.initialSignals,
      availableEvidenceKeys: unlocked,
      unlockedEvidence,
      evidenceCatalog: this.runtime.catalog(
        scenario,
        session.variant as SignalVariant,
      ),
      decisionOptions: this.runtime.decisionOptions(scenario),
      hypotheses: session.hypotheses.map((item) => ({
        id: item.id,
        claim: item.claim,
        supportingEvidenceKeys: item.supportingEvidenceKeys,
        missingEvidence: item.missingEvidence,
        confidence: item.confidence,
        sequence: item.sequence,
        supersedesId: item.supersedesId,
        createdAt: item.createdAt.toISOString(),
      })),
      decisions: session.decisions.map((item) => ({
        id: item.id,
        decisionKey: item.decisionKey,
        description: item.description,
        reasoning: item.reasoning,
        expectedEffect: item.expectedEffect,
        verificationPlan: item.verificationPlan,
        supportingEvidenceKeys: item.supportingEvidenceKeys,
        outcomeSummary: item.outcomeSummary,
        sequence: item.sequence,
        createdAt: item.createdAt.toISOString(),
      })),
      events: session.events.map((item) => ({
        id: item.id,
        sequence: item.sequence,
        eventType: item.eventType,
        simulatedTimeSeconds: item.simulatedTimeSeconds,
        summary: item.summary,
        createdAt: item.createdAt.toISOString(),
      })),
      interviewerMessage:
        interviewerOverride ??
        hidden.lastInterviewerMessage ??
        scenario.briefing,
      evaluation: session.evaluation
        ? {
            id: session.evaluation.id,
            rubricVersion: session.evaluation.rubricVersion,
            dimensions: session.evaluation
              .dimensions as unknown as SignalDimensionScore[],
            strengths: session.evaluation.strengths,
            gaps: session.evaluation.gaps,
            recommendedPractice: session.evaluation.recommendedPractice,
            overallSummary: session.evaluation.overallSummary,
            scenarioExplanation: session.evaluation.scenarioExplanation,
          }
        : null,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString() ?? null,
    };
  }
}
