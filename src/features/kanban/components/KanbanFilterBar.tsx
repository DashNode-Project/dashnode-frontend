import { Search, X } from 'lucide-react';
import type { KanbanCard, KanbanFilters } from '../types';

interface KanbanFilterBarProps {
  filters: KanbanFilters;
  onChange: (filters: KanbanFilters) => void;
  cards: KanbanCard[];
  filteredCount: number;
}

export function KanbanFilterBar({ filters, onChange, cards, filteredCount }: KanbanFilterBarProps) {
  // Extract distinct assignees
  const assigneesMap = new Map<string, string>();
  for (const card of cards) {
    if (card.assignee_id && card.assignee_name) {
      assigneesMap.set(card.assignee_id, card.assignee_name);
    }
  }
  const assignees = Array.from(assigneesMap.entries()).map(([id, name]) => ({ id, name }));

  // Extract distinct stories
  const storiesMap = new Map<string, string>();
  for (const card of cards) {
    if (card.story_id && card.story_title) {
      storiesMap.set(card.story_id, card.story_title);
    }
  }
  const stories = Array.from(storiesMap.entries()).map(([id, title]) => ({ id, title }));

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.assigneeId !== 'all' ||
    filters.storyId !== 'all' ||
    filters.taskType !== 'all';

  const resetFilters = () => {
    onChange({
      search: '',
      assigneeId: 'all',
      storyId: 'all',
      taskType: 'all',
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/6 bg-[#12131C] p-3 text-sm">
      <div className="relative min-w-[200px] flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
          aria-hidden="true"
        />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Buscar tareas por título..."
          aria-label="Buscar tareas"
          className="w-full rounded-lg border border-white/10 bg-[#1E1F2B] py-1.5 pl-9 pr-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.assigneeId}
          onChange={(e) => onChange({ ...filters, assigneeId: e.target.value })}
          aria-label="Filtrar por responsable"
          className="rounded-lg border border-white/10 bg-[#1E1F2B] px-3 py-1.5 text-sm text-[#F9FAFB] focus:border-blue-500 focus:outline-none"
        >
          <option value="all">Todos los responsables</option>
          {assignees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <select
          value={filters.storyId}
          onChange={(e) => onChange({ ...filters, storyId: e.target.value })}
          aria-label="Filtrar por historia de usuario"
          className="max-w-[200px] truncate rounded-lg border border-white/10 bg-[#1E1F2B] px-3 py-1.5 text-sm text-[#F9FAFB] focus:border-blue-500 focus:outline-none"
        >
          <option value="all">Todas las historias</option>
          {stories.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>

        <select
          value={filters.taskType}
          onChange={(e) => onChange({ ...filters, taskType: e.target.value })}
          aria-label="Filtrar por tipo de tarea"
          className="rounded-lg border border-white/10 bg-[#1E1F2B] px-3 py-1.5 text-sm text-[#F9FAFB] focus:border-blue-500 focus:outline-none"
        >
          <option value="all">Todos los tipos</option>
          <option value="frontend">Frontend</option>
          <option value="backend">Backend</option>
          <option value="devops">DevOps</option>
          <option value="qa">QA</option>
          <option value="design">Diseño</option>
          <option value="other">Otro</option>
        </select>

        <span className="ml-1 text-xs text-[#6B7280]">
          {filteredCount} tarea{filteredCount !== 1 ? 's' : ''}
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-[#9CA3AF] transition-colors hover:bg-white/5 hover:text-[#F9FAFB]"
          >
            <X size={13} aria-hidden="true" />
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
