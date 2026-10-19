import { Injectable } from '@nestjs/common';
import {
  TOPICS,
  type Difficulty,
  type RecommendationsResponse,
  type TopicRecommendation,
} from '@tayyari/shared';
import { ProgressService } from '../progress/progress.service';

@Injectable()
export class RecommendationsService {
  constructor(private readonly progressService: ProgressService) {}

  async getForUser(userId: string): Promise<RecommendationsResponse> {
    const summary = await this.progressService.getSummary(userId);
    const weakByTopic = new Map(
      summary.weakTopics.map((row) => [row.topic, row]),
    );

    const scored = TOPICS.map(
      (
        topic,
      ): Omit<TopicRecommendation, 'priority'> & { rankScore: number } => {
        const stats = weakByTopic.get(topic);
        if (!stats) {
          return {
            topic,
            suggestedDifficulty: 'easy',
            reason: 'No attempts yet — start with an easy set',
            attemptCount: 0,
            averagePercent: null,
            // Below very weak topics, above strong ones.
            rankScore: 100,
          };
        }

        const averagePercent = stats.averagePercent;
        const suggestedDifficulty = this.suggestDifficulty(averagePercent);
        const reason =
          averagePercent < 70
            ? `Averaging ${averagePercent}% — focus here to strengthen this topic`
            : `Averaging ${averagePercent}% — stretch with a harder set`;

        return {
          topic,
          suggestedDifficulty,
          reason,
          attemptCount: stats.attemptCount,
          averagePercent,
          // Weak topics (low %) rank highest.
          rankScore:
            averagePercent < 70 ? 200 - averagePercent : 100 - averagePercent,
        };
      },
    );

    scored.sort((a, b) => {
      if (b.rankScore !== a.rankScore) {
        return b.rankScore - a.rankScore;
      }
      return a.topic.localeCompare(b.topic);
    });

    const recommendations: TopicRecommendation[] = scored.map((row, index) => ({
      topic: row.topic,
      suggestedDifficulty: row.suggestedDifficulty,
      priority: index + 1,
      reason: row.reason,
      attemptCount: row.attemptCount,
      averagePercent: row.averagePercent,
    }));

    return { recommendations };
  }

  private suggestDifficulty(averagePercent: number): Difficulty {
    // Align with ranking/reason threshold (70%): stretch ⇒ hard.
    if (averagePercent < 50) return 'easy';
    if (averagePercent < 70) return 'medium';
    return 'hard';
  }
}
