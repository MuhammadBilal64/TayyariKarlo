import type {
  AnswerInterviewInput,
  InterviewSession,
  InterviewSessionSummary,
  StartInterviewInput,
} from '@tayyari/shared';
import { apiRequest } from '../../../shared/api/client';

const LLM_TIMEOUT_MS = 90_000;

export function createInterview(
  input: StartInterviewInput,
  accessToken: string,
) {
  return apiRequest<InterviewSession>('/interviews', {
    method: 'POST',
    body: input,
    accessToken,
    timeoutMs: LLM_TIMEOUT_MS,
  });
}

export function listInterviews(accessToken: string) {
  return apiRequest<InterviewSessionSummary[]>('/interviews', {
    method: 'GET',
    accessToken,
  });
}

export function getInterview(sessionId: string, accessToken: string) {
  return apiRequest<InterviewSession>(`/interviews/${sessionId}`, {
    method: 'GET',
    accessToken,
  });
}

export function answerInterview(
  sessionId: string,
  input: AnswerInterviewInput,
  accessToken: string,
) {
  return apiRequest<InterviewSession>(`/interviews/${sessionId}/answer`, {
    method: 'POST',
    body: input,
    accessToken,
    timeoutMs: LLM_TIMEOUT_MS,
  });
}
