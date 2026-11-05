import { CHECKOUT_LATENCY_SCENARIO } from './scenarios/checkout-latency';
import { evaluateSignalSession } from './signal-evaluation';

describe('evaluateSignalSession', () => {
  it('does not invent a score when no evidence was requested', () => {
    const report = evaluateSignalSession({
      scenario: CHECKOUT_LATENCY_SCENARIO,
      unlockedEvidenceKeys: [],
      evidenceRequested: [],
      hypotheses: [],
      decision: null,
      askedQuestions: 0,
      sawDelayedOrPartial: false,
      revisedAfterEvidence: false,
      eventIds: ['evt-1'],
    });
    const selection = report.dimensions.find(
      (item) => item.key === 'evidence_selection',
    );
    expect(selection?.insufficientEvidence).toBe(true);
    expect(selection?.score).toBeNull();
  });

  it('rewards revising after imperfect evidence', () => {
    const report = evaluateSignalSession({
      scenario: CHECKOUT_LATENCY_SCENARIO,
      unlockedEvidenceKeys: ['db_metrics', 'traces'],
      evidenceRequested: ['deploy_history', 'db_metrics', 'traces'],
      hypotheses: [
        {
          claim: 'Maybe slow queries',
          supportingEvidenceKeys: ['db_metrics'],
          confidence: 3,
          isRevision: false,
        },
        {
          claim: 'Pool saturation after the release; traces were delayed',
          supportingEvidenceKeys: ['deploy_history', 'db_metrics', 'traces'],
          confidence: 2,
          isRevision: true,
        },
      ],
      decision: {
        decisionKey: 'rollback_release',
        reasoning: 'Release opened extra connections and saturated the pool.',
        verificationPlan: 'Watch pool wait time, checkout p95, and error rate.',
        supportingEvidenceKeys: ['deploy_history', 'db_metrics'],
        quality: 'strong',
      },
      askedQuestions: 1,
      sawDelayedOrPartial: true,
      revisedAfterEvidence: true,
      eventIds: ['evt-1', 'evt-2'],
    });
    expect(
      report.dimensions.find((item) => item.key === 'adaptability')?.score,
    ).toBe(4);
    expect(
      report.dimensions.find((item) => item.key === 'decision_quality')?.score,
    ).toBe(4);
  });
});
