import type { SignalDimensionScore } from '@tayyari/shared';

export const PROFILE_OBSERVATION_SOURCE_SIGNAL = 'signal_session';

export type ProfileObservationKind = 'demonstrated' | 'claimed' | 'inferred';

export interface DerivedProfileObservation {
  kind: ProfileObservationKind;
  dimensionKey: string;
  summary: string;
  /** Normalized 0–1 confidence. */
  confidence: number;
}

const CLAIMED_LIMIT = 3;

function clampConfidence(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, Math.round(value * 100) / 100));
}

/**
 * Derive profile observations from scored Signal dimensions + hypothesis claims.
 * Does not invent skills outside the evaluation dimension keys / claim text.
 */
export function deriveSignalProfileObservations(input: {
  dimensions: SignalDimensionScore[];
  hypothesisClaims: string[];
}): DerivedProfileObservation[] {
  const observations: DerivedProfileObservation[] = [];

  for (const dimension of input.dimensions) {
    if (dimension.score != null && dimension.score >= 3) {
      observations.push({
        kind: 'demonstrated',
        dimensionKey: dimension.key,
        summary: dimension.explanation,
        confidence: clampConfidence(dimension.score / 4),
      });
      continue;
    }

    if (
      dimension.insufficientEvidence ||
      (dimension.score != null && dimension.score < 3)
    ) {
      observations.push({
        kind: 'inferred',
        dimensionKey: dimension.key,
        summary: dimension.explanation,
        confidence: clampConfidence(
          dimension.insufficientEvidence
            ? 0.25
            : Math.max(0.1, (dimension.score ?? 0) / 4),
        ),
      });
    }
  }

  const seenClaims = new Set<string>();
  for (const claim of input.hypothesisClaims) {
    if (
      observations.filter((item) => item.kind === 'claimed').length >=
      CLAIMED_LIMIT
    ) {
      break;
    }
    const trimmed = claim.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seenClaims.has(key)) continue;
    seenClaims.add(key);
    observations.push({
      kind: 'claimed',
      dimensionKey: 'hypothesis_claim',
      summary: trimmed,
      confidence: 0.5,
    });
  }

  return observations;
}
