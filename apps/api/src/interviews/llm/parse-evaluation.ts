import type { AnswerEvaluation, RubricDimensions } from './llm.types';

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error('Score is not a number');
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function extractJsonObject(text: string): unknown {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error('No JSON object in model response');
  }
}

export function parseEvaluation(content: string): AnswerEvaluation {
  const parsed = extractJsonObject(content) as {
    score?: unknown;
    feedback?: unknown;
    followUp?: unknown;
    dimensions?: {
      correctness?: unknown;
      depth?: unknown;
      tradeoffs?: unknown;
      clarity?: unknown;
    };
  };

  if (typeof parsed.feedback !== 'string' || !parsed.feedback.trim()) {
    throw new Error('Missing feedback');
  }

  const dimensions: RubricDimensions = {
    correctness: clampScore(Number(parsed.dimensions?.correctness)),
    depth: clampScore(Number(parsed.dimensions?.depth)),
    tradeoffs: clampScore(Number(parsed.dimensions?.tradeoffs)),
    clarity: clampScore(Number(parsed.dimensions?.clarity)),
  };

  const followUp =
    typeof parsed.followUp === 'string' && parsed.followUp.trim().length > 8
      ? parsed.followUp.trim()
      : null;

  return {
    score: clampScore(Number(parsed.score)),
    feedback: parsed.feedback.trim(),
    dimensions,
    followUp,
  };
}
