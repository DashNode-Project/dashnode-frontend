import type { MoscowPriority } from './types';

const MOSCOW_STYLES: Record<MoscowPriority, string> = {
  must_have: 'bg-red-500/20 text-red-300 ring-red-500/30',
  should_have: 'bg-amber-500/20 text-amber-200 ring-amber-500/30',
  could_have: 'bg-sky-500/20 text-sky-200 ring-sky-500/30',
  wont_have: 'bg-zinc-500/20 text-zinc-300 ring-zinc-500/30',
};

const MOSCOW_LABELS: Record<MoscowPriority, string> = {
  must_have: 'Must have',
  should_have: 'Should have',
  could_have: 'Could have',
  wont_have: "Won't have",
};

export function MoscowBadge({ priority }: { priority: MoscowPriority }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${MOSCOW_STYLES[priority]}`}
    >
      {MOSCOW_LABELS[priority]}
    </span>
  );
}
