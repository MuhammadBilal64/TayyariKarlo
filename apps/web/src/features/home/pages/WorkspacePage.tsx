import type {
  ProgressSummary,
  RecommendationsResponse,
  TopicRecommendation,
} from '@tayyari/shared';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { Button } from '../../../shared/ui/Button';
import { difficultyLabel, topicLabel } from '../../assessments/lib/labels';
import { useAuth } from '../../auth/hooks/useAuth';
import { getProgressSummary } from '../../progress/api/progressApi';
import { getRecommendations } from '../../progress/api/recommendationsApi';

function practiceHref(rec: TopicRecommendation) {
  const params = new URLSearchParams({
    topic: rec.topic,
    difficulty: rec.suggestedDifficulty,
  });
  return `/app/assessments?${params.toString()}`;
}

function formatAttemptDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function TrendMarks({ trends }: { trends: ProgressSummary['trends'] }) {
  if (trends.length === 0) return null;

  const max = Math.max(...trends.map((point) => point.percent), 1);

  return (
    <>
      <div className="mt-5 flex h-10 items-end gap-1.5" aria-hidden="true">
        {trends.map((point) => (
          <span
            key={point.attemptId}
            className="block w-[0.45rem] rounded-t-[2px] bg-signal opacity-85"
            style={{ height: `${Math.max(12, (point.percent / max) * 100)}%` }}
          />
        ))}
      </div>
      <p className="mt-2.5 m-0 text-[0.78rem] text-mute">
        Recent completed scores (oldest → newest)
      </p>
    </>
  );
}

export function WorkspacePage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [recommendations, setRecommendations] = useState<
    RecommendationsResponse['recommendations']
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!accessToken) {
        setError('You need to be signed in to view progress');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [summary, recs] = await Promise.all([
          getProgressSummary(accessToken),
          getRecommendations(accessToken),
        ]);
        if (!cancelled) {
          setProgress(summary);
          setRecommendations(recs.recommendations.slice(0, 3));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Unable to load progress right now',
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
  }, [accessToken]);

  if (loading) {
    return (
      <p className="m-0 text-sm text-ink-soft" role="status">
        Loading progress…
      </p>
    );
  }

  if (error || !progress) {
    return (
      <section>
        <p className="rounded-[10px] bg-danger-soft px-3.5 py-3 text-[0.85rem] text-danger">
          {error ?? 'Unable to load progress'}
        </p>
        <Link
          to="/app/assessments"
          className="mt-4 inline-block text-sm font-semibold text-signal"
        >
          Start an assessment
        </Link>
      </section>
    );
  }

  const skillScore = progress.skillScore;
  const hasScore = skillScore !== null;
  const hasAttempts = progress.recentAttempts.length > 0;

  return (
    <section>
      <p className="m-0 text-[0.72rem] font-semibold tracking-[0.16em] text-signal uppercase">
        Progress
      </p>
      <h1 className="font-display mt-3 text-[clamp(2rem,4vw,2.8rem)] leading-none font-normal tracking-[-0.03em] text-ink">
        Where you stand
      </h1>

      <div className="mt-5 border-b border-line pb-6">
        {hasScore ? (
          <p className="font-display m-0 text-[clamp(3.5rem,12vw,5.25rem)] leading-[0.95] font-normal tracking-[-0.04em] text-ink">
            {Math.round(skillScore)}
            <em className="italic text-signal">%</em>
          </p>
        ) : (
          <p className="font-display m-0 text-[clamp(3.5rem,12vw,5.25rem)] leading-[0.95] font-normal tracking-[-0.04em] text-mute">
            —
          </p>
        )}
        <p className="mt-3.5 m-0 max-w-md text-base text-ink-soft">
          {hasScore
            ? `Skill score from ${progress.completedCount} completed attempt${progress.completedCount === 1 ? '' : 's'}`
            : 'No completed attempts yet. Take a short set to unlock your skill score and history.'}
        </p>
        {hasScore ? <TrendMarks trends={progress.trends} /> : null}
      </div>

      <p className="mt-7 mb-2.5 text-[0.8rem] font-semibold text-ink-soft">
        Focus next
      </p>
      <ol className="m-0 grid list-none gap-0 border-t border-line p-0">
        {recommendations.map((rec, index) => (
          <li
            key={rec.topic}
            className="grid grid-cols-[1.5rem_1fr_auto] items-start gap-x-3.5 gap-y-3 border-b border-line py-4"
          >
            <span className="font-display text-[1.25rem] leading-tight text-signal">
              {index + 1}
            </span>
            <div>
              <p className="m-0 text-[0.98rem] font-semibold text-ink">
                {topicLabel(rec.topic)}
              </p>
              <p className="mt-1.5 m-0 text-[0.88rem] leading-snug text-ink-soft">
                {rec.reason}
              </p>
              <p className="mt-1.5 m-0 text-[0.75rem] font-semibold tracking-[0.08em] text-mute uppercase">
                Suggested · {difficultyLabel(rec.suggestedDifficulty)}
              </p>
            </div>
            <Link
              to={practiceHref(rec)}
              className="inline-flex items-center justify-center self-center rounded-[10px] bg-signal px-3.5 py-2 text-[0.85rem] font-semibold whitespace-nowrap text-white no-underline transition-colors hover:bg-signal-hover hover:no-underline"
            >
              Practice
            </Link>
          </li>
        ))}
      </ol>

      <p className="mt-7 mb-2.5 text-[0.8rem] font-semibold text-ink-soft">
        Recent attempts
      </p>
      {hasAttempts ? (
        <ul className="m-0 list-none border-t border-line p-0">
          {progress.recentAttempts.map((attempt) => (
            <li
              key={attempt.id}
              className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-b border-line py-3.5"
            >
              <div>
                <p className="m-0 text-[0.95rem] font-medium text-ink">
                  {topicLabel(attempt.topic)}
                </p>
                <p className="mt-1 m-0 text-[0.82rem] text-mute">
                  {difficultyLabel(attempt.difficulty)} ·{' '}
                  {attempt.questionCount}{' '}
                  {attempt.questionCount === 1 ? 'question' : 'questions'} ·{' '}
                  {formatAttemptDate(attempt.completedAt)}
                </p>
              </div>
              <Link
                to={`/app/assessments/${attempt.id}/results`}
                className="font-display text-[1.45rem] leading-none text-ink no-underline hover:no-underline"
              >
                {Math.round(attempt.percent)}
                <em className="text-[0.85em] italic text-signal">%</em>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 border-y border-line py-4 text-[0.95rem] text-ink-soft">
          Nothing here yet — your scored sets will show up.
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-2.5 border-t border-line pt-6">
        <Button
          className="min-w-40 px-5 py-3"
          onClick={() => navigate('/app/assessments')}
        >
          Start assessment
        </Button>
        <Button
          variant="ghost"
          className="min-w-40 px-5 py-3"
          onClick={() => navigate('/app/assessments')}
        >
          Browse all topics
        </Button>
      </div>
    </section>
  );
}
