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

  private shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j]!;
      copy[j] = tmp!;
    }
    return copy;
  }

  async findRandom(topic: Topic, difficulty: Difficulty, count: number) {
    const pool = await this.prisma.question.findMany({
      where: { topic, difficulty },
    });

    if (pool.length < count) {
      throw new BadRequestException(
        `Not enough questions for ${topic} (${difficulty}). Need ${count}, found ${pool.length}.`,
      );
    }

    return this.shuffle(pool).slice(0, count);
  }

  toPublic(question: {
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

  async seed(): Promise<{
    seeded: boolean;
    inserted: number;
    updated: number;
    count: number;
  }> {
    for (const item of QUESTION_SEED) {
      this.assertValidCorrectIndex(item.options, item.correctIndex);
    }

    const existing = await this.prisma.question.findMany({
      select: {
        id: true,
        prompt: true,
        options: true,
        correctIndex: true,
        explanation: true,
        topic: true,
        difficulty: true,
      },
    });
    const byPrompt = new Map(existing.map((row) => [row.prompt, row]));

    const missing = QUESTION_SEED.filter((item) => !byPrompt.has(item.prompt));
    const stale = QUESTION_SEED.filter((item) => {
      const row = byPrompt.get(item.prompt);
      if (!row) return false;
      return (
        row.correctIndex !== item.correctIndex ||
        row.topic !== item.topic ||
        row.difficulty !== item.difficulty ||
        row.explanation !== (item.explanation ?? null) ||
        JSON.stringify(row.options) !== JSON.stringify(item.options)
      );
    });

    if (missing.length > 0) {
      await this.prisma.question.createMany({
        data: missing.map((item) => ({
          prompt: item.prompt,
          topic: item.topic,
          difficulty: item.difficulty,
          options: item.options,
          correctIndex: item.correctIndex,
          explanation: item.explanation,
        })),
      });
    }

    for (const item of stale) {
      const row = byPrompt.get(item.prompt);
      if (!row) continue;
      await this.prisma.question.update({
        where: { id: row.id },
        data: {
          topic: item.topic,
          difficulty: item.difficulty,
          options: item.options,
          correctIndex: item.correctIndex,
          explanation: item.explanation ?? null,
        },
      });
    }

    const count = await this.prisma.question.count();
    return {
      seeded: missing.length > 0 || stale.length > 0,
      inserted: missing.length,
      updated: stale.length,
      count,
    };
  }

  private assertValidCorrectIndex(options: string[], correctIndex: number) {
    if (correctIndex < 0 || correctIndex >= options.length) {
      throw new BadRequestException(
        'correctIndex must point to an existing option',
      );
    }
  }
}
