export type EvidenceStatus =
  | 'complete'
  | 'partial'
  | 'delayed'
  | 'unavailable'
  | 'stale'
  | 'sampled'
  | 'conflicting';

export type SignalVariant = 'full' | 'delayed_incomplete' | 'conflicting';

export interface ScenarioEvidence {
  key: string;
  sourceType: string;
  title: string;
  status: EvidenceStatus;
  completenessNote: string | null;
  provenance: string;
  payload: string;
  eventTimeSeconds: number;
  /** Relative to scenario clock; Infinity-like large value means never for this variant. */
  availableAtSeconds: number;
}

export interface ScenarioDecision {
  key: string;
  label: string;
  description: string;
  outcomeSummary: string;
  quality: 'strong' | 'acceptable' | 'risky' | 'weak';
}

export interface ScenarioDefinition {
  id: string;
  version: string;
  title: string;
  roleTrack: string;
  difficulty: string;
  briefing: string;
  groundTruth: string;
  scenarioExplanation: string;
  initialSignals: Array<{
    key: string;
    label: string;
    value: string;
    interpretation: string;
  }>;
  evidenceByVariant: Record<SignalVariant, ScenarioEvidence[]>;
  faq: Array<{ match: string[]; answer: string }>;
  decisions: ScenarioDecision[];
  delayedUnlockHintSeconds: number;
}

const BASE_SIGNALS = [
  {
    key: 'checkout_p95',
    label: 'Checkout API p95 latency',
    value: '4.8 seconds',
    interpretation: 'Abnormally high',
  },
  {
    key: 'checkout_errors',
    label: 'Checkout error rate',
    value: '12%',
    interpretation: 'Elevated',
  },
  {
    key: 'db_cpu',
    label: 'Database CPU',
    value: '87%',
    interpretation: 'High, but not conclusive by itself',
  },
  {
    key: 'traces',
    label: 'Distributed traces',
    value: 'Partial',
    interpretation: 'Some request paths are missing',
  },
  {
    key: 'collector',
    label: 'Collector health',
    value: 'Delayed',
    interpretation: 'Some telemetry may arrive late',
  },
];

function evidence(
  partial: Omit<ScenarioEvidence, 'provenance'> & { provenance?: string },
): ScenarioEvidence {
  return {
    provenance: partial.provenance ?? 'Authored scenario fixture',
    ...partial,
  };
}

const FULL_EVIDENCE: ScenarioEvidence[] = [
  evidence({
    key: 'deploy_history',
    sourceType: 'deployment',
    title: 'Deployment history',
    status: 'complete',
    completenessNote: null,
    eventTimeSeconds: 0,
    availableAtSeconds: 0,
    payload:
      'Release checkout-api@2026.11.04.18 shipped 18 minutes before the latency rise. Change summary: ORM helper now opens an extra DB connection per request for a “read replica hint” that still targets the primary.',
  }),
  evidence({
    key: 'app_logs',
    sourceType: 'logs',
    title: 'Application logs',
    status: 'complete',
    completenessNote: null,
    eventTimeSeconds: 5,
    availableAtSeconds: 0,
    payload:
      'Repeated warnings: “Timed out waiting for a free connection from the pool (timeout=2000ms)”. Error spikes align with checkout POST /pay.',
  }),
  evidence({
    key: 'db_metrics',
    sourceType: 'metrics',
    title: 'Database metrics',
    status: 'complete',
    completenessNote: null,
    eventTimeSeconds: 5,
    availableAtSeconds: 0,
    payload:
      'Active connections 95/100 (pool max). Wait queue depth rising. CPU 87%. Slow-query log does not show a new dominant query; connection wait time is elevated.',
  }),
  evidence({
    key: 'traces',
    sourceType: 'traces',
    title: 'Distributed traces',
    status: 'complete',
    completenessNote: null,
    eventTimeSeconds: 8,
    availableAtSeconds: 0,
    payload:
      'Checkout spans show long waits in “acquireConnection” before SQL. Downstream payment spans are normal when the acquire succeeds.',
  }),
  evidence({
    key: 'collector_health',
    sourceType: 'collector',
    title: 'Telemetry collector health',
    status: 'complete',
    completenessNote: null,
    eventTimeSeconds: 3,
    availableAtSeconds: 0,
    payload:
      'Exporter queue had brief backpressure earlier, but is draining. Current delay ~2s. Not the primary checkout failure mode.',
  }),
];

