import type {
  AnswerInterviewInput,
  InterviewSession,
  InterviewSessionSummary,
  StartInterviewInput,
} from '@tayyari/shared';
import { apiRequest } from '../../../shared/api/client';

const LLM_TIMEOUT_MS = 540_000;
const VOICE_TIMEOUT_MS = 180_000;

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

export function continueInterview(sessionId: string, accessToken: string) {
  return apiRequest<InterviewSession>(`/interviews/${sessionId}/continue`, {
    method: 'POST',
    accessToken,
    timeoutMs: VOICE_TIMEOUT_MS,
  });
}

export function transcribeInterview(
  sessionId: string,
  audio: Blob,
  accessToken: string,
) {
  return apiRequest<{ transcript: string }>(
    `/interviews/${sessionId}/transcribe`,
    {
      method: 'POST',
      body: audio,
      contentType: 'audio/wav',
      accessToken,
      timeoutMs: VOICE_TIMEOUT_MS,
    },
  );
}

export function getTurnAudio(
  sessionId: string,
  turnId: string,
  accessToken: string,
  part: 'question' | 'feedback' = 'question',
) {
  const query = part === 'feedback' ? '?part=feedback' : '';
  return apiRequest<Blob>(
    `/interviews/${sessionId}/turns/${turnId}/audio${query}`,
    {
      method: 'GET',
      accessToken,
      responseType: 'blob',
      timeoutMs: VOICE_TIMEOUT_MS,
    },
  );
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
