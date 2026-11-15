import { env } from '@/config/env';
import { apiFormRequest, apiRequest } from '@/lib/api/client';
import type { ChatHistoryPayload, VoiceProcessResult, VoiceTranscribeResult } from './types';

const AI_TIMEOUT = env.aiRequestTimeoutMs;

function appendVoiceForm(
  form: FormData,
  audio: Blob,
  projectId: string | null,
  durationSeconds: number,
) {
  form.append('audio', audio, audio.type.includes('webm') ? 'voice.webm' : 'voice.wav');
  if (projectId) form.append('project_id', projectId);
  form.append('duration_seconds', String(durationSeconds));
}

export async function postVoiceTranscribe(
  audio: Blob,
  projectId: string | null,
  durationSeconds: number,
): Promise<VoiceTranscribeResult> {
  const form = new FormData();
  appendVoiceForm(form, audio, projectId, durationSeconds);
  return apiFormRequest<VoiceTranscribeResult>('/ai/voice-transcribe', {
    method: 'POST',
    formData: form,
    timeoutMs: AI_TIMEOUT,
  });
}

export async function fetchChatHistory(): Promise<ChatHistoryPayload> {
  return apiRequest<ChatHistoryPayload>('/ai/chat/messages', { timeoutMs: AI_TIMEOUT });
}

export async function postVoiceProcess(
  audio: Blob,
  projectId: string | null,
  durationSeconds: number,
): Promise<VoiceProcessResult> {
  const form = new FormData();
  appendVoiceForm(form, audio, projectId, durationSeconds);
  return apiFormRequest<VoiceProcessResult>('/ai/voice-process', {
    method: 'POST',
    formData: form,
    timeoutMs: AI_TIMEOUT,
  });
}

export async function postTextGenerate(
  text: string,
  projectId: string | null,
  options?: { persistUserMessage?: boolean },
): Promise<VoiceProcessResult> {
  return apiRequest<VoiceProcessResult>('/ai/text-generate', {
    method: 'POST',
    body: {
      text,
      project_id: projectId,
      persist_user_message: options?.persistUserMessage ?? true,
    },
    timeoutMs: AI_TIMEOUT,
  });
}
