import type { AssessmentAttempt } from '@tayyari/shared';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { Button } from '../../../shared/ui/Button';
import { InlineStatus } from '../../../shared/ui/InlineStatus';
import { PageState } from '../../../shared/ui/PageState';
import { StatusBanner } from '../../../shared/ui/StatusBanner';
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
      <PageState
        eyebrow="Assessment"
        title="Assessment unavailable"
        error={error}
        action={
          <Button
            className="min-w-[11rem] px-5"
            onClick={() => navigate('/app/assessments')}
          >
            Start a new assessment
          </Button>
        }
      />
    );
  }

  if (!attempt) {
    return null;
  }

  const question = attempt.questions[index];
  if (!question) {
    return (
      <PageState
        eyebrow="Assessment"
        title="No questions in this set"
        description="This assessment has no questions to display."
        action={
          <Button
            className="min-w-[11rem] px-5"
            onClick={() => navigate('/app/assessments')}
          >
            Choose another set
          </Button>
        }
      />
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
    <section className="w-full">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="m-0 text-[0.8rem] font-semibold text-ink-soft">
          Question {index + 1} of {total}
        </p>
        <p className="m-0 text-[0.85rem] text-ink-soft">
          {topicLabel(attempt.topic)} · {difficultyLabel(attempt.difficulty)}
        </p>
      </div>
      <div className="h-[3px] overflow-hidden bg-line" aria-hidden="true">
        <i
          className="ui-progress block h-full bg-signal not-italic"
          style={{ width: `${progress}%` }}
        />
      </div>

      <h1 className="font-display mt-7 text-[clamp(1.55rem,3.2vw,2.05rem)] leading-[1.3] font-semibold tracking-[-0.02em] text-ink text-balance">
        {question.prompt}
      </h1>

      {error ? <StatusBanner className="mt-4">{error}</StatusBanner> : null}

      <ul className="mt-6 m-0 list-none border-t border-line p-0">
        {question.options.map((option, optionIndex) => {
          const checked = selected === optionIndex;
          return (
            <li key={`${question.id}-${optionIndex}`} className="border-b border-line">
              <label
                className={`ui-row flex cursor-pointer items-start gap-3.5 border-l-2 py-4 transition-[background-color,border-color] duration-200 ${
                  checked
                    ? 'border-l-signal bg-signal-soft/70'
                    : 'border-l-transparent'
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
                  className="w-5 shrink-0 pt-0.5 text-[0.85rem] font-semibold text-signal"
                  aria-hidden="true"
                >
                  {optionLetter(optionIndex)}
                </span>
                <p className="m-0 flex-1 text-[0.98rem] leading-snug text-ink">
                  {option}
                </p>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex flex-wrap items-center gap-2.5 border-t border-line pt-6">
        <Button
          variant="ghost"
          className="min-w-[8.5rem] px-5"
          disabled={index === 0 || submitting}
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
        >
          Back
        </Button>
        {isLast ? (
          <Button
            className="min-w-[8.5rem] px-5"
            disabled={selected === undefined || submitting}
            onClick={() => {
              void onSubmit(attempt);
            }}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </Button>
        ) : (
          <Button
            className="min-w-[8.5rem] px-5"
            disabled={selected === undefined}
            onClick={() => setIndex((value) => Math.min(total - 1, value + 1))}
          >
            Next
          </Button>
        )}
        <Button
          variant="ghost"
          className="ml-auto min-w-[8.5rem] px-5"
          disabled={submitting}
          onClick={() => navigate('/app')}
        >
          Exit
        </Button>
      </div>
    </section>
  );
}
