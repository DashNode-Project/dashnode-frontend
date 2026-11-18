export type AssistantState = 'INACTIVE' | 'RECORDING' | 'PROCESSING' | 'RESPONDED' | 'ERROR';

/** When state is PROCESSING, clarifies text vs voice pipeline step. */
export type ProcessingMode = 'text' | 'voice-transcribe' | 'voice-reply';

export type ChatInputSource = 'text' | 'voice';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** Present on user messages to distinguish typed vs transcribed input. */
  inputSource?: ChatInputSource;
  /** Backend interaction id for rating (EP-13). */
  interactionId?: string | null;
  /** Structured metrics payload when intent is METRICS_* (HU_DN_08_118). */
  metricsData?: MetricsAssistantPayload | null;
}

export interface MetricsAssistantPeriod {
  from: string;
  to: string;
  timezone?: string;
  defaulted?: boolean;
}

export interface MetricsAssistantScope {
  type: string;
  project_id?: string | null;
  name?: string | null;
}

export interface MetricsAssistantPayload {
  intent?: string | null;
  period?: MetricsAssistantPeriod | null;
  scope?: MetricsAssistantScope | null;
  data?: Record<string, number> | null;
  panel_link?: string | null;
  computed_at?: string | null;
  clarification?: { question: string; options: string[] } | null;
}

export interface PendingRetry {
  kind: 'voice' | 'text';
  text?: string;
  audioBlob?: Blob;
  durationSeconds?: number;
  /** After transcription succeeded but Gemini failed. */
  voiceTranscribed?: boolean;
}

export interface VoiceProcessResult {
  recognized_text: string | null;
  assistant_response: string | null;
  status: 'RESPONDED' | 'ERROR';
  error?: string | null;
  interaction_id?: string | null;
  intent?: string | null;
  period?: MetricsAssistantPeriod | null;
  scope?: MetricsAssistantScope | null;
  data?: Record<string, number> | null;
  panel_link?: string | null;
  computed_at?: string | null;
  clarification?: { question: string; options: string[] } | null;
}

export interface VoiceTranscribeResult {
  recognized_text: string;
}

export interface ChatHistoryPayload {
  messages: Array<{
    id: string;
    role: ChatRole;
    text: string;
    input_source: ChatInputSource | null;
    created_at: string;
  }>;
}
