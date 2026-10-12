import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type Variant = 'error' | 'success' | 'info';

const styles: Record<Variant, string> = {
  error: 'border-red-500/30 bg-red-500/10 text-red-200',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
};

const icons: Record<Variant, ReactNode> = {
  error: <AlertCircle size={16} aria-hidden="true" />,
  success: <CheckCircle2 size={16} aria-hidden="true" />,
  info: <Info size={16} aria-hidden="true" />,
};

interface AlertProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  /** When set, shows a dismiss control (accessible name: Cerrar notificación). */
  onDismiss?: () => void;
}

/** Status message. Never relies on color alone: icon, text and optional dismiss. */
export function Alert({ variant = 'info', children, className = '', onDismiss }: AlertProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm ${styles[variant]} ${className}`}
    >
      <span className="mt-0.5 shrink-0">{icons[variant]}</span>
      <p className="min-w-0 flex-1">{children}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 text-current opacity-80 hover:opacity-100"
          aria-label="Cerrar notificación"
        >
          <X size={16} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
