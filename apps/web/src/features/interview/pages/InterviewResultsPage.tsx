import type { InterviewSession } from '@tayyari/shared';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { Button } from '../../../shared/ui/Button';
import { InlineStatus } from '../../../shared/ui/InlineStatus';
import { useAuth } from '../../auth/hooks/useAuth';
import { getInterview } from '../api/interviewsApi';

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
        <p className="rounded-[10px] bg-danger-soft px-3.5 py-3 text-[0.85rem] text-danger">
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

  return (
    <section>
      <p className="m-0 text-[0.72rem] font-semibold tracking-[0.16em] text-signal uppercase">
        Round complete
      </p>
      <h1 className="font-display mt-3 text-[clamp(2rem,4vw,2.8rem)] leading-none font-normal tracking-[-0.03em] text-ink">
        Your score
      </h1>
      {isMock ? (
        <p className="mt-3 m-0 text-[0.85rem] text-mute">
          Scripted practice scores — useful for flow, not a live model grade.
        </p>
      ) : null}

      <div className="mt-5 border-b border-line pb-6">
        <p className="font-display m-0 text-[clamp(3.5rem,12vw,5.5rem)] leading-[0.95] font-normal tracking-[-0.04em] text-ink">
          {score}
          <span className="text-[0.45em] text-mute">/100</span>
        </p>
        <p className="mt-4 m-0 max-w-xl text-base leading-relaxed text-ink-soft">
          {session.overallFeedback ??
            `Round complete for ${session.role}. Review each question below.`}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button
            className="min-w-40 px-5"
            onClick={() => navigate('/app/interviews')}
          >
            Run another round
          </Button>
          <Button
            variant="ghost"
            className="min-w-40 px-5"
            onClick={() => navigate('/app')}
          >
            Return to workspace
          </Button>
        </div>
      </div>

      <h2 className="font-display mt-9 mb-0 text-[1.55rem] font-normal tracking-[-0.02em] text-ink">
        Question by question
      </h2>
      <div className="mt-3 border-t border-line">
        {reviewed.map((turn, index) => (
          <article key={turn.id} className="border-b border-line py-5">
            <p className="m-0 text-[0.75rem] font-semibold tracking-[0.1em] text-mute uppercase">
              {turn.kind === 'follow_up'
                ? 'Follow-up'
                : `Topic ${
                    reviewed
                      .slice(0, index + 1)
                      .filter((item) => item.kind !== 'follow_up').length
                  }`}
            </p>
            <h3 className="font-display mt-2 m-0 text-[1.15rem] leading-snug font-normal text-ink">
              {turn.questionText}
            </h3>
            {turn.answerText ? (
              <p className="mt-2.5 m-0 text-[0.92rem] leading-relaxed text-ink-soft">
                {turn.answerText}
              </p>
            ) : null}
            {turn.feedback ? (
              <p className="mt-2.5 m-0 text-[0.92rem] leading-relaxed text-ink-soft">
                {turn.feedback}
              </p>
            ) : null}
            {turn.rubric ? <RubricBars rubric={turn.rubric} /> : null}
            {turn.score !== null ? (
              <p className="mt-2 m-0 text-[0.82rem] font-semibold text-signal-hover">
                {turn.score} / 100
              </p>
            ) : null}
          </article>
        ))}
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
    <ul className="mt-3 grid gap-2">
      {RUBRIC_LABELS.map(([key, label]) => (
        <li key={key}>
          <div className="mb-1 flex justify-between text-[0.75rem] text-ink-soft">
            <span>{label}</span>
            <span>{rubric[key]}</span>
          </div>
          <div className="h-[3px] overflow-hidden rounded-full bg-line">
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
