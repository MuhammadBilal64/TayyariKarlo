import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../common/prisma/prisma.service';
import { InterviewsService } from './interviews.service';
import { LLM_CLIENT } from './llm/llm.types';

describe('InterviewsService', () => {
  let service: InterviewsService;
  let prisma: {
    interviewSession: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    interviewTurn: {
      update: jest.Mock;
      create: jest.Mock;
    };
  };
  let llm: {
    provider: 'mock';
    generateQuestion: jest.Mock;
    evaluateAnswer: jest.Mock;
    summarize: jest.Mock;
  };

  const baseSession = {
    id: 'session-1',
    userId: 'user-1',
    role: 'Backend Engineer',
    techStack: ['Node.js', 'PostgreSQL'],
    experienceLevel: 'junior',
    questionCount: 2,
    status: 'in_progress',
    overallFeedback: null,
    overallScore: null,
    provider: 'mock',
    startedAt: new Date('2026-11-02T10:00:00.000Z'),
    completedAt: null,
    createdAt: new Date('2026-11-02T10:00:00.000Z'),
    updatedAt: new Date('2026-11-02T10:00:00.000Z'),
    turns: [
      {
        id: 'turn-1',
        sessionId: 'session-1',
        orderIndex: 0,
        questionText: 'Practice Q1?',
        answerText: null,
        feedback: null,
        score: null,
        createdAt: new Date('2026-11-02T10:00:00.000Z'),
        updatedAt: new Date('2026-11-02T10:00:00.000Z'),
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      interviewSession: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      interviewTurn: {
        update: jest.fn(),
        create: jest.fn(),
      },
    };
    llm = {
      provider: 'mock',
      generateQuestion: jest.fn().mockResolvedValue('Practice Q1?'),
      evaluateAnswer: jest.fn().mockResolvedValue({
        feedback: 'Practice feedback',
        score: 75,
      }),
      summarize: jest.fn().mockResolvedValue({
        overallFeedback: 'Practice summary',
        overallScore: 75,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewsService,
        { provide: PrismaService, useValue: prisma },
        { provide: LLM_CLIENT, useValue: llm },
      ],
    }).compile();

    service = module.get(InterviewsService);
  });

  it('creates a session with the first LLM question', async () => {
    prisma.interviewSession.create.mockResolvedValue(baseSession);

    const result = await service.create('user-1', {
      role: 'Backend Engineer',
      techStack: ['Node.js', 'PostgreSQL'],
      experienceLevel: 'junior',
      questionCount: 2,
    });

    expect(llm.generateQuestion).toHaveBeenCalled();
    expect(prisma.interviewSession.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        role: 'Backend Engineer',
        techStack: ['Node.js', 'PostgreSQL'],
        experienceLevel: 'junior',
        questionCount: 2,
        status: 'in_progress',
        provider: 'mock',
        turns: {
          create: [{ orderIndex: 0, questionText: 'Practice Q1?' }],
        },
      },
      include: {
        turns: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    expect(result.turns).toHaveLength(1);
    expect(result.provider).toBe('mock');
  });

  it('lists sessions for the current user', async () => {
    prisma.interviewSession.findMany.mockResolvedValue([
      {
        ...baseSession,
        _count: { turns: 1 },
      },
    ]);

    const result = await service.listForUser('user-1');
    expect(result[0]?.turnCount).toBe(1);
  });

  it('answers an open turn and asks the next question', async () => {
    prisma.interviewSession.findFirst
      .mockResolvedValueOnce(baseSession)
      .mockResolvedValueOnce({
        ...baseSession,
        turns: [
          {
            ...baseSession.turns[0],
            answerText: 'My detailed answer about Node and APIs.',
            feedback: 'Practice feedback',
            score: 75,
          },
        ],
      })
      .mockResolvedValueOnce({
        ...baseSession,
        turns: [
          {
            ...baseSession.turns[0],
            answerText: 'My detailed answer about Node and APIs.',
            feedback: 'Practice feedback',
            score: 75,
          },
          {
            id: 'turn-2',
            sessionId: 'session-1',
            orderIndex: 1,
            questionText: 'Practice Q2?',
            answerText: null,
            feedback: null,
            score: null,
            createdAt: new Date('2026-11-02T10:01:00.000Z'),
            updatedAt: new Date('2026-11-02T10:01:00.000Z'),
          },
        ],
      });
    llm.generateQuestion.mockResolvedValueOnce('Practice Q2?');

    const result = await service.answer(
      'user-1',
      'session-1',
      'My detailed answer about Node and APIs.',
    );

    expect(llm.evaluateAnswer).toHaveBeenCalled();
    expect(prisma.interviewTurn.update).toHaveBeenCalled();
    expect(prisma.interviewTurn.create).toHaveBeenCalledWith({
      data: {
        sessionId: 'session-1',
        orderIndex: 1,
        questionText: 'Practice Q2?',
      },
    });
    expect(result.turns).toHaveLength(2);
    expect(result.status).toBe('in_progress');
  });

  it('completes the session after the last answer', async () => {
    const lastOpen = {
      ...baseSession,
      questionCount: 1,
      turns: [baseSession.turns[0]],
    };
    const afterAnswer = {
      ...lastOpen,
      turns: [
        {
          ...baseSession.turns[0],
          answerText: 'Final answer with enough detail.',
          feedback: 'Practice feedback',
          score: 75,
        },
      ],
    };
    const completed = {
      ...afterAnswer,
      status: 'completed',
      completedAt: new Date('2026-11-02T10:05:00.000Z'),
      overallFeedback: 'Practice summary',
      overallScore: 75,
    };

    prisma.interviewSession.findFirst
      .mockResolvedValueOnce(lastOpen)
      .mockResolvedValueOnce(afterAnswer);
    prisma.interviewSession.update.mockResolvedValue(completed);

    const result = await service.answer(
      'user-1',
      'session-1',
      'Final answer with enough detail.',
    );

    expect(llm.summarize).toHaveBeenCalled();
    expect(result.status).toBe('completed');
    expect(result.overallScore).toBe(75);
    expect(prisma.interviewTurn.create).not.toHaveBeenCalled();
  });

  it('rejects answers on completed sessions', async () => {
    prisma.interviewSession.findFirst.mockResolvedValue({
      ...baseSession,
      status: 'completed',
    });

    await expect(
      service.answer('user-1', 'session-1', 'Late answer'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws NotFoundException for missing sessions', async () => {
    prisma.interviewSession.findFirst.mockResolvedValue(null);

    await expect(
      service.getForUser('user-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
