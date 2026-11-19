import { describe, expect, it } from 'vitest';
import type { CommandItem } from './api';
import { buildIndex, commandTypeLabel, normalizeText, searchCommands } from './commandSearch';

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

  it('returns up to eight matches for an empty query', () => {
    const many: CommandItem[] = Array.from({ length: 12 }, (_, i): CommandItem => ({
      id: `c-${i}`,
      label: `Página ${i}`,
      type: 'PAGE',
      scope: 'GLOBAL',
      route: `/pagina-${i}`,
      route_template: null,
      action: null,
      keywords: [],
      project: null,
    }));
    const index = buildIndex(many);
    expect(searchCommands(index, '', null)).toHaveLength(8);
  });

  it('scores keyword and label matches', () => {
    const index = buildIndex(sample);
    expect(searchCommands(index, 'pend', null)[0]?.item.id).toBe('a');
    expect(searchCommands(index, 'tar', null)[0]?.item.id).toBe('a');
  });

  it('labels command types in Spanish', () => {
    expect(commandTypeLabel('PAGE')).toBe('Página');
    expect(commandTypeLabel('ACTION')).toBe('Acción');
  });
});
