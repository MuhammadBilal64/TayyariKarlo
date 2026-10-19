import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from '../progress/progress.service';
import { RecommendationsService } from './recommendations.service';

describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let progressService: { getSummary: jest.Mock };

  beforeEach(async () => {
    progressService = {
      getSummary: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        { provide: ProgressService, useValue: progressService },
      ],
    }).compile();

    service = module.get(RecommendationsService);
  });

  it('ranks unattempted and weak topics ahead of strong ones', async () => {
    progressService.getSummary.mockResolvedValue({
      attemptCount: 2,
      completedCount: 2,
      skillScore: 55,
      recentAttempts: [],
      weakTopics: [
        {
          topic: 'database_systems',
          attemptCount: 1,
          averagePercent: 40,
          latestPercent: 40,
        },
        {
          topic: 'system_design',
          attemptCount: 1,
          averagePercent: 90,
          latestPercent: 90,
        },
      ],
      trends: [],
    });

    const result = await service.getForUser('user-1');
    const topics = result.recommendations.map((row) => row.topic);

    expect(result.recommendations[0]?.priority).toBe(1);
    expect(topics[0]).toBe('database_systems');
    expect(result.recommendations[0]?.suggestedDifficulty).toBe('easy');
    expect(topics.indexOf('system_design')).toBeGreaterThan(
      topics.indexOf('operating_systems'),
    );
    expect(
      result.recommendations.find((row) => row.topic === 'operating_systems')
        ?.reason,
    ).toContain('No attempts yet');
    expect(
      result.recommendations.find((row) => row.topic === 'system_design')
        ?.suggestedDifficulty,
    ).toBe('hard');
  });

  it('returns all topics when history is empty', async () => {
    progressService.getSummary.mockResolvedValue({
      attemptCount: 0,
      completedCount: 0,
      skillScore: null,
      recentAttempts: [],
      weakTopics: [],
      trends: [],
    });

    const result = await service.getForUser('user-1');

    expect(result.recommendations).toHaveLength(7);
    expect(
      result.recommendations.every((row) => row.suggestedDifficulty === 'easy'),
    ).toBe(true);
  });

  it('suggests hard once average reaches the stretch threshold', async () => {
    progressService.getSummary.mockResolvedValue({
      attemptCount: 1,
      completedCount: 1,
      skillScore: 72,
      recentAttempts: [],
      weakTopics: [
        {
          topic: 'system_design',
          attemptCount: 1,
          averagePercent: 72,
          latestPercent: 72,
        },
      ],
      trends: [],
    });

    const result = await service.getForUser('user-1');
    const systemDesign = result.recommendations.find(
      (row) => row.topic === 'system_design',
    );

    expect(systemDesign?.suggestedDifficulty).toBe('hard');
    expect(systemDesign?.reason).toContain('stretch');
  });
});
