import { useCallback, useEffect, useRef, useState } from 'react';
import { AI_MESSAGES } from './messages';

const MAX_SECONDS = 60;
const MIN_SECONDS = 1.2;

export type VoiceCaptureError =
  'MIC_DENIED' | 'NO_SUPPORT' | 'MIC_UNAVAILABLE' | 'EMPTY' | 'TOO_LONG';

interface VoiceCaptureState {
  supported: boolean;
  recording: boolean;
  seconds: number;
  error: VoiceCaptureError | null;
  startRecording: () => Promise<VoiceCaptureError | null>;
  stopRecording: () => Promise<{ blob: Blob; durationSeconds: number } | null>;
  clearError: () => void;
}

export function useVoiceCapture(): VoiceCaptureState {
  const [supported] = useState(
    () =>
      typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== 'undefined',
  );
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<VoiceCaptureError | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const stopResolverRef = useRef<
    ((value: { blob: Blob; durationSeconds: number } | null) => void) | null
  >(null);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanupStream(), [cleanupStream]);

  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return null;
    return new Promise<{ blob: Blob; durationSeconds: number } | null>((resolve) => {
      stopResolverRef.current = resolve;
      recorder.stop();
    });
  }, []);

  const startRecording = useCallback(async (): Promise<VoiceCaptureError | null> => {
    setError(null);
    if (!supported) {
      setError('NO_SUPPORT');
      return 'NO_SUPPORT';
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        cleanupStream();
        setRecording(false);
        const durationSeconds = Math.min(MAX_SECONDS, (Date.now() - startedAtRef.current) / 1000);
        setSeconds(0);
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const resolver = stopResolverRef.current;
        stopResolverRef.current = null;
        if (blob.size < 64 || durationSeconds < MIN_SECONDS) {
          setError('EMPTY');
          resolver?.(null);
          return;
        }
        if (durationSeconds > MAX_SECONDS + 0.5) {
          setError('TOO_LONG');
          resolver?.(null);
          return;
        }
        resolver?.({ blob, durationSeconds });
      };
      startedAtRef.current = Date.now();
      recorder.start(250);
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startedAtRef.current) / 1000;
        setSeconds(Math.min(MAX_SECONDS, Math.floor(elapsed)));
        if (elapsed >= MAX_SECONDS) {
          void stopRecording();
        }
      }, 500);
    } catch (err) {
      cleanupStream();
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError('MIC_DENIED');
        return 'MIC_DENIED';
      }
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError('MIC_UNAVAILABLE');
        return 'MIC_UNAVAILABLE';
      }
      setError('MIC_DENIED');
      return 'MIC_DENIED';
    }
    return null;
  }, [cleanupStream, stopRecording, supported]);

  return {
    supported,
    recording,
    seconds,
    error,
    startRecording,
    stopRecording,
    clearError: () => setError(null),
  };
}

export function mapVoiceCaptureError(code: VoiceCaptureError): string {
  switch (code) {
    case 'MIC_DENIED':
      return AI_MESSAGES.micDenied;
    case 'NO_SUPPORT':
      return AI_MESSAGES.noAudioSupport;
    case 'MIC_UNAVAILABLE':
      return AI_MESSAGES.micUnavailable;
    case 'EMPTY':
      return AI_MESSAGES.emptyAudio;
    case 'TOO_LONG':
      return AI_MESSAGES.audioTooLong;
    default:
      return AI_MESSAGES.technicalFailure;
  }
}
