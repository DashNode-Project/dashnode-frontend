import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch, ok } from '@/test/fetchMock';
import { attachEvidence, createIssue, getIssueDetail, listIssues } from './api';
import type { Issue, IssueDetail } from './types';

describe('issues api client', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  const sampleIssue: Issue = {
    id: 'issue-1',
    project_id: 'p-1',
    title: 'Fallo al autenticar',
    description: 'Descripción del fix',
    severity: 'critical',
    type: 'bug',
    status: 'open',
    reporter_id: 'user-1',
    reporter_name: 'Dev One',
    assignee_id: null,
    assignee_name: null,
    resolution_note: null,
    resolved_at: null,
    created_at: '2026-11-07T12:00:00Z',
    updated_at: '2026-11-07T12:00:00Z',
    evidences_count: 1,
  };

  const sampleDetail: IssueDetail = {
    ...sampleIssue,
    evidences: [
      {
        id: 'ev-1',
        fix_id: 'issue-1',
        title: 'Captura de pantalla',
        file_name: 'shot.png',
        file_type: 'image',
        mime_type: 'image/png',
        file_size: 1024,
        download_url: '/api/v1/projects/p-1/issues/issue-1/evidences/ev-1/content?signature=xyz&expires=999999999',
        thumbnail_url: '/api/v1/projects/p-1/issues/issue-1/evidences/ev-1/content?signature=xyz&expires=999999999',
        duration_seconds: null,
        uploaded_by: 'user-1',
        uploaded_by_name: 'Dev One',
        created_at: '2026-11-07T12:00:00Z',
      },
    ],
    ai_analyses: [],
  };

  it('lists issues with filters and pagination parameters', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('GET');
      expect(call.url).toContain('/projects/p-1/issues');
      expect(call.url).toContain('status=open');
      expect(call.url).toContain('severity=critical');
      expect(call.url).toContain('type=bug');
      expect(call.url).toContain('limit=25');
      return ok({ items: [sampleIssue], next_cursor: 'cur-2', total: 1 });
    });

    const res = await listIssues('p-1', {
      status: 'open',
      severity: 'critical',
      type: 'bug',
      limit: 25,
    });

    expect(res.items).toHaveLength(1);
    expect(res.items[0]?.title).toBe('Fallo al autenticar');
    expect(res.next_cursor).toBe('cur-2');
    expect(res.total).toBe(1);
  });

  it('creates an issue with payload and optional idempotency key', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('POST');
      expect(call.url).toContain('/projects/p-1/issues');
      expect(call.headers['Idempotency-Key']).toBe('idemp-key-123');
      const body = JSON.parse(call.body as string);
      expect(body.title).toBe('Nuevo fix');
      expect(body.severity).toBe('high');
      return ok({ message: 'Issue creado correctamente.', issue: sampleIssue });
    });

    const res = await createIssue(
      'p-1',
      {
        title: 'Nuevo fix',
        description: 'Detalle',
        severity: 'high',
        type: 'bug',
      },
      'idemp-key-123',
    );

    expect(res.message).toBe('Issue creado correctamente.');
    expect(res.issue.id).toBe('issue-1');
  });

  it('gets issue detail including evidences and signed URLs', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('GET');
      expect(call.url).toContain('/projects/p-1/issues/issue-1');
      return ok(sampleDetail);
    });

    const res = await getIssueDetail('p-1', 'issue-1');
    expect(res.title).toBe('Fallo al autenticar');
    expect(res.evidences).toHaveLength(1);
    expect(res.evidences[0]?.download_url).toContain('signature=xyz');
  });

  it('attaches evidence file via multipart form-data', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('POST');
      expect(call.url).toContain('/projects/p-1/issues/issue-1/evidences');
      expect(call.body).toBeInstanceOf(FormData);
      return ok({
        message: 'Evidencia adjuntada correctamente.',
        evidence: sampleDetail.evidences[0],
      });
    });

    const dummyFile = new File(['image content'], 'evidence.png', { type: 'image/png' });
    const res = await attachEvidence('p-1', 'issue-1', dummyFile, 'Captura');
    expect(res.message).toBe('Evidencia adjuntada correctamente.');
    expect(res.evidence.file_name).toBe('shot.png');
  });
});
