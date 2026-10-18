import { z } from 'zod';

export const difficultySchema = z.enum(['easy', 'medium', 'hard']);
export type Difficulty = z.infer<typeof difficultySchema>;

export const DIFFICULTIES = difficultySchema.options;

export const topicSchema = z.enum([
  'data_structures_algorithms',
  'database_systems',
  'operating_systems',
  'computer_networks',
  'object_oriented_programming',
  'software_engineering',
  'system_design',
]);
export type Topic = z.infer<typeof topicSchema>;

export const TOPICS = topicSchema.options;
