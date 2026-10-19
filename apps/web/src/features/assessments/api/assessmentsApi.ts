import type {
  AssessmentAttempt,
  AssessmentResult,
  StartAssessmentInput,
  SubmitAnswer,
} from '@tayyari/shared';
import { apiRequest } from '../../../shared/api/client';

export function startAssessment(
  input: StartAssessmentInput,
  accessToken: string,
) {
  return apiRequest<AssessmentAttempt>('/assessments/start', {
    method: 'POST',
    body: input,
    accessToken,
  });
}

export function getAssessment(attemptId: string, accessToken: string) {
  return apiRequest<AssessmentAttempt>(`/assessments/${attemptId}`, {
    method: 'GET',
    accessToken,
  });
}

export function submitAssessment(
  attemptId: string,
  answers: SubmitAnswer[],
  accessToken: string,
) {
  return apiRequest<AssessmentResult>(`/assessments/${attemptId}/submit`, {
    method: 'POST',
    body: { answers },
    accessToken,
  });
}

export function getAssessmentResult(attemptId: string, accessToken: string) {
  return apiRequest<AssessmentResult>(`/assessments/${attemptId}/result`, {
    method: 'GET',
    accessToken,
  });
}
