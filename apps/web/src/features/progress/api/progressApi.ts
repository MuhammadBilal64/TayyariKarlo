import type { ProgressSummary } from '@tayyari/shared';
import { apiRequest } from '../../../shared/api/client';

export function getProgressSummary(accessToken: string) {
  return apiRequest<ProgressSummary>('/progress', {
    method: 'GET',
    accessToken,
  });
}
