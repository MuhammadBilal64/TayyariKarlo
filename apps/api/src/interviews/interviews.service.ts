import { Injectable, NotFoundException } from '@nestjs/common';
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

type SessionWithTurns = PrismaInterviewSession & {
  turns: PrismaInterviewTurn[];
};

@Injectable()
export class InterviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    input: StartInterviewInput,
  ): Promise<InterviewSession> {
    const questionCount = input.questionCount ?? 5;
    const techStack = input.techStack.map((tech) => tech.trim()).filter(Boolean);

    const session = await this.prisma.interviewSession.create({
      data: {
        userId,
        role: input.role.trim(),
        techStack,
        experienceLevel: input.experienceLevel,
        questionCount,
        status: 'in_progress',
        provider: 'none',
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
