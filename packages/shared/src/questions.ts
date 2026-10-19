import { z } from 'zod';
import { difficultySchema, topicSchema } from './enums';

export const questionOptionSchema = z.string().min(1).max(500);

export const questionSchema = z.object({
  id: z.string(),
  prompt: z.string().min(1),
  topic: topicSchema,
  difficulty: difficultySchema,
  options: z.array(questionOptionSchema).min(2).max(6),
  correctIndex: z.number().int().min(0),
  explanation: z.string().nullable().optional(),
});
export type Question = z.infer<typeof questionSchema>;

/** Public quiz view — answer key omitted */
export const questionPublicSchema = questionSchema.omit({ correctIndex: true });
export type QuestionPublic = z.infer<typeof questionPublicSchema>;

export const listQuestionsQuerySchema = z.object({
  topic: topicSchema.optional(),
  difficulty: difficultySchema.optional(),
});
export type ListQuestionsQuery = z.infer<typeof listQuestionsQuerySchema>;

export const createQuestionSchema = z.object({
  prompt: z.string().min(1).max(2000),
  topic: topicSchema,
  difficulty: difficultySchema,
  options: z.array(questionOptionSchema).min(2).max(6),
  correctIndex: z.number().int().min(0),
  explanation: z.string().max(2000).optional(),
});
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
