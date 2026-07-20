import { z } from 'zod';
import { difficultySchema, topicSchema } from './enums';
import { questionPublicSchema } from './questions';

export const startAssessmentSchema = z.object({
  topic: topicSchema,
  difficulty: difficultySchema,
  count: z.number().int().min(1).max(50),
});
export type StartAssessmentInput = z.infer<typeof startAssessmentSchema>;

export const assessmentAttemptSchema = z.object({
  id: z.string(),
  topic: topicSchema,
  difficulty: difficultySchema,
  questionCount: z.number().int(),
  status: z.enum(['in_progress', 'completed']),
  startedAt: z.string(),
  questions: z.array(questionPublicSchema),
});
export type AssessmentAttempt = z.infer<typeof assessmentAttemptSchema>;
