import { z } from 'zod';

export const experienceLevelSchema = z.enum([
  'intern',
  'junior',
  'mid',
  'senior',
]);
export type ExperienceLevel = z.infer<typeof experienceLevelSchema>;
export const EXPERIENCE_LEVELS = experienceLevelSchema.options;

export const interviewStatusSchema = z.enum(['in_progress', 'completed']);
export type InterviewStatus = z.infer<typeof interviewStatusSchema>;

export const interviewProviderSchema = z.enum(['none', 'mock', 'ollama']);
export type InterviewProvider = z.infer<typeof interviewProviderSchema>;

export const startInterviewSchema = z.object({
  role: z.string().trim().min(2).max(120),
  techStack: z.array(z.string().trim().min(1).max(60)).min(1).max(12),
  experienceLevel: experienceLevelSchema,
  questionCount: z.number().int().min(1).max(10).optional(),
});
export type StartInterviewInput = z.infer<typeof startInterviewSchema>;

export const answerInterviewSchema = z.object({
  answer: z.string().trim().min(1).max(8000),
});
export type AnswerInterviewInput = z.infer<typeof answerInterviewSchema>;

export const interviewTurnSchema = z.object({
  id: z.string(),
  orderIndex: z.number().int(),
  questionText: z.string(),
  answerText: z.string().nullable(),
  feedback: z.string().nullable(),
  score: z.number().int().nullable(),
});
export type InterviewTurn = z.infer<typeof interviewTurnSchema>;

export const interviewSessionSchema = z.object({
  id: z.string(),
  role: z.string(),
  techStack: z.array(z.string()),
  experienceLevel: experienceLevelSchema,
  questionCount: z.number().int(),
  status: interviewStatusSchema,
  provider: interviewProviderSchema,
  overallFeedback: z.string().nullable(),
  overallScore: z.number().int().nullable(),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  turns: z.array(interviewTurnSchema),
});
export type InterviewSession = z.infer<typeof interviewSessionSchema>;

export const interviewSessionSummarySchema = z.object({
  id: z.string(),
  role: z.string(),
  techStack: z.array(z.string()),
  experienceLevel: experienceLevelSchema,
  questionCount: z.number().int(),
  status: interviewStatusSchema,
  provider: interviewProviderSchema,
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  turnCount: z.number().int(),
});
export type InterviewSessionSummary = z.infer<
  typeof interviewSessionSummarySchema
>;
