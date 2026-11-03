import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ExperienceLevel,
  InterviewSession,
  InterviewSessionSummary,
  InterviewTurn,
  StartInterviewInput,
} from '@tayyari/shared';
import type {
  InterviewSession as PrismaInterviewSession,
  InterviewTurn as PrismaInterviewTurn,
} from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  LLM_CLIENT,
  type InterviewLlmContext,
  type LlmClient,
} from './llm/llm.types';
import { SpeechService } from './speech/speech.service';
import { assertWav } from './speech/wav';

type SessionWithTurns = PrismaInterviewSession & {
  turns: PrismaInterviewTurn[];
};

@Injectable()
export class InterviewsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_CLIENT) private readonly llm: LlmClient,
    private readonly speech: SpeechService,
  ) {}

  async create(
    userId: string,
    input: StartInterviewInput,
  ): Promise<InterviewSession> {
    const questionCount = input.questionCount ?? 5;
    const techStack = input.techStack
      .map((tech) => tech.trim())
      .filter(Boolean);
    const role = input.role.trim();

    const draftCtx: InterviewLlmContext = {
      role,
      techStack,
      experienceLevel: input.experienceLevel,
      questionCount,
      previousTurns: [],
    };
    const questionText = await this.llm.generateQuestion(draftCtx, 0);

    const session = await this.prisma.interviewSession.create({
      data: {
        userId,
        role,
        techStack,
        experienceLevel: input.experienceLevel,
        questionCount,
        status: 'in_progress',
        provider: this.llm.provider,
        turns: {
          create: [
            {
              orderIndex: 0,
              kind: 'main',
              questionText,
            },
          ],
        },
      },
      include: {
        turns: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return this.toSessionResponse(session);
  }

  async listForUser(userId: string): Promise<InterviewSessionSummary[]> {
    const sessions = await this.prisma.interviewSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: {
        _count: { select: { turns: true } },
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      role: session.role,
      techStack: session.techStack,
      experienceLevel: session.experienceLevel as ExperienceLevel,
      questionCount: session.questionCount,
      status: session.status as InterviewSession['status'],
      provider: session.provider as InterviewSession['provider'],
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString() ?? null,
      turnCount: session._count.turns,
    }));
  }

  async getForUser(
    userId: string,
    sessionId: string,
  ): Promise<InterviewSession> {
    const session = await this.findSessionForUser(userId, sessionId);
    return this.toSessionResponse(session);
  }

  async answer(
    userId: string,
    sessionId: string,
    answerText: string,
  ): Promise<InterviewSession> {
    const trimmed = answerText.trim();
    if (trimmed.length < 1) {
      throw new BadRequestException('Answer is required');
    }

    const session = await this.findSessionForUser(userId, sessionId);
    this.assertInProgress(session);

    const openTurn = session.turns.find((turn) => turn.answerText === null);
    if (!openTurn) {
      return this.advance(session);
    }

    const evaluation = await this.llm.evaluateAnswer(
      this.toLlmContext(session),
      openTurn.questionText,
      trimmed,
    );

    const saved = await this.prisma.interviewTurn.updateMany({
      where: { id: openTurn.id, answerText: null },
      data: {
        answerText: trimmed,
        feedback: evaluation.feedback,
        score: evaluation.score,
        rubric: evaluation.dimensions,
      },
    });

    if (saved.count === 0) {
      return this.advance(await this.findSessionForUser(userId, sessionId));
    }

    const followUp =
      openTurn.kind !== 'follow_up' &&
      evaluation.score < 75 &&
      evaluation.followUp
        ? evaluation.followUp
        : null;

    if (followUp) {
      await this.createTurn(
        sessionId,
        openTurn.orderIndex + 1,
        'follow_up',
        followUp,
      );
      return this.toSessionResponse(
        await this.findSessionForUser(userId, sessionId),
      );
    }

    return this.advance(await this.findSessionForUser(userId, sessionId));
  }

  async transcribeAnswer(
    userId: string,
    sessionId: string,
    audio: Buffer,
  ): Promise<{ transcript: string }> {
    const session = await this.findSessionForUser(userId, sessionId);
    this.assertInProgress(session);
    if (!session.turns.some((turn) => turn.answerText === null)) {
      throw new BadRequestException('No open interview question to answer');
    }
    assertWav(audio);
    const transcript = (await this.speech.transcribe(audio)).trim();
    if (!transcript) {
      throw new BadRequestException(
        'No speech was heard. Record again or type your answer.',
      );
    }
    return { transcript };
  }

  async answerAudio(
    userId: string,
    sessionId: string,
    audio: Buffer,
  ): Promise<InterviewSession> {
    assertWav(audio);
    const transcript = (await this.speech.transcribe(audio)).trim();
    if (!transcript) {
      throw new BadRequestException(
        'No speech was heard. Record again or type your answer.',
      );
    }
    return this.answer(userId, sessionId, transcript);
  }

  async turnAudio(
    userId: string,
    sessionId: string,
    turnId: string,
  ): Promise<Buffer> {
    const session = await this.findSessionForUser(userId, sessionId);
    const turn = session.turns.find((item) => item.id === turnId);
    if (!turn) {
      throw new NotFoundException('Interview turn not found');
    }
    return this.speech.synthesize(turn.questionText);
  }

  async continue(userId: string, sessionId: string): Promise<InterviewSession> {
    const session = await this.findSessionForUser(userId, sessionId);
    if (session.status === 'completed') {
      return this.toSessionResponse(session);
    }
    return this.advance(session);
  }

  private assertInProgress(session: SessionWithTurns): void {
    if (session.status === 'completed') {
      throw new BadRequestException('Interview session already completed');
    }
  }

  private async advance(session: SessionWithTurns): Promise<InterviewSession> {
    if (session.turns.some((turn) => turn.answerText === null)) {
      return this.toSessionResponse(session);
    }

    const mainsAnswered = session.turns.filter(
      (turn) => turn.kind !== 'follow_up' && turn.answerText !== null,
    ).length;

    if (mainsAnswered >= session.questionCount) {
      return this.complete(session);
    }

    const nextIndex =
      session.turns.reduce((max, turn) => Math.max(max, turn.orderIndex), -1) +
      1;
    const questionText = await this.llm.generateQuestion(
      this.toLlmContext(session),
      nextIndex,
    );
    await this.createTurn(session.id, nextIndex, 'main', questionText);
    return this.toSessionResponse(
      await this.findSessionForUser(session.userId, session.id),
    );
  }

  private async complete(session: SessionWithTurns): Promise<InterviewSession> {
    const summary = await this.llm.summarize(this.toLlmContext(session));
    const completed = await this.prisma.interviewSession.update({
      where: { id: session.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        overallFeedback: summary.overallFeedback,
        overallScore: summary.overallScore,
      },
      include: {
        turns: { orderBy: { orderIndex: 'asc' } },
      },
    });
    return this.toSessionResponse(completed);
  }

  private async createTurn(
    sessionId: string,
    orderIndex: number,
    kind: 'main' | 'follow_up',
    questionText: string,
  ): Promise<void> {
    try {
      await this.prisma.interviewTurn.create({
        data: { sessionId, orderIndex, kind, questionText },
      });
    } catch (caught: unknown) {
      if (
        typeof caught === 'object' &&
        caught !== null &&
        'code' in caught &&
        caught.code === 'P2002'
      ) {
        return;
      }
      throw caught;
    }
  }

  private toLlmContext(session: SessionWithTurns): InterviewLlmContext {
    return {
      role: session.role,
      techStack: session.techStack,
      experienceLevel: session.experienceLevel,
      questionCount: session.questionCount,
      previousTurns: session.turns.map((turn) => ({
        orderIndex: turn.orderIndex,
        questionText: turn.questionText,
        answerText: turn.answerText,
        feedback: turn.feedback,
        score: turn.score,
      })),
    };
  }

  private async findSessionForUser(
    userId: string,
    sessionId: string,
  ): Promise<SessionWithTurns> {
    const session = await this.prisma.interviewSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        turns: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Interview session not found');
    }

    return session;
  }

  private toSessionResponse(session: SessionWithTurns): InterviewSession {
    return {
      id: session.id,
      role: session.role,
      techStack: session.techStack,
      experienceLevel: session.experienceLevel as ExperienceLevel,
      questionCount: session.questionCount,
      status: session.status as InterviewSession['status'],
      provider: session.provider as InterviewSession['provider'],
      overallFeedback: session.overallFeedback,
      overallScore: session.overallScore,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString() ?? null,
      turns: session.turns.map((turn) =>
        this.toTurnResponse(turn, session.status === 'in_progress'),
      ),
    };
  }

  private toTurnResponse(
    turn: PrismaInterviewTurn,
    hideScores: boolean,
  ): InterviewTurn {
    return {
      id: turn.id,
      orderIndex: turn.orderIndex,
      kind: turn.kind === 'follow_up' ? 'follow_up' : 'main',
      questionText: turn.questionText,
      answerText: turn.answerText,
      feedback: hideScores ? null : turn.feedback,
      score: hideScores ? null : turn.score,
      rubric: hideScores ? null : this.asRubric(turn.rubric),
    };
  }

  private asRubric(
    value: PrismaInterviewTurn['rubric'],
  ): InterviewTurn['rubric'] {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return null;
    const record = value as Record<string, unknown>;
    const keys = ['correctness', 'depth', 'tradeoffs', 'clarity'] as const;
    const rubric = {
      correctness: 0,
      depth: 0,
      tradeoffs: 0,
      clarity: 0,
    };
    for (const key of keys) {
      const score = record[key];
      if (typeof score !== 'number' || !Number.isFinite(score)) return null;
      rubric[key] = Math.max(0, Math.min(100, Math.round(score)));
    }
    return rubric;
  }
}
