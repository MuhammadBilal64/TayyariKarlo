import type { InterviewSession } from '@tayyari/shared';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { Button } from '../../../shared/ui/Button';
import { InlineStatus } from '../../../shared/ui/InlineStatus';
import { useAuth } from '../../auth/hooks/useAuth';
import { getInterview } from '../api/interviewsApi';

function levelLabel(level: InterviewSession['experienceLevel']) {
  switch (level) {
    case 'intern':
      return 'Intern';
    case 'junior':
      return 'Junior';
    case 'mid':
      return 'Mid';
    case 'senior':
      return 'Senior';
    default:
      return level;
  }
}

export function InterviewResultsPage() {
  const { sessionId = '' } = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!accessToken || !sessionId) {
        setError('Results not found');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getInterview(sessionId, accessToken);
        if (cancelled) return;
        if (data.status !== 'completed') {
          navigate(`/app/interviews/${sessionId}`, { replace: true });
          return;
        }
        setSession(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Unable to load interview results',
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
  }, [accessToken, navigate, sessionId]);

  if (loading) {
    return <InlineStatus message="Loading results…" />;
  }

  if (error || !session) {
    return (
      <section>
        <p className="rounded-[6px] bg-danger-soft px-3.5 py-3 text-[0.85rem] text-danger">
          {error ?? 'Results not found'}
        </p>
        <Link
          to="/app/interviews"
          className="mt-4 inline-block text-sm font-semibold text-signal"
        >
          Begin a new interview
        </Link>
      </section>
    );
  }

  const isMock = session.provider === 'mock' || session.provider === 'none';
  const score = session.overallScore ?? 0;
  const reviewed = [...session.turns].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );
  const scored = reviewed.filter((turn) => turn.score !== null);
  const strong = scored.filter((turn) => (turn.score ?? 0) >= 70).length;
  const thin = Math.max(0, scored.length - strong);

  return (
    <section className="w-full">
      <p className="m-0 text-[0.7rem] font-semibold tracking-[0.18em] text-signal uppercase">
        Results
      </p>

      <div className="mt-3 grid items-center gap-4 border-b border-line pb-8 md:grid-cols-[minmax(0,1.15fr)_minmax(12rem,0.85fr)] md:gap-6 md:pb-9">
        <div>
          <h1 className="font-display m-0 text-[clamp(2.15rem,4.2vw,3rem)] leading-[1.06] font-semibold tracking-[-0.03em] text-ink italic">
            {session.role} · {levelLabel(session.experienceLevel)}
          </h1>
          <p className="mt-3 m-0 text-[0.9rem] text-ink-soft">
            {scored.length > 0
              ? `${strong} strong · ${thin} thin`
              : (session.overallFeedback ?? 'Round complete')}
          </p>
          {isMock ? (
            <p className="mt-2 m-0 text-[0.8rem] text-mute">
              Scripted practice scores — useful for flow, not a live model
              grade.
            </p>
          ) : null}
        </div>
        <div className="relative flex min-h-[8.5rem] w-full flex-col items-center justify-center px-3 py-5">
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 h-[11rem] w-[11rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/14 blur-3xl md:h-[13rem] md:w-[13rem]"
          />
          <p className="font-display relative m-0 text-[clamp(2.85rem,8vw,4.25rem)] leading-[0.95] font-normal tracking-[-0.04em] text-ink">
            {score}
            <span className="text-[0.45em] text-mute">/100</span>
          </p>
          <p className="relative mt-2 m-0 text-center text-[0.8rem] leading-snug text-ink-soft">
            overall
          </p>
        </div>
      </div>

      {session.overallFeedback && scored.length > 0 ? (
        <p className="mt-6 m-0 max-w-2xl text-base leading-relaxed text-ink-soft">
          {session.overallFeedback}
        </p>
      ) : null}

      <p className="mt-8 mb-0 text-[0.8rem] font-semibold text-ink-soft">
        Review
      </p>
      <ul className="mt-3 m-0 list-none border-t border-line p-0">
        {reviewed.map((turn, index) => {
          const topicNumber = reviewed
            .slice(0, index + 1)
            .filter((item) => item.kind !== 'follow_up').length;
          return (
            <li key={turn.id} className="border-b border-line">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-5 gap-y-1 py-[1.05rem]">
                <div className="min-w-0">
                  <p className="m-0 text-[0.72rem] font-semibold tracking-[0.1em] text-mute uppercase">
                    {turn.kind === 'follow_up'
                      ? 'Follow-up'
                      : `Topic ${topicNumber}`}
                  </p>
                  <p className="mt-1.5 m-0 text-[0.95rem] font-medium text-ink">
                    {turn.questionText}
                  </p>
                  {turn.feedback ? (
                    <p className="mt-1 m-0 text-[0.85rem] text-ink-soft">
                      Feedback — {turn.feedback}
                    </p>
                  ) : turn.answerText ? (
                    <p className="mt-1 m-0 text-[0.85rem] text-ink-soft">
                      {turn.answerText}
                    </p>
                  ) : null}
                  {turn.rubric ? <RubricBars rubric={turn.rubric} /> : null}
                </div>
                {turn.score !== null ? (
                  <span className="pt-0.5 text-[0.8rem] font-semibold whitespace-nowrap text-signal">
                    {turn.score}/100
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-9 flex flex-wrap gap-2.5 border-t border-line pt-7">
        <Button
          className="min-w-[11rem] px-5"
          onClick={() => navigate('/app/interviews')}
        >
          Run another round
        </Button>
        <Button
          variant="ghost"
          className="min-w-[11rem] px-5"
          onClick={() => navigate('/app')}
        >
          Back to progress
        </Button>
      </div>
    </section>
  );
}

const RUBRIC_LABELS = [
  ['correctness', 'Correctness'],
  ['depth', 'Depth'],
  ['tradeoffs', 'Trade-offs'],
  ['clarity', 'Clarity'],
] as const;

function RubricBars({
  rubric,
}: {
  rubric: NonNullable<InterviewSession['turns'][number]['rubric']>;
}) {
  return (
    <ul className="mt-3 m-0 grid list-none gap-2 p-0">
      {RUBRIC_LABELS.map(([key, label]) => (
        <li key={key}>
          <div className="mb-1 flex justify-between text-[0.75rem] text-ink-soft">
            <span>{label}</span>
            <span>{rubric[key]}</span>
          </div>
          <div className="h-[3px] overflow-hidden bg-line">
            <span
              className="block h-full bg-signal"
              style={{ width: `${rubric[key]}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
