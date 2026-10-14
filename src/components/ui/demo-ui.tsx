import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return (parts[0] ?? '?').slice(0, 2).toUpperCase();
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return (first + last).toUpperCase() || '?';
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  activo: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  inactivo: 'bg-[#374151]/40 text-[#9CA3AF] border-white/10',
  paused: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  pausado: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  completed: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  completado: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  archived: 'bg-[#374151]/40 text-[#9CA3AF] border-white/10',
  archivado: 'bg-[#374151]/40 text-[#9CA3AF] border-white/10',
};

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/6 bg-[#12131C] shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const px = `${size}px`;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/30 to-violet-600/30 text-xs font-semibold text-[#F9FAFB] ring-1 ring-white/10"
      style={{ width: px, height: px }}
      title={name}
      aria-hidden={name ? undefined : true}
    >
      {initialsFor(name)}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'blue' | 'violet' | 'amber';
}) {
  const tones = {
    neutral: 'bg-white/5 text-[#9CA3AF] border-white/10',
    blue: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    violet: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  const cls = statusColors[key] ?? 'bg-white/5 text-[#9CA3AF] border-white/10';
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${cls}`}
    >
      {status}
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-[#6B7280]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[#F9FAFB]">{value}</p>
          {trend ? <p className="mt-1 text-xs text-[#9CA3AF]">{trend}</p> : null}
        </div>
        {icon ? <div className="rounded-lg bg-white/5 p-2">{icon}</div> : null}
      </div>
    </Card>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-[#F9FAFB]">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[#9CA3AF]">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? 'Buscar…'}
      className={`h-9 rounded-lg border border-white/10 bg-[#0A0B0E] px-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 ${className}`}
    />
  );
}

export function TabIconLabel({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon size={15} aria-hidden="true" />
      {label}
    </span>
  );
}
