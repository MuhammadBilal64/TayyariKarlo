# Interviews — Score Stage mocks (UI-3.6)

Direction: same hairline instrument language as Assessments S2 / T2 / R2 and Progress Score Stage. Drop bordered mode/level cards.

## Candidates

| File | Screen | Intent |
|------|--------|--------|
| `setup-v2-score-stage.jpg` | `/app/interviews` | Mode / role / level / evidence as hairline rows + underline select |
| `classic-session-v2-score-stage.jpg` | `/app/interviews/:id` | Progress bar, question + clock, response, 48px actions |
| `classic-results-v2-score-stage.jpg` | `/app/interviews/:id/results` | Split score stage + question-by-question review |
| `signal-session-v2-score-stage.jpg` | `/app/interviews/signal/:id` | Two-column investigation desk; signals/evidence left, interviewer/actions right |

## Constraints

- Classic oral must stay usable.
- No logic rewrite — chrome only.
- Preserve Signal Integrity action surface (evidence, hypothesis, commit, replay).

## Gate

**Awaiting owner approval before implement.**
