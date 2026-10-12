import React, { useState, useRef, useEffect } from 'react';
import { X, Check, AlertCircle, Info, CheckCircle, Loader2 } from 'lucide-react';

// ── Button ──────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type BtnSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const btnVariants: Record<BtnVariant, string> = {
  primary: 'bg-blue-500 hover:bg-blue-400 text-white border-transparent',
  secondary: 'bg-[#272A38] hover:bg-[#2E3245] text-[#F9FAFB] border-white/10',
  ghost: 'bg-transparent hover:bg-white/6 text-[#9CA3AF] hover:text-[#F9FAFB] border-transparent',
  danger: 'bg-red-600 hover:bg-red-500 text-white border-transparent',
  outline: 'bg-transparent border-white/15 hover:border-white/25 text-[#F9FAFB] hover:bg-white/4',
};

const btnSizes: Record<BtnSize, string> = {
  xs: 'h-6 px-2 text-xs gap-1 rounded',
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-md',
  md: 'h-9 px-4 text-sm gap-2 rounded-md',
  lg: 'h-10 px-5 text-sm gap-2 rounded-lg',
};

export function Button({ variant = 'primary', size = 'md', loading, icon, iconRight, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium border transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0A0B0E] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${btnVariants[variant]} ${btnSizes[size]} ${className}`}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
      {iconRight && !loading && iconRight}
    </button>
  );
}

// ── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function Input({ label, error, hint, leftIcon, rightElement, className = '', id, ...props }: InputProps) {
  const innerId = id ?? `inp-${Math.random().toString(36).slice(2)}`;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={innerId} className="text-sm font-medium text-[#F9FAFB]">{label}</label>}
      <div className="relative flex items-center">
        {leftIcon && <span className="absolute left-3 text-[#6B7280] pointer-events-none">{leftIcon}</span>}
        <input
          {...props}
          id={innerId}
          className={`w-full bg-[#1E1F2B] border ${error ? 'border-red-500' : 'border-white/10'} rounded-md h-9 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] transition-colors focus:outline-none focus:border-blue-500 ${leftIcon ? 'pl-9' : 'pl-3'} ${rightElement ? 'pr-10' : 'pr-3'} ${className}`}
        />
        {rightElement && <span className="absolute right-3">{rightElement}</span>}
      </div>
      {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
      {hint && !error && <p className="text-xs text-[#6B7280]">{hint}</p>}
    </div>
  );
}

// ── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className = '', id, ...props }: TextareaProps) {
  const innerId = id ?? `ta-${Math.random().toString(36).slice(2)}`;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={innerId} className="text-sm font-medium text-[#F9FAFB]">{label}</label>}
      <textarea
        {...props}
        id={innerId}
        className={`w-full bg-[#1E1F2B] border ${error ? 'border-red-500' : 'border-white/10'} rounded-md p-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] resize-none transition-colors focus:outline-none focus:border-blue-500 ${className}`}
      />
      {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
      {hint && !error && <p className="text-xs text-[#6B7280]">{hint}</p>}
    </div>
  );
}

// ── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = '', id, ...props }: SelectProps) {
  const innerId = id ?? `sel-${Math.random().toString(36).slice(2)}`;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={innerId} className="text-sm font-medium text-[#F9FAFB]">{label}</label>}
      <select
        {...props}
        id={innerId}
        className={`w-full bg-[#1E1F2B] border ${error ? 'border-red-500' : 'border-white/10'} rounded-md h-9 px-3 text-sm text-[#F9FAFB] transition-colors focus:outline-none focus:border-blue-500 appearance-none ${className}`}
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
      >
        {options.map(o => <option key={o.value} value={o.value} style={{ background: '#1E1F2B' }}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'blue' | 'violet' | 'green' | 'yellow' | 'red' | 'orange' | 'gray' | 'teal';

const badgeVariants: Record<BadgeVariant, string> = {
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  violet: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  yellow: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  red: 'bg-red-500/15 text-red-400 border-red-500/20',
  orange: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  gray: 'bg-white/8 text-[#9CA3AF] border-white/10',
  teal: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
};

export function Badge({ variant = 'gray', children, className = '' }: { variant?: BadgeVariant; children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${badgeVariants[variant]} ${className}`}>
      {children}
    </span>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'];

export function Avatar({ name, size = 32, className = '' }: { name: string; size?: number; className?: string }) {
  const initials = name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 font-semibold text-white ${className}`}
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

const modalSizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${modalSizes[size]} bg-[#1E1F2B] border border-white/10 rounded-xl shadow-2xl fade-in max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <h2 className="font-semibold text-[#F9FAFB]">{title}</h2>
            <button onClick={onClose} className="text-[#6B7280] hover:text-[#F9FAFB] transition-colors p-1 rounded" aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/8">{footer}</div>}
      </div>
    </div>
  );
}

// ── Confirm Modal ────────────────────────────────────────────────────────────
export function ConfirmModal({ open, onClose, onConfirm, title, description, confirmLabel = 'Eliminar', danger = true, loading }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; description: string; confirmLabel?: string; danger?: boolean; loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center">
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${danger ? 'bg-red-500/15' : 'bg-blue-500/15'}`}>
          <AlertCircle size={24} className={danger ? 'text-red-400' : 'text-blue-400'} />
        </div>
        <h3 className="font-semibold text-[#F9FAFB] mb-2">{title}</h3>
        <p className="text-sm text-[#9CA3AF] mb-6">{description}</p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button variant={danger ? 'danger' : 'primary'} className="flex-1" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange, className = '' }: {
  tabs: { id: string; label: string; icon?: React.ReactNode; badge?: number }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex gap-0.5 overflow-x-auto no-scrollbar ${className}`} role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-1.5 px-3 h-9 text-sm font-medium rounded-md whitespace-nowrap transition-colors shrink-0 ${
            active === tab.id
              ? 'bg-blue-500/15 text-blue-400'
              : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5'
          }`}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${active === tab.id ? 'bg-blue-500/30 text-blue-300' : 'bg-white/10 text-[#9CA3AF]'}`}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────
export function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error' | 'info'; onDismiss: () => void }) {
  const icons = { success: <CheckCircle size={16} className="text-emerald-400" />, error: <AlertCircle size={16} className="text-red-400" />, info: <Info size={16} className="text-blue-400" /> };
  const borders = { success: 'border-emerald-500/30', error: 'border-red-500/30', info: 'border-blue-500/30' };
  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-[#20222D] border ${borders[type]} rounded-lg px-4 py-3 shadow-xl fade-in max-w-sm`}>
      {icons[type]}
      <span className="text-sm text-[#F9FAFB] flex-1">{message}</span>
      <button onClick={onDismiss} className="text-[#6B7280] hover:text-[#F9FAFB]"><X size={14} /></button>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, trend, color = 'blue' }: {
  label: string; value: string | number; icon: React.ReactNode; trend?: string; color?: string;
}) {
  return (
    <div className="bg-[#12131C] border border-white/6 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${color}-500/15`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-[#F9FAFB]">{value}</p>
      {trend && <p className="text-xs text-[#6B7280] mt-1">{trend}</p>}
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4 text-[#6B7280]">
        {icon}
      </div>
      <h3 className="font-medium text-[#F9FAFB] mb-1">{title}</h3>
      {description && <p className="text-sm text-[#6B7280] max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = 'blue', size = 'md', className = '' }: {
  value: number; max?: number; color?: 'blue' | 'green' | 'violet' | 'yellow' | 'red'; size?: 'sm' | 'md'; className?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colors = { blue: 'bg-blue-500', green: 'bg-emerald-500', violet: 'bg-violet-500', yellow: 'bg-amber-500', red: 'bg-red-500' };
  const heights = { sm: 'h-1', md: 'h-2' };
  return (
    <div className={`w-full bg-white/8 rounded-full ${heights[size]} overflow-hidden ${className}`}>
      <div className={`${colors[color]} ${heights[size]} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Dropdown ─────────────────────────────────────────────────────────────────
export function Dropdown({ trigger, items }: {
  trigger: React.ReactNode;
  items: { label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-[#20222D] border border-white/10 rounded-lg shadow-xl z-40 py-1 fade-in">
          {items.map((item, i) => (
            <button key={i} onClick={() => { item.onClick(); setOpen(false); }} disabled={item.disabled}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors disabled:opacity-40 ${item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-[#F9FAFB] hover:bg-white/5'}`}>
              {item.icon}{item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-semibold text-[#F9FAFB]">{title}</h1>
        {description && <p className="text-sm text-[#9CA3AF] mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

// ── Search Input ─────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Buscar...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 pl-9 pr-3 bg-[#1E1F2B] border border-white/10 rounded-md text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:outline-none focus:border-blue-500 w-56 transition-colors"
      />
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      className={`bg-[#12131C] border border-white/6 rounded-xl ${onClick ? 'cursor-pointer hover:border-white/12 transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ── Role badge helpers ────────────────────────────────────────────────────────
export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    admin: { label: 'Administrador', variant: 'violet' },
    manager: { label: 'Gerente', variant: 'blue' },
    developer: { label: 'Desarrollador', variant: 'teal' },
  };
  const r = map[role] ?? { label: role, variant: 'gray' as BadgeVariant };
  return <Badge variant={r.variant}>{r.label}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    active: { label: 'Activo', variant: 'green' },
    inactive: { label: 'Inactivo', variant: 'yellow' },
    disabled: { label: 'Deshabilitado', variant: 'red' },
    planning: { label: 'Planificación', variant: 'violet' },
    completed: { label: 'Completado', variant: 'green' },
    archived: { label: 'Archivado', variant: 'gray' },
    'on-hold': { label: 'En Pausa', variant: 'yellow' },
    todo: { label: 'Por hacer', variant: 'gray' },
    'in-progress': { label: 'En progreso', variant: 'blue' },
    blocked: { label: 'Bloqueado', variant: 'orange' },
    scheduled: { label: 'Programada', variant: 'blue' },
    cancelled: { label: 'Cancelada', variant: 'red' },
    open: { label: 'Abierto', variant: 'yellow' },
    resolved: { label: 'Resuelto', variant: 'green' },
    closed: { label: 'Cerrado', variant: 'gray' },
    'in-sprint': { label: 'En Sprint', variant: 'blue' },
  };
  const r = map[status] ?? { label: status, variant: 'gray' as BadgeVariant };
  return <Badge variant={r.variant}>{r.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    low: { label: 'Baja', variant: 'gray' },
    medium: { label: 'Media', variant: 'blue' },
    high: { label: 'Alta', variant: 'yellow' },
    critical: { label: 'Crítica', variant: 'red' },
  };
  const r = map[priority] ?? { label: priority, variant: 'gray' as BadgeVariant };
  return <Badge variant={r.variant}>{r.label}</Badge>;
}

// ── Checkbox ─────────────────────────────────────────────────────────────────
export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-blue-500 border-blue-500' : 'border-white/20 bg-transparent hover:border-white/40'}`}
      >
        {checked && <Check size={10} className="text-white" />}
      </button>
      {label && <span className="text-sm text-[#9CA3AF] group-hover:text-[#F9FAFB] transition-colors">{label}</span>}
    </label>
  );
}
