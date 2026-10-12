import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

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
}

/** Status message. Never relies on color alone: it always carries an icon and text. */
export function Alert({ variant = 'info', children, className = '' }: AlertProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm ${styles[variant]} ${className}`}
    >
      <span className="mt-0.5 shrink-0">{icons[variant]}</span>
      <p>{children}</p>
    </div>
  );
}
