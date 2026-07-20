import { Injectable, NotFoundException } from '@nestjs/common';
import type { AssessmentAttempt, Difficulty, Topic } from '@tayyari/shared';
import { PrismaService } from '../common/prisma/prisma.service';
import { QuestionsService } from '../questions/questions.service';

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questionsService: QuestionsService,
  ) {}

  async start(
    userId: string,
    input: { topic: Topic; difficulty: Difficulty; count: number },
  ): Promise<AssessmentAttempt> {
    const selected = await this.questionsService.findRandom(
      input.topic,
      input.difficulty,
      input.count,
    );

    const attempt = await this.prisma.assessmentAttempt.create({
      data: {
        userId,
        topic: input.topic,
        difficulty: input.difficulty,
        questionCount: selected.length,
        status: 'in_progress',
        items: {
          create: selected.map((question, orderIndex) => ({
            questionId: question.id,
            orderIndex,
          })),
        },
      },
      include: {
        items: {
          orderBy: { orderIndex: 'asc' },
          include: { question: true },
        },
      },
    });

    return this.toAttemptResponse(attempt);
  }

  async getForUser(
    userId: string,
    attemptId: string,
  ): Promise<AssessmentAttempt> {
    const attempt = await this.prisma.assessmentAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        items: {
          orderBy: { orderIndex: 'asc' },
          include: { question: true },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Assessment attempt not found');
    }

    return this.toAttemptResponse(attempt);
  }

  private toAttemptResponse(attempt: {
    id: string;
    topic: string;
    difficulty: string;
    questionCount: number;
    status: string;
    startedAt: Date;
    items: Array<{
      question: {
        id: string;
        prompt: string;
        topic: string;
        difficulty: string;
        options: string[];
        explanation: string | null;
      };
    }>;
  }): AssessmentAttempt {
    return {
      id: attempt.id,
      topic: attempt.topic as Topic,
      difficulty: attempt.difficulty as Difficulty,
      questionCount: attempt.questionCount,
      status: attempt.status as 'in_progress' | 'completed',
      startedAt: attempt.startedAt.toISOString(),
      questions: attempt.items.map((item) =>
        this.questionsService.toPublic(item.question),
      ),
    };
  }
}
