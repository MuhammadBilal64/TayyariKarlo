import { z } from 'zod';
import { experienceLevelSchema } from './interviews';

export const signalVariantSchema = z.enum([
  'full',
  'delayed_incomplete',
  'conflicting',
]);
export type SignalVariant = z.infer<typeof signalVariantSchema>;
export const SIGNAL_VARIANTS = signalVariantSchema.options;

export const signalEvidenceStatusSchema = z.enum([
  'complete',
  'partial',
  'delayed',
  'unavailable',
  'stale',
  'sampled',
  'conflicting',
]);
export type SignalEvidenceStatus = z.infer<typeof signalEvidenceStatusSchema>;

export const signalSessionStatusSchema = z.enum(['in_progress', 'completed']);
export type SignalSessionStatus = z.infer<typeof signalSessionStatusSchema>;

export const signalPhaseSchema = z.enum([
  'briefing',
  'investigate',
  'commit',
  'outcome',
  'debrief',
]);
export type SignalPhase = z.infer<typeof signalPhaseSchema>;

export const signalActionTypeSchema = z.enum([
  'request_evidence',
  'ask_question',
  'submit_hypothesis',
  'revise_hypothesis',
  'commit_decision',
  'advance_clock',
]);
export type SignalActionType = z.infer<typeof signalActionTypeSchema>;

export const startSignalInterviewSchema = z.object({
  role: z.string().trim().min(2).max(120).default('Backend Engineer'),
  experienceLevel: experienceLevelSchema.default('junior'),
  scenarioId: z.string().trim().min(1).max(80).default('checkout-latency'),
  variant: signalVariantSchema.default('delayed_incomplete'),
});
export type StartSignalInterviewInput = z.infer<
  typeof startSignalInterviewSchema
>;

export const signalActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('request_evidence'),
    evidenceKey: z.string().trim().min(1).max(80),
  }),
  z.object({
    type: z.literal('ask_question'),
    question: z.string().trim().min(1).max(2000),
  }),
  z.object({
    type: z.literal('submit_hypothesis'),
    claim: z.string().trim().min(1).max(2000),
    supportingEvidenceKeys: z.array(z.string().trim().min(1).max(80)).max(20),
    missingEvidence: z.string().trim().max(1000).optional(),
    confidence: z.number().int().min(0).max(4).optional(),
  }),
  z.object({
    type: z.literal('revise_hypothesis'),
    claim: z.string().trim().min(1).max(2000),
    supportingEvidenceKeys: z.array(z.string().trim().min(1).max(80)).max(20),
    missingEvidence: z.string().trim().max(1000).optional(),
    confidence: z.number().int().min(0).max(4).optional(),
    reason: z.string().trim().min(1).max(2000),
  }),
  z.object({
    type: z.literal('commit_decision'),
    decisionKey: z.string().trim().min(1).max(80),
    reasoning: z.string().trim().min(1).max(4000),
    expectedEffect: z.string().trim().min(1).max(2000),
    verificationPlan: z.string().trim().min(1).max(2000),
    supportingEvidenceKeys: z.array(z.string().trim().min(1).max(80)).max(20),
  }),
  z.object({
    type: z.literal('advance_clock'),
    seconds: z.number().int().min(1).max(600).default(30),
  }),
]);
export type SignalActionInput = z.infer<typeof signalActionSchema>;

export const signalVisibleSignalSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string(),
  interpretation: z.string(),
});
export type SignalVisibleSignal = z.infer<typeof signalVisibleSignalSchema>;

export const signalEvidenceViewSchema = z.object({
  key: z.string(),
  sourceType: z.string(),
  title: z.string(),
  status: signalEvidenceStatusSchema,
  completenessNote: z.string().nullable(),
  provenance: z.string(),
  payload: z.string(),
  eventTimeSeconds: z.number().int(),
  availableAtSeconds: z.number().int(),
});
export type SignalEvidenceView = z.infer<typeof signalEvidenceViewSchema>;

export const signalHypothesisViewSchema = z.object({
  id: z.string(),
  claim: z.string(),
  supportingEvidenceKeys: z.array(z.string()),
  missingEvidence: z.string().nullable(),
  confidence: z.number().int().nullable(),
  sequence: z.number().int(),
  supersedesId: z.string().nullable(),
  createdAt: z.string(),
});
export type SignalHypothesisView = z.infer<typeof signalHypothesisViewSchema>;

