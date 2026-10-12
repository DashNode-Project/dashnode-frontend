import { Layers } from 'lucide-react';

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="flex items-center justify-center rounded-lg bg-blue-500"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <Layers size={Math.round(size * 0.57)} className="text-white" />
      </span>
      <span className="text-sm font-bold text-[#F9FAFB]">DashNode</span>
    </span>
  );
}
