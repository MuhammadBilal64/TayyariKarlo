import { ScenarioRuntime } from './scenario-runtime';

describe('ScenarioRuntime', () => {
  const runtime = new ScenarioRuntime();
  const scenario = runtime.load('checkout-latency');

  function snap(time = 0, unlocked: string[] = []) {
    return {
      scenario,
      variant: 'delayed_incomplete' as const,
      simulatedTimeSeconds: time,
      unlockedEvidenceKeys: unlocked,
      lastInterviewerMessage: null,
    };
  }

  it('does not reveal delayed traces before unlock time', () => {
    const result = runtime.apply(snap(0), {
      type: 'request_evidence',
      evidenceKey: 'traces',
    });
    expect(result.eventType).toBe('evidence_unavailable');
    expect(result.unlockedEvidence).toBeUndefined();
    expect(result.interviewerMessage).toMatch(/not available yet/i);
  });

  it('returns delayed traces after the clock advances', () => {
    const advanced = runtime.apply(snap(0), {
      type: 'advance_clock',
      seconds: 45,
    });
    const result = runtime.apply(
      {
        ...snap(advanced.simulatedTimeSeconds),
        unlockedEvidenceKeys: [],
      },
      { type: 'request_evidence', evidenceKey: 'traces' },
    );
    expect(result.eventType).toBe('evidence_requested');
    expect(result.unlockedEvidence?.status).toBe('delayed');
    expect(result.unlockedEvidence?.payload).toMatch(/acquireConnection/i);
  });

  it('keeps partial app logs labeled partial', () => {
    const result = runtime.apply(snap(0), {
      type: 'request_evidence',
      evidenceKey: 'app_logs',
    });
    expect(result.unlockedEvidence?.status).toBe('partial');
    expect(result.unlockedEvidence?.completenessNote).toBeTruthy();
  });

  it('applies deterministic decision outcomes', () => {
    const first = runtime.apply(snap(0), {
      type: 'commit_decision',
      decisionKey: 'rollback_release',
      reasoning: 'Release correlates with pool saturation.',
      expectedEffect: 'Errors drop.',
      verificationPlan: 'Watch pool wait and checkout p95.',
      supportingEvidenceKeys: ['deploy_history', 'db_metrics'],
    });
    const second = runtime.apply(snap(0), {
      type: 'commit_decision',
      decisionKey: 'rollback_release',
      reasoning: 'Same action again.',
      expectedEffect: 'Errors drop.',
      verificationPlan: 'Watch pool wait and checkout p95.',
      supportingEvidenceKeys: ['deploy_history'],
    });
    expect(first.decisionOutcome?.outcomeSummary).toBe(
      second.decisionOutcome?.outcomeSummary,
    );
    expect(first.decisionOutcome?.quality).toBe('strong');
  });

  it('rejects unknown evidence keys without leaking ground truth', () => {
    expect(() =>
      runtime.apply(snap(0), {
        type: 'request_evidence',
        evidenceKey: 'secret_root_cause',
      }),
    ).toThrow(/not part of this scenario/i);
    expect(scenario.groundTruth).toMatch(/pool/i);
  });
});
