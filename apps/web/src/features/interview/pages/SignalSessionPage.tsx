import type { SignalSession, SignalVariant } from '@tayyari/shared';
import { useCallback, useEffect, useState } from 'react';
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

export function SignalSessionPage() {
  const { sessionId = '' } = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<SignalSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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
    if (!accessToken || !sessionId) return;
    setBusy(true);
    setError(null);
    try {
      const next = await applySignalAction(sessionId, action, accessToken);
      setSession(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  async function onReplay(keepOrChange: 'keep' | 'change') {
    if (!accessToken || !sessionId || !session?.decisions[0]) return;
    setBusy(true);
    try {
      const next = await replaySignalDecision(
        sessionId,
        {
          decisionId: session.decisions[0].id,
          keepOrChange,
          revisedDecisionKey:
            keepOrChange === 'change' ? decisionKey || undefined : undefined,
          reasoning: replayReason || 'Replay after debrief.',
        },
        accessToken,
      );
      setSession(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Replay failed');
    } finally {
      setBusy(false);
    }
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
    <section className="ui-enter">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/app/interviews"
          className="inline-block cursor-pointer text-sm font-semibold text-signal"
        >
          ← Interviews
        </Link>
        <p className="m-0 text-[0.75rem] text-mute">
          t={session.simulatedTimeSeconds}s ·{' '}
          {session.variant.replaceAll('_', ' ')}
        </p>
      </div>

      <p className="mt-5 m-0 text-[0.72rem] font-semibold tracking-[0.16em] text-signal uppercase">
        Signal Integrity
      </p>
      <h1 className="font-display mt-2 text-[clamp(1.8rem,4vw,2.6rem)] leading-[1.1] font-normal tracking-[-0.03em] text-ink">
        {session.scenarioTitle}
      </h1>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink-soft">
        {session.briefing}
      </p>

      {error ? (
        <p className="mt-4 rounded-[10px] bg-danger-soft px-3.5 py-3 text-[0.85rem] text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h2 className="font-display m-0 text-xl text-ink">Live signals</h2>
          <ul className="mt-3 grid list-none gap-2 p-0">
            {session.visibleSignals.map((signal) => (
              <li
                key={signal.key}
                className="rounded-[10px] border border-line bg-white px-3.5 py-3"
              >
                <p className="m-0 text-[0.8rem] font-semibold text-ink">
                  {signal.label}
                </p>
                <p className="mt-1 mb-0 text-[0.95rem] text-ink">
                  {signal.value}
                </p>
                <p className="mt-1 mb-0 text-[0.8rem] text-mute">
                  {signal.interpretation}
                </p>
              </li>
            ))}
          </ul>

          <h2 className="font-display mt-8 mb-0 text-xl text-ink">
            Evidence locker
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {session.evidenceCatalog.map((item) => (
              <Button
                key={item.key}
                variant="ghost"
                disabled={busy || completed}
                onClick={() =>
                  void run({ type: 'request_evidence', evidenceKey: item.key })
                }
              >
                {item.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              disabled={busy || completed}
              onClick={() => void run({ type: 'advance_clock', seconds: 30 })}
            >
              Advance clock +30s
            </Button>
          </div>

          <ul className="mt-4 grid list-none gap-3 p-0">
            {session.unlockedEvidence.map((item) => (
              <li
                key={item.key}
                className="rounded-[10px] border border-line bg-paper-lift px-3.5 py-3"
              >
                <p className="m-0 text-[0.75rem] font-semibold tracking-[0.08em] text-signal uppercase">
                  {statusLabel(item.status)}
                </p>
                <p className="mt-1 mb-0 text-[0.95rem] font-semibold text-ink">
                  {item.title}
                </p>
                <p className="mt-1 mb-0 whitespace-pre-wrap text-[0.9rem] leading-relaxed text-ink-soft">
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
        </div>

        <div>
          <div className="rounded-[12px] border border-line bg-white px-4 py-4">
            <p className="m-0 text-[0.72rem] font-semibold tracking-[0.14em] text-signal uppercase">
              Interviewer
            </p>
            <p className="mt-2 mb-0 text-[0.95rem] leading-relaxed text-ink">
              {session.interviewerMessage}
            </p>
          </div>

          {!completed ? (
            <>
              <label className="mt-5 block">
                <span className="mb-1.5 block text-[0.8rem] font-semibold text-ink-soft">
                  Ask a mapped question
                </span>
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  rows={3}
                  className="w-full rounded-[10px] border border-line bg-white px-3 py-2 text-sm text-ink"
                  placeholder="Traffic? Payments? Cache?"
                />
              </label>
              <Button
                className="mt-2"
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

              <label className="mt-6 block">
                <span className="mb-1.5 block text-[0.8rem] font-semibold text-ink-soft">
                  Working hypothesis
                </span>
                <textarea
                  value={claim}
                  onChange={(event) => setClaim(event.target.value)}
                  rows={4}
                  className="w-full rounded-[10px] border border-line bg-white px-3 py-2 text-sm text-ink"
                  placeholder="What do you think is happening, and what supports it?"
                />
              </label>
              <label className="mt-3 block">
                <span className="mb-1.5 block text-[0.8rem] font-semibold text-ink-soft">
                  Missing evidence
                </span>
                <input
                  value={missing}
                  onChange={(event) => setMissing(event.target.value)}
                  className="w-full rounded-[10px] border border-line bg-white px-3 py-2 text-sm text-ink"
                />
              </label>
              <label className="mt-3 block">
                <span className="mb-1.5 block text-[0.8rem] font-semibold text-ink-soft">
                  Confidence 0–4
                </span>
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={confidence}
                  onChange={(event) =>
                    setConfidence(Number(event.target.value))
                  }
                  className="w-24 rounded-[10px] border border-line bg-white px-3 py-2 text-sm text-ink"
                />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
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

              <h2 className="font-display mt-8 mb-2 text-xl text-ink">
                Commit an action
              </h2>
              <div className="grid gap-2">
                {session.decisionOptions.map((option) => (
                  <label
                    key={option.key}
                    className={`cursor-pointer rounded-[10px] border px-3 py-3 ${
                      decisionKey === option.key
                        ? 'border-signal bg-signal-soft'
                        : 'border-line bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      checked={decisionKey === option.key}
                      onChange={() => setDecisionKey(option.key)}
                    />
                    <p className="m-0 text-sm font-semibold text-ink">
                      {option.label}
                    </p>
                    <p className="mt-1 mb-0 text-[0.8rem] text-mute">
                      {option.description}
                    </p>
                  </label>
                ))}
              </div>
              <label className="mt-3 block">
                <span className="mb-1.5 block text-[0.8rem] font-semibold text-ink-soft">
                  Reasoning
                </span>
                <textarea
                  value={reasoning}
                  onChange={(event) => setReasoning(event.target.value)}
                  rows={3}
                  className="w-full rounded-[10px] border border-line bg-white px-3 py-2 text-sm text-ink"
                />
              </label>
              <label className="mt-3 block">
                <span className="mb-1.5 block text-[0.8rem] font-semibold text-ink-soft">
                  Expected effect
                </span>
                <input
                  value={expectedEffect}
                  onChange={(event) => setExpectedEffect(event.target.value)}
                  className="w-full rounded-[10px] border border-line bg-white px-3 py-2 text-sm text-ink"
                />
              </label>
              <label className="mt-3 block">
                <span className="mb-1.5 block text-[0.8rem] font-semibold text-ink-soft">
                  Verification plan
                </span>
                <textarea
                  value={verificationPlan}
                  onChange={(event) => setVerificationPlan(event.target.value)}
                  rows={2}
                  className="w-full rounded-[10px] border border-line bg-white px-3 py-2 text-sm text-ink"
                />
              </label>
              <Button
                className="mt-3"
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
            </>
          ) : null}

          {session.hypotheses.length > 0 ? (
            <div className="mt-6">
              <h2 className="font-display m-0 text-lg text-ink">Hypotheses</h2>
              <ul className="mt-2 grid list-none gap-2 p-0">
                {session.hypotheses.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-[10px] border border-line px-3 py-2 text-sm text-ink-soft"
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
        <div className="mt-10 border-t border-line pt-6">
          <h2 className="font-display m-0 text-2xl text-ink">Debrief</h2>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink-soft">
            {session.evaluation.overallSummary}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-mute">
            {session.evaluation.scenarioExplanation}
          </p>
          <ul className="mt-5 grid list-none gap-2 p-0 md:grid-cols-2">
            {session.evaluation.dimensions.map((item) => (
              <li
                key={item.key}
                className="rounded-[10px] border border-line bg-white px-3.5 py-3"
              >
                <p className="m-0 text-sm font-semibold text-ink">
                  {item.label}{' '}
                  {item.insufficientEvidence
                    ? '· insufficient'
                    : `· ${item.score}/4`}
                </p>
                <p className="mt-1 mb-0 text-[0.85rem] text-ink-soft">
                  {item.explanation}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-soft">
            Practice next: {session.evaluation.recommendedPractice}
          </p>

          {session.decisions[0] ? (
            <div className="mt-6 rounded-[12px] border border-line bg-paper-lift px-4 py-4">
              <h3 className="font-display m-0 text-lg text-ink">
                Decision replay
              </h3>
              <p className="mt-2 text-sm text-ink-soft">
                Original: {session.decisions[0].description}
              </p>
              <textarea
                value={replayReason}
                onChange={(event) => setReplayReason(event.target.value)}
                rows={3}
                className="mt-3 w-full rounded-[10px] border border-line bg-white px-3 py-2 text-sm text-ink"
                placeholder="Would you keep or change this decision with what you know now?"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button disabled={busy} onClick={() => void onReplay('keep')}>
                  Keep original
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void onReplay('change')}
                >
                  I would change it
                </Button>
              </div>
            </div>
          ) : null}

          <Button className="mt-6" onClick={() => navigate('/app/interviews')}>
            Start another interview
          </Button>
        </div>
      ) : null}

      <div className="mt-8">
        <h2 className="font-display m-0 text-lg text-ink">Event log</h2>
        <ul className="mt-2 grid list-none gap-1 p-0">
          {session.events.map((event) => (
            <li key={event.id} className="text-[0.8rem] text-mute">
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
