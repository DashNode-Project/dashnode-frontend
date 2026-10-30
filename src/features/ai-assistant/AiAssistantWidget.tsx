import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Loader2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Square,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useMatch } from 'react-router';
import { PATHS } from '@/app/paths';
import { useAuth } from '@/features/auth/AuthContext';
import { getProject } from '@/features/projects/api';
import { ApiError, isTechnicalFailure, NetworkError } from '@/lib/api/errors';
import { fetchChatHistory, postTextGenerate, postVoiceTranscribe } from './api';
import { escapeHtml } from './escapeHtml';
import { AI_MESSAGES } from './messages';
import type {
  AssistantState,
  ChatMessage,
  PendingRetry,
  ProcessingMode,
} from './types';
import { mapVoiceCaptureError, useVoiceCapture } from './useVoiceCapture';

const IDLE_AFTER_MS = 2500;

function mapHistoryMessages(
  payload: Awaited<ReturnType<typeof fetchChatHistory>>,
): ChatMessage[] {
  return payload.messages.map((item) => ({
    id: item.id,
    role: item.role,
    text: item.text,
    inputSource: item.input_source ?? undefined,
  }));
}

function isVoiceNotUnderstood(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'VOICE_NOT_UNDERSTOOD';
}

function mapApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'EMPTY_AUDIO') return AI_MESSAGES.emptyAudio;
    if (error.code === 'VOICE_NOT_UNDERSTOOD') return AI_MESSAGES.voiceNotUnderstood;
    if (error.code === 'AUDIO_TOO_LONG') return AI_MESSAGES.audioTooLong;
    if (error.code === 'FREE_QUOTA_EXHAUSTED') return AI_MESSAGES.quotaExhausted;
    if (error.code === 'AI_PROCESSING_ERROR') return AI_MESSAGES.aiProcessing;
    if (error.code === 'HTTP_404' || error.status === 404) {
      return AI_MESSAGES.technicalFailure;
    }
    if (!isTechnicalFailure(error)) return error.message;
  }
  if (error instanceof NetworkError) return AI_MESSAGES.technicalFailure;
  return AI_MESSAGES.technicalFailure;
}

function statusLabel(state: AssistantState, processingMode: ProcessingMode | null): string {
  if (state === 'PROCESSING' && processingMode) {
    return AI_MESSAGES.processingLabels[processingMode];
  }
  return AI_MESSAGES.stateLabels[state];
}

function StatusBadge({
  state,
  processingMode,
}: {
  state: AssistantState;
  processingMode: ProcessingMode | null;
}) {
  const label = statusLabel(state, processingMode);
  const Icon =
    state === 'RECORDING'
      ? Mic
      : state === 'PROCESSING'
        ? Loader2
        : state === 'RESPONDED'
          ? CheckCircle2
          : state === 'ERROR'
            ? AlertCircle
            : Sparkles;
  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#E5E7EB]"
      role="status"
      aria-live="polite"
    >
      <Icon
        size={14}
        aria-hidden="true"
        className={state === 'PROCESSING' ? 'animate-spin text-violet-300' : 'text-violet-300'}
      />
      <span>{label}</span>
    </div>
  );
}

