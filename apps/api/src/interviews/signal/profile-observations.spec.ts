import type { SignalDimensionScore } from '@tayyari/shared';
import { deriveSignalProfileObservations } from './profile-observations';

function dimension(
  partial: Partial<SignalDimensionScore> &
    Pick<SignalDimensionScore, 'key' | 'score'>,
): SignalDimensionScore {
  return {
    label: partial.label ?? partial.key,
    insufficientEvidence: partial.insufficientEvidence ?? false,
    explanation: partial.explanation ?? `${partial.key} note`,
    evidenceRefs: partial.evidenceRefs ?? [],
    ...partial,
  };
}

describe('deriveSignalProfileObservations', () => {
  it('marks high scores as demonstrated and low/insufficient as inferred', () => {
    const observations = deriveSignalProfileObservations({
      dimensions: [
        dimension({
          key: 'evidence_selection',
          score: 4,
          explanation: 'Strong source mix.',
        }),
        dimension({
          key: 'decision_quality',
          score: 2,
          explanation: 'Risky action.',
        }),
        dimension({
          key: 'hypothesis_quality',
          score: null,
          insufficientEvidence: true,
          explanation: 'No hypothesis was stated.',
        }),
      ],
      hypothesisClaims: [],
    });

    expect(observations).toEqual([
      {
        kind: 'demonstrated',
        dimensionKey: 'evidence_selection',
        summary: 'Strong source mix.',
        confidence: 1,
      },
      {
        kind: 'inferred',
        dimensionKey: 'decision_quality',
        summary: 'Risky action.',
        confidence: 0.5,
      },
      {
        kind: 'inferred',
        dimensionKey: 'hypothesis_quality',
        summary: 'No hypothesis was stated.',
        confidence: 0.25,
      },
    ]);
  });

  it('adds claimed observations only from real hypothesis claims', () => {
    const observations = deriveSignalProfileObservations({
      dimensions: [
        dimension({
          key: 'communication',
          score: 3,
          explanation: 'Clear write-up.',
        }),
      ],
      hypothesisClaims: [
        'Pool saturation after deploy',
        '',
        '  Pool saturation after deploy  ',
        'Traces delayed; waiting on collector',
      ],
    });

    const claimed = observations.filter((item) => item.kind === 'claimed');
    expect(claimed).toEqual([
      {
        kind: 'claimed',
        dimensionKey: 'hypothesis_claim',
        summary: 'Pool saturation after deploy',
        confidence: 0.5,
      },
      {
        kind: 'claimed',
        dimensionKey: 'hypothesis_claim',
        summary: 'Traces delayed; waiting on collector',
        confidence: 0.5,
      },
    ]);
    expect(observations.some((item) => item.kind === 'demonstrated')).toBe(
      true,
    );
  });

  it('does not invent dimension keys outside the evaluation input', () => {
    const observations = deriveSignalProfileObservations({
      dimensions: [
        dimension({ key: 'verification', score: 1, explanation: 'Thin plan.' }),
      ],
      hypothesisClaims: [],
    });

    expect(observations).toHaveLength(1);
    expect(observations[0]?.dimensionKey).toBe('verification');
    expect(observations.every((item) => item.kind === 'inferred')).toBe(true);
  });
});
