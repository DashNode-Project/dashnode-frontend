import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch, ok } from '@/test/fetchMock';
import {
  createDocumentationEntry,
  deleteDocumentationEntry,
  getDocumentationEntry,
  listDocumentationEntries,
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
});
