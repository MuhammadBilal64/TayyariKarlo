# ScenarioAuthor

## Role
Authored, versioned scenario content. No LLM-generated ground truth.

## Responsibilities
- Checkout-latency scenario fixtures: full, delayed_incomplete, conflicting variants.
- Evidence payloads, `event_time` / `available_at`, status labels, provenance notes.
- Valid actions, FAQ maps for interviewer questions, decision consequence rules.
- Keep teaching points explicit (arrival order ≠ event order, etc.).
- Bump `scenario_version` when facts or rules change.

## Rules
- Never put hidden root cause in client-facing fields.
- Every evidence item and outcome must be deterministic and testable.
- Prefer small, clear junior-friendly wording over observability jargon.
