import type { CommandItem } from './api';

export interface IndexedCommand {
  item: CommandItem;
  labelNorm: string;
  keywordsNorm: string[];
  tokens: string[];
}

const MAX_VISIBLE = 8;

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildIndex(commands: CommandItem[]): IndexedCommand[] {
  return commands.map((item) => {
    const labelNorm = normalizeText(item.label);
    const keywordsNorm = item.keywords.map((keyword) => normalizeText(keyword));
    const tokens = labelNorm.split(' ').filter(Boolean);
    return { item, labelNorm, keywordsNorm, tokens };
  });
}

function scoreMatch(entry: IndexedCommand, query: string): number {
  if (!query) return 1;
  const { labelNorm, keywordsNorm, tokens } = entry;
  if (labelNorm.startsWith(query)) return 400;
  if (tokens.some((token) => token.startsWith(query))) return 300;
  if (keywordsNorm.some((keyword) => keyword.includes(query))) return 200;
  if (labelNorm.includes(query)) return 100;
  return 0;
}

export function searchCommands(
  index: IndexedCommand[],
  query: string,
  openProjectId: string | null,
): IndexedCommand[] {
  const normalizedQuery = normalizeText(query);
  const scored = index
    .map((entry) => ({
      entry,
      score: scoreMatch(entry, normalizedQuery),
    }))
    .filter(({ score }) => score > 0 || !normalizedQuery);

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aProject = openProjectId && a.entry.item.project?.id === openProjectId ? 0 : 1;
    const bProject = openProjectId && b.entry.item.project?.id === openProjectId ? 0 : 1;
    if (aProject !== bProject) return aProject - bProject;
    return a.entry.item.label.localeCompare(b.entry.item.label, 'es');
  });

  return scored.slice(0, MAX_VISIBLE).map(({ entry }) => entry);
}

export function commandTypeLabel(type: CommandItem['type']): string {
  if (type === 'ACTION') return 'Acción';
  return 'Página';
}
