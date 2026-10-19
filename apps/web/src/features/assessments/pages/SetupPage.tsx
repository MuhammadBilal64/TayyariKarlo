import {
  DIFFICULTIES,
  TOPICS,
  startAssessmentSchema,
  type Difficulty,
  type Topic,
} from '@tayyari/shared';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { Button } from '../../../shared/ui/Button';
import { useAuth } from '../../auth/hooks/useAuth';
import { startAssessment } from '../api/assessmentsApi';
import { difficultyLabel, topicLabel } from '../lib/labels';

export function SetupPage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic>('system_design');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [count, setCount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!accessToken) {
      setError('You need to be signed in to start an assessment');
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

  return (
    <section>
      <p className="m-0 text-[0.72rem] font-semibold tracking-[0.16em] text-signal uppercase">
        Assessment
      </p>
      <h1 className="font-display mt-3 text-[clamp(2rem,4vw,2.8rem)] leading-none font-normal tracking-[-0.03em] text-ink">
        Choose your set
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
        Pick a topic and difficulty. We’ll pull a fresh mix of MCQs — no answer
        key until you submit.
      </p>

      <form className="mt-8" onSubmit={onSubmit}>
        {error ? (
          <p className="mb-4 rounded-[10px] bg-danger-soft px-3.5 py-3 text-[0.85rem] text-danger">
            {error}
          </p>
        ) : null}

        <p className="mb-2.5 text-[0.8rem] font-semibold text-ink-soft">
          Topic
        </p>
        <ul className="m-0 grid list-none gap-1.5 p-0">
          {TOPICS.map((value) => (
            <li key={value}>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-[10px] border px-4 py-3.5 transition-[border-color,background] ${
                  topic === value
                    ? 'border-signal bg-signal-soft'
                    : 'border-line bg-paper-lift hover:border-signal/40'
                }`}
              >
                <input
                  type="radio"
                  name="topic"
                  className="accent-signal"
                  checked={topic === value}
                  onChange={() => setTopic(value)}
                />
                <span
                  className={`text-[0.95rem] ${topic === value ? 'font-semibold text-ink' : 'text-ink'}`}
                >
                  {topicLabel(value)}
                </span>
              </label>
            </li>
          ))}
        </ul>

        <p className="mt-7 mb-2.5 text-[0.8rem] font-semibold text-ink-soft">
          Difficulty
        </p>
        <div className="grid grid-cols-3 gap-2">
          {DIFFICULTIES.map((value) => (
            <label
              key={value}
              className={`cursor-pointer rounded-[10px] border px-2 py-3 text-center text-[0.9rem] font-medium transition-[border-color,background,color] ${
                difficulty === value
                  ? 'border-signal bg-signal-soft font-semibold text-signal-hover'
                  : 'border-line bg-white text-ink hover:border-signal/40'
              }`}
            >
              <input
                type="radio"
                name="difficulty"
                className="sr-only"
                checked={difficulty === value}
                onChange={() => setDifficulty(value)}
              />
              {difficultyLabel(value)}
            </label>
          ))}
        </div>

        <p className="mt-7 mb-2.5 text-[0.8rem] font-semibold text-ink-soft">
          Questions
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
            aria-label="Question count"
            className="w-[5.5rem] rounded-[10px] border border-line bg-white px-3.5 py-3 text-[0.95rem] text-ink outline-none focus:border-focus focus:shadow-[0_0_0_3px_rgb(42_85_255/0.18)]"
          />
          <p className="m-0 text-[0.85rem] text-mute">Between 1 and 50</p>
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <Button
            type="submit"
            className="w-full max-w-64"
            disabled={submitting}
          >
            {submitting ? 'Starting…' : 'Start assessment'}
          </Button>
        </div>
      </form>
    </section>
  );
}
