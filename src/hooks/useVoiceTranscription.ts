/**
 * useVoiceTranscription
 * Records mic audio via MediaRecorder → uploads full blob to voice-transcribe
 * edge function → returns transcript text.
 *
 * Not streaming: one recording, one request, one text. Simple, robust, works
 * in Chrome/Firefox (webm) and Safari iOS (mp4).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type State = 'idle' | 'recording' | 'transcribing';

const MAX_RECORD_MS = 120_000; // 2 min soft cap
const MIN_BLOB_BYTES = 2 * 1024; // <2KB = definitely empty/silent

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return undefined;
}

function filenameForMime(mime: string): string {
  const base = mime.split(';')[0].trim().toLowerCase();
  const ext =
    base.includes('mp4') ? 'mp4' :
    base.includes('mpeg') || base.includes('mp3') ? 'mp3' :
    base.includes('wav') ? 'wav' :
    base.includes('ogg') ? 'ogg' :
    'webm';
  return `recording.${ext}`;
}

export interface UseVoiceTranscriptionOptions {
  language?: string; // ISO-639-1 (`ru`, `en`). Omit to auto-detect.
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceTranscription(opts: UseVoiceTranscriptionOptions = {}) {
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const isSupported =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined';

  const uploadAndTranscribe = useCallback(async (blob: Blob) => {
    setState('transcribing');
    try {
      const form = new FormData();
      form.append('file', blob, filenameForMime(blob.type || 'audio/webm'));
      if (optsRef.current.language) {
        form.append('language', optsRef.current.language);
      }

      const { data, error: fnError } = await supabase.functions.invoke(
        'voice-transcribe',
        { body: form },
      );

      if (fnError) throw new Error(fnError.message || 'Transcription failed');
      const text = (data as { text?: string } | null)?.text?.trim() ?? '';
      if (!text) throw new Error('Empty transcript');

      optsRef.current.onTranscript?.(text);
      setState('idle');
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Transcription failed';
      setError(msg);
      optsRef.current.onError?.(msg);
      setState('idle');
    }
  }, []);

  const start = useCallback(async () => {
    if (state !== 'idle') return;
    setError(null);

    if (!isSupported) {
      const msg = 'Voice recording is not supported in this browser';
      setError(msg);
      optsRef.current.onError?.(msg);
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const msg =
        e instanceof Error && e.name === 'NotAllowedError'
          ? 'Microphone access denied'
          : 'Cannot access microphone';
      setError(msg);
      optsRef.current.onError?.(msg);
      return;
    }

    const mimeType = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch {
      recorder = new MediaRecorder(stream);
    }

    streamRef.current = stream;
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
    };

    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type });
      cleanup();

      if (blob.size < MIN_BLOB_BYTES) {
        const msg = 'Recording was empty. Please try again.';
        setError(msg);
        optsRef.current.onError?.(msg);
        setState('idle');
        return;
      }
      void uploadAndTranscribe(blob);
    };

    recorder.start(); // single segment, no timeslice
    setState('recording');

    timerRef.current = window.setTimeout(() => {
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
    }, MAX_RECORD_MS);
  }, [state, isSupported, cleanup, uploadAndTranscribe]);

  const stop = useCallback(() => {
    if (state !== 'recording') return;
    const rec = recorderRef.current;
    if (rec && rec.state === 'recording') rec.stop();
  }, [state]);

  const toggle = useCallback(() => {
    if (state === 'recording') stop();
    else if (state === 'idle') void start();
  }, [state, start, stop]);

  return {
    state,
    isRecording: state === 'recording',
    isTranscribing: state === 'transcribing',
    isBusy: state !== 'idle',
    isSupported,
    error,
    start,
    stop,
    toggle,
  };
}
