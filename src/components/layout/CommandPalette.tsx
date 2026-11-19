import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useMatch, useNavigate } from 'react-router';
import { PATHS } from '@/app/paths';
import { useAuth } from '@/features/auth/AuthContext';
import {
  type CommandCatalogResponse,
  type CommandItem,
  fetchCommandCatalog,
} from '@/features/commands/api';
import {
  buildIndex,
  commandTypeLabel,
  searchCommands,
  type IndexedCommand,
} from '@/features/commands/commandSearch';

const LOAD_FAILURE = 'No fue posible cargar la información. Intente nuevamente.';
const EMPTY_RESULTS = 'No se encontraron comandos.';

let catalogCache: CommandCatalogResponse | null = null;
let catalogRoleKey: string | null = null;

export function invalidateCommandCatalog() {
  catalogCache = null;
  catalogRoleKey = null;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const projectMatch = useMatch(`${PATHS.projects}/:projectId/*`);
  const openProjectId = projectMatch?.params.projectId ?? null;

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CommandCatalogResponse | null>(null);

  const roleKey = user ? `${user.id}:${user.role}` : '';
  const activeCatalog = useMemo(() => {
    if (catalog) return catalog;
    if (user && catalogCache && catalogRoleKey === roleKey) return catalogCache;
    return null;
  }, [catalog, roleKey, user]);

  const index = useMemo(() => buildIndex(activeCatalog?.commands ?? []), [activeCatalog?.commands]);

  const results = useMemo(
    () => searchCommands(index, query, openProjectId),
    [index, query, openProjectId],
  );

  const loading = Boolean(open && user && !activeCatalog && !loadError);

  const close = useCallback(() => {
    setQuery('');
    setActiveIndex(0);
    onClose();
    const target = restoreFocusRef.current;
    if (target && document.contains(target)) {
      target.focus();
    } else {
      document.getElementById('main')?.focus();
    }
  }, [onClose]);

  const runCommand = useCallback(
    (item: CommandItem | undefined) => {
      if (!item) return;
      if (item.action === 'OPEN_ASSISTANT') {
        window.dispatchEvent(new CustomEvent('dashnode:open-assistant'));
        close();
        return;
      }
      const path = item.route;
      if (path) {
        navigate(path);
        close();
      }
    },
    [close, navigate],
  );

  useEffect(() => {
    if (!open || !user) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const nextRoleKey = `${user.id}:${user.role}`;
    if (catalogCache && catalogRoleKey === nextRoleKey) {
      return;
    }
    let cancelled = false;
    fetchCommandCatalog()
      .then((payload) => {
        if (cancelled) return;
        catalogCache = payload;
        catalogRoleKey = nextRoleKey;
        setCatalog(payload);
      })
      .catch(() => {
        if (!cancelled) setLoadError(LOAD_FAILURE);
      });
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trapFocus = (event: FocusEvent) => {
      const root = document.getElementById('command-palette-panel');
      if (!root || root.contains(event.target as Node)) return;
      inputRef.current?.focus();
    };
    document.addEventListener('focusin', trapFocus);
    return () => document.removeEventListener('focusin', trapFocus);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((value) => Math.min(value + 1, Math.max(0, results.length - 1)));
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((value) => Math.max(value - 1, 0));
      }
      if (event.key === 'Home') {
        event.preventDefault();
        setActiveIndex(0);
      }
      if (event.key === 'End') {
        event.preventDefault();
        setActiveIndex(Math.max(0, results.length - 1));
      }
      if (event.key === 'Enter' && results.length > 0) {
        event.preventDefault();
        runCommand(results[activeIndex]?.item);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, results, activeIndex, runCommand]);

  useEffect(() => {
    if (user) return;
    if (open) onClose();
  }, [user, open, onClose]);

  if (!open || !user) return null;

  const activeId = results[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Cerrar paleta"
        className="absolute inset-0 cursor-default"
        onClick={close}
      />
      <div
        id="command-palette-panel"
        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-white/10 bg-[#12131C] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          placeholder="Buscar páginas y acciones…"
          className="w-full border-b border-white/10 bg-transparent px-4 py-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:outline-none"
        />
        <p className="sr-only" aria-live="polite">
          {loadError ? loadError : `${results.length} resultado${results.length === 1 ? '' : 's'}`}
        </p>
        {loadError ? (
          <p className="px-4 py-6 text-sm text-[#FCA5A5]">{loadError}</p>
        ) : loading ? (
          <p className="px-4 py-6 text-sm text-[#9CA3AF]">Cargando comandos…</p>
        ) : (
          <ul
            id={listboxId}
            role="listbox"
            className="max-h-80 overflow-y-auto py-2"
            aria-label="Resultados"
          >
            {results.map((entry: IndexedCommand, position: number) => {
              const selected = position === activeIndex;
              return (
                <li key={entry.item.id} role="presentation">
                  <button
                    id={`${listboxId}-option-${position}`}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm ${
                      selected ? 'bg-white/10 text-[#F9FAFB]' : 'text-[#E5E7EB] hover:bg-white/5'
                    }`}
                    onMouseEnter={() => setActiveIndex(position)}
                    onClick={() => runCommand(entry.item)}
                  >
                    <span>{entry.item.label}</span>
                    <span className="shrink-0 text-xs text-[#9CA3AF]">
                      {entry.item.project
                        ? `Proyecto · ${entry.item.project.name}`
                        : commandTypeLabel(entry.item.type)}
                    </span>
                  </button>
                </li>
              );
            })}
            {!loading && !loadError && results.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-[#6B7280]">{EMPTY_RESULTS}</li>
            ) : null}
          </ul>
        )}
      </div>
    </div>
  );
}
