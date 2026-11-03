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
  const isMock = session.provider === 'mock' || session.provider === 'none';
  const spoken = session.provider === 'ollama';

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/app"
          className="text-sm font-semibold text-signal no-underline hover:underline"
        >
          ← Workspace
        </Link>
        <Link
          to="/app/interviews"
          className="text-sm text-mute no-underline hover:text-ink hover:underline"
        >
          Exit round
        </Link>
      </div>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <p className="m-0 text-[0.8rem] font-semibold text-ink-soft">
          {topic.label} · {session.role}
        </p>
        {isMock ? (
          <span className="rounded-[6px] border border-line bg-paper-lift px-2 py-0.5 text-[0.68rem] font-semibold tracking-[0.04em] text-ink-soft uppercase">
            Scripted practice
          </span>
        ) : null}
      </div>
      <div
        className="mb-7 h-[3px] overflow-hidden rounded-full bg-line"
        aria-hidden="true"
      >
        <span
          className="ui-progress block h-full bg-signal"
          style={{ width: `${topic.percent}%` }}
        />
      </div>

      {priorTurns.length > 0 ? (
        <details className="mb-5 border-y border-line py-3">
          <summary className="cursor-pointer text-sm font-semibold text-ink-soft">
            Earlier answers ({priorTurns.length})
          </summary>
          <div className="mt-3 grid gap-4">
            {priorTurns.map((turn) => (
              <article key={turn.id}>
                <p className="m-0 text-[0.72rem] font-semibold tracking-[0.12em] text-signal uppercase">
                  {turn.kind === 'follow_up' ? 'Follow-up' : 'Topic'}
                </p>
                <h2 className="font-display mt-2 m-0 text-[clamp(1.15rem,2.5vw,1.35rem)] leading-[1.25] font-normal tracking-[-0.02em] text-ink">
                  {turn.questionText}
                </h2>
                <p className="mt-2.5 m-0 text-[0.92rem] leading-relaxed text-ink-soft">
                  {turn.answerText}
                </p>
                {turn.feedback ? (
                  <div className="mt-3 border-l-[3px] border-signal bg-signal-soft px-3.5 py-3 text-[0.85rem] leading-relaxed text-ink">
                    {turn.feedback}
                  </div>
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
        <article className="border-y border-line py-4">
          <div className="flex items-start justify-between gap-4">
            <p className="m-0 text-[0.72rem] font-semibold tracking-[0.12em] text-signal uppercase">
              Question
            </p>
            <p
              className={`font-display m-0 text-[1.8rem] leading-none tracking-[-0.04em] ${secondsLeft <= 15 ? 'text-danger' : 'text-ink'}`}
              aria-live="polite"
            >
              {formatClock(secondsLeft)}
            </p>
          </div>
          <h2 className="font-display mt-2 m-0 text-[clamp(1.35rem,3vw,1.55rem)] leading-[1.25] font-normal tracking-[-0.02em] text-ink">
            {openTurn.questionText}
          </h2>
        </article>
      )}

      {spoken ? null : (
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
              className="w-full cursor-text resize-y rounded-[10px] border border-line bg-white px-3.5 py-3 text-[0.95rem] text-ink outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-mute/70 hover:border-ink/30 focus:border-focus focus:bg-paper-lift focus:shadow-[0_0_0_3px_rgb(42_85_255/0.18)] disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>
          {submitting ? (
            <p className="mt-3 m-0 text-sm text-mute italic" role="status">
              Interpreting your answer…
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
          {isMock ? (
            <p className="mt-4 mb-0 text-[0.85rem] leading-relaxed text-mute">
              Voice needs the local model. This round is typed practice, with
              the same two minutes and a scripted judge.
            </p>
          ) : null}
        </form>
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
