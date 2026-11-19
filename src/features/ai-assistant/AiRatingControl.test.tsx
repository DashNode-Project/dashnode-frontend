import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiRatingControl } from './AiRatingControl';
import { AI_RATING_MESSAGES } from '@/features/ai-metrics/messages';
import * as metricsApi from '@/features/ai-metrics/api';
import { ToastProvider } from '@/lib/toast/ToastProvider';

vi.mock('@/features/ai-metrics/api');

describe('AiRatingControl', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(metricsApi.putInteractionRating).mockResolvedValue({
      message: AI_RATING_MESSAGES.thanks,
      score: 5,
    });
  });

  it('submits rating and shows Valorado', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <AiRatingControl interactionId="int-99" />
      </ToastProvider>,
    );

    const five = screen.getByRole('button', { name: AI_RATING_MESSAGES.scoreLabels[5] });
    await user.click(five);

    await waitFor(() => {
      expect(metricsApi.putInteractionRating).toHaveBeenCalledWith('int-99', 5);
    });
    expect(screen.getByText(AI_RATING_MESSAGES.rated)).toBeInTheDocument();
  });
});
