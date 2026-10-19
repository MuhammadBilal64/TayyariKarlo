import type { Difficulty, QuestionPublic, Topic } from '@tayyari/shared';
import { apiRequest } from '../../../shared/api/client';

export function listQuestions(
  filters: { topic?: Topic; difficulty?: Difficulty },
  accessToken: string,
) {
  const params = new URLSearchParams();
  if (filters.topic) params.set('topic', filters.topic);
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  const query = params.toString();
  return apiRequest<QuestionPublic[]>(`/questions${query ? `?${query}` : ''}`, {
    method: 'GET',
    accessToken,
  });
}
