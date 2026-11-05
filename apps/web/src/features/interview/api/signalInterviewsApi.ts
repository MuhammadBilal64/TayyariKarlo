import type {
  SignalActionInput,
  SignalReplayInput,
  SignalSession,
  SignalSessionSummary,
  StartSignalInterviewInput,
} from '@tayyari/shared';
import { apiRequest } from '../../../shared/api/client';

const TIMEOUT_MS = 120_000;

export function createSignalInterview(
  input: StartSignalInterviewInput,
  accessToken: string,
) {
  return apiRequest<SignalSession>('/signal-interviews', {
    method: 'POST',
    body: input,
    accessToken,
    timeoutMs: TIMEOUT_MS,
  });
}

export function listSignalInterviews(accessToken: string) {
  return apiRequest<SignalSessionSummary[]>('/signal-interviews', {
    method: 'GET',
    accessToken,
  });
}

export function getSignalInterview(sessionId: string, accessToken: string) {
  return apiRequest<SignalSession>(`/signal-interviews/${sessionId}`, {
    method: 'GET',
    accessToken,
  });
}

export function applySignalAction(
  sessionId: string,
  input: SignalActionInput,
  accessToken: string,
) {
  return apiRequest<SignalSession>(`/signal-interviews/${sessionId}/actions`, {
    method: 'POST',
    body: input,
    accessToken,
    timeoutMs: TIMEOUT_MS,
  });
}

export function replaySignalDecision(
  sessionId: string,
  input: SignalReplayInput,
  accessToken: string,
) {
  return apiRequest<SignalSession>(`/signal-interviews/${sessionId}/replay`, {
    method: 'POST',
    body: input,
    accessToken,
    timeoutMs: TIMEOUT_MS,
  });
}
