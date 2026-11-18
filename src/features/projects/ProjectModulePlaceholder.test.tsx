import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import ProjectModulePlaceholder from './ProjectModulePlaceholder';
import * as underDev from '@/lib/underDevelopment';

vi.mock('@/lib/underDevelopment', () => ({
  notifyUnderDevelopment: vi.fn(),
}));

describe('ProjectModulePlaceholder', () => {
  it('renders nothing for implemented issues tab', () => {
    vi.mocked(underDev.notifyUnderDevelopment).mockClear();
    const { container } = render(
      <MemoryRouter initialEntries={['/proyectos/p1/issues']}>
        <Routes>
          <Route path="/proyectos/:projectId/:moduleTab" element={<ProjectModulePlaceholder />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
    expect(underDev.notifyUnderDevelopment).not.toHaveBeenCalled();
  });
});
