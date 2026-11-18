import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Card } from '@/components/ui/demo-ui';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { searchSystemKnowledge, type SystemKnowledgeEntry } from './api';

export function SystemKnowledgePanel() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SystemKnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      setLoading(true);
      void searchSystemKnowledge(query)
        .then((rows) => {
          if (!cancelled) {
            setItems(rows);
            setError(null);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(
              err instanceof ApiError && !isTechnicalFailure(err)
                ? err.message
                : MESSAGES.loadFailure,
            );
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query]);

  return (
    <Card className="mb-6 p-6">
      <h2 className="mb-2 text-lg font-semibold text-[#F9FAFB]">Preguntas frecuentes (DashNode)</h2>
      <p className="mb-4 text-sm text-[#9CA3AF]">
        Base de conocimientos del sistema con al menos 31 entradas sobre funcionalidades reales.
        El asistente consulta esta información antes de inventar respuestas.
      </p>
      <label className="mb-4 flex items-center gap-2 rounded-lg border border-white/10 bg-[#0A0B0E] px-3 py-2">
        <Search size={18} className="text-[#6B7280]" aria-hidden />
        <input
          type="search"
          className="w-full bg-transparent text-sm text-[#F9FAFB] outline-none placeholder:text-[#6B7280]"
          placeholder="Buscar en el manual (ej. sprints, login, métricas IA)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar en la base de conocimientos"
        />
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {loading ? <p className="text-sm text-[#9CA3AF]">Cargando entradas…</p> : null}
      {!loading && !error && items.length === 0 ? (
        <p className="text-sm text-[#9CA3AF]">Sin resultados para esta búsqueda.</p>
      ) : null}
      <ul className="max-h-[28rem] space-y-3 overflow-y-auto">
        {items.map((entry) => (
          <li key={entry.id} className="rounded-lg border border-white/10 bg-[#12131C] p-4">
            <p className="font-medium text-[#F9FAFB]">{entry.question}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-[#9CA3AF]">{entry.answer_md}</p>
            {entry.tags ? (
              <p className="mt-2 text-xs text-[#6B7280]">Etiquetas: {entry.tags}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}