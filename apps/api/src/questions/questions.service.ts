import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  CreateQuestionInput,
  Difficulty,
  QuestionPublic,
  Topic,
} from '@tayyari/shared';
import { PrismaService } from '../common/prisma/prisma.service';
import { QUESTION_SEED } from './question.seed-data';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: {
    topic?: Topic;
    difficulty?: Difficulty;
  }): Promise<QuestionPublic[]> {
    const questions = await this.prisma.question.findMany({
      where: {
        ...(filters.topic ? { topic: filters.topic } : {}),
        ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
      },
      orderBy: [{ topic: 'asc' }, { difficulty: 'asc' }, { createdAt: 'asc' }],
    });

    return questions.map((question) => this.toPublic(question));
  }

  async create(input: CreateQuestionInput): Promise<QuestionPublic> {
    this.assertValidCorrectIndex(input.options, input.correctIndex);

    const question = await this.prisma.question.create({
      data: {
        prompt: input.prompt,
        topic: input.topic,
        difficulty: input.difficulty,
        options: input.options,
        correctIndex: input.correctIndex,
        explanation: input.explanation,
      },
    });

    return this.toPublic(question);
  }

  async seed(): Promise<{ seeded: boolean; count: number }> {
    const existing = await this.prisma.question.count();
    if (existing > 0) {
      return { seeded: false, count: existing };
    }

    for (const item of QUESTION_SEED) {
      this.assertValidCorrectIndex(item.options, item.correctIndex);
    }

    await this.prisma.question.createMany({
      data: QUESTION_SEED.map((item) => ({
        prompt: item.prompt,
        topic: item.topic,
        difficulty: item.difficulty,
        options: item.options,
        correctIndex: item.correctIndex,
        explanation: item.explanation,
      })),
    });

    return { seeded: true, count: QUESTION_SEED.length };
  }

  private assertValidCorrectIndex(options: string[], correctIndex: number) {
    if (correctIndex < 0 || correctIndex >= options.length) {
      throw new BadRequestException(
        'correctIndex must point to an existing option',
      );
    }
  }

  private toPublic(question: {
    id: string;
    prompt: string;
    topic: string;
    difficulty: string;
    options: string[];
    explanation: string | null;
  }): QuestionPublic {
    return {
      id: question.id,
      prompt: question.prompt,
      topic: question.topic as Topic,
      difficulty: question.difficulty as Difficulty,
      options: question.options,
      explanation: question.explanation,
    };
  }
}