export const signalDecisionViewSchema = z.object({
  id: z.string(),
  decisionKey: z.string(),
  description: z.string(),
  reasoning: z.string(),
  expectedEffect: z.string(),
  verificationPlan: z.string(),
  supportingEvidenceKeys: z.array(z.string()),
  outcomeSummary: z.string().nullable(),
  sequence: z.number().int(),
  createdAt: z.string(),
});
export type SignalDecisionView = z.infer<typeof signalDecisionViewSchema>;

export const signalDimensionScoreSchema = z.object({
  key: z.string(),
  label: z.string(),
  score: z.number().int().min(0).max(4).nullable(),
  insufficientEvidence: z.boolean(),
  explanation: z.string(),
  evidenceRefs: z.array(z.string()),
});
export type SignalDimensionScore = z.infer<typeof signalDimensionScoreSchema>;

export const signalEvaluationViewSchema = z.object({
  id: z.string(),
  rubricVersion: z.string(),
  dimensions: z.array(signalDimensionScoreSchema),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  recommendedPractice: z.string(),
  overallSummary: z.string(),
  scenarioExplanation: z.string(),
});
export type SignalEvaluationView = z.infer<typeof signalEvaluationViewSchema>;

export const signalEventViewSchema = z.object({
  id: z.string(),
  sequence: z.number().int(),
  eventType: z.string(),
  simulatedTimeSeconds: z.number().int(),
  summary: z.string(),
  createdAt: z.string(),
});
export type SignalEventView = z.infer<typeof signalEventViewSchema>;

export const signalReplayViewSchema = z.object({
  id: z.string(),
  decisionId: z.string(),
  keepOrChange: z.enum(['keep', 'change']),
  revisedDecisionKey: z.string().nullable(),
  reasoning: z.string(),
  comparisonNotes: z.string().nullable(),
  createdAt: z.string(),
});
export type SignalReplayView = z.infer<typeof signalReplayViewSchema>;

export const signalActionOptionSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
});
export type SignalActionOption = z.infer<typeof signalActionOptionSchema>;

export const signalSessionSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  scenarioTitle: z.string(),
  variant: signalVariantSchema,
  status: signalSessionStatusSchema,
  phase: signalPhaseSchema,
  role: z.string(),
  experienceLevel: experienceLevelSchema,
  briefing: z.string(),
  simulatedTimeSeconds: z.number().int(),
  visibleSignals: z.array(signalVisibleSignalSchema),
  availableEvidenceKeys: z.array(z.string()),
  unlockedEvidence: z.array(signalEvidenceViewSchema),
  evidenceCatalog: z.array(signalActionOptionSchema),
  decisionOptions: z.array(signalActionOptionSchema),
  hypotheses: z.array(signalHypothesisViewSchema),
  decisions: z.array(signalDecisionViewSchema),
  events: z.array(signalEventViewSchema),
  interviewerMessage: z.string().nullable(),
  evaluation: signalEvaluationViewSchema.nullable(),
  replay: signalReplayViewSchema.nullable(),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
});
export type SignalSession = z.infer<typeof signalSessionSchema>;

export const signalSessionSummarySchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  scenarioTitle: z.string(),
  variant: signalVariantSchema,
  status: signalSessionStatusSchema,
  role: z.string(),
  experienceLevel: experienceLevelSchema,
  startedAt: z.string(),
  completedAt: z.string().nullable(),
});
export type SignalSessionSummary = z.infer<typeof signalSessionSummarySchema>;

export const signalReplaySchema = z
  .object({
    decisionId: z.string(),
    keepOrChange: z.enum(['keep', 'change']),
    revisedDecisionKey: z.string().trim().min(1).max(80).optional(),
    reasoning: z.string().trim().min(1).max(4000),
  })
  .superRefine((value, ctx) => {
    if (
      value.keepOrChange === 'change' &&
      (!value.revisedDecisionKey ||
        value.revisedDecisionKey.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'revisedDecisionKey is required when keepOrChange is change',
        path: ['revisedDecisionKey'],
      });
    }
  });
export type SignalReplayInput = z.infer<typeof signalReplaySchema>;
