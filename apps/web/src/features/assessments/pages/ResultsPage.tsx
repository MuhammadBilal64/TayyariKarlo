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
        <p className="rounded-[6px] bg-danger-soft px-3.5 py-3 text-[0.85rem] text-danger">
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
    <section className="w-full">
      <p className="m-0 text-[0.7rem] font-semibold tracking-[0.18em] text-signal uppercase">
        Results
      </p>

      <div className="mt-3 grid items-center gap-4 border-b border-line pb-8 md:grid-cols-[minmax(0,1.15fr)_minmax(12rem,0.85fr)] md:gap-6 md:pb-9">
        <div>
          <h1 className="font-display m-0 text-[clamp(2.15rem,4.2vw,3rem)] leading-[1.06] font-semibold tracking-[-0.03em] text-ink italic">
            {topicLabel(result.topic)} · {difficultyLabel(result.difficulty)}
          </h1>
          <p className="mt-3 m-0 text-[0.9rem] text-ink-soft">
            {result.correctCount} correct · {result.incorrectCount} missed
          </p>
        </div>
        <div className="relative flex min-h-[8.5rem] w-full flex-col items-center justify-center px-3 py-5">
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 h-[11rem] w-[11rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/14 blur-3xl md:h-[13rem] md:w-[13rem]"
          />
          <p className="font-display relative m-0 text-[clamp(2.85rem,8vw,4.25rem)] leading-[0.95] font-normal tracking-[-0.04em] text-ink">
            {Math.round(result.percent)}
            <em className="italic text-signal">%</em>
          </p>
          <p className="relative mt-2 m-0 text-center text-[0.8rem] leading-snug text-ink-soft">
            {result.correctCount} of {result.questionCount} correct
          </p>
        </div>
      </div>

      {result.topicBreakdown.length > 1 ? (
        <>
          <p className="mt-8 mb-0 text-[0.8rem] font-semibold text-ink-soft">
            By topic
          </p>
          <ul className="mt-3 m-0 list-none border-t border-line p-0">
            {result.topicBreakdown.map((row) => (
              <li key={row.topic} className="border-b border-line py-3.5">
                <div className="flex justify-between gap-4 text-[0.95rem]">
                  <strong className="font-semibold text-ink">
                    {topicLabel(row.topic)}
                  </strong>
                  <span className="text-mute">
                    {row.correct}/{row.total} · {Math.round(row.percent)}%
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden bg-line">
                  <i
                    className="ui-progress block h-full bg-signal not-italic"
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="mt-8 mb-0 text-[0.8rem] font-semibold text-ink-soft">
        Review
      </p>
      <ul className="mt-3 m-0 list-none border-t border-line p-0">
        {reviewItems.map((item) => {
          const selected =
            item.selectedIndex === null
              ? '—'
              : `${optionLetter(item.selectedIndex)}. ${item.question.options[item.selectedIndex] ?? ''}`;
          const correct = `${optionLetter(item.correctIndex)}. ${item.question.options[item.correctIndex] ?? ''}`;

          return (
            <li key={item.questionId} className="border-b border-line">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-5 gap-y-1 py-[1.05rem]">
                <div className="min-w-0">
                  <p className="m-0 text-[0.95rem] font-medium text-ink">
                    {item.question.prompt}
                  </p>
                  <p className="mt-1 m-0 text-[0.85rem] text-ink-soft">
                    {item.isCorrect
                      ? `Matched — ${selected}`
                      : `Chose ${selected} · Correct: ${correct}`}
                  </p>
                </div>
                <span
                  className={`pt-0.5 text-[0.8rem] font-semibold whitespace-nowrap ${
                    item.isCorrect ? 'text-signal' : 'text-danger'
                  }`}
                >
                  {item.isCorrect ? 'Correct' : 'Missed'}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-9 flex flex-wrap gap-2.5 border-t border-line pt-7">
        <Button
          className="h-12 min-w-[11rem] px-5"
          onClick={() => navigate('/app/assessments')}
        >
          Practice again
        </Button>
        <Button
          variant="ghost"
          className="h-12 min-w-[11rem] px-5"
          onClick={() => navigate('/app')}
        >
          Back to progress
        </Button>
      </div>
    </section>
  );
}
