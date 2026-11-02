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

type SessionWithTurns = PrismaInterviewSession & {
  turns: PrismaInterviewTurn[];
};

@Injectable()
export class InterviewsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_CLIENT) private readonly llm: LlmClient,
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

    if (session.status === 'completed') {
      throw new BadRequestException('Interview session already completed');
    }

    const openTurn = session.turns.find((turn) => turn.answerText === null);
    if (!openTurn) {
      throw new BadRequestException('No open interview question to answer');
    }

    const ctx = this.toLlmContext(session);
    const evaluation = await this.llm.evaluateAnswer(
      ctx,
      openTurn.questionText,
      trimmed,
    );

    await this.prisma.interviewTurn.update({
      where: { id: openTurn.id },
      data: {
        answerText: trimmed,
        feedback: evaluation.feedback,
        score: evaluation.score,
      },
    });

    const answeredCount = session.turns.filter(
      (turn) => turn.id === openTurn.id || turn.answerText !== null,
    ).length;

    if (answeredCount >= session.questionCount) {
      const refreshed = await this.findSessionForUser(userId, sessionId);
      const summary = await this.llm.summarize(this.toLlmContext(refreshed));
      const completed = await this.prisma.interviewSession.update({
        where: { id: sessionId },
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

    const nextIndex = openTurn.orderIndex + 1;
    const nextCtxSession = await this.findSessionForUser(userId, sessionId);
    const nextQuestion = await this.llm.generateQuestion(
      this.toLlmContext(nextCtxSession),
      nextIndex,
    );

    await this.prisma.interviewTurn.create({
      data: {
        sessionId,
        orderIndex: nextIndex,
        questionText: nextQuestion,
      },
    });

    const withNext = await this.findSessionForUser(userId, sessionId);
    return this.toSessionResponse(withNext);
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
      turns: session.turns.map((turn) => this.toTurnResponse(turn)),
    };
  }

  private toTurnResponse(turn: PrismaInterviewTurn): InterviewTurn {
    return {
      id: turn.id,
      orderIndex: turn.orderIndex,
      questionText: turn.questionText,
      answerText: turn.answerText,
      feedback: turn.feedback,
      score: turn.score,
    };
  }
}
