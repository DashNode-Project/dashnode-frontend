import { describe, expect, it } from 'vitest';
import type { CommandItem } from './api';
import { buildIndex, normalizeText, searchCommands } from './commandSearch';

const sample: CommandItem[] = [
  {
    id: 'a',
    label: 'Tareas',
    type: 'PAGE',
    scope: 'GLOBAL',
    route: '/mis-tareas',
    route_template: null,
    action: null,
    keywords: ['pendientes'],
    project: null,
  },
  {
    id: 'b',
    label: 'Issues · Alpha',
    type: 'PAGE',
    scope: 'PROJECT',
    route: '/proyectos/p1/issues',
    route_template: null,
    action: null,
    keywords: ['bugs'],
    project: { id: 'p1', name: 'Alpha' },
  },
];

describe('commandSearch', () => {
  it('normalizes accents', () => {
    expect(normalizeText('Tareas')).toBe('tareas');
    expect(normalizeText('Reunión')).toBe('reunion');
  });

  it('prioritizes project-open commands', () => {
    const index = buildIndex(sample);
    const results = searchCommands(index, 'issues', 'p1');
    expect(results[0]?.item.id).toBe('b');
  });
});
