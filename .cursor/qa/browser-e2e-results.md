# Browser E2E results (2026-11-06 evening)

Logged in as `browser.qa.all.scenarios@tayyari.test` on http://127.0.0.1:5173

## Unit tests
- `@tayyari/api` Jest: **14 suites / 72 tests passed**

## Signal Integrity — Full evidence
- Session: `/app/interviews/signal/cmw530rjd0005ucr8fdi28wo7`
- Traces available at t=0; statuses COMPLETE
- Hypothesis → commit `reduce_connection_pressure` → Debrief
- **Cite:** evidence citations visible
- Replay Keep original → **Recorded: kept original**
- Result: **PASS**

## Signal Integrity — Delayed / incomplete
- Session: `cmw532px8000uucr8t9vm7ub2`
- Early traces blocked at t=0; clock to 60s; PARTIAL logs; DELAYED traces
- Debrief + Cite after commit
- Result: **PASS**

## Signal Integrity — Conflicting
- Session: `cmw534k8u001nucr8x7b82svu`
- Database metrics labeled **conflicting** (vs incomplete “DB idle” traces)
- Debrief + Cite after commit
- Result: **PASS**

## Classic oral
- Session: `cmw537vu6002aucr84b3cfnte`
- Created Topic 1 of 5; typed answer; scored **72/100** with dimension feedback
- Result: **PASS** (create + text answer + feedback; did not grind all 5 questions)

## Still open (blocks “done” / merge readiness)
- **SI-QA-007** medium: profile observations after Signal completion (no API path yet)
- **SI-QA-009** low: busy double-click UX
