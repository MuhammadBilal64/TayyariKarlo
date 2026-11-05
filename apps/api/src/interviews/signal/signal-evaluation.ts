import type { SignalDimensionScore } from '@tayyari/shared';
import type { ScenarioDefinition } from './scenarios/checkout-latency';

export const SIGNAL_RUBRIC_VERSION = 'signal-rubric-v1';

interface EvalInput {
  scenario: ScenarioDefinition;
  unlockedEvidenceKeys: string[];
  evidenceRequested: string[];
  hypotheses: Array<{
    claim: string;
    supportingEvidenceKeys: string[];
    confidence: number | null;
    isRevision: boolean;
  }>;
  decision: {
    decisionKey: string;
    reasoning: string;
    verificationPlan: string;
    supportingEvidenceKeys: string[];
    quality: string;
  } | null;
  askedQuestions: number;
  sawDelayedOrPartial: boolean;
  revisedAfterEvidence: boolean;
  eventIds: string[];
}

function dim(
  key: string,
  label: string,
  score: number | null,
  explanation: string,
  evidenceRefs: string[],
  insufficientEvidence = false,
): SignalDimensionScore {
  return {
    key,
    label,
    score,
    insufficientEvidence,
    explanation,
    evidenceRefs,
  };
}

export function evaluateSignalSession(input: EvalInput): {
  dimensions: SignalDimensionScore[];
  strengths: string[];
  gaps: string[];
  recommendedPractice: string;
  overallSummary: string;
  scenarioExplanation: string;
} {
  const refs = input.eventIds.slice(0, 12);
  const relevant = ['deploy_history', 'db_metrics', 'app_logs', 'traces'];
  const hitRelevant = relevant.filter((key) =>
    input.evidenceRequested.includes(key),
  ).length;

  const selectionScore =
    input.evidenceRequested.length === 0
      ? null
      : Math.min(
          4,
          Math.max(
            1,
            hitRelevant +
              (hitRelevant >= 3 ? 1 : 0) -
              (input.evidenceRequested.length > 5 ? 1 : 0),
          ),
        );

  const interpretationScore = !input.sawDelayedOrPartial
    ? input.unlockedEvidenceKeys.length === 0
      ? null
      : 2
    : input.revisedAfterEvidence ||
        input.hypotheses.some((h) =>
          /delay|partial|collector|pool|acquiring|connection/i.test(h.claim),
        )
      ? 4
      : 2;

  const latest = input.hypotheses.at(-1);
  const hypothesisScore = !latest
    ? null
    : latest.supportingEvidenceKeys.length === 0
      ? 1
      : /pool|connection|deploy|release|acquire/i.test(latest.claim)
        ? 4
        : 2;

  const decisionScore = !input.decision
    ? null
    : input.decision.quality === 'strong'
      ? 4
      : input.decision.quality === 'acceptable'
        ? 3
        : input.decision.quality === 'risky'
          ? 2
          : 1;

  const adaptabilityScore =
    input.hypotheses.length === 0
      ? null
      : input.revisedAfterEvidence
        ? 4
        : input.hypotheses.length > 1
          ? 3
          : 2;

  const causalScore = !latest
    ? null
    : /because|pool|connection|release|deploy/i.test(latest.claim)
      ? 3
      : 2;

  const confidenceScore = !latest
    ? null
    : latest.confidence == null
      ? 2
      : latest.confidence <= 2 && input.sawDelayedOrPartial
        ? 4
        : latest.confidence >= 4 && input.unlockedEvidenceKeys.length < 2
          ? 1
          : 3;

  const verificationScore = !input.decision
    ? null
    : /p95|pool|error|latency|trace|metric/i.test(
          input.decision.verificationPlan,
        )
      ? 4
      : input.decision.verificationPlan.trim().length > 20
        ? 2
        : 1;

  const communicationScore =
    input.hypotheses.length + (input.decision ? 1 : 0) === 0
      ? null
      : (input.decision?.reasoning.length ?? 0) > 40 ||
          (latest?.claim.length ?? 0) > 40
        ? 3
        : 2;

  const dimensions = [
    dim(
      'evidence_selection',
      'Evidence selection',
      selectionScore,
      selectionScore == null
        ? 'No evidence requests were recorded.'
        : `Requested ${input.evidenceRequested.length} source(s); ${hitRelevant} were highly relevant.`,
      refs,
      selectionScore == null,
    ),
    dim(
      'evidence_interpretation',
      'Evidence interpretation',
      interpretationScore,
      interpretationScore == null
        ? 'Not enough unlocked evidence to score interpretation.'
        : input.sawDelayedOrPartial
          ? 'Encountered delayed or partial evidence and needed to treat it carefully.'
          : 'Evidence was complete; interpretation still required linking symptoms to mechanism.',
      refs,
      interpretationScore == null,
    ),
    dim(
      'hypothesis_quality',
      'Hypothesis quality',
      hypothesisScore,
      hypothesisScore == null
        ? 'No hypothesis was stated.'
        : 'Scored from whether the claim was testable and tied to unlocked evidence.',
      refs,
      hypothesisScore == null,
    ),
    dim(
      'causal_reasoning',
      'Causal reasoning',
      causalScore,
      causalScore == null
        ? 'Insufficient hypothesis text to score causal reasoning.'
        : 'Looks for a mechanism, not only a correlated symptom.',
      refs,
      causalScore == null,
    ),
    dim(
      'decision_quality',
      'Decision quality',
      decisionScore,
      decisionScore == null
        ? 'No decision was committed.'
        : `Authored outcome quality for this action: ${input.decision?.quality}.`,
      refs,
      decisionScore == null,
    ),
    dim(
      'adaptability',
      'Adaptability',
      adaptabilityScore,
      adaptabilityScore == null
        ? 'No hypotheses to judge adaptation.'
        : input.revisedAfterEvidence
          ? 'Revised after new or imperfect evidence — positive engineering behavior.'
          : 'Adaptation scored from whether the working claim changed when evidence changed.',
      refs,
      adaptabilityScore == null,
    ),
    dim(
      'confidence_calibration',
      'Confidence calibration',
      confidenceScore,
      confidenceScore == null
        ? 'No confidence signal was provided.'
        : 'Checks whether confidence matched how complete the evidence was.',
      refs,
      confidenceScore == null,
    ),
    dim(
      'verification',
      'Verification',
      verificationScore,
      verificationScore == null
        ? 'No verification plan was provided.'
        : 'Looks for concrete metrics or traces to confirm recovery.',
      refs,
      verificationScore == null,
    ),
    dim(
      'communication',
      'Communication',
      communicationScore,
      communicationScore == null
        ? 'Insufficient written reasoning to score communication.'
        : 'Structured claims and decision reasoning score higher than one-liners.',
      refs,
      communicationScore == null,
    ),
  ];

  const strengths: string[] = [];
  const gaps: string[] = [];
  for (const item of dimensions) {
    if (item.score != null && item.score >= 3) strengths.push(item.label);
    if (item.score != null && item.score <= 2) gaps.push(item.label);
    if (item.insufficientEvidence)
      gaps.push(`${item.label} (insufficient evidence)`);
  }

  return {
    dimensions,
    strengths: strengths.slice(0, 5),
    gaps: gaps.slice(0, 5),
    recommendedPractice:
      'Replay the delayed/incomplete variant and force yourself to name what each source cannot prove before you commit.',
    overallSummary:
      input.decision == null
        ? 'Investigation recorded without a final action. Review evidence selection and state a decision next time.'
        : `Completed with decision “${input.decision.decisionKey}” (${input.decision.quality}). Scores below cite your event log, not a guessed root-cause match.`,
    scenarioExplanation: input.scenario.scenarioExplanation,
  };
}
