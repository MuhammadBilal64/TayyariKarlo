import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AssessmentAttempt,
  AssessmentResult,
  Difficulty,
  SubmitAnswer,
  Topic,
  TopicBreakdown,
} from '@tayyari/shared';
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
    const attempt = await this.findAttemptForUser(userId, attemptId);
    return this.toAttemptResponse(attempt);
  }

  async getResultForUser(
    userId: string,
    attemptId: string,
  ): Promise<AssessmentResult> {
    const attempt = await this.findAttemptForUser(userId, attemptId);

    if (attempt.status !== 'completed') {
      throw new BadRequestException('Assessment has not been submitted yet');
    }

    if (
      attempt.score === null ||
      attempt.percent === null ||
      attempt.completedAt === null
    ) {
      throw new BadRequestException('Assessment result is incomplete');
    }

    return this.toResultResponse(attempt, {
      score: attempt.score,
      percent: attempt.percent,
      completedAt: attempt.completedAt,
      items: attempt.items.map((item) => {
        if (item.selectedIndex === null || item.isCorrect === null) {
          throw new BadRequestException('Assessment result is incomplete');
        }
        return {
          questionId: item.questionId,
          orderIndex: item.orderIndex,
          selectedIndex: item.selectedIndex,
          isCorrect: item.isCorrect,
          correctIndex: item.question.correctIndex,
          question: item.question,
        };
      }),
    });
  }

  async submit(
    userId: string,
    attemptId: string,
    answers: SubmitAnswer[],
  ): Promise<AssessmentResult> {
    const attempt = await this.findAttemptForUser(userId, attemptId);

    if (attempt.status === 'completed') {
      throw new BadRequestException('Assessment already submitted');
    }

    const answerByQuestionId = new Map(
      answers.map((answer) => [answer.questionId, answer.selectedIndex]),
    );

    if (answerByQuestionId.size !== answers.length) {
      throw new BadRequestException(
        'Duplicate question answers are not allowed',
      );
    }

    const attemptQuestionIds = new Set(
      attempt.items.map((item) => item.questionId),
    );

    for (const questionId of answerByQuestionId.keys()) {
      if (!attemptQuestionIds.has(questionId)) {
        throw new BadRequestException(
          `Question ${questionId} is not part of this assessment`,
        );
      }
    }

    for (const item of attempt.items) {
      if (!answerByQuestionId.has(item.questionId)) {
        throw new BadRequestException(
          'Answers must be provided for every question in the assessment',
        );
      }

      const selectedIndex = answerByQuestionId.get(item.questionId)!;
      if (selectedIndex < 0 || selectedIndex >= item.question.options.length) {
        throw new BadRequestException(
          `selectedIndex out of range for question ${item.questionId}`,
        );
      }
    }

    const graded = attempt.items.map((item) => {
      const selectedIndex = answerByQuestionId.get(item.questionId)!;
      const isCorrect = selectedIndex === item.question.correctIndex;
      return { item, selectedIndex, isCorrect };
    });

    const score = graded.filter((entry) => entry.isCorrect).length;
    const percent =
      attempt.questionCount === 0
        ? 0
        : Math.round((score / attempt.questionCount) * 10000) / 100;
    const completedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      for (const entry of graded) {
        await tx.assessmentItem.update({
          where: { id: entry.item.id },
          data: {
            selectedIndex: entry.selectedIndex,
            isCorrect: entry.isCorrect,
          },
        });
      }

      await tx.assessmentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'completed',
          score,
          percent,
          completedAt,
        },
      });
    });

    return this.toResultResponse(attempt, {
      score,
      percent,
      completedAt,
      items: graded.map((entry) => ({
        questionId: entry.item.questionId,
        orderIndex: entry.item.orderIndex,
        selectedIndex: entry.selectedIndex,
        isCorrect: entry.isCorrect,
        correctIndex: entry.item.question.correctIndex,
        question: entry.item.question,
      })),
    });
  }

  private async findAttemptForUser(userId: string, attemptId: string) {
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

    return attempt;
  }

  private buildTopicBreakdown(
    entries: Array<{ topic: Topic; isCorrect: boolean }>,
  ): TopicBreakdown[] {
    const byTopic = new Map<Topic, { correct: number; total: number }>();

    for (const entry of entries) {
      const current = byTopic.get(entry.topic) ?? { correct: 0, total: 0 };
      current.total += 1;
      if (entry.isCorrect) {
        current.correct += 1;
      }
      byTopic.set(entry.topic, current);
    }

    return [...byTopic.entries()]
      .map(([topic, stats]) => ({
        topic,
        correct: stats.correct,
        total: stats.total,
        percent:
          stats.total === 0
            ? 0
            : Math.round((stats.correct / stats.total) * 10000) / 100,
      }))
      .sort((a, b) => a.topic.localeCompare(b.topic));
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

  private toResultResponse(
    attempt: {
      id: string;
      topic: string;
      difficulty: string;
      questionCount: number;
      startedAt: Date;
    },
    graded: {
      score: number;
      percent: number;
      completedAt: Date;
      items: Array<{
        questionId: string;
        orderIndex: number;
        selectedIndex: number;
        isCorrect: boolean;
        correctIndex: number;
        question: {
          id: string;
          prompt: string;
          topic: string;
          difficulty: string;
          options: string[];
          explanation: string | null;
        };
      }>;
    },
  ): AssessmentResult {
    const topicBreakdown = this.buildTopicBreakdown(
      graded.items.map((item) => ({
        topic: item.question.topic as Topic,
        isCorrect: item.isCorrect,
      })),
    );

    return {
      id: attempt.id,
      topic: attempt.topic as Topic,
      difficulty: attempt.difficulty as Difficulty,
      questionCount: attempt.questionCount,
      status: 'completed',
      startedAt: attempt.startedAt.toISOString(),
      completedAt: graded.completedAt.toISOString(),
      score: graded.score,
      percent: graded.percent,
      correctCount: graded.score,
      incorrectCount: attempt.questionCount - graded.score,
      topicBreakdown,
      items: graded.items.map((item) => ({
        questionId: item.questionId,
        orderIndex: item.orderIndex,
        selectedIndex: item.selectedIndex,
        isCorrect: item.isCorrect,
        correctIndex: item.correctIndex,
        question: this.questionsService.toPublic(item.question),
      })),
    };
  }
}
