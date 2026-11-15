import { describe, expect, it } from 'vitest';
import { mapVoiceCaptureError } from './useVoiceCapture';
import { AI_MESSAGES } from './messages';

describe('mapVoiceCaptureError', () => {
  it('maps capture error codes to literal messages', () => {
    expect(mapVoiceCaptureError('MIC_DENIED')).toBe(AI_MESSAGES.micDenied);
    expect(mapVoiceCaptureError('NO_SUPPORT')).toBe(AI_MESSAGES.noAudioSupport);
    expect(mapVoiceCaptureError('EMPTY')).toBe(AI_MESSAGES.emptyAudio);
    expect(mapVoiceCaptureError('TOO_LONG')).toBe(AI_MESSAGES.audioTooLong);
    expect(mapVoiceCaptureError('MIC_UNAVAILABLE')).toBe(AI_MESSAGES.micUnavailable);
  });
});
