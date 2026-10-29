export type AssistantState = 'INACTIVE' | 'RECORDING' | 'PROCESSING' | 'RESPONDED' | 'ERROR';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
}

export interface PendingRetry {
  kind: 'voice' | 'text';
  text?: string;
  audioBlob?: Blob;
  durationSeconds?: number;
}

export interface VoiceProcessResult {
  recognized_text: string | null;
  assistant_response: string | null;
  status: 'RESPONDED' | 'ERROR';
  error?: string | null;
}
