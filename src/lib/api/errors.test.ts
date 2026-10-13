import { describe, expect, it } from 'vitest';
import { ApiError, isTechnicalFailure, NetworkError, parseErrorBody } from './errors';

describe('api errors', () => {
  it('parses error bodies', () => {
    expect(parseErrorBody({ error: { code: 'X', message: 'm', fields: { a: 'b' } } })).toEqual({
      code: 'X',
      message: 'm',
      fields: { a: 'b' },
    });
    expect(parseErrorBody(null)).toBeNull();
  });

  it('classifies technical failures', () => {
    expect(isTechnicalFailure(new NetworkError())).toBe(true);
    expect(isTechnicalFailure(new ApiError(500, { code: 'X', message: 'm', fields: {} }))).toBe(
      true,
    );
    expect(
      isTechnicalFailure(new ApiError(400, { code: 'VALIDATION', message: 'm', fields: {} })),
    ).toBe(false);
  });
});
