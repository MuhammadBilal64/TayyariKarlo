import type {
  SignalActionInput,
  SignalEvidenceView,
  SignalVariant,
} from '@tayyari/shared';
import {
  type ScenarioDefinition,
  type ScenarioEvidence,
  getScenario,
} from './scenarios/checkout-latency';

export interface HiddenState {
  scenarioId: string;
  variant: SignalVariant;
  unlockedEvidenceKeys: string[];
  lastInterviewerMessage: string | null;
}

export interface RuntimeSnapshot {
  scenario: ScenarioDefinition;
  variant: SignalVariant;
  simulatedTimeSeconds: number;
  unlockedEvidenceKeys: string[];
  lastInterviewerMessage: string | null;
}

export interface ActionResult {
  simulatedTimeSeconds: number;
  hiddenState: HiddenState;
  interviewerMessage: string;
  eventType: string;
  eventSummary: string;
  eventPayload: Record<string, unknown>;
  unlockedEvidence?: SignalEvidenceView;
  decisionOutcome?: {
    decisionKey: string;
    description: string;
    outcomeSummary: string;
    quality: string;
  };
  phaseHint: 'investigate' | 'commit' | 'outcome';
}

function evidenceView(item: ScenarioEvidence): SignalEvidenceView {
  return {
    key: item.key,
    sourceType: item.sourceType,
    title: item.title,
    status: item.status,
    completenessNote: item.completenessNote,
    provenance: item.provenance,
    payload: item.payload,
    eventTimeSeconds: item.eventTimeSeconds,
    availableAtSeconds: item.availableAtSeconds,
  };
}

export class ScenarioRuntime {
  load(scenarioId: string): ScenarioDefinition {
    return getScenario(scenarioId);
  }

  initialHiddenState(scenarioId: string, variant: SignalVariant): HiddenState {
    return {
      scenarioId,
      variant,
      unlockedEvidenceKeys: [],
      lastInterviewerMessage: null,
    };
  }

  catalog(scenario: ScenarioDefinition, variant: SignalVariant) {
    return scenario.evidenceByVariant[variant].map((item) => ({
      key: item.key,
      label: item.title,
      description: `${item.sourceType} · may be ${item.status}`,
    }));
  }

  decisionOptions(scenario: ScenarioDefinition) {
    return scenario.decisions.map((item) => ({
      key: item.key,
      label: item.label,
      description: item.description,
    }));
  }

  visibleEvidence(
    scenario: ScenarioDefinition,
    variant: SignalVariant,
    unlockedKeys: string[],
    simulatedTimeSeconds: number,
  ): SignalEvidenceView[] {
    return scenario.evidenceByVariant[variant]
      .filter(
        (item) =>
          unlockedKeys.includes(item.key) &&
          item.availableAtSeconds <= simulatedTimeSeconds,
      )
      .map(evidenceView);
  }

