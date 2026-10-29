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
import { ApiError, isTechnicalFailure, NetworkError } from '@/lib/api/errors';
import { postTextGenerate, postVoiceProcess } from './api';
import { escapeHtml } from './escapeHtml';
import { AI_MESSAGES } from './messages';
import type { AssistantState, ChatMessage, PendingRetry } from './types';
import { mapVoiceCaptureError, useVoiceCapture } from './useVoiceCapture';

const SESSION_KEY = 'dashnode_ai_chat_session';

function loadMessages(): ChatMessage[] {
  try {
    /* eslint-disable-next-line no-restricted-globals -- HU 93: chat history only, no credentials */
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistMessages(messages: ChatMessage[]) {
  /* eslint-disable-next-line no-restricted-globals -- HU 93: chat history only, no credentials */
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
}

function nextId(): string {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function mapApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'EMPTY_AUDIO') return AI_MESSAGES.emptyAudio;
    if (error.code === 'AUDIO_TOO_LONG') return AI_MESSAGES.audioTooLong;
    if (error.code === 'FREE_QUOTA_EXHAUSTED') return AI_MESSAGES.quotaExhausted;
    if (error.code === 'AI_PROCESSING_ERROR') return AI_MESSAGES.aiProcessing;
    if (!isTechnicalFailure(error)) return error.message;
  }
  if (error instanceof NetworkError) return AI_MESSAGES.technicalFailure;
  return AI_MESSAGES.technicalFailure;
}

function StatusBadge({ state }: { state: AssistantState }) {
  const label = AI_MESSAGES.stateLabels[state];
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
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [assistantState, setAssistantState] = useState<AssistantState>('INACTIVE');
  const [draft, setDraft] = useState('');
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [pendingRetry, setPendingRetry] = useState<PendingRetry | null>(null);
  const [projectLabel, setProjectLabel] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const voice = useVoiceCapture();

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
      const res = await fetch(`/api/v1/projects/${activeProjectId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('load');
      const data = (await res.json()) as { name?: string };
      setProjectLabel(data.name ?? null);
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

  const appendMessage = useCallback((role: ChatMessage['role'], text: string) => {
    setMessages((prev) => {
      const next = [...prev, { id: nextId(), role, text }];
      persistMessages(next);
      return next;
    });
    scrollToLatest();
  }, []);

  const runTextQuery = useCallback(
    async (text: string, retry = false) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setBannerError(null);
      setAssistantState('PROCESSING');
      if (!retry) {
        appendMessage('user', trimmed);
        setDraft('');
      }
      try {
        const result = await postTextGenerate(trimmed, projectId);
        if (result.assistant_response) {
          appendMessage('assistant', result.assistant_response);
          setAssistantState('RESPONDED');
          setPendingRetry(null);
        } else {
          setAssistantState('ERROR');
          setBannerError(result.error ?? AI_MESSAGES.aiProcessing);
          setPendingRetry({ kind: 'text', text: trimmed });
        }
      } catch (error) {
        setAssistantState('ERROR');
        setBannerError(mapApiError(error));
        setPendingRetry({ kind: 'text', text: trimmed });
      }
    },
    [appendMessage, projectId],
  );

  const runVoiceQuery = useCallback(
    async (blob: Blob, durationSeconds: number) => {
      setBannerError(null);
      setAssistantState('PROCESSING');
      try {
        const result = await postVoiceProcess(blob, projectId, durationSeconds);
        if (result.recognized_text) appendMessage('user', result.recognized_text);
        if (result.assistant_response) {
          appendMessage('assistant', result.assistant_response);
          setAssistantState('RESPONDED');
          setPendingRetry(null);
        } else {
          setAssistantState('ERROR');
          setBannerError(result.error ?? AI_MESSAGES.aiProcessing);
          setPendingRetry({ kind: 'voice', audioBlob: blob, durationSeconds });
        }
      } catch (error) {
        setAssistantState('ERROR');
        setBannerError(mapApiError(error));
        setPendingRetry({ kind: 'voice', audioBlob: blob, durationSeconds });
      }
    },
    [appendMessage, projectId],
  );

  const onToggle = () => {
    setOpen((value) => {
      const next = !value;
      if (next) {
        if (!historyLoaded) {
          setMessages(loadMessages());
          setHistoryLoaded(true);
        }
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
        setBannerError(mapVoiceCaptureError(voice.error));
      } else {
        setAssistantState('INACTIVE');
      }
      return;
    }
    const captureError = await voice.startRecording();
    if (captureError) {
      setAssistantState('ERROR');
      setBannerError(mapVoiceCaptureError(captureError));
      return;
    }
    setAssistantState('RECORDING');
  };

  const onRetry = async () => {
    if (!pendingRetry) return;
    if (pendingRetry.kind === 'text' && pendingRetry.text) {
      await runTextQuery(pendingRetry.text, true);
      return;
    }
    if (pendingRetry.kind === 'voice' && pendingRetry.audioBlob && pendingRetry.durationSeconds) {
      await runVoiceQuery(pendingRetry.audioBlob, pendingRetry.durationSeconds);
    }
  };

  const contextLine = useMemo(() => {
    if (!projectId) return AI_MESSAGES.noProjectContext;
    return projectLabel ? `${AI_MESSAGES.contextPrefix} ${projectLabel}` : 'Cargando contexto…';
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
              <StatusBadge state={assistantState} />
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
            {messages.length === 0 ? (
              <p className="text-xs leading-relaxed text-[#9CA3AF]">
                Consulte al asistente por voz o por texto. El historial se conserva solo durante
                esta sesión del navegador.
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
                  dangerouslySetInnerHTML={{ __html: escapeHtml(message.text) }}
                />
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
              <button
                type="button"
                className="mt-2 rounded-lg border border-red-400/40 px-2 py-1 text-[11px] font-medium hover:bg-red-500/10"
                onClick={() => void onRetry()}
              >
                {AI_MESSAGES.retry}
              </button>
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
