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
    };
  };

  beforeEach(async () => {
    prisma = {
      question: {
        findMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
        createMany: jest.fn(),
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
      count: QUESTION_SEED.length,
    });
    expect(prisma.question.createMany).toHaveBeenCalled();
  });

  it('skips insert when all seed prompts already exist', async () => {
    prisma.question.findMany.mockResolvedValue(
      QUESTION_SEED.map((item) => ({ prompt: item.prompt })),
    );
    prisma.question.count.mockResolvedValue(QUESTION_SEED.length);

    await expect(service.seed()).resolves.toEqual({
      seeded: false,
      inserted: 0,
      count: QUESTION_SEED.length,
    });
    expect(prisma.question.createMany).not.toHaveBeenCalled();
  });
});
