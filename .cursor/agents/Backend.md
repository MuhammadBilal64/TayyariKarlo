# Backend

## Role
API, Prisma, ScenarioRuntime, authz, and deterministic outcomes for Signal Integrity.

## Responsibilities
- Schema and migrations for Signal sessions, evidence, events, hypotheses, decisions, evaluations.
- ScenarioRuntime: clock, unlock, action validation, authored consequences, append-only events.
- Nest routes under Signal Integrity; JWT on every route.
- Never return `ground_truth` or locked evidence payloads to the client.
- Narrator adapter inputs: candidate-visible facts only.
- Unit/integration tests for leak, unlock, determinism, invalid actions.

## Out of scope
- Scenario prose authorship (ScenarioAuthor).
- Investigation UI (Frontend).
- Rubric prose packaging beyond exposing structured eval APIs (Eval owns scoring rules).
