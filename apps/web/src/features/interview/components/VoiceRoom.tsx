import type { InterviewSession, InterviewTurn } from '@tayyari/shared';
import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../../shared/api/client';
import { Button } from '../../../shared/ui/Button';
import {
  answerInterview,
  continueInterview,
  getInterview,
  getTurnAudio,
  transcribeInterview,
} from '../api/interviewsApi';
import { useWavRecorder } from '../audio/useWavRecorder';

type PresenceState = 'idle' | 'speaking' | 'listening' | 'thinking';

const STATE_LABEL: Record<PresenceState, string> = {
  idle: 'Ready',
  speaking: 'Speaking',
  listening: 'Listening',
  thinking: 'Thinking',
};

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
  const [presence, setPresence] = useState<PresenceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const recorder = useWavRecorder();
  const transcribeRef = useRef<(blob: Blob | null) => Promise<void>>(
    async () => undefined,
  );

  useEffect(() => {
    const element = new Audio();
    audio.current = element;
    element.onended = () => setPresence('idle');
    element.onplay = () => setPresence('speaking');
    return () => {
      element.pause();
      element.src = '';
    };
  }, []);

  useEffect(() => {
    recorder.bindAutoStop((blob) => {
      void transcribeRef.current(blob);
    });
  }, [recorder, recorder.bindAutoStop]);

  useEffect(() => {
    let cancelled = false;
    setTranscript('');
    setTyping(false);
    setError(null);
    void (async () => {
      if (cancelled) return;
      await playQuestion();
    })();

    return () => {
      cancelled = true;
      if (objectUrl.current) {
        URL.revokeObjectURL(objectUrl.current);
        objectUrl.current = null;
      }
    };
    // The spoken line reloads only when the open turn changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTurn.id]);

  async function playQuestion() {
    const element = audio.current;
    if (!element) return;
    setPresence('speaking');
    try {
      const blob = await getTurnAudio(session.id, openTurn.id, accessToken);
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      const url = URL.createObjectURL(blob);
      objectUrl.current = url;
      element.src = url;
      await element.play();
    } catch {
      setPresence('idle');
    }
  }

  async function transcribeBlob(blob: Blob | null) {
    setPresence('thinking');
    setBusy(true);
    setError(null);
    try {
      if (!blob) {
        setError('No speech was heard. Record again or type your answer.');
        setPresence('idle');
        return;
      }
      const heard = await transcribeInterview(session.id, blob, accessToken);
      setTranscript(heard.transcript);
      setPresence('idle');
    } catch (err) {
      setError(messageFrom(err, 'Unable to transcribe that recording'));
      setPresence('idle');
    } finally {
      setBusy(false);
    }
  }
  transcribeRef.current = transcribeBlob;

  async function onRecord() {
    audio.current?.pause();
    setPresence('listening');
    setError(null);
    const result = await recorder.start();
    if (result !== 'ok') setPresence('idle');
  }

  async function onStop() {
    await transcribeBlob(await recorder.stop());
  }

  async function onSend() {
    const trimmed = transcript.trim();
    if (!trimmed) {
      setError('Edit the transcript, or record again, before sending.');
      return;
    }
    setBusy(true);
    setError(null);
    setPresence('thinking');
    try {
      const next = await answerInterview(
        session.id,
        { answer: trimmed },
        accessToken,
      );
      accept(next);
    } catch (err) {
      const recovered = await recover(openTurn.id);
      if (!recovered) {
        setError(messageFrom(err, 'Unable to submit that answer'));
        setPresence('idle');
      }
    } finally {
      setBusy(false);
    }
  }

  function accept(next: InterviewSession) {
    setTranscript('');
    if (next.status === 'completed') {
      onCompleted();
      return;
    }
    onSession(next);
    setPresence('idle');
  }

  async function recover(previousOpenId: string): Promise<boolean> {
    try {
      const fresh = await getInterview(session.id, accessToken);
      const open = fresh.turns.find((turn) => turn.answerText === null);
      if (fresh.status === 'completed') {
        onCompleted();
        return true;
      }
      if (open && open.id === previousOpenId) return false;
      const resumed = open
        ? fresh
        : await continueInterview(session.id, accessToken);
      accept(resumed);
      return true;
    } catch {
      return false;
    }
  }

  const stateLabel = recorder.recording ? 'Listening' : STATE_LABEL[presence];
  const shownState: PresenceState = recorder.recording ? 'listening' : presence;

  return (
    <div className="ui-enter">
      <div className="stage grid justify-items-center text-center">
        <div
          className="presence relative h-[9.5rem] w-[9.5rem]"
          data-state={shownState}
          aria-hidden="true"
        >
          <span className="presence-ring" />
          <span className="presence-disc" />
        </div>
        <p className="mt-4 mb-0 text-[0.72rem] font-semibold tracking-[0.16em] text-signal uppercase">
          {stateLabel}
        </p>
        <h2 className="font-display mt-3 mb-0 max-w-xl text-[clamp(1.7rem,4vw,2.35rem)] leading-[1.15] font-normal tracking-[-0.03em] text-ink">
          {openTurn.questionText}
        </h2>
        <button
          type="button"
          className="mt-3 border-0 bg-transparent text-[0.85rem] font-semibold text-signal"
          onClick={() => void playQuestion()}
        >
          Replay
        </button>
      </div>

      <div className="mt-8 border-t border-line pt-5 text-left">
        {error || recorder.micError ? (
          <p className="mb-4 rounded-[10px] bg-danger-soft px-3.5 py-3 text-[0.85rem] text-danger">
            {error ?? recorder.micError}
          </p>
        ) : null}
        <label className="block">
          <span className="mb-1.5 block text-[0.8rem] font-semibold text-ink-soft">
            What I heard — edit before sending
          </span>
          <textarea
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            rows={5}
            disabled={busy || recorder.recording}
            placeholder={
              typing
                ? 'Type the answer you want judged…'
                : 'Record, then correct the transcript before it is scored.'
            }
            className="w-full cursor-text resize-y rounded-[10px] border border-line bg-white px-3.5 py-3 text-[0.95rem] text-ink outline-none placeholder:text-mute/70 hover:border-ink/30 focus:border-focus focus:bg-paper-lift focus:shadow-[0_0_0_3px_rgb(42_85_255/0.18)] disabled:cursor-not-allowed disabled:opacity-70"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2.5">
          <Button
            className="min-w-40"
            disabled={busy || recorder.recording || !transcript.trim()}
            onClick={() => void onSend()}
          >
            {busy && presence === 'thinking' ? 'Sending…' : 'Send this answer'}
          </Button>
          {recorder.recording ? (
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => void onStop()}
            >
              Stop and transcribe
            </Button>
          ) : (
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => void onRecord()}
            >
              {transcript ? 'Record again' : 'Record'}
            </Button>
          )}
          <Button
            variant="ghost"
            disabled={busy || recorder.recording}
            onClick={() => setTyping(true)}
          >
            Type instead
          </Button>
        </div>
        <p className="mt-3 mb-0 text-[0.8rem] text-mute">
          Scores stay hidden until the round ends. One follow-up at most.
        </p>
      </div>
    </div>
  );
}

function messageFrom(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
