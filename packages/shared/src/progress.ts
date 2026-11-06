import { z } from 'zod';
import { difficultySchema, topicSchema } from './enums';

export const progressAttemptSummarySchema = z.object({
  id: z.string(),
  topic: topicSchema,
  difficulty: difficultySchema,
  questionCount: z.number().int(),
  score: z.number().int(),
  percent: z.number(),
  completedAt: z.string(),
});
export type ProgressAttemptSummary = z.infer<
  typeof progressAttemptSummarySchema
>;

export const weakTopicSchema = z.object({
  topic: topicSchema,
  attemptCount: z.number().int(),
  averagePercent: z.number(),
  latestPercent: z.number(),
});
export type WeakTopic = z.infer<typeof weakTopicSchema>;

export const progressTrendPointSchema = z.object({
  attemptId: z.string(),
  topic: topicSchema,
  difficulty: difficultySchema,
  percent: z.number(),
  completedAt: z.string(),
});
export type ProgressTrendPoint = z.infer<typeof progressTrendPointSchema>;

export const profileObservationKindSchema = z.enum([
  'demonstrated',
  'claimed',
  'inferred',
]);
export type ProfileObservationKind = z.infer<
  typeof profileObservationKindSchema
>;

export const profileObservationSchema = z.object({
  id: z.string(),
  sourceType: z.string(),
  sourceSessionId: z.string(),
  kind: profileObservationKindSchema,
  dimensionKey: z.string(),
  summary: z.string(),
  confidence: z.number().min(0).max(1),
  createdAt: z.string(),
});
export type ProfileObservation = z.infer<typeof profileObservationSchema>;

export const progressSummarySchema = z.object({
  attemptCount: z.number().int(),
  completedCount: z.number().int(),
  skillScore: z.number().nullable(),
  recentAttempts: z.array(progressAttemptSummarySchema),
  weakTopics: z.array(weakTopicSchema),
  trends: z.array(progressTrendPointSchema),
  profileObservations: z.array(profileObservationSchema),
});
export type ProgressSummary = z.infer<typeof progressSummarySchema>;
