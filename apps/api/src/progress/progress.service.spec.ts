import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../common/prisma/prisma.service';
import { ProgressService } from './progress.service';

describe('ProgressService', () => {
  let service: ProgressService;
  let prisma: {
    assessmentAttempt: {
      count: jest.Mock;
      findMany: jest.Mock;
    };
    profileObservation: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      assessmentAttempt: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      profileObservation: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ProgressService);
  });

  it('returns empty aggregates when no completed attempts', async () => {
    prisma.assessmentAttempt.count.mockResolvedValue(2);
    prisma.assessmentAttempt.findMany.mockResolvedValue([]);
    prisma.profileObservation.findMany.mockResolvedValue([]);

    const result = await service.getSummary('user-1');

    expect(result).toEqual({
      attemptCount: 2,
      completedCount: 0,
      skillScore: null,
      recentAttempts: [],
      weakTopics: [],
      trends: [],
      profileObservations: [],
    });
  });

  it('aggregates history, weak topics, and trends from completed attempts', async () => {
    prisma.assessmentAttempt.count.mockResolvedValue(3);
    prisma.assessmentAttempt.findMany.mockResolvedValue([
      {
        id: 'a3',
        topic: 'system_design',
        difficulty: 'easy',
        questionCount: 5,
        score: 4,
        percent: 80,
        completedAt: new Date('2026-10-19T12:00:00.000Z'),
      },
      {
        id: 'a2',
        topic: 'database_systems',
        difficulty: 'medium',
        questionCount: 5,
        score: 2,
        percent: 40,
        completedAt: new Date('2026-10-18T12:00:00.000Z'),
      },
      {
        id: 'a1',
        topic: 'system_design',
        difficulty: 'easy',
        questionCount: 5,
        score: 3,
        percent: 60,
        completedAt: new Date('2026-10-17T12:00:00.000Z'),
      },
    ]);
    prisma.profileObservation.findMany.mockResolvedValue([
      {
        id: 'obs-1',
        sourceType: 'signal_session',
        sourceSessionId: 'sig-1',
        kind: 'demonstrated',
        dimensionKey: 'evidence_selection',
        summary: 'Strong source mix.',
        confidence: 1,
        createdAt: new Date('2026-11-06T12:00:00.000Z'),
      },
    ]);

    const result = await service.getSummary('user-1');

    expect(result.attemptCount).toBe(3);
    expect(result.completedCount).toBe(3);
    expect(result.skillScore).toBe(60);
    expect(result.recentAttempts).toHaveLength(3);
    expect(result.recentAttempts[0]?.id).toBe('a3');
    expect(result.weakTopics.map((topic) => topic.topic)).toEqual([
      'database_systems',
      'system_design',
    ]);
    expect(result.weakTopics[0]).toEqual({
      topic: 'database_systems',
      attemptCount: 1,
      averagePercent: 40,
      latestPercent: 40,
    });
    expect(result.weakTopics[1]?.averagePercent).toBe(70);
    expect(result.trends.map((point) => point.attemptId)).toEqual([
      'a1',
      'a2',
      'a3',
    ]);
    expect(result.profileObservations).toEqual([
      {
        id: 'obs-1',
        sourceType: 'signal_session',
        sourceSessionId: 'sig-1',
        kind: 'demonstrated',
        dimensionKey: 'evidence_selection',
        summary: 'Strong source mix.',
        confidence: 1,
        createdAt: '2026-11-06T12:00:00.000Z',
      },
    ]);
  });
});
