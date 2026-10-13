import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 10_000;

const borderByVariant: Record<ToastVariant, string> = {
  success: 'border-emerald-500/30',
  error: 'border-red-500/30',
  info: 'border-blue-500/30',
};

const iconByVariant: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 size={16} className="text-emerald-400" aria-hidden="true" />,
  error: <AlertCircle size={16} className="text-red-400" aria-hidden="true" />,
  info: <Info size={16} className="text-blue-400" aria-hidden="true" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast({ message, variant });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-[100] flex max-w-sm items-center gap-3 rounded-lg border bg-[#20222D] px-4 py-3 shadow-xl ${borderByVariant[toast.variant]}`}
        >
          {iconByVariant[toast.variant]}
          <span className="flex-1 text-sm text-[#F9FAFB]">{toast.message}</span>
          <button
            type="button"
            className="text-[#6B7280] hover:text-[#F9FAFB]"
            aria-label="Cerrar notificación"
            onClick={() => setToast(null)}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
