import {
  DIFFICULTIES,
  TOPICS,
  difficultySchema,
  startAssessmentSchema,
  topicSchema,
  type Difficulty,
  type Topic,
} from '@tayyari/shared';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { Button } from '../../../shared/ui/Button';
import { useAuth } from '../../auth/hooks/useAuth';
import { startAssessment } from '../api/assessmentsApi';
import { listQuestions } from '../api/questionsApi';
import { difficultyLabel, topicLabel } from '../lib/labels';

function topicFromSearch(value: string | null): Topic {
  const parsed = topicSchema.safeParse(value);
  return parsed.success ? parsed.data : 'system_design';
}

function difficultyFromSearch(value: string | null): Difficulty {
  const parsed = difficultySchema.safeParse(value);
  return parsed.success ? parsed.data : 'easy';
}

function SetupPageForm({
  initialTopic,
  initialDifficulty,
}: {
  initialTopic: Topic;
  initialDifficulty: Difficulty;
}) {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic>(initialTopic);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [count, setCount] = useState(5);
  const [available, setAvailable] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailable() {
      if (!accessToken) {
        setAvailable(null);
        return;
      }

      try {
        const questions = await listQuestions(
          { topic, difficulty },
          accessToken,
        );
        if (cancelled) return;
        setAvailable(questions.length);
        setCount((current) => {
          if (questions.length === 0) return 1;
          return Math.min(Math.max(current, 1), questions.length);
        });
      } catch {
        if (!cancelled) {
          setAvailable(null);
        }
      }
    }

    void loadAvailable();
    return () => {
      cancelled = true;
    };
  }, [accessToken, topic, difficulty]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!accessToken) {
      setError('You need to be signed in to start an assessment');
      return;
    }

    if (available === 0) {
      setError('No questions available for this topic and difficulty yet');
      return;
    }

    const parsed = startAssessmentSchema.safeParse({
      topic,
      difficulty,
      count,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    if (available !== null && parsed.data.count > available) {
      setError(`Only ${available} questions available for this set`);
      return;
    }

    setSubmitting(true);
    try {
      const attempt = await startAssessment(parsed.data, accessToken);
      navigate(`/app/assessments/${attempt.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to start assessment right now',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const maxCount = available && available > 0 ? Math.min(50, available) : 50;

  return (
    <section className="w-full">
      <Link
        to="/app"
        className="mb-5 inline-block cursor-pointer text-sm font-semibold text-signal no-underline hover:underline"
      >
        ← Progress
      </Link>
      <p className="m-0 text-[0.7rem] font-semibold tracking-[0.18em] text-signal uppercase">
        Assessment
      </p>
      <h1 className="font-display mt-3 text-[clamp(2.15rem,4.2vw,3rem)] leading-[1.06] font-semibold tracking-[-0.03em] text-ink italic">
        Choose your set
      </h1>
      <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-soft">
        Pick topic, difficulty, and length — then begin.
      </p>

      <form className="mt-8" onSubmit={onSubmit}>
        {error ? (
          <p className="mb-4 rounded-[6px] bg-danger-soft px-3.5 py-3 text-[0.85rem] text-danger">
            {error}
          </p>
        ) : null}

        <p className="mb-0 text-[0.8rem] font-semibold text-ink-soft">Topic</p>
        <ul className="mt-3 m-0 list-none border-t border-line p-0">
          {TOPICS.map((value) => {
            const selected = topic === value;
            return (
              <li key={value} className="border-b border-line">
                <label className="ui-row flex cursor-pointer items-center gap-3 py-[0.95rem]">
                  <input
                    type="radio"
                    name="topic"
                    className="sr-only"
                    checked={selected}
                    onChange={() => setTopic(value)}
                  />
                  <span
                    aria-hidden
                    className={`size-1.5 shrink-0 rotate-45 ${
                      selected ? 'bg-signal' : 'bg-transparent'
                    }`}
                  />
                  <span
                    className={`text-[1rem] ${
                      selected
                        ? 'font-semibold text-ink'
                        : 'font-medium text-ink-soft'
                    }`}
                  >
                    {topicLabel(value)}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 mb-0 text-[0.8rem] font-semibold text-ink-soft">
          Difficulty
        </p>
        <div className="mt-3 flex flex-wrap gap-5 border-b border-line pb-4">
          {DIFFICULTIES.map((value) => {
            const selected = difficulty === value;
            return (
              <label key={value} className="cursor-pointer">
                <input
                  type="radio"
                  name="difficulty"
                  className="sr-only"
                  checked={selected}
                  onChange={() => setDifficulty(value)}
                />
                <span
                  className={`inline-block border-b-2 pb-1 text-[0.95rem] transition-[color,border-color] duration-200 ${
                    selected
                      ? 'border-ink font-semibold text-ink'
                      : 'border-transparent font-medium text-ink-soft hover:text-ink'
                  }`}
                >
                  {difficultyLabel(value)}
                </span>
              </label>
            );
          })}
        </div>

        <p className="mt-8 mb-0 text-[0.8rem] font-semibold text-ink-soft">
          Questions
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="number"
            min={1}
            max={maxCount}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
            aria-label="Question count"
            className="w-[5.5rem] cursor-text rounded-[6px] border border-line bg-surface px-3.5 py-3 text-[0.95rem] text-ink outline-none transition-[border-color,box-shadow] duration-200 hover:border-ink/25 focus:border-ink focus:shadow-[0_0_0_3px_rgb(11_15_20/0.12)]"
          />
          <p className="m-0 text-[0.85rem] text-mute">
            {available === null
              ? 'Between 1 and 50'
              : available === 0
                ? 'No questions in this set yet'
                : `${available} available · pick 1–${maxCount}`}
          </p>
        </div>

        <div className="mt-9 border-t border-line pt-7">
          <Button
            type="submit"
            className="min-w-[11rem] px-5 py-3"
            disabled={submitting || available === 0}
          >
            {submitting ? 'Starting…' : 'Start assessment'}
          </Button>
        </div>
      </form>
    </section>
  );
}

/** Remount when Practice query params change so topic/difficulty stay in sync. */
export function SetupPage() {
  const [searchParams] = useSearchParams();
  const initialTopic = topicFromSearch(searchParams.get('topic'));
  const initialDifficulty = difficultyFromSearch(
    searchParams.get('difficulty'),
  );

  return (
    <SetupPageForm
      key={`${initialTopic}:${initialDifficulty}`}
      initialTopic={initialTopic}
      initialDifficulty={initialDifficulty}
    />
  );
}
