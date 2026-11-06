# Signal Integrity QA findings

Source: QA_Agent code matrix + browser E2E (session `cmw3xqxxq000wucbs1yvymmaw`, variant `delayed_incomplete`).

## Findings

id: SI-QA-001
severity: medium
area: Frontend
steps: Complete a Signal session until debrief renders. Inspect API response `evaluation.dimensions[].evidenceRefs` vs UI.
expected: Debrief shows citations (event/evidence IDs) tied to each scored dimension (QA matrix #9, debrief citations).
actual: Fixed — debrief lists Cite: #seq summary per dimension (or insufficient note).
status: fixed

id: SI-QA-002
severity: medium
area: Eval
steps: Finish a session after only `session_started` (commit decision without requesting evidence). Inspect stored evaluation JSON.
expected: Dimensions marked insufficient have empty or non-misleading refs; scored dimensions cite actions that support the score (QA matrix #9–#10).
actual: Fixed — `refsFor` filters by event type; insufficient → `[]`. Covered by `signal-evaluation.spec.ts`.
status: fixed

id: SI-QA-003
severity: medium
area: Backend
steps: Trace `applyAction` when `commit_decision` completes the session; simulate `writeEvaluation` failure after the transaction commits.
expected: Session completion and evaluation are atomic, or failed scoring leaves the session recoverable (QA matrix #14).
actual: Fixed — evaluation persists inside the same transaction; GET recovers completed-without-eval via `writeEvaluation`.
status: fixed

id: SI-QA-004
severity: medium
area: Backend
steps: Send two concurrent `POST .../actions` with `commit_decision` for the same in-progress session.
expected: One decision is recorded; the other is rejected safely (QA matrix #16).
actual: Fixed — `FOR UPDATE` lock + P2002 → ConflictException.
status: fixed

id: SI-QA-005
severity: medium
area: Backend
steps: POST replay with `keepOrChange: "change"` and omit `revisedDecisionKey`.
expected: Validation requires a concrete revised decision when the candidate would change the action.
actual: Fixed — DTO `ValidateIf` + Zod superRefine + service BadRequest.
status: fixed

id: SI-QA-006
severity: medium
area: Frontend
steps: On debrief, click “I would change it” without selecting a different radio decision.
expected: UI blocks replay or sends a valid `revisedDecisionKey` for a change.
actual: Fixed — UI requires a different decisionKey before change replay.
status: fixed

id: SI-QA-007
severity: medium
area: Backend
steps: Search codebase for profile observations written after Signal completion.
expected: Profile observations (demonstrated / claimed / inferred) reference the source Signal session (QA matrix #19).
actual: Fixed — ProfileObservation rows written on Signal eval persist (sourceType signal_session + sourceSessionId); exposed on GET /progress as profileObservations.
status: fixed

id: SI-QA-008
severity: low
area: Backend
steps: POST `/signal-interviews` with JWT and unknown `scenarioId`.
expected: 4xx with a clear client error.
actual: Fixed — `loadScenario` wraps unknown ids as BadRequestException.
status: fixed

id: SI-QA-009
severity: low
area: Frontend
steps: Mid-session, double-click two evidence buttons quickly (Database metrics + Application logs) while busy.
expected: Second click ignored cleanly; both requests serialize without lost UI state.
actual: Fixed — `actionLockRef` ignores overlapping `run`/`onReplay` calls before React re-disables buttons.
status: fixed

id: SI-QA-010
severity: medium
area: Backend
steps: POST `/signal-interviews/:id/replay` with keep; GET session again.
expected: Session payload includes replay record; UI can show confirmation; evaluation unchanged (matrix #18).
actual: Fixed — `replay` on session response + UI confirmation after record.
status: fixed

## Browser E2E results

Signal delayed_incomplete path: PASS (pre-fix session)
- Early Distributed traces blocked at t=0 (available t=45)
- Clock advance 30s → 60s unlocked Telemetry then Traces
- Partial logs, delayed traces, partial collector health labels correct
- Mapped FAQ answered without inventing facts
- Hypothesis + decision → debrief; mutations locked
- Pre-fix: citations missing; replay omitted from GET (now fixed — re-verify)

Classic oral: pending re-run after servers up
