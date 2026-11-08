import type {
  ProgressSummary,
  RecommendationsResponse,
  TopicRecommendation,
} from '@tayyari/shared';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { Button } from '../../../shared/ui/Button';
import { InlineStatus } from '../../../shared/ui/InlineStatus';
import { PageState } from '../../../shared/ui/PageState';
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
    <div
      className="mt-3 flex h-8 items-end justify-center gap-1.5"
      aria-hidden="true"
    >
      {trends.map((point) => (
        <span
          key={point.attemptId}
          className="ui-progress block w-[0.4rem] rounded-t-[2px] bg-signal/85"
          style={{
            height: `${Math.max(10, (point.percent / max) * 100)}%`,
          }}
        />
      ))}
    </div>
  );
}

function ScoreStage({
  hasScore,
  skillScore,
  completedCount,
  trends,
}: {
  hasScore: boolean;
  skillScore: number | null;
  completedCount: number;
  trends: ProgressSummary['trends'];
}) {
  return (
    <div className="relative flex min-h-[8.5rem] w-full flex-col items-center justify-center px-3 py-5 md:min-h-[9.5rem]">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[11rem] w-[11rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/14 blur-3xl md:h-[13rem] md:w-[13rem]"
      />
      {hasScore && skillScore !== null ? (
        <>
          <p className="font-display relative m-0 text-[clamp(2.85rem,8vw,4.25rem)] leading-[0.95] font-normal tracking-[-0.04em] text-ink">
            {Math.round(skillScore)}
            <em className="italic text-signal">%</em>
          </p>
          <p className="relative mt-2 m-0 text-center text-[0.8rem] leading-snug text-ink-soft">
            Skill score from {completedCount} completed attempt
            {completedCount === 1 ? '' : 's'}
          </p>
          <div className="relative">
            <TrendMarks trends={trends} />
          </div>
        </>
      ) : (
        <>
          {/* Mock A empty glyph: short stub bar, not a typographic dash */}
          <span
            aria-hidden
            className="relative block h-1 w-11 rounded-[1px] bg-mute/70"
          />
          <p className="relative mt-3 m-0 max-w-[11.5rem] text-center text-[0.8rem] leading-snug text-ink-soft">
            Unlock with your first completed set.
          </p>
        </>
      )}
    </div>
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
        const [summaryResult, recsResult] = await Promise.allSettled([
          getProgressSummary(accessToken),
          getRecommendations(accessToken),
        ]);

        if (cancelled) return;

        if (summaryResult.status === 'rejected') {
          const err = summaryResult.reason;
          setProgress(null);
          setRecommendations([]);
          setError(
            err instanceof ApiError
              ? err.message
              : 'Unable to load progress right now',
          );
          return;
        }

        setProgress(summaryResult.value);
        setError(null);
        setRecommendations(
          recsResult.status === 'fulfilled'
            ? recsResult.value.recommendations.slice(0, 3)
            : [],
        );
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
    return <InlineStatus message="Loading progress…" />;
  }

  if (error || !progress) {
    return (
      <PageState
        eyebrow="Progress"
        title="Unable to load progress"
        error={error ?? 'Unable to load progress'}
        action={
          <Button
            className="min-w-[11rem] px-5"
            onClick={() => navigate('/app/assessments')}
          >
            Start an assessment
          </Button>
        }
      />
    );
  }

  const skillScore = progress.skillScore;
  const hasScore = skillScore !== null;
  const hasAttempts = progress.recentAttempts.length > 0;

  return (
    <section className="w-full">
      <p className="m-0 text-[0.7rem] font-semibold tracking-[0.18em] text-signal uppercase">
        Progress
      </p>

      {/* Score Stage hero — title left, readout right */}
      <div className="mt-3 grid items-center gap-4 border-b border-line pb-8 md:grid-cols-[minmax(0,1.15fr)_minmax(12rem,0.85fr)] md:gap-6 md:pb-9">
        <h1 className="font-display m-0 text-[clamp(2.15rem,4.2vw,3rem)] leading-[1.06] font-semibold tracking-[-0.03em] text-ink italic">
          Where you stand
        </h1>
        <ScoreStage
          hasScore={hasScore}
          skillScore={skillScore}
          completedCount={progress.completedCount}
          trends={progress.trends}
        />
      </div>

      <p className="mt-8 mb-0 text-[0.8rem] font-semibold text-ink-soft">
        Focus next
      </p>
      {recommendations.length > 0 ? (
        <ul className="mt-3 m-0 list-none border-t border-line p-0">
          {recommendations.map((rec) => (
            <li key={rec.topic} className="border-b border-line">
              <Link
                to={practiceHref(rec)}
                className="ui-row grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-1 py-[1.15rem] no-underline hover:no-underline"
              >
                <div className="min-w-0">
                  <p className="m-0 text-[1rem] font-semibold text-ink">
                    {topicLabel(rec.topic)}
                  </p>
                  <p className="mt-1 m-0 text-[0.875rem] leading-snug text-ink-soft">
                    {rec.reason}
                  </p>
                  <p className="mt-1.5 m-0 text-[0.7rem] font-semibold tracking-[0.1em] text-mute uppercase">
                    Suggested · {difficultyLabel(rec.suggestedDifficulty)}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 self-center text-[0.9rem] font-semibold whitespace-nowrap text-signal">
                  Practice
                  <span aria-hidden>→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 m-0 border-y border-line py-4 text-[0.95rem] text-ink-soft">
          Recommendations unavailable right now. Start any assessment to keep
          practicing.
        </p>
      )}

      <p className="mt-8 mb-0 text-[0.8rem] font-semibold text-ink-soft">
        Recent attempts
      </p>
      {hasAttempts ? (
        <ul className="mt-3 m-0 list-none border-t border-line p-0">
          {progress.recentAttempts.map((attempt) => (
            <li key={attempt.id} className="border-b border-line">
              <Link
                to={`/app/assessments/${attempt.id}/results`}
                className="ui-row grid cursor-pointer grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3.5 no-underline hover:no-underline"
                aria-label={`View results: ${Math.round(attempt.percent)} percent`}
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
                <span className="font-display text-[1.4rem] leading-none text-ink">
                  {Math.round(attempt.percent)}
                  <em className="text-[0.85em] italic text-signal">%</em>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 m-0 border-y border-line py-4 text-[0.95rem] text-ink-soft">
          Nothing here yet — your scored sets will show up.
        </p>
      )}

      <div className="mt-9 border-t border-line pt-7">
        <Button
          className="min-w-[11rem] px-5 py-3"
          onClick={() => navigate('/app/assessments')}
        >
          Start assessment
        </Button>
      </div>
    </section>
  );
}
