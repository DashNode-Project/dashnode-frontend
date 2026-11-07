import { useState } from 'react';
import { AlertTriangle, FileCode, Film, Image, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProjectModal } from '@/features/projects/ProjectModal';
import { validateEvidenceFile } from '../validation';

interface AddEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File, title?: string) => Promise<void>;
  loading: boolean;
}

export function AddEvidenceModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
}: AddEvidenceModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      const err = validateEvidenceFile(selected);
      setError(err);
    } else {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Debe seleccionar un archivo.');
      return;
    }

    const validationErr = validateEvidenceFile(file);
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setError(null);
    setProgress(30);

    try {
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 20 : prev));
      }, 100);

      await onSubmit(file, title.trim() || undefined);
      clearInterval(interval);
      setProgress(100);
    } catch {
      setProgress(0);
    }
  };

  return (
    <ProjectModal
      title="Adjuntar evidencia"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !file || !!error}>
            {loading ? 'Adjuntando…' : 'Adjuntar'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Constraints Notice */}
        <div className="rounded-lg border border-white/10 bg-[#1E1F2B] p-3 text-xs text-[#9CA3AF]">
          <p className="font-medium text-[#F9FAFB] mb-1">Límites permitidos:</p>
          <ul className="space-y-1">
            <li className="flex items-center gap-1.5">
              <Image size={13} className="text-blue-400" />
              <span>Imágenes: JPG, PNG, WEBP (hasta 5 MB)</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Film size={13} className="text-violet-400" />
              <span>Videos: MP4, WEBM (hasta 25 MB y 60 segundos)</span>
            </li>
            <li className="flex items-center gap-1.5">
              <FileCode size={13} className="text-emerald-400" />
              <span>Registros / Texto: LOG, TXT (hasta 1 MB)</span>
            </li>
          </ul>
        </div>

        {/* File selector */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="evidence-file" className="text-sm font-medium text-[#F9FAFB]">
            Archivo *
          </label>
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-[#12131C] p-4 text-center hover:border-white/30 transition-colors">
            <Upload size={24} className="text-[#6B7280] mb-2" />
            <input
              id="evidence-file"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.log,.txt,image/*,video/*,text/plain"
              onChange={handleFileChange}
              className="text-xs text-[#9CA3AF] file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-500 cursor-pointer"
            />
            {file && (
              <p className="mt-2 text-xs text-[#9CA3AF]">
                Seleccionado: <span className="text-[#F9FAFB] font-medium">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
          {error && (
            <div role="alert" className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertTriangle size={13} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Título opcional */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="evidence-title" className="text-sm font-medium text-[#F9FAFB]">
            Título (opcional)
          </label>
          <input
            id="evidence-title"
            type="text"
            maxLength={255}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Descripción breve de la evidencia"
            className="h-10 w-full rounded-md border border-white/10 bg-[#1E1F2B] px-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Barra de progreso */}
        {loading && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-[#9CA3AF]">
              <span>Subiendo archivo…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </form>
    </ProjectModal>
  );
}
