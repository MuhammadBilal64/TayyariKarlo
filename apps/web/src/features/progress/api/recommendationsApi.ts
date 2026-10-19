import type { RecommendationsResponse } from '@tayyari/shared';
import { apiRequest } from '../../../shared/api/client';

export function getRecommendations(accessToken: string) {
  return apiRequest<RecommendationsResponse>('/recommendations', {
    method: 'GET',
    accessToken,
  });
}
