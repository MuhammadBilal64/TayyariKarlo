import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../common/prisma/prisma.service';
import { InterviewsService } from './interviews.service';

describe('InterviewsService', () => {
  let service: InterviewsService;
  let prisma: {
    interviewSession: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
  };

  const baseSession = {
    id: 'session-1',
    userId: 'user-1',
    role: 'Backend Engineer',
    techStack: ['Node.js', 'PostgreSQL'],
    experienceLevel: 'junior',
    questionCount: 5,
    status: 'in_progress',
    overallFeedback: null,
    overallScore: null,
    provider: 'none',
    startedAt: new Date('2026-11-02T10:00:00.000Z'),
    completedAt: null,
    createdAt: new Date('2026-11-02T10:00:00.000Z'),
    updatedAt: new Date('2026-11-02T10:00:00.000Z'),
    turns: [] as unknown[],
  };

  beforeEach(async () => {
    prisma = {
      interviewSession: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(InterviewsService);
  });

  it('creates a session with empty turns and default questionCount', async () => {
    prisma.interviewSession.create.mockResolvedValue(baseSession);

    const result = await service.create('user-1', {
      role: 'Backend Engineer',
      techStack: ['Node.js', 'PostgreSQL'],
      experienceLevel: 'junior',
    });

    expect(prisma.interviewSession.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        role: 'Backend Engineer',
        techStack: ['Node.js', 'PostgreSQL'],
        experienceLevel: 'junior',
        questionCount: 5,
        status: 'in_progress',
        provider: 'none',
      },
      include: {
        turns: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    expect(result.id).toBe('session-1');
    expect(result.turns).toEqual([]);
    expect(result.provider).toBe('none');
    expect(result.startedAt).toBe('2026-11-02T10:00:00.000Z');
  });

  it('lists sessions for the current user', async () => {
    prisma.interviewSession.findMany.mockResolvedValue([
      {
        ...baseSession,
        _count: { turns: 0 },
      },
    ]);

    const result = await service.listForUser('user-1');

    expect(prisma.interviewSession.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: {
        _count: { select: { turns: true } },
      },
    });
    expect(result).toEqual([
      {
        id: 'session-1',
        role: 'Backend Engineer',
        techStack: ['Node.js', 'PostgreSQL'],
        experienceLevel: 'junior',
        questionCount: 5,
        status: 'in_progress',
        provider: 'none',
        startedAt: '2026-11-02T10:00:00.000Z',
        completedAt: null,
        turnCount: 0,
      },
    ]);
  });

  it('returns a session owned by the user', async () => {
    prisma.interviewSession.findFirst.mockResolvedValue(baseSession);

    const result = await service.getForUser('user-1', 'session-1');

    expect(result.id).toBe('session-1');
    expect(result.turns).toEqual([]);
  });

  it('throws NotFoundException for missing or foreign sessions', async () => {
    prisma.interviewSession.findFirst.mockResolvedValue(null);

    await expect(
      service.getForUser('user-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