const DELAYED_EVIDENCE: ScenarioEvidence[] = [
  evidence({
    key: 'deploy_history',
    sourceType: 'deployment',
    title: 'Deployment history',
    status: 'complete',
    completenessNote: null,
    eventTimeSeconds: 0,
    availableAtSeconds: 0,
    payload:
      'Release checkout-api@2026.11.04.18 shipped 18 minutes before the latency rise. Change summary: ORM helper now opens an extra DB connection per request for a “read replica hint” that still targets the primary.',
  }),
  evidence({
    key: 'app_logs',
    sourceType: 'logs',
    title: 'Application logs',
    status: 'partial',
    completenessNote:
      'Log shipper lag: newest 90 seconds are not in the searchable index yet.',
    eventTimeSeconds: 5,
    availableAtSeconds: 0,
    payload:
      'Older window shows intermittent “Timed out waiting for a free connection from the pool”. Newest errors are not searchable yet.',
  }),
  evidence({
    key: 'db_metrics',
    sourceType: 'metrics',
    title: 'Database metrics',
    status: 'complete',
    completenessNote: null,
    eventTimeSeconds: 5,
    availableAtSeconds: 0,
    payload:
      'Active connections 95/100 (pool max). Wait queue depth rising. CPU 87%. No single new slow query dominates.',
  }),
  evidence({
    key: 'traces',
    sourceType: 'traces',
    title: 'Distributed traces',
    status: 'delayed',
    completenessNote:
      'Several spans arrived after the requests finished. Arrival order is not event order.',
    eventTimeSeconds: 8,
    availableAtSeconds: 45,
    payload:
      'Late-arriving spans: acquireConnection waits dominate. Some child spans appear after parent end times because the collector delayed export.',
  }),
  evidence({
    key: 'collector_health',
    sourceType: 'collector',
    title: 'Telemetry collector health',
    status: 'partial',
    completenessNote: 'Queue metrics refresh every 30s.',
    eventTimeSeconds: 3,
    availableAtSeconds: 30,
    payload:
      'Exporter queue depth was high for ~10 minutes. Spans for checkout were delayed 5–12 seconds. Missing early traces were an observability delay, not proof the DB was healthy.',
  }),
];

const CONFLICTING_EVIDENCE: ScenarioEvidence[] = [
  evidence({
    key: 'deploy_history',
    sourceType: 'deployment',
    title: 'Deployment history',
    status: 'complete',
    completenessNote: null,
    eventTimeSeconds: 0,
    availableAtSeconds: 0,
    payload:
      'Release checkout-api@2026.11.04.18 shipped 18 minutes before the latency rise. Change summary: ORM helper opens an extra DB connection per request.',
  }),
  evidence({
    key: 'app_logs',
    sourceType: 'logs',
    title: 'Application logs',
    status: 'complete',
    completenessNote: null,
    eventTimeSeconds: 5,
    availableAtSeconds: 0,
    payload:
      'Warnings: connection pool timeouts on checkout POST /pay. Also a noisy INFO line from a batch job unrelated to checkout.',
  }),
  evidence({
    key: 'db_metrics',
    sourceType: 'metrics',
    title: 'Database metrics',
    status: 'conflicting',
    completenessNote:
      'Conflicts with an early incomplete trace view that suggested “DB idle”.',
    eventTimeSeconds: 5,
    availableAtSeconds: 0,
    payload:
      'Pool saturated (95/100). CPU high. This disagrees with the first partial trace summary that showed almost no DB time — that summary was missing acquire spans.',
  }),
  evidence({
    key: 'traces',
    sourceType: 'traces',
    title: 'Distributed traces',
    status: 'conflicting',
    completenessNote:
      'First export omitted acquireConnection spans; later export includes them.',
    eventTimeSeconds: 8,
    availableAtSeconds: 40,
    payload:
      'Initial sampled view looked “DB idle”. Complete export shows long acquireConnection waits. The conflict is incomplete sampling plus collector delay, not two different realities.',
  }),
  evidence({
    key: 'collector_health',
    sourceType: 'collector',
    title: 'Telemetry collector health',
    status: 'complete',
    completenessNote: null,
    eventTimeSeconds: 3,
    availableAtSeconds: 25,
    payload:
      'Tail sampling dropped some client spans during backpressure. That made early traces look healthier than the request path was.',
  }),
];

