import type { InterviewSession } from '@tayyari/shared';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { Button } from '../../../shared/ui/Button';
import { InlineStatus } from '../../../shared/ui/InlineStatus';
import { useAuth } from '../../auth/hooks/useAuth';
import { VoiceRoom } from '../components/VoiceRoom';
import {
  answerInterview,
  continueInterview,
  getInterview,
} from '../api/interviewsApi';

export function InterviewSessionPage() {
  const { sessionId = '' } = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const answerRef = useRef('');
  const submitTextRef = useRef<(text: string) => Promise<void>>(
    async () => undefined,
  );
  answerRef.current = answer;

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

  const topic = useMemo(() => {
    if (!session || !openTurn) return { label: '', percent: 0 };
    const mainsAnswered = session.turns.filter(
      (turn) => turn.kind !== 'follow_up' && turn.answerText !== null,
    ).length;
    const current =
      openTurn.kind === 'follow_up' ? mainsAnswered : mainsAnswered + 1;
    const bounded = Math.min(Math.max(current, 1), session.questionCount);
    return {
      label: `Topic ${bounded} of ${session.questionCount}`,
      percent: Math.min(
        100,
        Math.round(((bounded - 0.65) / session.questionCount) * 100),
      ),
    };
  }, [openTurn, session]);

  useEffect(() => {
    if (!openTurn || session?.provider === 'ollama') return;
    setSecondsLeft(120);
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [openTurn?.id, session?.provider]);

  useEffect(() => {
    if (secondsLeft !== 0 || !openTurn || session?.provider === 'ollama') {
      return;
    }
    const text = answerRef.current.trim();
    if (!text) return;
    void submitTextRef.current(text);
  }, [openTurn, secondsLeft, session?.provider]);

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
    await submitText(trimmed);
  }

  async function submitText(trimmed: string) {
    if (!accessToken || !sessionId || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const next = await answerInterview(
        sessionId,
        { answer: trimmed },
        accessToken,
      );
      applySession(next);
    } catch (err) {
      const recovered = openTurn
        ? await recoverAfterAnswer(openTurn.id)
        : false;
      if (!recovered) {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Unable to submit that response',
        );
      }
    } finally {
      setSubmitting(false);
    }
  }
  submitTextRef.current = submitText;

  function applySession(next: InterviewSession) {
    setAnswer('');
    if (next.status === 'completed') {
      navigate(`/app/interviews/${sessionId}/results`, { replace: true });
      return;
    }
    setSession(next);
  }

  async function recoverAfterAnswer(previousOpenId: string) {
    if (!accessToken || !sessionId) return false;
    try {
      const fresh = await getInterview(sessionId, accessToken);
      const open = fresh.turns.find((turn) => turn.answerText === null);
      if (fresh.status === 'completed' || !open || open.id !== previousOpenId) {
        const resumed =
          fresh.status === 'completed' || open
            ? fresh
            : await continueInterview(sessionId, accessToken);
        applySession(resumed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  if (loading) {
    return <InlineStatus message="Loading interview…" />;
  }

  if (error && !session) {
    return (
      <section>
        <p className="rounded-[6px] bg-danger-soft px-3.5 py-3 text-[0.85rem] text-danger">
          {error}
        </p>
        <Link
          to="/app/interviews"
          className="mt-4 inline-block text-sm font-semibold text-signal"
        >
          Choose the round
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
  const isMock = session.provider === 'mock' || session.provider === 'none';
  const spoken = session.provider === 'ollama';

  return (
    <section className="w-full">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="m-0 text-[0.8rem] font-semibold text-ink-soft">
          {topic.label} · {session.role}
        </p>
        <div className="flex items-center gap-3">
          {isMock ? (
            <span className="text-[0.72rem] font-semibold tracking-[0.06em] text-mute uppercase">
              Scripted practice
            </span>
          ) : null}
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 text-[0.85rem] font-medium text-ink-soft hover:text-ink"
            onClick={() => navigate('/app/interviews')}
          >
            Exit round
          </button>
        </div>
      </div>
      <div className="h-[3px] overflow-hidden bg-line" aria-hidden="true">
        <i
          className="ui-progress block h-full bg-signal not-italic"
          style={{ width: `${topic.percent}%` }}
        />
      </div>

      {priorTurns.length > 0 ? (
        <details className="mt-5 border-y border-line py-3">
          <summary className="cursor-pointer text-sm font-semibold text-ink-soft">
            Earlier answers ({priorTurns.length})
          </summary>
          <div className="mt-3 grid gap-4">
            {priorTurns.map((turn) => (
              <article key={turn.id}>
                <p className="m-0 text-[0.7rem] font-semibold tracking-[0.14em] text-signal uppercase">
                  {turn.kind === 'follow_up' ? 'Follow-up' : 'Topic'}
                </p>
                <h2 className="font-display mt-2 m-0 text-[clamp(1.15rem,2.5vw,1.35rem)] leading-[1.25] font-semibold tracking-[-0.02em] text-ink">
                  {turn.questionText}
                </h2>
                <p className="mt-2.5 m-0 text-[0.92rem] leading-relaxed text-ink-soft">
                  {turn.answerText}
                </p>
                {turn.feedback ? (
                  <p className="mt-2 m-0 border-l-2 border-signal pl-3.5 text-[0.85rem] leading-relaxed text-ink-soft">
                    {turn.feedback}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </details>
      ) : null}

      {spoken && accessToken ? (
        <VoiceRoom
          session={session}
          openTurn={openTurn}
          accessToken={accessToken}
          onSession={setSession}
          onCompleted={() =>
            navigate(`/app/interviews/${sessionId}/results`, { replace: true })
          }
        />
      ) : null}

      {spoken ? null : (
        <>
          <div className="mt-7 flex items-start justify-between gap-4 border-t border-line pt-5">
            <div className="min-w-0">
              <p className="m-0 text-[0.7rem] font-semibold tracking-[0.18em] text-signal uppercase">
                Question
              </p>
              <h1 className="font-display mt-2 m-0 text-[clamp(1.55rem,3.2vw,2.05rem)] leading-[1.3] font-semibold tracking-[-0.02em] text-ink text-balance">
                {openTurn.questionText}
              </h1>
            </div>
            <p
              className={`font-display m-0 shrink-0 text-[clamp(1.8rem,4vw,2.4rem)] leading-none tracking-[-0.04em] ${
                secondsLeft <= 15 ? 'text-danger' : 'text-ink'
              }`}
              aria-live="polite"
            >
              {formatClock(secondsLeft)}
            </p>
          </div>

          <form className="mt-6" onSubmit={onSubmit}>
            {error ? (
              <p className="mb-4 rounded-[6px] bg-danger-soft px-3.5 py-3 text-[0.85rem] text-danger">
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
                className="w-full cursor-text resize-y rounded-[6px] border border-line bg-surface px-3.5 py-3 text-[0.95rem] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-mute/70 hover:border-ink/25 focus:border-ink focus:shadow-[0_0_0_3px_rgb(11_15_20/0.12)] disabled:cursor-not-allowed disabled:opacity-70"
              />
            </label>
            {submitting ? (
              <p className="mt-3 m-0 text-sm text-mute italic" role="status">
                Interpreting your answer…
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap items-center gap-2.5 border-t border-line pt-6">
              <Button
                type="submit"
                className="h-12 min-w-[11rem] px-5"
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : 'Submit response'}
              </Button>
              <Button
                variant="ghost"
                className="ml-auto h-12 min-w-[8.5rem] px-5"
                disabled={submitting}
                onClick={() => navigate('/app/interviews')}
              >
                Exit
              </Button>
            </div>
            {isMock ? (
              <p className="mt-4 mb-0 text-[0.85rem] leading-relaxed text-mute">
                Voice needs the local model. This round is typed practice, with
                the same two minutes and a scripted judge.
              </p>
            ) : null}
          </form>
        </>
      )}
    </section>
  );
}

function formatClock(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const remain = safe % 60;
  return `${minutes}:${remain.toString().padStart(2, '0')}`;
}
