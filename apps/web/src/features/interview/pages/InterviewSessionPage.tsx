import type { InterviewSession } from '@tayyari/shared';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { Button } from '../../../shared/ui/Button';
import { useAuth } from '../../auth/hooks/useAuth';
import { answerInterview, getInterview } from '../api/interviewsApi';

export function InterviewSessionPage() {
  const { sessionId = '' } = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!accessToken || !sessionId) {
        setError('Interview not found');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getInterview(sessionId, accessToken);
        if (cancelled) return;
        if (data.status === 'completed') {
          navigate(`/app/interviews/${sessionId}/results`, { replace: true });
          return;
        }
        setSession(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Unable to load this interview',
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

  const openTurn = useMemo(
    () => session?.turns.find((turn) => turn.answerText === null) ?? null,
    [session],
  );

  const answeredCount = useMemo(
    () => session?.turns.filter((turn) => turn.answerText !== null).length ?? 0,
    [session],
  );

  const progressPercent = session
    ? Math.min(
        100,
        Math.round(
          ((answeredCount + (openTurn ? 0.35 : 0)) / session.questionCount) *
            100,
        ),
      )
    : 0;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!accessToken || !sessionId) {
      setError('You need to be signed in');
      return;
    }

    const trimmed = answer.trim();
    if (!trimmed) {
      setError('Write a response before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const next = await answerInterview(
        sessionId,
        { answer: trimmed },
        accessToken,
      );
      setAnswer('');
      if (next.status === 'completed') {
        navigate(`/app/interviews/${sessionId}/results`, { replace: true });
        return;
      }
      setSession(next);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to submit that response',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <p className="m-0 text-sm text-ink-soft" role="status">
        Loading interview…
      </p>
    );
  }

  if (error && !session) {
    return (
      <section>
        <p className="rounded-[10px] bg-danger-soft px-3.5 py-3 text-[0.85rem] text-danger">
          {error}
        </p>
        <Link
          to="/app/interviews"
          className="mt-4 inline-block text-sm font-semibold text-signal"
        >
          State the role
        </Link>
      </section>
    );
  }

  if (!session || !openTurn) {
    return (
      <section>
        <p className="m-0 text-sm text-ink-soft">
          No open question on this round.
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

  const priorTurns = session.turns.filter((turn) => turn.answerText !== null);
  const roundNumber = openTurn.orderIndex + 1;
  const isMock = session.provider === 'mock' || session.provider === 'none';

  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <p className="m-0 text-[0.8rem] font-semibold text-ink-soft">
          Round {roundNumber} of {session.questionCount} · {session.role}
        </p>
        {isMock ? (
          <span className="rounded-full border border-line bg-paper-lift px-2 py-0.5 text-[0.68rem] font-semibold tracking-[0.04em] text-ink-soft uppercase">
            Scripted practice
          </span>
        ) : null}
      </div>
      <div
        className="mb-7 h-[3px] overflow-hidden rounded-full bg-line"
        aria-hidden="true"
      >
        <span
          className="block h-full bg-signal transition-[width]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {priorTurns.map((turn) => (
        <article
          key={turn.id}
          className="border-t border-line py-4 first:border-t"
        >
          <p className="m-0 text-[0.72rem] font-semibold tracking-[0.12em] text-signal uppercase">
            Question
          </p>
          <h2 className="font-display mt-2 m-0 text-[clamp(1.25rem,2.8vw,1.45rem)] leading-[1.25] font-normal tracking-[-0.02em] text-ink">
            {turn.questionText}
          </h2>
          <p className="mt-3 m-0 text-[0.95rem] leading-relaxed text-ink-soft">
            {turn.answerText}
          </p>
          {turn.feedback ? (
            <div className="mt-3.5 border-l-[3px] border-signal bg-signal-soft px-3.5 py-3.5 text-[0.88rem] leading-relaxed text-ink">
              {turn.feedback}
              {turn.score !== null ? (
                <p className="mt-2 m-0 text-[0.8rem] font-semibold text-signal-hover">
                  {turn.score} / 100
                </p>
              ) : null}
            </div>
          ) : null}
        </article>
      ))}

      <article className="border-y border-line py-4">
        <p className="m-0 text-[0.72rem] font-semibold tracking-[0.12em] text-signal uppercase">
          Question
        </p>
        <h2 className="font-display mt-2 m-0 text-[clamp(1.35rem,3vw,1.55rem)] leading-[1.25] font-normal tracking-[-0.02em] text-ink">
          {openTurn.questionText}
        </h2>
      </article>

      <form className="mt-6" onSubmit={onSubmit}>
        {error ? (
          <p className="mb-4 rounded-[10px] bg-danger-soft px-3.5 py-3 text-[0.85rem] text-danger">
            {error}
          </p>
        ) : null}
        <label className="block">
          <span className="mb-1.5 block text-[0.8rem] font-medium text-ink-soft">
            Your response
          </span>
          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            rows={6}
            disabled={submitting}
            placeholder="Approach → trade-offs → a concrete example…"
            className="w-full resize-y rounded-[10px] border border-line bg-white px-3.5 py-3 text-[0.95rem] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-mute/70 focus:border-focus focus:shadow-[0_0_0_3px_rgb(42_85_255/0.18)] disabled:opacity-70"
          />
        </label>
        {submitting ? (
          <p className="mt-3 m-0 text-sm text-mute italic" role="status">
            Scoring your response…
          </p>
        ) : null}
        <div className="mt-5">
          <Button
            type="submit"
            className="w-full max-w-64"
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit response'}
          </Button>
        </div>
      </form>
    </section>
  );
}
