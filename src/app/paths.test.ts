import { describe, expect, it } from 'vitest';
import { PATHS, projectDetailPath } from './paths';

describe('paths', () => {
  it('builds project detail paths', () => {
    expect(PATHS.projects).toBe('/proyectos');
    expect(projectDetailPath('abc')).toBe('/proyectos/abc/resumen');
  });
});
