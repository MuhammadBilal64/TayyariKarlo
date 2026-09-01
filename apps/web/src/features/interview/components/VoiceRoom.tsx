import type { InterviewSession, InterviewTurn } from '@tayyari/shared';
import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../../shared/api/client';
import { Button } from '../../../shared/ui/Button';
import { StatusBanner } from '../../../shared/ui/StatusBanner';
import {
  answerInterview,
  continueInterview,
  getInterview,
  getTurnAudio,
  transcribeInterview,
} from '../api/interviewsApi';
import { useWavRecorder } from '../audio/useWavRecorder';

const ANSWER_SECONDS = 120;

type Phase = 'asking' | 'answering' | 'thinking' | 'revise' | 'reviewing';
type Playback = 'question' | 'feedback';

type VoiceRoomProps = {
  session: InterviewSession;
  openTurn: InterviewTurn;
  accessToken: string;
  onSession: (session: InterviewSession) => void;
  onCompleted: () => void;
};

export function VoiceRoom({
  session,
  openTurn,
  accessToken,
  onSession,
  onCompleted,
}: VoiceRoomProps) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const objectUrl = useRef<string | null>(null);
  const playback = useRef<Playback>('question');
  const phaseRef = useRef<Phase>('asking');
  const finishing = useRef(false);
  const transcriptRef = useRef('');
  const [phase, setPhase] = useState<Phase>('asking');
  const [secondsLeft, setSecondsLeft] = useState(ANSWER_SECONDS);
  const [transcript, setTranscript] = useState('');
  const [review, setReview] = useState<InterviewTurn | null>(null);
  const [pending, setPending] = useState<InterviewSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorder = useWavRecorder();
  const finishRef = useRef<(blob: Blob | null) => Promise<void>>(
    async () => undefined,
  );

  function movePhase(next: Phase) {
    phaseRef.current = next;
    setPhase(next);
  }

  useEffect(() => {
    const element = new Audio();
    audio.current = element;
    element.onended = () => {
      if (playback.current === 'question' && phaseRef.current === 'asking') {
        void beginAnswer();
      }
    };
    return () => {
      element.pause();
      element.src = '';
    };
    // beginAnswer is stable via refs for the playback that is current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    recorder.bindAutoStop((blob) => {
      void finishRef.current(blob);
    });
  }, [recorder, recorder.bindAutoStop]);

  useEffect(() => {
    if (phase !== 'answering') return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          void finishRef.current(null);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    let cancelled = false;
    setTranscript('');
    transcriptRef.current = '';
    setReview(null);
    setPending(null);
    setError(null);
    finishing.current = false;
    movePhase('asking');
    setSecondsLeft(ANSWER_SECONDS);
    void (async () => {
      if (!cancelled) await play('question', openTurn.id);
    })();
    return () => {
      cancelled = true;
      if (objectUrl.current) {
        URL.revokeObjectURL(objectUrl.current);
        objectUrl.current = null;
      }
    };
    // A new question starts its own two minutes after it is spoken.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTurn.id]);

  async function play(part: Playback, turnId: string) {
    const element = audio.current;
    if (!element) return;
    playback.current = part;
    try {
      const blob = await getTurnAudio(session.id, turnId, accessToken, part);
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      const url = URL.createObjectURL(blob);
      objectUrl.current = url;
      element.src = url;
      await element.play();
    } catch {
      if (part === 'question' && phaseRef.current === 'asking') {
        await beginAnswer();
      }
    }
  }

  async function beginAnswer() {
    if (phaseRef.current !== 'asking') return;
    movePhase('answering');
    setSecondsLeft(ANSWER_SECONDS);
    setError(null);
    const result = await recorder.start();
    if (result !== 'ok') {
      setError(
        'Microphone access was denied. Type your answer. The two minutes still run.',
      );
    }
  }

  async function finishAnswer(autoBlob: Blob | null) {
    if (finishing.current || phaseRef.current === 'reviewing') return;
    if (phaseRef.current !== 'answering' && phaseRef.current !== 'thinking') {
      return;
    }
    finishing.current = true;
    movePhase('thinking');
    setError(null);
    try {
      const blob =
        autoBlob ?? (recorder.recording ? await recorder.stop() : null);
      let text = transcriptRef.current.trim();
      if (!text && blob) {
        const heard = await transcribeInterview(session.id, blob, accessToken);
        text = heard.transcript.trim();
        setTranscript(text);
        transcriptRef.current = text;
      }
      if (!text) {
        finishing.current = false;
        movePhase('revise');
        setError(
          'No speech was heard. Type what you meant and send it. This question is still open.',
        );
        return;
      }
      await submit(text);
    } catch (err) {
      finishing.current = false;
      movePhase('revise');
      setError(messageFrom(err, 'Unable to interpret that answer'));
    }
  }
  finishRef.current = finishAnswer;

  async function submit(text: string) {
    movePhase('thinking');
    finishing.current = true;
    try {
      const next = await answerInterview(
        session.id,
        { answer: text },
        accessToken,
      );
      holdReview(next);
    } catch (err) {
      const recovered = await recover(openTurn.id);
      if (!recovered) {
        finishing.current = false;
        movePhase('revise');
        setError(messageFrom(err, 'Unable to interpret that answer'));
      }
    }
  }

  function holdReview(next: InterviewSession) {
    const judged =
      next.turns.find((turn) => turn.id === openTurn.id) ??
      [...next.turns].reverse().find((turn) => turn.answerText) ??
      null;
    setReview(judged);
    setPending(next);
    movePhase('reviewing');
    if (judged?.feedback) {
      void play('feedback', judged.id);
    }
  }

  async function recover(previousOpenId: string): Promise<boolean> {
    try {
      const fresh = await getInterview(session.id, accessToken);
      const open = fresh.turns.find((turn) => turn.answerText === null);
      if (fresh.status === 'completed' || !open || open.id !== previousOpenId) {
        const resumed =
          fresh.status === 'completed' || open
            ? fresh
            : await continueInterview(session.id, accessToken);
        holdReview(resumed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  function continueRound() {
    if (!pending) return;
    if (pending.status === 'completed') {
      onCompleted();
      return;
    }
    onSession(pending);
  }

  const presence =
    phase === 'thinking'
      ? 'thinking'
      : phase === 'answering' && recorder.recording
        ? 'listening'
        : phase === 'asking'
          ? 'speaking'
          : 'idle';
  const label =
    phase === 'answering'
      ? 'Listening'
      : phase === 'thinking'
        ? 'Interpreting'
        : phase === 'reviewing'
          ? 'Feedback'
          : 'Speaking';
  const urgent = phase === 'answering' && secondsLeft <= 15;

  return (
    <div className="ui-enter">
      <div className="grid justify-items-center text-center">
        <div
          className="presence relative h-[9.5rem] w-[9.5rem]"
          data-state={presence}
          aria-hidden="true"
        >
          <span className="presence-ring" />
          <span className="presence-disc" />
        </div>
        <p className="mt-4 mb-0 text-[0.72rem] font-semibold tracking-[0.16em] text-signal uppercase">
          {label}
        </p>
        {phase === 'answering' ||
        (phase === 'thinking' && secondsLeft === 0) ? (
          <p
            className={`font-display mt-2 mb-0 text-[3.2rem] leading-none tracking-[-0.04em] ${urgent ? 'text-danger' : 'text-ink'}`}
            aria-live="polite"
          >
            {formatClock(secondsLeft)}
          </p>
        ) : null}
        <h2 className="font-display mt-3 mb-0 max-w-xl text-[clamp(1.7rem,4vw,2.35rem)] leading-[1.15] font-normal tracking-[-0.03em] text-ink">
          {phase === 'reviewing' && review
            ? review.questionText
            : openTurn.questionText}
        </h2>
        {phase === 'asking' ? (
          <button
            type="button"
            className="mt-3 cursor-pointer border-0 border-b-2 border-transparent bg-transparent px-0 pb-1 text-[0.85rem] font-semibold text-signal transition-[color,border-color] duration-200 hover:border-signal/50 hover:text-signal-hover focus-visible:outline-none focus-visible:border-signal"
            onClick={() => void play('question', openTurn.id)}
          >
            Replay question
          </button>
        ) : null}
      </div>

      <div className="mt-8 border-t border-line pt-5 text-left">
        {error || recorder.micError ? (
          <StatusBanner className="mb-4">
            {error ?? recorder.micError}
          </StatusBanner>
        ) : null}

        {phase === 'reviewing' && review ? (
          <Review
            turn={review}
            last={pending?.status === 'completed'}
            onContinue={continueRound}
            onReplay={() => review.id && void play('feedback', review.id)}
          />
        ) : (
          <>
            <label className="block">
              <span className="mb-1.5 block text-[0.8rem] font-semibold text-ink-soft">
                {phase === 'answering'
                  ? 'Two minutes. Speak your answer, or type it.'
                  : phase === 'thinking'
                    ? 'Interpreting what you said…'
                    : 'The two minutes start when the question finishes.'}
              </span>
              <textarea
                value={transcript}
                onChange={(event) => {
                  transcriptRef.current = event.target.value;
                  setTranscript(event.target.value);
                }}
                rows={5}
                disabled={phase === 'thinking' || phase === 'asking'}
                placeholder="Your words show up here after you speak. You can correct them before the clock ends."
                className="ui-input resize-y"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {phase === 'asking' ? (
                <Button
                  className="min-w-[11rem] px-5"
                  onClick={() => void beginAnswer()}
                >
                  Start my two minutes
                </Button>
              ) : null}
              {phase === 'answering' ? (
                <Button
                  className="min-w-[11rem] px-5"
                  disabled={!transcript.trim() && !recorder.recording}
                  onClick={() => void finishAnswer(null)}
                >
                  Done speaking
                </Button>
              ) : null}
              {phase === 'revise' ? (
                <Button
                  className="min-w-[11rem] px-5"
                  disabled={!transcript.trim()}
                  onClick={() => void submit(transcript.trim())}
                >
                  Send this answer
                </Button>
              ) : null}
              {phase === 'thinking' ? (
                <Button className="min-w-[11rem] px-5" disabled>
                  Interpreting…
                </Button>
              ) : null}
            </div>
            <p className="mt-3 mb-0 text-[0.8rem] text-mute">
              Five questions. The interviewer rates this answer, explains it,
              then asks the next one.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Review({
  turn,
  last,
  onContinue,
  onReplay,
}: {
  turn: InterviewTurn;
  last: boolean;
  onContinue: () => void;
  onReplay: () => void;
}) {
  return (
    <div>
      <p className="m-0 text-[0.72rem] font-semibold tracking-[0.16em] text-signal uppercase">
        How that answer landed
      </p>
      {turn.score !== null ? (
        <p className="font-display mt-2 mb-0 text-[3rem] leading-none tracking-[-0.04em] text-ink">
          {turn.score}
          <span className="text-[0.45em] text-mute">/100</span>
        </p>
      ) : null}
      {turn.feedback ? (
        <p className="mt-3 mb-0 max-w-xl text-[0.98rem] leading-relaxed text-ink">
          {turn.feedback}
        </p>
      ) : null}
      {turn.rubric ? (
        <ul className="mt-4 grid max-w-md gap-2">
          {(
            [
              ['correctness', 'Correctness'],
              ['depth', 'Depth'],
              ['tradeoffs', 'Trade-offs'],
              ['clarity', 'Clarity'],
            ] as const
          ).map(([key, name]) => (
            <li key={key}>
              <div className="mb-1 flex justify-between text-[0.75rem] text-ink-soft">
                <span>{name}</span>
                <span>{turn.rubric?.[key]}</span>
              </div>
              <div className="h-[3px] overflow-hidden rounded-full bg-line">
                <span
                  className="block h-full bg-signal"
                  style={{ width: `${turn.rubric?.[key] ?? 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {turn.answerText ? (
        <p className="mt-4 mb-0 text-[0.88rem] leading-relaxed text-ink-soft">
          {turn.answerText}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-2.5">
        <Button className="min-w-[11rem] px-5" onClick={onContinue}>
          {last ? 'See the full round' : 'Next question'}
        </Button>
        {turn.feedback ? (
          <Button
            variant="ghost"
            className="min-w-[11rem] px-5"
            onClick={onReplay}
          >
            Replay feedback
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function formatClock(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const remain = safe % 60;
  return `${minutes}:${remain.toString().padStart(2, '0')}`;
}

function messageFrom(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