export function AiAssistantWidget() {
  const { user } = useAuth();
  const projectMatch = useMatch({ path: `${PATHS.projects}/:projectId/*`, end: false });
  const projectId = projectMatch?.params.projectId ?? null;
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [assistantState, setAssistantState] = useState<AssistantState>('INACTIVE');
  const [processingMode, setProcessingMode] = useState<ProcessingMode | null>(null);
  const [draft, setDraft] = useState('');
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [pendingRetry, setPendingRetry] = useState<PendingRetry | null>(null);
  const [retryDisabled, setRetryDisabled] = useState(false);
  const [projectLabel, setProjectLabel] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<number | null>(null);
  const voice = useVoiceCapture();

  const clearIdleTimer = () => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const scheduleReturnToInactive = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = window.setTimeout(() => {
      setAssistantState('INACTIVE');
      setProcessingMode(null);
    }, IDLE_AFTER_MS);
  }, []);

  useEffect(() => () => clearIdleTimer(), []);

  const scrollToLatest = () => {
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView?.({ behavior: 'smooth' });
    });
  };

  const refreshProjectContext = async (activeProjectId: string | null) => {
    if (!activeProjectId) {
      setProjectLabel(null);
      return;
    }
    try {
      const data = await getProject(activeProjectId);
      setProjectLabel(data.name);
    } catch {
      setProjectLabel(null);
    }
  };

  const focusableSelector =
    'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = panel.querySelectorAll<HTMLElement>(focusableSelector);
    focusables[0]?.focus();
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab' || !panel.contains(document.activeElement)) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (el) => !el.hasAttribute('disabled'),
      );
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const reloadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const payload = await fetchChatHistory();
      setMessages(mapHistoryMessages(payload));
      scrollToLatest();
    } catch {
      setMessages([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setMessages([]);
      return;
    }
    if (open) void reloadHistory();
  }, [user?.id, open, reloadHistory]);

  const runTextQuery = useCallback(
    async (text: string, retry = false) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      clearIdleTimer();
      setBannerError(null);
      setRetryDisabled(false);
      setAssistantState('PROCESSING');
      setProcessingMode('text');
      if (!retry) {
        setDraft('');
      }
      try {
        const result = await postTextGenerate(trimmed, projectId);
        await reloadHistory();
        if (result.assistant_response) {
          setAssistantState('RESPONDED');
          setProcessingMode(null);
          setPendingRetry(null);
          scheduleReturnToInactive();
        } else {
          setAssistantState('ERROR');
          setProcessingMode(null);
          setBannerError(result.error ?? AI_MESSAGES.aiProcessing);
          setPendingRetry({ kind: 'text', text: trimmed });
        }
      } catch (error) {
        setAssistantState('ERROR');
        setProcessingMode(null);
        setBannerError(mapApiError(error));
        setPendingRetry({ kind: 'text', text: trimmed });
      }
    },
    [projectId, reloadHistory, scheduleReturnToInactive],
  );

  const runVoiceQuery = useCallback(
    async (
      blob: Blob,
      durationSeconds: number,
      options?: { skipTranscribe?: boolean; recognizedText?: string },
    ) => {
      clearIdleTimer();
      setBannerError(null);
      setRetryDisabled(false);
      let recognized = options?.recognizedText?.trim() ?? '';

      if (!options?.skipTranscribe) {
        setAssistantState('PROCESSING');
        setProcessingMode('voice-transcribe');
        try {
          const transcribed = await postVoiceTranscribe(blob, projectId, durationSeconds);
          recognized = transcribed.recognized_text.trim();
          await reloadHistory();
        } catch (error) {
          setAssistantState('ERROR');
          setProcessingMode(null);
          setBannerError(mapApiError(error));
          if (isVoiceNotUnderstood(error)) {
            setRetryDisabled(true);
            setPendingRetry(null);
          } else {
            setPendingRetry({ kind: 'voice', audioBlob: blob, durationSeconds });
          }
          return;
        }
      }

      setAssistantState('PROCESSING');
      setProcessingMode('voice-reply');
      try {
        const result = await postTextGenerate(recognized, projectId, {
          persistUserMessage: false,
        });
        await reloadHistory();
        if (result.assistant_response) {
          setAssistantState('RESPONDED');
          setProcessingMode(null);
          setPendingRetry(null);
          scheduleReturnToInactive();
        } else {
          setAssistantState('ERROR');
          setProcessingMode(null);
          setBannerError(result.error ?? AI_MESSAGES.aiProcessing);
          setPendingRetry({
            kind: 'voice',
            audioBlob: blob,
            durationSeconds,
            text: recognized,
            voiceTranscribed: true,
          });
        }
      } catch (error) {
        setAssistantState('ERROR');
        setProcessingMode(null);
        setBannerError(mapApiError(error));
        setPendingRetry({
          kind: 'voice',
          audioBlob: blob,
          durationSeconds,
          text: recognized,
          voiceTranscribed: Boolean(recognized),
        });
      }
    },
    [projectId, reloadHistory, scheduleReturnToInactive],
  );

  const onToggle = () => {
    setOpen((value) => {
      const next = !value;
      if (next) {
        void refreshProjectContext(projectId);
        scrollToLatest();
      }
      return next;
    });
  };

  const onRecordClick = async () => {
    voice.clearError();
    setBannerError(null);
    if (voice.recording) {
      const captured = await voice.stopRecording();
      if (captured) await runVoiceQuery(captured.blob, captured.durationSeconds);
      else if (voice.error) {
        setAssistantState('ERROR');
        setProcessingMode(null);
        setBannerError(mapVoiceCaptureError(voice.error));
      } else {
        setAssistantState('INACTIVE');
        setProcessingMode(null);
      }
      return;
    }
    const captureError = await voice.startRecording();
    if (captureError) {
      setAssistantState('ERROR');
      setProcessingMode(null);
      setBannerError(mapVoiceCaptureError(captureError));
      return;
    }
    setAssistantState('RECORDING');
    setProcessingMode(null);
  };

  const onRetry = async () => {
    if (!pendingRetry) return;
    if (pendingRetry.kind === 'text' && pendingRetry.text) {
      await runTextQuery(pendingRetry.text, true);
      return;
    }
    if (pendingRetry.kind === 'voice' && pendingRetry.durationSeconds) {
      if (pendingRetry.voiceTranscribed && pendingRetry.text) {
        await runVoiceQuery(pendingRetry.audioBlob ?? new Blob(), pendingRetry.durationSeconds, {
          skipTranscribe: true,
          recognizedText: pendingRetry.text,
        });
        return;
      }
      if (pendingRetry.audioBlob) {
        await runVoiceQuery(pendingRetry.audioBlob, pendingRetry.durationSeconds);
      }
    }
  };

  const contextLine = useMemo(() => {
    const globalLine = AI_MESSAGES.globalAssistantScope;
    if (!projectId) return globalLine;
    if (!projectLabel) return `${globalLine} · Cargando vista…`;
    return `${globalLine} · ${AI_MESSAGES.contextPrefix} ${projectLabel}`;
  }, [projectId, projectLabel]);

  if (!user) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label={AI_MESSAGES.chatPanelLabel}
          className="pointer-events-auto flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#12131C] shadow-2xl shadow-violet-950/40"
        >
          <header className="flex items-start justify-between gap-2 border-b border-white/8 bg-gradient-to-r from-[#0A0B0E] to-[#151628] px-4 py-3">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20 text-violet-300">
                  <Bot size={16} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#F9FAFB]">{AI_MESSAGES.widgetTitle}</p>
                  <p className="truncate text-xs text-[#9CA3AF]">{contextLine}</p>
                </div>
              </div>
              <StatusBadge state={assistantState} processingMode={processingMode} />
            </div>
            <button
              type="button"
              className="rounded-lg p-1 text-[#9CA3AF] hover:bg-white/5 hover:text-white"
              aria-label={AI_MESSAGES.closeChatPanel}
              onClick={() => setOpen(false)}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </header>

          <div className="max-h-72 space-y-3 overflow-y-auto px-3 py-3" aria-live="polite">
            {historyLoading ? (
              <p className="text-xs text-[#9CA3AF]">Cargando historial…</p>
            ) : null}
            {!historyLoading && messages.length === 0 ? (
              <p className="text-xs leading-relaxed text-[#9CA3AF]">
                Consulte al asistente por voz o por texto. El historial es personal y se conserva
                durante 24 horas.
              </p>
            ) : null}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'border border-white/10 bg-[#1E1F2B] text-[#F3F4F6]'
                  }`}
                >
                  {message.role === 'user' && message.inputSource ? (
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide opacity-80">
                      {message.inputSource === 'voice'
                        ? AI_MESSAGES.voiceMessageBadge
                        : AI_MESSAGES.textMessageBadge}
                    </p>
                  ) : null}
                  <span dangerouslySetInnerHTML={{ __html: escapeHtml(message.text) }} />
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {bannerError ? (
            <div
              className="mx-3 mb-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100"
              role="alert"
            >
              <p>{bannerError}</p>
              {!retryDisabled && pendingRetry ? (
                <button
                  type="button"
                  className="mt-2 rounded-lg border border-red-400/40 px-2 py-1 text-[11px] font-medium hover:bg-red-500/10"
                  onClick={() => void onRetry()}
                >
                  {AI_MESSAGES.retry}
                </button>
              ) : null}
            </div>
          ) : null}

          <footer className="border-t border-white/8 px-3 py-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => void onRecordClick()}
                disabled={assistantState === 'PROCESSING' || !voice.supported}
                aria-pressed={voice.recording}
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                  voice.recording
                    ? 'bg-red-600 text-white'
                    : 'border border-white/10 bg-[#1E1F2B] text-[#E5E7EB] hover:bg-white/5'
                }`}
              >
                {voice.recording ? (
                  <>
                    <Square size={12} aria-hidden="true" /> {AI_MESSAGES.stop}
                  </>
                ) : (
                  <>
                    <Mic size={12} aria-hidden="true" /> {AI_MESSAGES.record}
                  </>
                )}
              </button>
              {voice.recording ? (
                <span className="text-xs tabular-nums text-red-300" aria-live="polite">
                  {voice.seconds}s / 60s
                  <MicOff size={12} className="ml-1 inline opacity-70" aria-hidden="true" />
                </span>
              ) : null}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void runTextQuery(draft);
                }}
                placeholder={AI_MESSAGES.inputPlaceholder}
                disabled={assistantState === 'PROCESSING'}
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#1E1F2B] px-3 py-2 text-xs text-white placeholder:text-[#6B7280] focus:border-violet-400 focus:outline-none"
                aria-label={AI_MESSAGES.inputPlaceholder}
              />
              <button
                type="button"
                aria-label={AI_MESSAGES.send}
                disabled={!draft.trim() || assistantState === 'PROCESSING'}
                onClick={() => void runTextQuery(draft)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40"
              >
                <Send size={14} aria-hidden="true" />
              </button>
            </div>
          </footer>
        </div>
      ) : null}

      <button
        ref={toggleRef}
        type="button"
        aria-label={open ? AI_MESSAGES.closeAssistant : AI_MESSAGES.openAssistant}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onToggle();
          }
        }}
        className={`pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all ${
          open
            ? 'border border-white/15 bg-[#1E1F2B] text-violet-300'
            : 'bg-violet-600 text-white hover:scale-105 hover:bg-violet-500'
        }`}
      >
        <Bot size={22} aria-hidden="true" />
      </button>
    </div>
  );
}
