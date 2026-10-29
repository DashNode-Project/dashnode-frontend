import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import ProjectModulePlaceholder from './ProjectModulePlaceholder';
import * as underDev from '@/lib/underDevelopment';

vi.mock('@/lib/underDevelopment', () => ({
  notifyUnderDevelopment: vi.fn(),
}));

describe('ProjectModulePlaceholder', () => {
  it('notifies under development for issues tab', () => {
    render(
      <MemoryRouter initialEntries={['/proyectos/p1/issues']}>
        <Routes>
          <Route path="/proyectos/:projectId/:moduleTab" element={<ProjectModulePlaceholder />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText(/Issues/)).toBeInTheDocument();
    expect(underDev.notifyUnderDevelopment).toHaveBeenCalledWith('Issues');
  });
});
