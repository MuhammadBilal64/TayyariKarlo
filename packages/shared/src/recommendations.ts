import { z } from 'zod';
import { difficultySchema, topicSchema } from './enums';

export const topicRecommendationSchema = z.object({
  topic: topicSchema,
  suggestedDifficulty: difficultySchema,
  priority: z.number().int().min(1),
  reason: z.string(),
  attemptCount: z.number().int(),
  averagePercent: z.number().nullable(),
});
export type TopicRecommendation = z.infer<typeof topicRecommendationSchema>;

export const recommendationsResponseSchema = z.object({
  recommendations: z.array(topicRecommendationSchema),
});
export type RecommendationsResponse = z.infer<
  typeof recommendationsResponseSchema
>;
