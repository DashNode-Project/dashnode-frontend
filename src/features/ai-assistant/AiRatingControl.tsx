import { useState } from 'react';
import { putInteractionRating } from '@/features/ai-metrics/api';
import { AI_RATING_MESSAGES } from '@/features/ai-metrics/messages';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { useToast } from '@/lib/toast/ToastProvider';

interface AiRatingControlProps {
  interactionId: string;
  initialScore?: number | null;
  className?: string;
}

export function AiRatingControl({
  interactionId,
  initialScore = null,
  className = '',
}: AiRatingControlProps) {
  const { showToast } = useToast();
  const [score, setScore] = useState<number | null>(initialScore);
  const [saving, setSaving] = useState(false);

  const onSelect = async (next: number) => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await putInteractionRating(interactionId, next);
      setScore(res.score);
      showToast(res.message || AI_RATING_MESSAGES.thanks, 'success');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'RATING_OUT_OF_RANGE' || err.message === AI_RATING_MESSAGES.outOfRange) {
          showToast(AI_RATING_MESSAGES.outOfRange, 'error');
        } else if (
          err.code === 'RATING_NOT_ALLOWED' ||
          err.message === AI_RATING_MESSAGES.notAllowed
        ) {
          showToast(AI_RATING_MESSAGES.notAllowed, 'error');
        } else if (
          err.code === 'RATING_NOT_AVAILABLE' ||
          err.message === AI_RATING_MESSAGES.notAvailable
        ) {
          showToast(AI_RATING_MESSAGES.notAvailable, 'error');
        } else if (!isTechnicalFailure(err)) {
          showToast(err.message, 'error');
        } else {
          showToast(AI_RATING_MESSAGES.technicalFailure, 'error');
        }
      } else {
        showToast(AI_RATING_MESSAGES.technicalFailure, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`mt-2 rounded-lg border border-white/10 bg-[#161722] p-2.5 text-xs ${className}`}
      data-testid="ai-rating-control"
    >
      <p className="mb-2 font-medium text-[#E5E7EB]">{AI_RATING_MESSAGES.label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {[1, 2, 3, 4, 5].map((value) => {
          const selected = score === value;
          const label = AI_RATING_MESSAGES.scoreLabels[value] ?? String(value);
          return (
            <button
              key={value}
              type="button"
              disabled={saving}
              aria-pressed={selected}
              onClick={() => void onSelect(value)}
              className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                selected
                  ? 'border-violet-400 bg-violet-500/20 text-violet-200'
                  : 'border-white/15 bg-white/5 text-[#D1D5DB] hover:border-violet-400/50 hover:text-white'
              } disabled:opacity-50`}
            >
              {label}
            </button>
          );
        })}
        {score !== null ? (
          <span className="text-[#9CA3AF]" role="status">
            {AI_RATING_MESSAGES.rated}
          </span>
        ) : null}
      </div>
    </div>
  );
}