  apply(snapshot: RuntimeSnapshot, action: SignalActionInput): ActionResult {
    const { scenario, variant } = snapshot;
    let time = snapshot.simulatedTimeSeconds;
    const unlocked = [...snapshot.unlockedEvidenceKeys];
    const evidence = scenario.evidenceByVariant[variant];

    if (action.type === 'advance_clock') {
      time += action.seconds;
      const newlyAvailable = evidence.filter(
        (item) =>
          item.availableAtSeconds <= time &&
          item.availableAtSeconds > snapshot.simulatedTimeSeconds,
      );
      const message =
        newlyAvailable.length > 0
          ? `Scenario clock advanced to t=${time}s. New evidence may now be available: ${newlyAvailable
              .map((item) => item.title)
              .join(', ')}.`
          : `Scenario clock advanced to t=${time}s. No new evidence became available.`;
      return {
        simulatedTimeSeconds: time,
        hiddenState: {
          scenarioId: scenario.id,
          variant,
          unlockedEvidenceKeys: unlocked,
          lastInterviewerMessage: message,
        },
        interviewerMessage: message,
        eventType: 'clock_advanced',
        eventSummary: message,
        eventPayload: { seconds: action.seconds, time },
        phaseHint: 'investigate',
      };
    }

    if (action.type === 'request_evidence') {
      const item = evidence.find((entry) => entry.key === action.evidenceKey);
      if (!item) {
        throw new Error('That evidence source is not part of this scenario.');
      }
      if (item.availableAtSeconds > time) {
        const message = `${item.title} is not available yet at t=${time}s (becomes available at t=${item.availableAtSeconds}s). Arrival time is not the same as event time.`;
        return {
          simulatedTimeSeconds: time,
          hiddenState: {
            scenarioId: scenario.id,
            variant,
            unlockedEvidenceKeys: unlocked,
            lastInterviewerMessage: message,
          },
          interviewerMessage: message,
          eventType: 'evidence_unavailable',
          eventSummary: message,
          eventPayload: {
            evidenceKey: item.key,
            availableAtSeconds: item.availableAtSeconds,
          },
          phaseHint: 'investigate',
        };
      }
      if (!unlocked.includes(item.key)) {
        unlocked.push(item.key);
      }
      const view = evidenceView(item);
      const message = `Opened ${item.title} (${item.status}). ${item.completenessNote ?? 'Treat this as authored scenario evidence.'}`;
      return {
        simulatedTimeSeconds: time,
        hiddenState: {
          scenarioId: scenario.id,
          variant,
          unlockedEvidenceKeys: unlocked,
          lastInterviewerMessage: message,
        },
        interviewerMessage: message,
        eventType: 'evidence_requested',
        eventSummary: message,
        eventPayload: { evidenceKey: item.key, status: item.status },
        unlockedEvidence: view,
        phaseHint: 'investigate',
      };
    }

    if (action.type === 'ask_question') {
      const lower = action.question.toLowerCase();
      const hit = scenario.faq.find((entry) =>
        entry.match.some((token) => lower.includes(token)),
      );
      const message = hit
        ? hit.answer
        : 'That source is not available in this scenario. Request one of the listed evidence actions, or ask about traffic, payments, or cache.';
      return {
        simulatedTimeSeconds: time,
        hiddenState: {
          scenarioId: scenario.id,
          variant,
          unlockedEvidenceKeys: unlocked,
          lastInterviewerMessage: message,
        },
        interviewerMessage: message,
        eventType: 'question_asked',
        eventSummary: `Asked: ${action.question.slice(0, 120)}`,
        eventPayload: { question: action.question, answered: Boolean(hit) },
        phaseHint: 'investigate',
      };
    }

    if (
      action.type === 'submit_hypothesis' ||
      action.type === 'revise_hypothesis'
    ) {
      const message =
        action.type === 'revise_hypothesis'
          ? `Hypothesis revised. Reason noted: ${action.reason}`
          : 'Hypothesis recorded. You can keep investigating or commit a decision.';
      return {
        simulatedTimeSeconds: time,
        hiddenState: {
          scenarioId: scenario.id,
          variant,
          unlockedEvidenceKeys: unlocked,
          lastInterviewerMessage: message,
        },
        interviewerMessage: message,
        eventType:
          action.type === 'revise_hypothesis'
            ? 'hypothesis_revised'
            : 'hypothesis_created',
        eventSummary: action.claim.slice(0, 160),
        eventPayload: { ...action },
        phaseHint: 'commit',
      };
    }

    if (action.type === 'commit_decision') {
      const decision = scenario.decisions.find(
        (entry) => entry.key === action.decisionKey,
      );
      if (!decision) {
        throw new Error('That decision is not part of this scenario.');
      }
      const message = `Action applied: ${decision.label}. ${decision.outcomeSummary}`;
      return {
        simulatedTimeSeconds: time,
        hiddenState: {
          scenarioId: scenario.id,
          variant,
          unlockedEvidenceKeys: unlocked,
          lastInterviewerMessage: message,
        },
        interviewerMessage: message,
        eventType: 'decision_committed',
        eventSummary: message,
        eventPayload: {
          decisionKey: decision.key,
          quality: decision.quality,
          reasoning: action.reasoning,
          verificationPlan: action.verificationPlan,
          supportingEvidenceKeys: action.supportingEvidenceKeys,
        },
        decisionOutcome: {
          decisionKey: decision.key,
          description: decision.description,
          outcomeSummary: decision.outcomeSummary,
          quality: decision.quality,
        },
        phaseHint: 'outcome',
      };
    }

    throw new Error('Unsupported action');
  }
}
