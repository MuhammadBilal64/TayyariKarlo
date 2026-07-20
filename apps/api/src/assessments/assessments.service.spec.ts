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
    };
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

  beforeEach(async () => {
    prisma = {
      assessmentAttempt: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
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
});
