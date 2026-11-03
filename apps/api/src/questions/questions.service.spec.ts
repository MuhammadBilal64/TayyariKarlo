import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../common/prisma/prisma.service';
import { QUESTION_SEED } from './question.seed-data';
import { QuestionsService } from './questions.service';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let prisma: {
    question: {
      findMany: jest.Mock;
      create: jest.Mock;
      count: jest.Mock;
      createMany: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      question: {
        findMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(QuestionsService);
  });

  it('lists public questions without correctIndex', async () => {
    prisma.question.findMany.mockResolvedValue([
      {
        id: 'q1',
        prompt: 'Sample?',
        topic: 'system_design',
        difficulty: 'easy',
        options: ['A', 'B'],
        correctIndex: 0,
        explanation: null,
      },
    ]);

    const result = await service.list({ topic: 'system_design' });

    expect(prisma.question.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { topic: 'system_design' },
      }),
    );
    expect(result[0]).toEqual({
      id: 'q1',
      prompt: 'Sample?',
      topic: 'system_design',
      difficulty: 'easy',
      options: ['A', 'B'],
      explanation: null,
    });
    expect(result[0]).not.toHaveProperty('correctIndex');
  });

  it('rejects create when correctIndex is out of range', async () => {
    await expect(
      service.create({
        prompt: 'Bad index?',
        topic: 'system_design',
        difficulty: 'easy',
        options: ['A', 'B'],
        correctIndex: 5,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('inserts missing seed questions by prompt', async () => {
    prisma.question.findMany.mockResolvedValue([]);
    prisma.question.createMany.mockResolvedValue({
      count: QUESTION_SEED.length,
    });
    prisma.question.count.mockResolvedValue(QUESTION_SEED.length);

    await expect(service.seed()).resolves.toEqual({
      seeded: true,
      inserted: QUESTION_SEED.length,
      updated: 0,
      count: QUESTION_SEED.length,
    });
    expect(prisma.question.createMany).toHaveBeenCalled();
  });

  it('skips write when seed rows already match', async () => {
    prisma.question.findMany.mockResolvedValue(
      QUESTION_SEED.map((item, index) => ({
        id: `q${index}`,
        prompt: item.prompt,
        options: item.options,
        correctIndex: item.correctIndex,
        explanation: item.explanation ?? null,
        topic: item.topic,
        difficulty: item.difficulty,
      })),
    );
    prisma.question.count.mockResolvedValue(QUESTION_SEED.length);

    await expect(service.seed()).resolves.toEqual({
      seeded: false,
      inserted: 0,
      updated: 0,
      count: QUESTION_SEED.length,
    });
    expect(prisma.question.createMany).not.toHaveBeenCalled();
    expect(prisma.question.update).not.toHaveBeenCalled();
  });

  it('updates stale correct answers when seed changes', async () => {
    const [first] = QUESTION_SEED;
    prisma.question.findMany.mockResolvedValue(
      QUESTION_SEED.map((item, index) => ({
        id: `q${index}`,
        prompt: item.prompt,
        options: item.options,
        correctIndex:
          index === 0 ? (item.correctIndex + 1) % 4 : item.correctIndex,
        explanation: item.explanation ?? null,
        topic: item.topic,
        difficulty: item.difficulty,
      })),
    );
    prisma.question.update.mockResolvedValue({});
    prisma.question.count.mockResolvedValue(QUESTION_SEED.length);

    await expect(service.seed()).resolves.toEqual({
      seeded: true,
      inserted: 0,
      updated: 1,
      count: QUESTION_SEED.length,
    });
    expect(prisma.question.update).toHaveBeenCalledWith({
      where: { id: 'q0' },
      data: {
        topic: first!.topic,
        difficulty: first!.difficulty,
        options: first!.options,
        correctIndex: first!.correctIndex,
        explanation: first!.explanation ?? null,
      },
    });
  });

  it('seed bank has 12 unique questions per topic × difficulty', () => {
    const counts = new Map<string, number>();
    const prompts = new Set<string>();

    for (const item of QUESTION_SEED) {
      expect(prompts.has(item.prompt)).toBe(false);
      prompts.add(item.prompt);
      const key = `${item.topic}|${item.difficulty}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      expect(item.options).toHaveLength(4);
      expect(item.correctIndex).toBeGreaterThanOrEqual(0);
      expect(item.correctIndex).toBeLessThan(4);
    }

    expect(QUESTION_SEED).toHaveLength(252);
    for (const count of counts.values()) {
      expect(count).toBe(12);
    }
    expect(counts.size).toBe(21);
  });

  it('keeps known correct option text after option rotation', () => {
    const cdn = QUESTION_SEED.find(
      (item) => item.prompt === 'CDN primarily helps with:',
    );
    expect(cdn).toBeDefined();
    expect(cdn!.options[cdn!.correctIndex]).toBe(
      'Serving content closer to users',
    );

    const binarySearch = QUESTION_SEED.find(
      (item) =>
        item.prompt ===
        'What is the average time complexity of binary search on a sorted array?',
    );
    expect(binarySearch).toBeDefined();
    expect(binarySearch!.options[binarySearch!.correctIndex]).toBe('O(log n)');
  });
});
