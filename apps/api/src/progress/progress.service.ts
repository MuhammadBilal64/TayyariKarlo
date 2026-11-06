import { Injectable } from '@nestjs/common';
import type {
  Difficulty,
  ProfileObservationKind,
  ProgressSummary,
  Topic,
  WeakTopic,
} from '@tayyari/shared';
import { PrismaService } from '../common/prisma/prisma.service';

const RECENT_LIMIT = 10;
const TREND_LIMIT = 20;
const OBSERVATION_LIMIT = 50;

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string): Promise<ProgressSummary> {
    const [attemptCount, completed, observations] = await Promise.all([
      this.prisma.assessmentAttempt.count({ where: { userId } }),
      this.prisma.assessmentAttempt.findMany({
        where: { userId, status: 'completed' },
        orderBy: { completedAt: 'desc' },
        select: {
          id: true,
          topic: true,
          difficulty: true,
          questionCount: true,
          score: true,
          percent: true,
          completedAt: true,
        },
      }),
      this.prisma.profileObservation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: OBSERVATION_LIMIT,
        select: {
          id: true,
          sourceType: true,
          sourceSessionId: true,
          kind: true,
          dimensionKey: true,
          summary: true,
          confidence: true,
          createdAt: true,
        },
      }),
    ]);

    const usable = completed.filter(
      (row) =>
        row.score !== null && row.percent !== null && row.completedAt !== null,
    );

    const completedCount = usable.length;
    const skillScore =
      completedCount === 0
        ? null
        : Math.round(
            (usable.reduce((sum, row) => sum + row.percent!, 0) /
              completedCount) *
              100,
          ) / 100;

    const recentAttempts = usable.slice(0, RECENT_LIMIT).map((row) => ({
      id: row.id,
      topic: row.topic as Topic,
      difficulty: row.difficulty as Difficulty,
      questionCount: row.questionCount,
      score: row.score!,
      percent: row.percent!,
      completedAt: row.completedAt!.toISOString(),
    }));

    const weakTopics = this.buildWeakTopics(usable);
    const trends = [...usable]
      .reverse()
      .slice(-TREND_LIMIT)
      .map((row) => ({
        attemptId: row.id,
        topic: row.topic as Topic,
        difficulty: row.difficulty as Difficulty,
        percent: row.percent!,
        completedAt: row.completedAt!.toISOString(),
      }));

    const profileObservations = observations.map((row) => ({
      id: row.id,
      sourceType: row.sourceType,
      sourceSessionId: row.sourceSessionId,
      kind: row.kind as ProfileObservationKind,
      dimensionKey: row.dimensionKey,
      summary: row.summary,
      confidence: row.confidence,
      createdAt: row.createdAt.toISOString(),
    }));

    return {
      attemptCount,
      completedCount,
      skillScore,
      recentAttempts,
      weakTopics,
      trends,
      profileObservations,
    };
  }

  private buildWeakTopics(
    attempts: Array<{
      topic: string;
      percent: number | null;
      completedAt: Date | null;
    }>,
  ): WeakTopic[] {
    const byTopic = new Map<
      Topic,
      { total: number; sum: number; latestPercent: number; latestAt: number }
    >();

    for (const attempt of attempts) {
      if (attempt.percent === null || attempt.completedAt === null) continue;
      const topic = attempt.topic as Topic;
      const completedAtMs = attempt.completedAt.getTime();
      const current = byTopic.get(topic) ?? {
        total: 0,
        sum: 0,
        latestPercent: attempt.percent,
        latestAt: completedAtMs,
      };
      current.total += 1;
      current.sum += attempt.percent;
      if (completedAtMs >= current.latestAt) {
        current.latestAt = completedAtMs;
        current.latestPercent = attempt.percent;
      }
      byTopic.set(topic, current);
    }

    return [...byTopic.entries()]
      .map(([topic, stats]) => ({
        topic,
        attemptCount: stats.total,
        averagePercent: Math.round((stats.sum / stats.total) * 100) / 100,
        latestPercent: stats.latestPercent,
      }))
      .sort((a, b) => {
        if (a.averagePercent !== b.averagePercent) {
          return a.averagePercent - b.averagePercent;
        }
        return a.topic.localeCompare(b.topic);
      });
  }
}
