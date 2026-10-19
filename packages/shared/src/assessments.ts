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

export const submitAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedIndex: z.number().int().min(0),
});
export type SubmitAnswer = z.infer<typeof submitAnswerSchema>;

export const submitAssessmentSchema = z.object({
  answers: z.array(submitAnswerSchema).min(1),
});
export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>;

export const assessmentResultItemSchema = z.object({
  questionId: z.string(),
  orderIndex: z.number().int(),
  selectedIndex: z.number().int().nullable(),
  isCorrect: z.boolean(),
  correctIndex: z.number().int(),
  question: questionPublicSchema,
});
export type AssessmentResultItem = z.infer<typeof assessmentResultItemSchema>;

export const topicBreakdownSchema = z.object({
  topic: topicSchema,
  correct: z.number().int(),
  total: z.number().int(),
  percent: z.number(),
});
export type TopicBreakdown = z.infer<typeof topicBreakdownSchema>;

export const assessmentResultSchema = z.object({
  id: z.string(),
  topic: topicSchema,
  difficulty: difficultySchema,
  questionCount: z.number().int(),
  status: z.literal('completed'),
  startedAt: z.string(),
  completedAt: z.string(),
  score: z.number().int(),
  percent: z.number(),
  correctCount: z.number().int(),
  incorrectCount: z.number().int(),
  topicBreakdown: z.array(topicBreakdownSchema),
  items: z.array(assessmentResultItemSchema),
});
export type AssessmentResult = z.infer<typeof assessmentResultSchema>;
