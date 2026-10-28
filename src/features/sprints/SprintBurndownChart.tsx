import { useMemo, useState } from 'react';
import type { BurndownPoint } from './types';

const WIDTH = 560;
const HEIGHT = 220;
const PAD = { top: 16, right: 16, bottom: 32, left: 40 };

function buildPath(points: BurndownPoint[], maxY: number): string {
  if (points.length === 0) return '';
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const coords = points.map((p, i) => {
    const x =
      points.length === 1 ? PAD.left + innerW / 2 : PAD.left + (i / (points.length - 1)) * innerW;
    const y = PAD.top + innerH - (p.points / maxY) * innerH;
    return `${x},${y}`;
  });
  return `M ${coords.join(' L ')}`;
}

export function SprintBurndownChart({
  ideal,
  actual,
}: {
  ideal: BurndownPoint[];
  actual: BurndownPoint[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const maxY = useMemo(
    () => Math.max(1, ...ideal.map((p) => p.points), ...actual.map((p) => p.points)),
    [ideal, actual],
  );
  const idealPath = buildPath(ideal, maxY);
  const actualPath = buildPath(actual, maxY);
  const labels = actual.length ? actual : ideal;

  return (
    <div className="rounded-xl border border-white/10 bg-[#12131C] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[#F9FAFB]">Métricas del sprint — Burndown</h3>
      <div className="flex flex-wrap gap-4 text-xs text-[#9CA3AF] mb-2">
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-violet-400" /> Línea ideal
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-blue-400" /> Línea real
        </span>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full max-w-full"
        role="img"
        aria-label="Gráfico burndown del sprint"
      >
        <line
          x1={PAD.left}
          y1={HEIGHT - PAD.bottom}
          x2={WIDTH - PAD.right}
          y2={HEIGHT - PAD.bottom}
          stroke="#374151"
        />
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={HEIGHT - PAD.bottom} stroke="#374151" />
        <path d={idealPath} fill="none" stroke="#a78bfa" strokeWidth={2} strokeDasharray="6 4" />
        <path d={actualPath} fill="none" stroke="#60a5fa" strokeWidth={2.5} />
        {labels.map((p, i) => {
          const innerW = WIDTH - PAD.left - PAD.right;
          const x =
            labels.length === 1
              ? PAD.left + innerW / 2
              : PAD.left + (i / (labels.length - 1)) * innerW;
          return (
            <g key={p.date}>
              <circle
                cx={x}
                cy={PAD.top + (HEIGHT - PAD.top - PAD.bottom) * (1 - p.points / maxY)}
                r={hover === i ? 6 : 4}
                fill="#60a5fa"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              {i % Math.max(1, Math.floor(labels.length / 6)) === 0 ? (
                <text x={x} y={HEIGHT - 8} textAnchor="middle" fill="#6B7280" fontSize={10}>
                  {p.date.slice(5)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {hover !== null && labels[hover] ? (
        <p className="mt-2 text-xs text-[#9CA3AF]">
          {labels[hover].date}: {labels[hover].points} pts restantes
        </p>
      ) : null}
    </div>
  );
}
