import { describe, expect, it, vi } from 'vitest';
import { postTextGenerate, postVoiceProcess } from './api';

vi.mock('@/lib/api/client', () => ({
  apiFormRequest: vi.fn(async () => ({
    recognized_text: 'hola',
    assistant_response: 'respuesta',
    status: 'RESPONDED',
  })),
  apiRequest: vi.fn(async () => ({
    recognized_text: 'texto',
    assistant_response: 'ok',
    status: 'RESPONDED',
  })),
}));

describe('ai assistant api', () => {
  it('postVoiceProcess sends multipart form', async () => {
    const blob = new Blob(['x'], { type: 'audio/webm' });
    const result = await postVoiceProcess(blob, 'p1', 3);
    expect(result.status).toBe('RESPONDED');
  });

  it('postTextGenerate sends json body', async () => {
    const result = await postTextGenerate('consulta', null);
    expect(result.assistant_response).toBe('ok');
  });
});
