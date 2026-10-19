import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../common/prisma/prisma.service';
import { QuestionsService } from '../questions/questions.service';
import { AssessmentsService } from './assessments.service';

describe('AssessmentsService', () => {
  let service: AssessmentsService;
  let prisma: {
    assessmentAttempt: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    assessmentItem: {
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let questionsService: {
    findRandom: jest.Mock;
    toPublic: jest.Mock;
  };

  const question = {
    id: 'q1',
    prompt: 'Sample?',
    topic: 'system_design',
    difficulty: 'easy',
    options: ['A', 'B'],
    correctIndex: 0,
    explanation: null,
  };

  const question2 = {
    id: 'q2',
    prompt: 'Another?',
    topic: 'system_design',
    difficulty: 'easy',
    options: ['X', 'Y', 'Z'],
    correctIndex: 2,
    explanation: 'Z is right',
  };

  beforeEach(async () => {
    prisma = {
      assessmentAttempt: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      assessmentItem: {
        update: jest.fn(),
      },
      $transaction: jest.fn(async (fn: (tx: typeof prisma) => Promise<void>) =>
        fn(prisma),
      ),
    };
    questionsService = {
      findRandom: jest.fn(),
      toPublic: jest.fn((q: typeof question) => ({
        id: q.id,
        prompt: q.prompt,
        topic: q.topic,
        difficulty: q.difficulty,
        options: q.options,
        explanation: q.explanation,
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: QuestionsService, useValue: questionsService },
      ],
    }).compile();

    service = module.get(AssessmentsService);
  });

  it('starts an attempt with N questions', async () => {
    questionsService.findRandom.mockResolvedValue([question]);
    prisma.assessmentAttempt.create.mockResolvedValue({
      id: 'attempt-1',
      topic: 'system_design',
      difficulty: 'easy',
      questionCount: 1,
      status: 'in_progress',
      startedAt: new Date('2026-07-20T10:00:00.000Z'),
      items: [{ question }],
    });

    const result = await service.start('user-1', {
      topic: 'system_design',
      difficulty: 'easy',
      count: 1,
    });

    expect(questionsService.findRandom).toHaveBeenCalledWith(
      'system_design',
      'easy',
      1,
    );
    expect(result.id).toBe('attempt-1');
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0]).not.toHaveProperty('correctIndex');
    expect(result.status).toBe('in_progress');
  });

  it('propagates not-enough-questions errors', async () => {
    questionsService.findRandom.mockRejectedValue(
      new BadRequestException('Not enough questions'),
    );

    await expect(
      service.start('user-1', {
        topic: 'system_design',
        difficulty: 'easy',
        count: 5,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects missing attempts for user', async () => {
    prisma.assessmentAttempt.findFirst.mockResolvedValue(null);

    await expect(
      service.getForUser('user-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('scores a submission and returns topic breakdown', async () => {
    prisma.assessmentAttempt.findFirst.mockResolvedValue({
      id: 'attempt-1',
      topic: 'system_design',
      difficulty: 'easy',
      questionCount: 2,
      status: 'in_progress',
      startedAt: new Date('2026-07-21T10:00:00.000Z'),
      items: [
        {
          id: 'item-1',
          questionId: 'q1',
          orderIndex: 0,
          question,
        },
        {
          id: 'item-2',
          questionId: 'q2',
          orderIndex: 1,
          question: question2,
        },
      ],
    });

    const result = await service.submit('user-1', 'attempt-1', [
      { questionId: 'q1', selectedIndex: 0 },
      { questionId: 'q2', selectedIndex: 0 },
    ]);

    expect(result.status).toBe('completed');
    expect(result.score).toBe(1);
    expect(result.percent).toBe(50);
    expect(result.correctCount).toBe(1);
    expect(result.incorrectCount).toBe(1);
    expect(result.items[0]?.isCorrect).toBe(true);
    expect(result.items[1]?.isCorrect).toBe(false);
    expect(result.items[1]?.correctIndex).toBe(2);
    expect(result.topicBreakdown).toEqual([
      {
        topic: 'system_design',
        correct: 1,
        total: 2,
        percent: 50,
      },
    ]);
    expect(prisma.assessmentAttempt.update).toHaveBeenCalledTimes(1);
    const updateCalls = prisma.assessmentAttempt.update.mock.calls as Array<
      [
        {
          where: { id: string };
          data: { status: string; score: number; percent: number };
        },
      ]
    >;
    const updateArg = updateCalls[0][0];
    expect(updateArg.where.id).toBe('attempt-1');
    expect(updateArg.data.status).toBe('completed');
    expect(updateArg.data.score).toBe(1);
    expect(updateArg.data.percent).toBe(50);
  });

  it('rejects resubmission of a completed attempt', async () => {
    prisma.assessmentAttempt.findFirst.mockResolvedValue({
      id: 'attempt-1',
      status: 'completed',
      items: [],
    });

    await expect(
      service.submit('user-1', 'attempt-1', [
        { questionId: 'q1', selectedIndex: 0 },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects incomplete answer sets', async () => {
    prisma.assessmentAttempt.findFirst.mockResolvedValue({
      id: 'attempt-1',
      topic: 'system_design',
      difficulty: 'easy',
      questionCount: 2,
      status: 'in_progress',
      startedAt: new Date(),
      items: [
        { id: 'item-1', questionId: 'q1', orderIndex: 0, question },
        { id: 'item-2', questionId: 'q2', orderIndex: 1, question: question2 },
      ],
    });

    await expect(
      service.submit('user-1', 'attempt-1', [
        { questionId: 'q1', selectedIndex: 0 },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns stored results for a completed attempt', async () => {
    prisma.assessmentAttempt.findFirst.mockResolvedValue({
      id: 'attempt-1',
      topic: 'system_design',
      difficulty: 'easy',
      questionCount: 1,
      status: 'completed',
      score: 1,
      percent: 100,
      startedAt: new Date('2026-10-19T15:00:00.000Z'),
      completedAt: new Date('2026-10-19T15:10:00.000Z'),
      items: [
        {
          id: 'item-1',
          questionId: 'q1',
          orderIndex: 0,
          selectedIndex: 0,
          isCorrect: true,
          question,
        },
      ],
    });

    const result = await service.getResultForUser('user-1', 'attempt-1');

    expect(result.status).toBe('completed');
    expect(result.score).toBe(1);
    expect(result.percent).toBe(100);
    expect(result.items[0]?.isCorrect).toBe(true);
  });

  it('rejects result fetch for in-progress attempts', async () => {
    prisma.assessmentAttempt.findFirst.mockResolvedValue({
      id: 'attempt-1',
      status: 'in_progress',
      score: null,
      percent: null,
      completedAt: null,
      items: [],
    });

    await expect(
      service.getResultForUser('user-1', 'attempt-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
