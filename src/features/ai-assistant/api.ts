import { apiFormRequest, apiRequest } from '@/lib/api/client';
import type { VoiceProcessResult } from './types';

export async function postVoiceProcess(
  audio: Blob,
  projectId: string | null,
  durationSeconds: number,
): Promise<VoiceProcessResult> {
  const form = new FormData();
  form.append('audio', audio, audio.type.includes('webm') ? 'voice.webm' : 'voice.wav');
  if (projectId) form.append('project_id', projectId);
  form.append('duration_seconds', String(durationSeconds));
  return apiFormRequest<VoiceProcessResult>('/api/v1/ai/voice-process', {
    method: 'POST',
    formData: form,
  });
}

export async function postTextGenerate(
  text: string,
  projectId: string | null,
): Promise<VoiceProcessResult> {
  return apiRequest<VoiceProcessResult>('/api/v1/ai/text-generate', {
    method: 'POST',
    body: { text, project_id: projectId },
  });
}
