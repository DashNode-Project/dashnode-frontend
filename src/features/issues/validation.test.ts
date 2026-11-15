import { describe, expect, it } from 'vitest';
import { ISSUE_MESSAGES } from './messages';
import { validateCreateIssue, validateEvidenceFile } from './validation';

describe('issues validation', () => {
  it('validates required title', () => {
    const res = validateCreateIssue({
      title: '',
      description: 'Desc',
      severity: 'high',
      type: 'bug',
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.title).toBe(ISSUE_MESSAGES.TITLE_REQUIRED);
  });

  it('validates title maximum length of 100 characters', () => {
    const res = validateCreateIssue({
      title: 'A'.repeat(101),
      description: 'Desc',
      severity: 'high',
      type: 'bug',
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.title).toBe(ISSUE_MESSAGES.TITLE_TOO_LONG);
  });

  it('validates description maximum length of 5000 characters', () => {
    const res = validateCreateIssue({
      title: 'Valid title',
      description: 'B'.repeat(5001),
      severity: 'high',
      type: 'bug',
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.description).toBe(ISSUE_MESSAGES.DESCRIPTION_TOO_LONG);
  });

  it('validates required severity', () => {
    const res = validateCreateIssue({
      title: 'Valid title',
      severity: '',
      type: 'bug',
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.severity).toBe(ISSUE_MESSAGES.SEVERITY_REQUIRED);
  });

  it('validates required type', () => {
    const res = validateCreateIssue({
      title: 'Valid title',
      severity: 'medium',
      type: '',
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.type).toBe(ISSUE_MESSAGES.TYPE_REQUIRED);
  });

  it('passes on valid issue form values', () => {
    const res = validateCreateIssue({
      title: 'Fix: Problema con la barra de navegación',
      description: 'Detalles del problema observado en producción.',
      severity: 'critical',
      type: 'bug',
    });
    expect(res.isValid).toBe(true);
    expect(res.errors).toEqual({});
  });

  it('validates evidence file presence and formats', () => {
    expect(validateEvidenceFile(null)).toBe('Debe seleccionar un archivo.');

    // Unsupported format
    const badFile = new File(['code'], 'script.exe', { type: 'application/x-msdownload' });
    expect(validateEvidenceFile(badFile)).toBe(ISSUE_MESSAGES.UNSUPPORTED_FORMAT);

    // Image size > 5MB
    const bigImg = new File([new ArrayBuffer(5 * 1024 * 1024 + 10)], 'photo.png', {
      type: 'image/png',
    });
    expect(validateEvidenceFile(bigImg)).toBe(ISSUE_MESSAGES.FILE_TOO_LARGE);

    // Video size > 25MB
    const bigVid = new File([new ArrayBuffer(25 * 1024 * 1024 + 10)], 'clip.mp4', {
      type: 'video/mp4',
    });
    expect(validateEvidenceFile(bigVid)).toBe(ISSUE_MESSAGES.FILE_TOO_LARGE);

    // Log size > 1MB
    const bigLog = new File([new ArrayBuffer(1 * 1024 * 1024 + 10)], 'app.log', {
      type: 'text/plain',
    });
    expect(validateEvidenceFile(bigLog)).toBe(ISSUE_MESSAGES.FILE_TOO_LARGE);

    // Valid file returns null
    const validImg = new File([new ArrayBuffer(1024)], 'screenshot.jpg', {
      type: 'image/jpeg',
    });
    expect(validateEvidenceFile(validImg)).toBeNull();
  });
});
