import type { AssessmentAttempt } from '@tayyari/shared';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { Button } from '../../../shared/ui/Button';
import { InlineStatus } from '../../../shared/ui/InlineStatus';
import { useAuth } from '../../auth/hooks/useAuth';
import { getAssessment, submitAssessment } from '../api/assessmentsApi';
import {
  clearAnswerDraft,
  loadAnswerDraft,
  saveAnswerDraft,
} from '../lib/answer-draft';
import { difficultyLabel, optionLetter, topicLabel } from '../lib/labels';

export function TakePage() {
  const { attemptId = '' } = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!accessToken || !attemptId) {
        setError('Assessment not found');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getAssessment(attemptId, accessToken);
        if (cancelled) return;

        if (data.status === 'completed') {
          clearAnswerDraft(attemptId);
          navigate(`/app/assessments/${attemptId}/results`, { replace: true });
          return;
        }

        setAttempt(data);
        const draft = loadAnswerDraft(attemptId);
        if (draft) {
          const allowed = new Set(data.questions.map((q) => q.id));
          const restored: Record<string, number> = {};
          for (const [questionId, selectedIndex] of Object.entries(draft)) {
            if (allowed.has(questionId)) {
              restored[questionId] = selectedIndex;
            }
          }
          setAnswers(restored);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Unable to load this assessment',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, attemptId, navigate]);

  useEffect(() => {
    if (!attemptId || !attempt || attempt.status === 'completed') return;
    saveAnswerDraft(attemptId, answers);
  }, [answers, attempt, attemptId]);

  if (loading) {
    return <InlineStatus message="Loading assessment…" />;
  }

  if (error && !attempt) {
    return (
      <section>
        <p className="rounded-[10px] bg-danger-soft px-3.5 py-3 text-[0.85rem] text-danger">
          {error}
        </p>
        <Link
          to="/app/assessments"
          className="mt-4 inline-block text-sm font-semibold text-signal"
        >
          Start a new assessment
        </Link>
      </section>
    );
  }

  if (!attempt) {
    return null;
  }

  const question = attempt.questions[index];
  if (!question) {
    return (
      <p className="m-0 text-sm text-danger">
        This assessment has no questions.
      </p>
    );
  }

  const total = attempt.questions.length;
  const progress = ((index + 1) / total) * 100;
  const selected = answers[question.id];
  const isLast = index === total - 1;

  function selectOption(optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }));
  }

  async function onSubmit(current: AssessmentAttempt) {
    if (!accessToken) return;

    const unanswered = current.questions.filter(
      (q) => answers[q.id] === undefined,
    );
    if (unanswered.length > 0) {
      const firstMissing = current.questions.findIndex(
        (q) => answers[q.id] === undefined,
      );
      setError(
        `Answer all questions before submitting (${unanswered.length} left)`,
      );
      if (firstMissing >= 0) {
        setIndex(firstMissing);
      }
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = current.questions.map((q) => ({
        questionId: q.id,
        selectedIndex: answers[q.id]!,
      }));
      await submitAssessment(current.id, payload, accessToken);
      clearAnswerDraft(current.id);
      navigate(`/app/assessments/${current.id}/results`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to submit assessment right now',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <p className="m-0 text-[0.8rem] font-semibold tracking-[0.04em] text-mute uppercase">
          Question{' '}
          <span className="font-medium tracking-normal text-ink-soft normal-case">
            {index + 1} of {total}
          </span>
        </p>
        <p className="m-0 text-[0.85rem] font-medium text-ink-soft">
          {topicLabel(attempt.topic)} · {difficultyLabel(attempt.difficulty)}
        </p>
      </div>
      <div
        className="h-[3px] overflow-hidden rounded-full bg-line"
        aria-hidden="true"
      >
        <i
          className="ui-progress block h-full bg-signal not-italic"
          style={{ width: `${progress}%` }}
        />
      </div>

      <h1 className="font-display mt-7 text-[clamp(1.55rem,3.2vw,2.05rem)] leading-[1.25] font-normal tracking-[-0.02em] text-ink">
        {question.prompt}
      </h1>

      {error ? (
        <p className="mt-4 rounded-[10px] bg-danger-soft px-3.5 py-3 text-[0.85rem] text-danger">
          {error}
        </p>
      ) : null}

      <ul className="mt-6 grid list-none gap-2.5 p-0">
        {question.options.map((option, optionIndex) => {
          const checked = selected === optionIndex;
          return (
            <li key={`${question.id}-${optionIndex}`}>
              <label
                className={`flex cursor-pointer items-start gap-3.5 rounded-[10px] border px-4 py-4 transition-[border-color,background-color,transform,box-shadow] duration-200 ease-out active:translate-y-px ${
                  checked
                    ? 'border-signal bg-signal-soft shadow-[0_8px_20px_rgb(15_110_92/0.12)]'
                    : 'border-line bg-white hover:-translate-y-px hover:border-signal/45 hover:shadow-[0_10px_24px_rgb(18_21_28/0.07)]'
                }`}
              >
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  className="sr-only"
                  checked={checked}
                  onChange={() => selectOption(optionIndex)}
                />
                <span
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[0.75rem] font-semibold transition-[background-color,border-color,color] duration-200 ${
                    checked
                      ? 'border-signal bg-signal text-white'
                      : 'border-line bg-paper-lift text-ink-soft'
                  }`}
                  aria-hidden="true"
                >
                  {optionLetter(optionIndex)}
                </span>
                <p className="m-0 pt-0.5 text-[0.98rem] leading-snug text-ink">
                  {option}
                </p>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex flex-wrap gap-2.5 border-t border-line pt-5">
        <Button
          variant="ghost"
          className="min-w-34 px-5 py-3"
          disabled={index === 0 || submitting}
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
        >
          Back
        </Button>
        {isLast ? (
          <Button
            className="min-w-34 px-5 py-3"
            disabled={selected === undefined || submitting}
            onClick={() => {
              void onSubmit(attempt);
            }}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </Button>
        ) : (
          <Button
            className="min-w-34 px-5 py-3"
            disabled={selected === undefined}
            onClick={() => setIndex((value) => Math.min(total - 1, value + 1))}
          >
            Next
          </Button>
        )}
        <Link
          to="/app"
          className="ml-auto self-center text-sm font-medium text-mute no-underline hover:text-ink hover:underline"
        >
          Exit
        </Link>
      </div>
    </section>
  );
}
