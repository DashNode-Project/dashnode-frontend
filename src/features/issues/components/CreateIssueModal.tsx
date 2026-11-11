import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ProjectModal } from '@/features/projects/ProjectModal';
import { validateCreateIssue } from '../validation';
import type { CreateIssuePayload } from '../types';

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateIssuePayload) => Promise<void>;
  loading: boolean;
}

export function CreateIssueModal({ isOpen, onClose, onSubmit, loading }: CreateIssueModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [type, setType] = useState('bug');
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    severity?: string;
    type?: string;
  }>({});

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCreateIssue({
      title,
      description,
      severity,
      type,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      severity,
      type,
    });
  };

  return (
    <ProjectModal
      title="Nuevo fix"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creando…' : 'Crear fix'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Título */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="issue-title" className="text-sm font-medium text-[#F9FAFB]">
            Título *
          </label>
          <input
            id="issue-title"
            type="text"
            value={title}
            maxLength={100}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            placeholder="Fix: Descripción breve del problema"
            className="h-10 w-full rounded-md border border-white/10 bg-[#1E1F2B] px-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-blue-500 focus:outline-none"
            aria-invalid={errors.title ? 'true' : 'false'}
            aria-describedby={errors.title ? 'issue-title-error' : undefined}
          />
          {errors.title && (
            <p id="issue-title-error" role="alert" className="text-xs text-red-400">
              {errors.title}
            </p>
          )}
        </div>

        {/* Descripción */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="issue-description" className="text-sm font-medium text-[#F9FAFB]">
            Descripción
          </label>
          <textarea
            id="issue-description"
            rows={4}
            value={description}
            maxLength={5000}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
            }}
            placeholder="Describe el problema, su impacto y contexto..."
            className="w-full resize-none rounded-md border border-white/10 bg-[#1E1F2B] p-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-blue-500 focus:outline-none"
            aria-invalid={errors.description ? 'true' : 'false'}
            aria-describedby={errors.description ? 'issue-description-error' : undefined}
          />
          {errors.description && (
            <p id="issue-description-error" role="alert" className="text-xs text-red-400">
              {errors.description}
            </p>
          )}
        </div>

        {/* Severidad y Tipo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="issue-severity" className="text-sm font-medium text-[#F9FAFB]">
              Severidad *
            </label>
            <select
              id="issue-severity"
              value={severity}
              onChange={(e) => {
                setSeverity(e.target.value);
                if (errors.severity) setErrors((prev) => ({ ...prev, severity: undefined }));
              }}
              className="h-10 rounded-md border border-white/10 bg-[#1E1F2B] px-3 text-sm text-[#F9FAFB] focus:border-blue-500 focus:outline-none"
              aria-invalid={errors.severity ? 'true' : 'false'}
              aria-describedby={errors.severity ? 'issue-severity-error' : undefined}
            >
              <option value="">Seleccione severidad</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
            {errors.severity && (
              <p id="issue-severity-error" role="alert" className="text-xs text-red-400">
                {errors.severity}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="issue-type" className="text-sm font-medium text-[#F9FAFB]">
              Tipo *
            </label>
            <select
              id="issue-type"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                if (errors.type) setErrors((prev) => ({ ...prev, type: undefined }));
              }}
              className="h-10 rounded-md border border-white/10 bg-[#1E1F2B] px-3 text-sm text-[#F9FAFB] focus:border-blue-500 focus:outline-none"
              aria-invalid={errors.type ? 'true' : 'false'}
              aria-describedby={errors.type ? 'issue-type-error' : undefined}
            >
              <option value="">Seleccione tipo</option>
              <option value="bug">Bug</option>
              <option value="regression">Regresión</option>
              <option value="performance">Rendimiento</option>
              <option value="security">Seguridad</option>
              <option value="ux">UX</option>
            </select>
            {errors.type && (
              <p id="issue-type-error" role="alert" className="text-xs text-red-400">
                {errors.type}
              </p>
            )}
          </div>
        </div>
      </form>
    </ProjectModal>
  );
}