export const CHECKOUT_LATENCY_SCENARIO: ScenarioDefinition = {
  id: 'checkout-latency',
  version: '1',
  title: 'The Missing Evidence',
  roleTrack: 'backend',
  difficulty: 'junior',
  briefing:
    'Our e-commerce checkout API has become slow and some requests are failing. The dashboards show unusual latency, but the distributed traces are incomplete. You are the engineer investigating the issue. What would you like to examine first?',
  groundTruth:
    'A recent application change increases DB connections opened per request. The pool saturates under normal traffic. Collector delay/sampling made early traces misleading.',
  scenarioExplanation:
    'The actionable fault was connection-pool pressure from the new release. High DB CPU was a symptom. Incomplete or delayed traces could make the database look idle until acquire spans arrived. Good investigation separates event time from evidence arrival time and does not treat missing spans as proof of health.',
  initialSignals: BASE_SIGNALS,
  evidenceByVariant: {
    full: FULL_EVIDENCE,
    delayed_incomplete: DELAYED_EVIDENCE,
    conflicting: CONFLICTING_EVIDENCE,
  },
  faq: [
    {
      match: ['traffic', 'load', 'rps', 'users'],
      answer:
        'Checkout RPS is within the normal daily band. There was no marketing spike that explains a sudden pool saturation by itself.',
    },
    {
      match: ['payment', 'stripe', 'psp', 'downstream'],
      answer:
        'Payment provider latency is normal in the windows where checkout acquired a DB connection successfully.',
    },
    {
      match: ['cache', 'redis'],
      answer:
        'Redis hit rates are unchanged. Checkout payment path does not depend on a new cache key in this release.',
    },
  ],
  decisions: [
    {
      key: 'rollback_release',
      label: 'Roll back the recent checkout release',
      description:
        'Revert checkout-api@2026.11.04.18 while keeping traffic on the previous build.',
      outcomeSummary:
        'Pool wait time and checkout errors fall within minutes. You still need to fix the connection leak before re-shipping.',
      quality: 'strong',
    },
    {
      key: 'reduce_connection_pressure',
      label: 'Remove the extra connection open per request',
      description:
        'Hotfix: stop opening the redundant connection in the ORM helper, deploy a patch.',
      outcomeSummary:
        'Connection demand returns to baseline. Latency improves after deploy. Strong when logs/metrics already implicate acquire waits.',
      quality: 'strong',
    },
    {
      key: 'increase_pool_size',
      label: 'Increase the DB pool max',
      description:
        'Raise pool max from 100 to 200 without changing request code.',
      outcomeSummary:
        'Symptoms ease briefly, then the database shows higher memory and risk of cascading load. Risky band-aid if the app still opens extra connections per request.',
      quality: 'risky',
    },
    {
      key: 'scale_app_replicas',
      label: 'Scale checkout API replicas',
      description: 'Add app pods without addressing connection usage.',
      outcomeSummary:
        'More replicas open even more connections. Pool exhaustion worsens. Weak under current evidence.',
      quality: 'weak',
    },
    {
      key: 'keep_investigating',
      label: 'Keep gathering evidence before a disruptive change',
      description:
        'Hold production changes; continue investigation for a short window.',
      outcomeSummary:
        'Reasonable if critical evidence is still delayed, but customer impact continues. Acceptable as a short pause with a time box, weak as a final action after pool evidence is clear.',
      quality: 'acceptable',
    },
  ],
  delayedUnlockHintSeconds: 45,
};

export function getScenario(scenarioId: string): ScenarioDefinition {
  if (scenarioId === CHECKOUT_LATENCY_SCENARIO.id) {
    return CHECKOUT_LATENCY_SCENARIO;
  }
  throw new Error(`Unknown scenario: ${scenarioId}`);
}
