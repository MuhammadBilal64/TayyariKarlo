import type { SignalSession, SignalVariant } from '@tayyari/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { Button } from '../../../shared/ui/Button';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  applySignalAction,
  getSignalInterview,
  replaySignalDecision,
} from '../api/signalInterviewsApi';

function statusLabel(status: string) {
  return status.replaceAll('_', ' ');
}

const fieldClass =
  'w-full cursor-text rounded-[6px] border border-line bg-surface px-3.5 py-2.5 text-[0.95rem] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-mute/70 hover:border-ink/25 focus:border-ink focus:shadow-[0_0_0_3px_rgb(11_15_20/0.12)]';

const underlineAction =
  'cursor-pointer border-0 border-b-2 bg-transparent px-0 pb-1 text-[0.9rem] transition-[color,border-color,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-45';

export function SignalSessionPage() {
  const { sessionId = '' } = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<SignalSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** Sync lock so rapid double-clicks cannot start overlapping actions. */
  const actionLockRef = useRef(false);
  const [question, setQuestion] = useState('');
  const [claim, setClaim] = useState('');
  const [missing, setMissing] = useState('');
  const [confidence, setConfidence] = useState(2);
  const [decisionKey, setDecisionKey] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [expectedEffect, setExpectedEffect] = useState('');
  const [verificationPlan, setVerificationPlan] = useState('');
  const [replayReason, setReplayReason] = useState('');

  const load = useCallback(async () => {
    if (!accessToken || !sessionId) return;
    try {
      const next = await getSignalInterview(sessionId, accessToken);
      setSession(next);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Unable to load the session',
      );
    }
  }, [accessToken, sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: Parameters<typeof applySignalAction>[1]) {
    if (!accessToken || !sessionId || actionLockRef.current) return;
    actionLockRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const next = await applySignalAction(sessionId, action, accessToken);
      setSession(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      actionLockRef.current = false;
      setBusy(false);
    }
  }

  async function onReplay(keepOrChange: 'keep' | 'change') {
    if (
      !accessToken ||
      !sessionId ||
      !session?.decisions[0] ||
      actionLockRef.current
    ) {
      return;
    }
    const originalKey = session.decisions[0].decisionKey;
    if (keepOrChange === 'change') {
      if (!decisionKey.trim() || decisionKey === originalKey) {
        setError(
          'Select a different decision before recording that you would change it.',
        );
        return;
      }
    }
    actionLockRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const next = await replaySignalDecision(
        sessionId,
        {
          decisionId: session.decisions[0].id,
          keepOrChange,
          revisedDecisionKey:
            keepOrChange === 'change' ? decisionKey : undefined,
          reasoning: replayReason || 'Replay after debrief.',
        },
        accessToken,
      );
      setSession(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Replay failed');
    } finally {
      actionLockRef.current = false;
      setBusy(false);
    }
  }

  function citationLabel(ref: string) {
    const event = session?.events.find((item) => item.id === ref);
    if (!event) return ref;
    return `#${event.sequence} ${event.summary}`;
  }

  if (!session) {
    return (
      <section>
        <p className="text-ink-soft">{error ?? 'Loading investigation…'}</p>
      </section>
    );
  }

  const completed = session.status === 'completed';
  const selectedKeys = session.unlockedEvidence.map((item) => item.key);

  return (
    <section className="ui-enter w-full">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line pb-6">
        <div className="min-w-0">
          <p className="m-0 text-[0.7rem] font-semibold tracking-[0.18em] text-signal uppercase">
            Signal Integrity
          </p>
          <h1 className="font-display mt-2 m-0 text-[clamp(1.9rem,3.5vw,2.6rem)] leading-[1.08] font-semibold tracking-[-0.03em] text-ink">
            {session.scenarioTitle}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <p className="m-0 text-[0.85rem] text-mute">
            t={session.simulatedTimeSeconds}s ·{' '}
            {session.variant.replaceAll('_', ' ')}
          </p>
          <Link
            to="/app/interviews"
            className="text-[0.85rem] font-medium text-ink-soft no-underline hover:text-ink"
          >
            Exit
          </Link>
        </div>
      </header>

      {error ? (
        <p className="mt-5 rounded-[6px] bg-danger-soft px-3.5 py-3 text-[0.85rem] text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-8 grid items-start gap-y-10 lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
        {/* Left: observation desk */}
        <div className="min-w-0 lg:border-r lg:border-line lg:pr-12 xl:pr-16">
          <p className="m-0 text-[0.7rem] font-semibold tracking-[0.16em] text-signal uppercase">
            Observe
          </p>
          <h2 className="mt-2 m-0 text-[1.05rem] font-semibold text-ink">
            Live signals
          </h2>
          <ul className="mt-4 m-0 list-none border-t border-line p-0">
            {session.visibleSignals.map((signal) => (
              <li key={signal.key} className="border-b border-line py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="m-0 text-[0.95rem] font-semibold text-ink">
                    {signal.label}
                  </p>
                  <p className="m-0 shrink-0 text-[0.95rem] font-medium text-ink">
                    {signal.value}
                  </p>
                </div>
                <p className="mt-1.5 mb-0 text-[0.82rem] text-mute">
                  {signal.interpretation}
                </p>
              </li>
            ))}
          </ul>

          <h2 className="mt-10 m-0 text-[1.05rem] font-semibold text-ink">
            Evidence locker
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
            <button
              type="button"
              className={`${underlineAction} border-transparent font-medium text-ink-soft hover:text-ink`}
              disabled={busy || completed}
              onClick={() => void run({ type: 'advance_clock', seconds: 30 })}
            >
              Advance clock +30s
            </button>
            {session.evidenceCatalog.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${underlineAction} border-transparent font-medium text-ink-soft hover:text-ink`}
                disabled={busy || completed}
                onClick={() =>
                  void run({ type: 'request_evidence', evidenceKey: item.key })
                }
              >
                {item.label}
              </button>
            ))}
          </div>

          {session.unlockedEvidence.length > 0 ? (
            <ul className="mt-6 m-0 list-none space-y-3 p-0">
              {session.unlockedEvidence.map((item) => (
                <li
                  key={item.key}
                  className="border-l-2 border-signal bg-signal-soft/35 px-4 py-3.5"
                >
                  <p className="m-0 text-[0.7rem] font-semibold tracking-[0.12em] text-signal uppercase">
                    {statusLabel(item.status)}
                  </p>
                  <p className="mt-1.5 mb-0 text-[0.95rem] font-semibold text-ink">
                    {item.title}
                  </p>
                  <p className="mt-1.5 mb-0 whitespace-pre-wrap text-[0.9rem] leading-relaxed text-ink-soft">
                    {item.payload}
                  </p>
                  {item.completenessNote ? (
                    <p className="mt-2 mb-0 text-[0.8rem] text-mute">
                      {item.completenessNote}
                    </p>
                  ) : null}
                  <p className="mt-2 mb-0 text-[0.75rem] text-mute">
                    Event t={item.eventTimeSeconds}s · Available t=
                    {item.availableAtSeconds}s · {item.provenance}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 m-0 text-[0.85rem] text-mute">
              Request evidence from the locker to fill this panel.
            </p>
          )}
        </div>

        {/* Right: response desk */}
        <div className="min-w-0">
          <p className="m-0 text-[0.7rem] font-semibold tracking-[0.16em] text-signal uppercase">
            Respond
          </p>
          <h2 className="mt-2 m-0 text-[1.05rem] font-semibold text-ink">
            Interviewer
          </h2>
          <p className="mt-4 m-0 border-t border-line pt-4 text-[0.95rem] leading-relaxed text-ink">
            {session.interviewerMessage || session.briefing}
          </p>

          {!completed ? (
            <div className="mt-8 space-y-8">
              <div>
                <label className="block">
                  <span className="mb-2 block text-[0.8rem] font-medium text-ink-soft">
                    Ask a mapped question
                  </span>
                  <textarea
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    rows={2}
                    className={fieldClass}
                    placeholder="Traffic? Payments? Cache?"
                  />
                </label>
                <Button
                  className="mt-3 h-12 min-w-[7rem] px-5"
                  disabled={busy || !question.trim()}
                  onClick={() =>
                    void run({
                      type: 'ask_question',
                      question: question.trim(),
                    }).then(() => setQuestion(''))
                  }
                >
                  Ask
                </Button>
              </div>

              <div className="border-t border-line pt-8">
                <label className="block">
                  <span className="mb-2 block text-[0.8rem] font-medium text-ink-soft">
                    Working hypothesis
                  </span>
                  <textarea
                    value={claim}
                    onChange={(event) => setClaim(event.target.value)}
                    rows={3}
                    className={fieldClass}
                    placeholder="What do you think is happening, and what supports it?"
                  />
                </label>
                <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_6.5rem]">
                  <label className="block min-w-0">
                    <span className="mb-2 block text-[0.8rem] font-medium text-ink-soft">
                      Missing evidence
                    </span>
                    <input
                      value={missing}
                      onChange={(event) => setMissing(event.target.value)}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[0.8rem] font-medium text-ink-soft">
                      Confidence
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={4}
                      value={confidence}
                      onChange={(event) =>
                        setConfidence(Number(event.target.value))
                      }
                      className={fieldClass}
                      aria-label="Confidence 0 to 4"
                    />
                  </label>
                </div>
                <Button
                  className="mt-4 h-12 min-w-[11rem] px-5"
                  disabled={busy || !claim.trim()}
                  onClick={() => {
                    if (session.hypotheses.length > 0) {
                      void run({
                        type: 'revise_hypothesis',
                        claim: claim.trim(),
                        supportingEvidenceKeys: selectedKeys,
                        missingEvidence: missing.trim() || undefined,
                        confidence,
                        reason: 'Updated from new evidence.',
                      });
                      return;
                    }
                    void run({
                      type: 'submit_hypothesis',
                      claim: claim.trim(),
                      supportingEvidenceKeys: selectedKeys,
                      missingEvidence: missing.trim() || undefined,
                      confidence,
                    });
                  }}
                >
                  {session.hypotheses.length > 0
                    ? 'Revise hypothesis'
                    : 'Record hypothesis'}
                </Button>
              </div>

              <div className="border-t border-line pt-8">
                <h2 className="m-0 text-[1.05rem] font-semibold text-ink">
                  Commit an action
                </h2>
                <ul className="mt-4 m-0 list-none border-t border-line p-0">
                  {session.decisionOptions.map((option) => {
                    const active = decisionKey === option.key;
                    return (
                      <li key={option.key} className="border-b border-line">
                        <label
                          className={`ui-row flex cursor-pointer items-start gap-3 border-l-2 py-4 transition-[background-color,border-color] duration-200 ${
                            active
                              ? 'border-l-signal bg-signal-soft/70'
                              : 'border-l-transparent'
                          }`}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            checked={active}
                            onChange={() => setDecisionKey(option.key)}
                          />
                          <div className="min-w-0">
                            <p
                              className={`m-0 text-[0.95rem] ${
                                active
                                  ? 'font-semibold text-ink'
                                  : 'font-medium text-ink'
                              }`}
                            >
                              {option.label}
                            </p>
                            <p className="mt-1 mb-0 text-[0.8rem] text-mute">
                              {option.description}
                            </p>
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                <label className="mt-5 block">
                  <span className="mb-2 block text-[0.8rem] font-medium text-ink-soft">
                    Reasoning
                  </span>
                  <textarea
                    value={reasoning}
                    onChange={(event) => setReasoning(event.target.value)}
                    rows={2}
                    className={fieldClass}
                  />
                </label>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block min-w-0">
                    <span className="mb-2 block text-[0.8rem] font-medium text-ink-soft">
                      Expected effect
                    </span>
                    <input
                      value={expectedEffect}
                      onChange={(event) =>
                        setExpectedEffect(event.target.value)
                      }
                      className={fieldClass}
                    />
                  </label>
                  <label className="block min-w-0">
                    <span className="mb-2 block text-[0.8rem] font-medium text-ink-soft">
                      Verification plan
                    </span>
                    <input
                      value={verificationPlan}
                      onChange={(event) =>
                        setVerificationPlan(event.target.value)
                      }
                      className={fieldClass}
                    />
                  </label>
                </div>
                <Button
                  className="mt-5 h-12 min-w-[11rem] px-5"
                  disabled={
                    busy ||
                    !decisionKey ||
                    !reasoning.trim() ||
                    !expectedEffect.trim() ||
                    !verificationPlan.trim()
                  }
                  onClick={() =>
                    void run({
                      type: 'commit_decision',
                      decisionKey,
                      reasoning: reasoning.trim(),
                      expectedEffect: expectedEffect.trim(),
                      verificationPlan: verificationPlan.trim(),
                      supportingEvidenceKeys: selectedKeys,
                    })
                  }
                >
                  Commit decision
                </Button>
              </div>
            </div>
          ) : null}

          {session.hypotheses.length > 0 ? (
            <div className="mt-8 border-t border-line pt-8">
              <h2 className="m-0 text-[1.05rem] font-semibold text-ink">
                Hypotheses
              </h2>
              <ul className="mt-4 m-0 list-none border-t border-line p-0">
                {session.hypotheses.map((item) => (
                  <li
                    key={item.id}
                    className="border-b border-line py-3.5 text-[0.9rem] text-ink-soft"
                  >
                    {item.supersedesId ? 'Revised: ' : ''}
                    {item.claim}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {completed && session.evaluation ? (
        <div className="mt-14 border-t border-line pt-10">
          <p className="m-0 text-[0.7rem] font-semibold tracking-[0.18em] text-signal uppercase">
            Debrief
          </p>
          <h2 className="font-display mt-2 m-0 text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.02em] text-ink">
            Round complete
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink-soft">
            {session.evaluation.overallSummary}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-mute">
            {session.evaluation.scenarioExplanation}
          </p>
          <ul className="mt-8 m-0 grid list-none gap-x-10 border-t border-line p-0 md:grid-cols-2">
            {session.evaluation.dimensions.map((item) => (
              <li key={item.key} className="border-b border-line py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="m-0 text-[0.95rem] font-semibold text-ink">
                    {item.label}
                  </p>
                  <span className="text-[0.8rem] font-semibold text-signal">
                    {item.insufficientEvidence
                      ? 'insufficient'
                      : `${item.score}/4`}
                  </span>
                </div>
                <p className="mt-1.5 mb-0 text-[0.85rem] text-ink-soft">
                  {item.explanation}
                </p>
                {item.evidenceRefs.length > 0 ? (
                  <ul className="mt-2 mb-0 list-none space-y-1 p-0">
                    {item.evidenceRefs.map((ref) => (
                      <li key={ref} className="text-[0.75rem] text-mute">
                        Cite: {citationLabel(ref)}
                      </li>
                    ))}
                  </ul>
                ) : item.insufficientEvidence ? (
                  <p className="mt-2 mb-0 text-[0.75rem] text-mute">
                    No evidence citations (insufficient).
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-ink-soft">
            Practice next: {session.evaluation.recommendedPractice}
          </p>

          {session.decisions[0] ? (
            <div className="mt-10 border-t border-line pt-8">
              <h2 className="m-0 text-[1.05rem] font-semibold text-ink">
                Decision replay
              </h2>
              <p className="mt-3 text-sm text-ink-soft">
                Original: {session.decisions[0].description}
              </p>
              {session.replay ? (
                <div className="mt-3 text-sm text-ink">
                  <p className="m-0 font-semibold">
                    Recorded:{' '}
                    {session.replay.keepOrChange === 'keep'
                      ? 'kept original'
                      : `would change to ${session.replay.revisedDecisionKey}`}
                  </p>
                  <p className="mt-2 mb-0 text-ink-soft">
                    {session.replay.reasoning}
                  </p>
                  {session.replay.comparisonNotes ? (
                    <p className="mt-2 mb-0 text-mute">
                      {session.replay.comparisonNotes}
                    </p>
                  ) : null}
                </div>
              ) : (
                <>
                  <textarea
                    value={replayReason}
                    onChange={(event) => setReplayReason(event.target.value)}
                    rows={3}
                    className={`mt-4 ${fieldClass}`}
                    placeholder="Would you keep or change this decision with what you know now?"
                  />
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <Button
                      className="h-12 min-w-[11rem] px-5"
                      disabled={busy}
                      onClick={() => void onReplay('keep')}
                    >
                      Keep original
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-12 min-w-[11rem] px-5"
                      disabled={busy}
                      onClick={() => void onReplay('change')}
                    >
                      I would change it
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-2.5 border-t border-line pt-8">
            <Button
              className="h-12 min-w-[11rem] px-5"
              onClick={() => navigate('/app/interviews')}
            >
              Start another interview
            </Button>
            <Button
              variant="ghost"
              className="h-12 min-w-[11rem] px-5"
              onClick={() => navigate('/app')}
            >
              Back to progress
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-14 border-t border-line pt-8">
        <h2 className="m-0 text-[1.05rem] font-semibold text-ink">Event log</h2>
        <ul className="mt-4 m-0 list-none border-t border-line p-0">
          {session.events.map((event) => (
            <li
              key={event.id}
              className="border-b border-line py-3 text-[0.82rem] text-mute"
            >
              #{event.sequence} t={event.simulatedTimeSeconds}s ·{' '}
              {event.summary}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export type { SignalVariant };
