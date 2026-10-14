import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

const toneClasses = {
  neutral:
    'text-[#9CA3AF] hover:bg-white/10 hover:text-[#F9FAFB] active:bg-white/15 focus-visible:ring-white/30',
  blue: 'text-blue-400 hover:bg-blue-500/15 hover:text-blue-300 active:bg-blue-500/25 focus-visible:ring-blue-500/40',
  amber:
    'text-amber-400 hover:bg-amber-500/15 hover:text-amber-300 active:bg-amber-500/25 focus-visible:ring-amber-500/40',
  emerald:
    'text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300 active:bg-emerald-500/25 focus-visible:ring-emerald-500/40',
  red: 'text-red-400 hover:bg-red-500/15 hover:text-red-300 active:bg-red-500/25 focus-visible:ring-red-500/40',
  violet:
    'text-violet-400 hover:bg-violet-500/15 hover:text-violet-300 active:bg-violet-500/25 focus-visible:ring-violet-500/40',
} as const;

export type IconActionTone = keyof typeof toneClasses;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  tone?: IconActionTone;
};

/** Icon-only control with accessible name and hover/active affordances (WCAG 2.2). */
export function IconActionButton({
  icon: Icon,
  label,
  tone = 'neutral',
  className = '',
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent transition-colors focus:outline-none focus-visible:ring-2 ${toneClasses[tone]} ${className}`}
      {...rest}
    >
      <Icon size={16} aria-hidden="true" />
    </button>
  );
}
