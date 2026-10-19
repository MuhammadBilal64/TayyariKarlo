const PREFIX = 'tayyari.assessment.answers.';

export function loadAnswerDraft(
  attemptId: string,
): Record<string, number> | null {
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${attemptId}`);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    const draft: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
        draft[key] = value;
      }
    }
    return draft;
  } catch {
    return null;
  }
}

export function saveAnswerDraft(
  attemptId: string,
  answers: Record<string, number>,
) {
  sessionStorage.setItem(`${PREFIX}${attemptId}`, JSON.stringify(answers));
}

export function clearAnswerDraft(attemptId: string) {
  sessionStorage.removeItem(`${PREFIX}${attemptId}`);
}
