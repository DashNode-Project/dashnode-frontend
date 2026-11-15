import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch, ok } from '@/test/fetchMock';
import {
  assignIssue,
  attachEvidence,
  closeIssue,
  createIssue,
  deleteAiAnalysis,
  getAiAnalysisStatus,
  getIssueDetail,
  listAiAnalyses,
  listIssues,
  rejectAiAnalysis,
  reportTaskFix,
  requestAiAnalysis,
  resolveIssue,
  validateAiAnalysis,
} from './api';
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
    version: 1,
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
        download_url:
          '/api/v1/projects/p-1/issues/issue-1/evidences/ev-1/content?signature=xyz&expires=999999999',
        thumbnail_url:
          '/api/v1/projects/p-1/issues/issue-1/evidences/ev-1/content?signature=xyz&expires=999999999',
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
      const body = call.body as { title: string; severity: string };
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
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      expect(init?.method).toBe('POST');
      expect(url).toContain('/projects/p-1/issues/issue-1/evidences');
      expect(init?.body).toBeInstanceOf(FormData);
      return new Response(
        JSON.stringify({
          message: 'Evidencia adjuntada correctamente.',
          evidence: sampleDetail.evidences[0],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });
    vi.stubGlobal('fetch', fetchSpy);

    const dummyFile = new File(['image content'], 'evidence.png', { type: 'image/png' });
    const res = await attachEvidence('p-1', 'issue-1', dummyFile, 'Captura');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(res.message).toBe('Evidencia adjuntada correctamente.');
    expect(res.evidence.file_name).toBe('shot.png');
  });

  it('assigns, resolves, closes issue and reports task fix', async () => {
    mockFetch((call) => {
      if (call.url.endsWith('/assignee')) {
        expect(call.method).toBe('PATCH');
        expect(call.body).toEqual({ assignee_id: 'dev-1', version: 1 });
        return ok({
          message: 'Issue asignado correctamente.',
          issue: { ...sampleIssue, version: 2 },
        });
      }
      if (call.url.endsWith('/resolve')) {
        expect(call.method).toBe('POST');
        expect(call.body).toEqual({
          resolution_note: 'Corregido',
          task_status: 'TESTING',
          version: 2,
        });
        return ok({
          message: 'Issue resuelto correctamente.',
          issue: { ...sampleIssue, status: 'resolved', version: 3 },
          task_unlinked: true,
          task_status: 'TESTING',
        });
      }
      if (call.url.endsWith('/close')) {
        expect(call.method).toBe('POST');
        return ok({
          message: 'Issue cerrado correctamente.',
          issue: { ...sampleIssue, status: 'closed', version: 4 },
        });
      }
      expect(call.url).toContain('/projects/p-1/tasks/task-9/report-fix');
      expect(call.method).toBe('POST');
      return ok({
        message: 'Fix reportado. La tarea pasó a estado Corrección.',
        issue: { ...sampleIssue, task_id: 'task-9' },
        task_status: 'CORRECTION',
      });
    });

    const a = await assignIssue('p-1', 'issue-1', { assignee_id: 'dev-1', version: 1 });
    expect(a.issue.version).toBe(2);

    const r = await resolveIssue('p-1', 'issue-1', {
      resolution_note: 'Corregido',
      task_status: 'TESTING',
      version: 2,
    });
    expect(r.task_unlinked).toBe(true);

    const c = await closeIssue('p-1', 'issue-1', { version: 3 });
    expect(c.issue.status).toBe('closed');

    const rf = await reportTaskFix('p-1', 'task-9', {
      title: 'Fix: Task 9',
      severity: 'high',
      type: 'bug',
    });
    expect(rf.task_status).toBe('CORRECTION');
  });

  it('EP-12: requests, polls, lists, and deletes AI visual analysis', async () => {
    mockFetch((call) => {
      if (call.method === 'POST' && call.url.endsWith('/ai-analyses')) {
        expect(call.body).toEqual({
          evidence_id: 'ev-1',
          user_confirmed_no_sensitive_data: true,
          force_new: false,
        });
        return ok({
          analysis_id: 'ana-1',
          status: 'PENDING',
          reused: false,
          message: 'Análisis solicitado. Procesando…',
        });
      }
      if (call.method === 'GET' && call.url.endsWith('/ai-analyses/ana-1')) {
        return ok({
          analysis_id: 'ana-1',
          status: 'DONE',
          validation_status: 'PENDING_VALIDATION',
          requires_human_validation: true,
          retryable: false,
          created_at: '2026-11-12T10:00:00Z',
          result: {
            problem_description: 'Error en render',
            probable_cause: 'Causa probable',
            suggested_solution: 'Solución',
            context_sufficient: true,
          },
        });
      }
      if (call.method === 'GET' && call.url.includes('/ai-analyses')) {
        return ok({
          items: [
            {
              id: 'ana-1',
              requested_by: { id: 'u-1', name: 'User One' },
              created_at: '2026-11-12T10:00:00Z',
              validation_status: 'PENDING_VALIDATION',
              summary: 'Resumen de prueba',
              requires_human_validation: true,
            },
          ],
        });
      }
      if (call.method === 'DELETE' && call.url.endsWith('/ai-analyses/ana-1')) {
        return ok({ message: 'Respuesta de IA eliminada correctamente.' });
      }
      return ok({});
    });

    const req = await requestAiAnalysis('p-1', 'issue-1', {
      evidence_id: 'ev-1',
      user_confirmed_no_sensitive_data: true,
    });
    expect(req.analysis_id).toBe('ana-1');

    const status = await getAiAnalysisStatus('p-1', 'issue-1', 'ana-1');
    expect(status.status).toBe('DONE');
    expect(status.result?.problem_description).toBe('Error en render');

    const list = await listAiAnalyses('p-1', 'issue-1');
    expect(list.items).toHaveLength(1);
    expect(list.items[0]?.summary).toBe('Resumen de prueba');

    const del = await deleteAiAnalysis('p-1', 'issue-1', 'ana-1');
    expect(del.message).toBe('Respuesta de IA eliminada correctamente.');
  });

  it('validates and rejects AI analysis (HU_DN_07_111, HU_DN_07_112)', async () => {
    mockFetch((call) => {
      if (call.method === 'POST' && call.url.endsWith('/ai-analyses/ana-1/validate')) {
        return ok({
          message: 'Respuesta de IA validada correctamente.',
          validation_status: 'VALIDATED',
        });
      }
      if (call.method === 'POST' && call.url.endsWith('/ai-analyses/ana-1/reject')) {
        return ok({
          message: 'Respuesta de IA rechazada.',
          validation_status: 'REJECTED',
        });
      }
      return ok({});
    });

    const val = await validateAiAnalysis('p-1', 'issue-1', 'ana-1');
    expect(val.message).toBe('Respuesta de IA validada correctamente.');
    expect(val.validation_status).toBe('VALIDATED');

    const rej = await rejectAiAnalysis('p-1', 'issue-1', 'ana-1', 'Motivo de descarte');
    expect(rej.message).toBe('Respuesta de IA rechazada.');
    expect(rej.validation_status).toBe('REJECTED');
  });
});
