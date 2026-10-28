import { useState } from 'react';
import { AlertCircle, ExternalLink, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProjectModal } from '@/features/projects/ProjectModal';
import { DOCUMENTATION_MESSAGES } from '../messages';
import type {
  CreateDocumentationPayload,
  DocumentationCategory,
  DocumentationEntry,
} from '../types';

const CATEGORIES: DocumentationCategory[] = [
  'Técnica',
  'Funcional',
  'Reunión',
  'General',
  'Prompt',
];

const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

interface DocumentationModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'resubmit';
  initialEntry?: DocumentationEntry | null;
  onClose: () => void;
  onSave: (payload: CreateDocumentationPayload) => Promise<void>;
  loading: boolean;
}

export function DocumentationModal({
  isOpen,
  mode,
  initialEntry,
  onClose,
  onSave,
  loading,
}: DocumentationModalProps) {
  const [title, setTitle] = useState(() =>
    mode !== 'create' && initialEntry ? initialEntry.title || '' : '',
  );
  const [category, setCategory] = useState<DocumentationCategory>(() =>
    mode !== 'create' && initialEntry ? initialEntry.category || 'Técnica' : 'Técnica',
  );
  const [objective, setObjective] = useState(() =>
    mode !== 'create' && initialEntry ? initialEntry.objective || '' : '',
  );
  const [tags, setTags] = useState(() =>
    mode !== 'create' && initialEntry ? initialEntry.tags || '' : '',
  );
  const [content, setContent] = useState(() =>
    mode !== 'create' && initialEntry ? initialEntry.content || '' : '',
  );
  const [externalUrl, setExternalUrl] = useState(() =>
    mode !== 'create' && initialEntry ? initialEntry.external_url || '' : '',
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(DOCUMENTATION_MESSAGES.TITLE_REQUIRED);
      return;
    }
    if (trimmedTitle.length > 100) {
      setError(DOCUMENTATION_MESSAGES.TITLE_TOO_LONG);
      return;
    }

    if (!category) {
      setError(DOCUMENTATION_MESSAGES.CATEGORY_REQUIRED);
      return;
    }

    const trimmedContent = content.trim();
    const trimmedUrl = externalUrl.trim();

    if (!trimmedContent && !trimmedUrl) {
      setError(DOCUMENTATION_MESSAGES.CONTENT_OR_URL_REQUIRED);
      return;
    }

    if (trimmedUrl) {
      if (!URL_REGEX.test(trimmedUrl)) {
        setError(DOCUMENTATION_MESSAGES.INVALID_URL);
        return;
      }
    }

    try {
      await onSave({
        title: trimmedTitle,
        category,
        objective: objective.trim() || undefined,
        tags: tags.trim() || undefined,
        content: trimmedContent || undefined,
        external_url: trimmedUrl || undefined,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(DOCUMENTATION_MESSAGES.GENERIC_ERROR);
      }
    }
  };

  const isApprovedEdit = mode === 'edit' && initialEntry?.approval_status === 'APPROVED';
  const hasRejectionFeedback =
    (mode === 'resubmit' || mode === 'edit') &&
    initialEntry?.approval_status === 'REJECTED' &&
    Boolean(initialEntry?.rejection_reason);

  return (
    <ProjectModal
      title={
        mode === 'create'
          ? 'Nueva entrada de documentación'
          : mode === 'resubmit'
            ? 'Reenviar entrada a aprobación'
            : 'Editar entrada de documentación'
      }
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="documentation-form"
            loading={loading}
            disabled={loading}
            data-testid="submit-doc-modal-btn"
          >
            {mode === 'create'
              ? 'Registrar entrada'
              : mode === 'resubmit'
                ? 'Reenviar a aprobación'
                : 'Guardar cambios'}
          </Button>
        </>
      }
    >
      <form
        id="documentation-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="flex flex-col gap-4"
      >
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        ) : null}

        {hasRejectionFeedback ? (
          <div
            role="alert"
            className="flex flex-col gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"
          >
            <div className="flex items-center gap-1.5 font-semibold text-amber-300">
              <Info size={15} />
              <span>Motivo del rechazo anterior:</span>
            </div>
            <p className="mt-0.5 whitespace-pre-wrap text-amber-100/90">
              {initialEntry?.rejection_reason}
            </p>
          </div>
        ) : null}

        {isApprovedEdit ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
            <Info size={16} className="mt-0.5 shrink-0 text-amber-400" />
            <span>{DOCUMENTATION_MESSAGES.STATUS_RESET_NOTICE}</span>
          </div>
        ) : null}

        <label className="flex flex-col gap-1 text-xs text-[#9CA3AF]">
          <span className="font-medium text-[#F9FAFB]">
            Título <span className="text-red-400">*</span>
          </span>
          <input
            type="text"
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Guía de autenticación con JWT"
            required
            aria-label="Título"
            className="h-9 rounded-lg border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
          />
          <span className="self-end text-[10px] text-[#6B7280]">{title.length}/100</span>
        </label>

        <label className="flex flex-col gap-1 text-xs text-[#9CA3AF]">
          <span className="font-medium text-[#F9FAFB]">
            Categoría <span className="text-red-400">*</span>
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentationCategory)}
            required
            aria-label="Categoría"
            className="h-9 rounded-lg border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F9FAFB] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-[#9CA3AF]">
          <span className="font-medium text-[#F9FAFB]">Objetivo (opcional)</span>
          <input
            type="text"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="Ej. Explicar el flujo de generación y refresco de tokens"
            aria-label="Objetivo"
            className="h-9 rounded-lg border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-[#9CA3AF]">
          <span className="font-medium text-[#F9FAFB]">
            Etiquetas (opcional, separadas por coma)
          </span>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="fastapi, jwt, seguridad, tokens"
            aria-label="Etiquetas"
            className="h-9 rounded-lg border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-[#9CA3AF]">
          <span className="font-medium text-[#F9FAFB]">Contenido en texto plano</span>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escriba aquí la documentación, notas técnicas o instrucciones..."
            aria-label="Contenido"
            className="rounded-lg border border-white/10 bg-[#0A0B0E] p-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
          />
        </label>

        <div className="flex flex-col gap-1 text-xs text-[#9CA3AF]">
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1 font-medium text-[#F9FAFB]">
              <ExternalLink size={13} className="text-blue-400" />
              URL de recurso externo (opcional)
            </span>
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://drive.google.com/... o https://notion.so/..."
              aria-label="Enlace externo"
              className="h-9 rounded-lg border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
            />
          </label>
          {externalUrl.trim() ? (
            <p className="mt-1 text-[11px] text-[#9CA3AF]/80 italic">
              {DOCUMENTATION_MESSAGES.EXTERNAL_RESOURCE_NOTICE}
            </p>
          ) : null}
        </div>
      </form>
    </ProjectModal>
  );
}
