import type { ReactNode } from 'react';

export function ProjectModal({
  title,
  children,
  footer,
  onClose,
}: {
  title: string;
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#12131C] p-6 shadow-xl">
        <h2 id="modal-title" className="mb-4 text-lg font-semibold">
          {title}
        </h2>
        {children}
        <div className="mt-6 flex justify-end gap-2">{footer}</div>
      </div>
      <button type="button" className="sr-only" onClick={onClose}>
        Cerrar
      </button>
    </div>
  );
}
