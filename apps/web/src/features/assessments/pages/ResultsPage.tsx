import type { AssessmentResult } from '@tayyari/shared';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { Button } from '../../../shared/ui/Button';
import { InlineStatus } from '../../../shared/ui/InlineStatus';
import { useAuth } from '../../auth/hooks/useAuth';
import { getAssessmentResult } from '../api/assessmentsApi';
import { difficultyLabel, optionLetter, topicLabel } from '../lib/labels';

export function ResultsPage() {
  const { attemptId = '' } = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!accessToken || !attemptId) {
        setError('Results not found');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getAssessmentResult(attemptId, accessToken);
        if (!cancelled) {
          setResult(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Unable to load assessment results',
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
  }, [accessToken, attemptId]);

  if (loading) {
    return <InlineStatus message="Loading results…" />;
  }

  if (error || !result) {
    return (
      <section>
        <p className="rounded-[10px] bg-danger-soft px-3.5 py-3 text-[0.85rem] text-danger">
          {error ?? 'Results not found'}
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

  const reviewItems = [...result.items]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .slice(0, 8);

  return (
    <section>
      <p className="m-0 text-[0.72rem] font-semibold tracking-[0.16em] text-signal uppercase">
        Results
      </p>
      <h1 className="font-display mt-3 text-[clamp(2rem,4vw,2.8rem)] leading-none font-normal tracking-[-0.03em] text-ink">
        {topicLabel(result.topic)} · {difficultyLabel(result.difficulty)}
      </h1>

      <div className="mt-5 border-b border-line pb-6">
        <p className="font-display m-0 text-[clamp(3.5rem,12vw,5.5rem)] leading-[0.95] font-normal tracking-[-0.04em] text-ink">
          {Math.round(result.percent)}
          <em className="italic text-signal">%</em>
        </p>
        <p className="mt-3.5 m-0 text-base text-ink-soft">
          {result.correctCount} of {result.questionCount} correct
        </p>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <p className="m-0 text-[0.72rem] font-semibold tracking-[0.14em] text-mute uppercase">
              Correct
            </p>
            <p className="mt-1 m-0 text-[1.35rem] font-semibold text-ink">
              {result.correctCount}
            </p>
          </div>
          <div>
            <p className="m-0 text-[0.72rem] font-semibold tracking-[0.14em] text-mute uppercase">
              Incorrect
            </p>
            <p className="mt-1 m-0 text-[1.35rem] font-semibold text-ink">
              {result.incorrectCount}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-7 mb-3 text-[0.8rem] font-semibold text-ink-soft">
        By topic
      </p>
      <div className="grid gap-3.5">
        {result.topicBreakdown.map((row) => (
          <div key={row.topic} className="grid gap-1.5">
            <div className="flex justify-between gap-4 text-[0.9rem]">
              <strong className="font-semibold text-ink">
                {topicLabel(row.topic)}
              </strong>
              <span className="text-mute">
                {row.correct} / {row.total} · {Math.round(row.percent)}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <i
                className="ui-progress block h-full bg-signal not-italic"
                style={{ width: `${row.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-7 mb-3 text-[0.8rem] font-semibold text-ink-soft">
        Review
      </p>
      <ul className="m-0 grid list-none gap-2.5 p-0">
        {reviewItems.map((item) => {
          const selected =
            item.selectedIndex === null
              ? '—'
              : `${optionLetter(item.selectedIndex)}. ${item.question.options[item.selectedIndex] ?? ''}`;
          const correct = `${optionLetter(item.correctIndex)}. ${item.question.options[item.correctIndex] ?? ''}`;

          return (
            <li
              key={item.questionId}
              className={`grid gap-1.5 border-l-[3px] bg-paper-lift px-4 py-3.5 transition-[background-color,transform] duration-200 hover:translate-x-0.5 hover:bg-white ${
                item.isCorrect ? 'border-l-signal' : 'border-l-danger'
              }`}
            >
              <p className="m-0 text-[0.95rem] font-medium text-ink">
                {item.question.prompt}
              </p>
              <p className="m-0 text-[0.85rem] text-ink-soft">
                {item.isCorrect
                  ? `Your answer matched — ${selected}`
                  : `You chose ${selected} · Correct: ${correct}`}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex flex-wrap gap-2.5 border-t border-line pt-5">
        <Button
          className="min-w-40 px-5 py-3"
          onClick={() => navigate('/app/assessments')}
        >
          Try another set
        </Button>
        <Button
          variant="ghost"
          className="min-w-40 px-5 py-3"
          onClick={() => navigate('/app/interviews')}
        >
          Begin interview
        </Button>
        <Button
          variant="ghost"
          className="min-w-40 px-5 py-3"
          onClick={() => navigate('/app')}
        >
          Back to workspace
        </Button>
      </div>
    </section>
  );
}
