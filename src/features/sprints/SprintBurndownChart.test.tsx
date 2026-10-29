import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SprintBurndownChart } from './SprintBurndownChart';

describe('SprintBurndownChart (HU_DN_05_68)', () => {
  it('renders ideal and actual lines with accessible label', () => {
    render(
      <SprintBurndownChart
        ideal={[
          { date: '2026-11-01', points: 20 },
          { date: '2026-11-14', points: 0 },
        ]}
        actual={[
          { date: '2026-11-01', points: 20 },
          { date: '2026-11-02', points: 17 },
        ]}
      />,
    );
    expect(screen.getByRole('img', { name: /burndown/i })).toBeInTheDocument();
    expect(screen.getByText(/Línea ideal/)).toBeInTheDocument();
    expect(screen.getByText(/Línea real/)).toBeInTheDocument();
  });
});
