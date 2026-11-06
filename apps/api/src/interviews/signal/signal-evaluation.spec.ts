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
      events: [{ id: 'evt-1', eventType: 'session_started' }],
    });
    const selection = report.dimensions.find(
      (item) => item.key === 'evidence_selection',
    );
    expect(selection?.insufficientEvidence).toBe(true);
    expect(selection?.score).toBeNull();
    expect(selection?.evidenceRefs).toEqual([]);
  });

  it('keeps evidenceRefs empty on insufficient dimensions', () => {
    const report = evaluateSignalSession({
      scenario: CHECKOUT_LATENCY_SCENARIO,
      unlockedEvidenceKeys: [],
      evidenceRequested: [],
      hypotheses: [],
      decision: null,
      askedQuestions: 0,
      sawDelayedOrPartial: false,
      revisedAfterEvidence: false,
      events: [
        { id: 'evt-1', eventType: 'session_started' },
        { id: 'evt-2', eventType: 'clock_advanced' },
      ],
    });

    for (const item of report.dimensions) {
      if (item.insufficientEvidence) {
        expect(item.evidenceRefs).toEqual([]);
      }
    }
  });

  it('cites only dimension-relevant event ids', () => {
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
      events: [
        { id: 'evt-start', eventType: 'session_started' },
        { id: 'evt-evidence', eventType: 'evidence_requested' },
        { id: 'evt-hyp', eventType: 'hypothesis_created' },
        { id: 'evt-rev', eventType: 'hypothesis_revised' },
        { id: 'evt-decision', eventType: 'decision_committed' },
      ],
    });

    const selection = report.dimensions.find(
      (item) => item.key === 'evidence_selection',
    );
    const decision = report.dimensions.find(
      (item) => item.key === 'decision_quality',
    );
    const hypothesis = report.dimensions.find(
      (item) => item.key === 'hypothesis_quality',
    );

    expect(selection?.evidenceRefs).toEqual(['evt-evidence']);
    expect(decision?.evidenceRefs).toEqual(['evt-decision']);
    expect(hypothesis?.evidenceRefs).toEqual(['evt-hyp', 'evt-rev']);
    expect(selection?.evidenceRefs).not.toContain('evt-start');
    expect(decision?.evidenceRefs).not.toContain('evt-evidence');
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
      events: [
        { id: 'evt-1', eventType: 'evidence_requested' },
        { id: 'evt-2', eventType: 'hypothesis_revised' },
        { id: 'evt-3', eventType: 'decision_committed' },
      ],
    });
    expect(
      report.dimensions.find((item) => item.key === 'adaptability')?.score,
    ).toBe(4);
    expect(
      report.dimensions.find((item) => item.key === 'decision_quality')?.score,
    ).toBe(4);
  });
});
