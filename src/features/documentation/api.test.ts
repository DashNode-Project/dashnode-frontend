import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch, ok } from '@/test/fetchMock';
import {
  approveDocumentationEntry,
  createDocumentationEntry,
  deleteDocumentationEntry,
  getDocumentationEntry,
  listDocumentationEntries,
  listPendingApprovals,
  rejectDocumentationEntry,
  resubmitDocumentationEntry,
  toggleDocumentationPin,
  toggleDocumentationVisibility,
  updateDocumentationEntry,
} from './api';
import type {
  CreateDocumentationPayload,
  DocumentationEntry,
  UpdateDocumentationPayload,
} from './types';

describe('documentation api', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  const sampleEntry: DocumentationEntry = {
    id: 'doc-1',
    project_id: 'p-1',
    author_id: 'dev-1',
    author_name: 'Dev One',
    title: 'Guía técnica',
    category: 'Técnica',
    objective: 'Documentar arquitectura',
    tags: 'api, fast',
    content: 'Detalles técnicos',
    external_url: 'https://docs.dashnode.io',
    approval_status: 'PENDING',
    is_pinned: false,
    is_visible_to_devs: true,
    rejection_reason: null,
    created_at: '2026-10-28T00:00:00Z',
    updated_at: '2026-10-28T00:00:00Z',
    can_edit: true,
    can_delete: true,
  };

  it('lists documentation entries', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('GET');
      expect(call.url).toContain('/projects/p-1/documentation');
      return ok({ entries: [sampleEntry], message: null });
    });

    const res = await listDocumentationEntries('p-1');
    expect(res.entries).toHaveLength(1);
    expect(res.entries[0]?.title).toBe('Guía técnica');
  });

  it('creates documentation entry', async () => {
    const payload: CreateDocumentationPayload = {
      title: 'Nueva guía',
      category: 'Funcional',
      content: 'Contenido nuevo',
    };

    mockFetch((call) => {
      expect(call.method).toBe('POST');
      expect(call.url).toContain('/projects/p-1/documentation');
      return ok({
        message: 'Entrada registrada correctamente. Quedó pendiente de aprobación.',
        entry: { ...sampleEntry, ...payload },
      });
    });

    const res = await createDocumentationEntry('p-1', payload);
    expect(res.message).toBe('Entrada registrada correctamente. Quedó pendiente de aprobación.');
    expect(res.entry?.title).toBe('Nueva guía');
  });

  it('updates documentation entry', async () => {
    const payload: UpdateDocumentationPayload = {
      title: 'Guía modificada',
      category: 'Técnica',
      content: 'Contenido editado',
    };

    mockFetch((call) => {
      expect(call.method).toBe('PUT');
      expect(call.url).toContain('/projects/p-1/documentation/doc-1');
      return ok({
        message: 'Entrada actualizada correctamente.',
        entry: { ...sampleEntry, ...payload },
      });
    });

    const res = await updateDocumentationEntry('p-1', 'doc-1', payload);
    expect(res.message).toBe('Entrada actualizada correctamente.');
    expect(res.entry?.title).toBe('Guía modificada');
  });

  it('deletes documentation entry', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('DELETE');
      expect(call.url).toContain('/projects/p-1/documentation/doc-1');
      return ok({
        message: 'Entrada eliminada correctamente.',
        entry: null,
      });
    });

    const res = await deleteDocumentationEntry('p-1', 'doc-1');
    expect(res.message).toBe('Entrada eliminada correctamente.');
    expect(res.entry).toBeNull();
  });

  it('gets single documentation entry by id', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('GET');
      expect(call.url).toContain('/projects/p-1/documentation/doc-1');
      return ok(sampleEntry);
    });

    const res = await getDocumentationEntry('p-1', 'doc-1');
    expect(res.id).toBe('doc-1');
    expect(res.title).toBe('Guía técnica');
  });

  it('HU_DN_06_82: toggles documentation visibility for developers', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('PATCH');
      expect(call.url).toContain('/projects/p-1/documentation/doc-1/visibility');
      return ok({
        message: 'Visibilidad actualizada correctamente.',
        entry: { ...sampleEntry, is_visible_to_devs: false },
      });
    });

    const res = await toggleDocumentationVisibility('p-1', 'doc-1', false);
    expect(res.message).toBe('Visibilidad actualizada correctamente.');
    expect(res.entry?.is_visible_to_devs).toBe(false);
  });

  it('HU_DN_06_83: lists pending approvals queue', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('GET');
      expect(call.url).toContain('/projects/p-1/documentation/pending-approvals');
      return ok({ entries: [sampleEntry], message: null });
    });

    const res = await listPendingApprovals('p-1');
    expect(res.entries).toHaveLength(1);
    expect(res.entries[0]?.id).toBe('doc-1');
  });

  it('HU_DN_06_84: approves documentation entry', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('POST');
      expect(call.url).toContain('/projects/p-1/documentation/doc-1/approve');
      return ok({
        message: 'Entrada aprobada correctamente.',
        entry: { ...sampleEntry, approval_status: 'APPROVED', is_visible_to_devs: true },
      });
    });

    const res = await approveDocumentationEntry('p-1', 'doc-1');
    expect(res.message).toBe('Entrada aprobada correctamente.');
    expect(res.entry?.approval_status).toBe('APPROVED');
  });

  it('HU_DN_06_85: rejects documentation entry with feedback', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('POST');
      expect(call.url).toContain('/projects/p-1/documentation/doc-1/reject');
      return ok({
        message: 'Entrada rechazada correctamente.',
        entry: {
          ...sampleEntry,
          approval_status: 'REJECTED',
          rejection_reason: 'Faltan detalles de despliegue',
        },
      });
    });

    const res = await rejectDocumentationEntry('p-1', 'doc-1', 'Faltan detalles de despliegue');
    expect(res.message).toBe('Entrada rechazada correctamente.');
    expect(res.entry?.approval_status).toBe('REJECTED');
    expect(res.entry?.rejection_reason).toBe('Faltan detalles de despliegue');
  });

  it('HU_DN_06_86: resubmits rejected documentation entry', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('POST');
      expect(call.url).toContain('/projects/p-1/documentation/doc-1/resubmit');
      return ok({
        message: 'Entrada reenviada a aprobación.',
        entry: {
          ...sampleEntry,
          title: 'Guía técnica v2',
          approval_status: 'PENDING',
        },
      });
    });

    const res = await resubmitDocumentationEntry('p-1', 'doc-1', { title: 'Guía técnica v2' });
    expect(res.message).toBe('Entrada reenviada a aprobación.');
    expect(res.entry?.title).toBe('Guía técnica v2');
    expect(res.entry?.approval_status).toBe('PENDING');
  });

  it('HU_DN_06_87 & HU_DN_06_89: toggles pin state of documentation entry', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('PATCH');
      expect(call.url).toContain('/projects/p-1/documentation/doc-1/pin');
      return ok({
        message: 'Entrada anclada correctamente.',
        entry: {
          ...sampleEntry,
          is_pinned: true,
        },
      });
    });

    const res = await toggleDocumentationPin('p-1', 'doc-1', true);
    expect(res.message).toBe('Entrada anclada correctamente.');
    expect(res.entry?.is_pinned).toBe(true);
  });
});
