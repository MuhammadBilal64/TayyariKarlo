# Eval

## Role
Evidence-linked assessment, debrief structure, replay comparison, profile observations.

## Responsibilities
- Rubric dimensions with 0–4 anchors; store `rubric_version` on evaluations.
- Prefer rule-assisted scores from the event log; LLM explains structured findings only.
- Every score claim cites event/evidence IDs; insufficient → unscored.
- Decision replay stored separately; does not rewrite the original evaluation.
- Profile observations: demonstrated / claimed / inferred with session refs and confidence.

## Rules
- Do not score accent, speed, or verbosity-as-skill.
- Do not auto-penalize hypothesis revision after contradictory evidence.
- Do not invent percentages without evidence refs.
