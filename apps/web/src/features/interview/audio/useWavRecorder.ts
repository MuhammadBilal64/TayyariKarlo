import { useCallback, useRef, useState } from 'react';
import { encodeWav } from './encodeWav';

const MAX_MS = 2 * 60 * 1000;

export function useWavRecorder() {
  const [recording, setRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const chunks = useRef<Float32Array[]>([]);
  const context = useRef<AudioContext | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const processor = useRef<ScriptProcessorNode | null>(null);
  const timer = useRef<number | null>(null);
  const onAutoStop = useRef<((blob: Blob | null) => void) | null>(null);

  const bindAutoStop = useCallback((handler: (blob: Blob | null) => void) => {
    onAutoStop.current = handler;
  }, []);

  function cleanup() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    processor.current?.disconnect();
    processor.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    void context.current?.close();
    context.current = null;
  }

  const stop = useCallback(async (): Promise<Blob | null> => {
    const audio = context.current;
    const recorded = chunks.current;
    cleanup();
    setRecording(false);
    if (!audio || recorded.length === 0) return null;
    const length = recorded.reduce((sum, chunk) => sum + chunk.length, 0);
    const merged = new Float32Array(length);
    let offset = 0;
    for (const chunk of recorded) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    return encodeWav(merged, audio.sampleRate);
  }, []);

  const start = useCallback(async (): Promise<'ok' | 'denied'> => {
    setMicError(null);
    chunks.current = [];
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true },
      });
      const audio = new AudioContext();
      const source = audio.createMediaStreamSource(media);
      const node = audio.createScriptProcessor(4096, 1, 1);
      node.onaudioprocess = (event) => {
        chunks.current.push(
          new Float32Array(event.inputBuffer.getChannelData(0)),
        );
      };
      source.connect(node);
      node.connect(audio.destination);
      stream.current = media;
      context.current = audio;
      processor.current = node;
      setRecording(true);
      timer.current = window.setTimeout(() => {
        void stop().then((blob) => onAutoStop.current?.(blob));
      }, MAX_MS);
      return 'ok';
    } catch {
      cleanup();
      setRecording(false);
      setMicError(
        'Microphone access was denied. Type your answer, or allow the mic and record again.',
      );
      return 'denied';
    }
  }, [stop]);

  return { recording, micError, start, stop, bindAutoStop };
}
