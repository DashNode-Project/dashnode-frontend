import { Trash2, UserCheck, UserX } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deactivateDeveloperByManager,
  listManagerDevelopers,
  reactivateDeveloperByManager,
  type ManagerDeveloperSummary,
} from '@/features/auth/api';
import { Avatar, SearchInput, StatusBadge } from '@/components/ui/demo-ui';
import { IconActionButton } from '@/components/ui/IconActionButton';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { USER_MESSAGES } from './messages';

function onboardingStatus(status: string): string {
  if (status === 'pending') return 'pendiente';
  if (status === 'active') return 'completado';
  return 'desactivado';
}

export function ManagerDevelopersPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const [rows, setRows] = useState<ManagerDeveloperSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listManagerDevelopers());
    } catch (e) {
      setError(e instanceof ApiError && !isTechnicalFailure(e) ? e.message : MESSAGES.loadFailure);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listManagerDevelopers();
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof ApiError && !isTechnicalFailure(e) ? e.message : MESSAGES.loadFailure,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q),
    );
  }, [rows, debouncedSearch]);

  async function toggleActive(u: ManagerDeveloperSummary) {
    try {
      if (u.is_active) {
        await deactivateDeveloperByManager(u.id);
      } else {
        await reactivateDeveloperByManager(u.id);
      }
      await load();
    } catch (e) {
      setError(
        e instanceof ApiError && !isTechnicalFailure(e) ? e.message : MESSAGES.technicalFailure,
      );
    }
  }

  return (
    <>
      {error ? (
        <p className="mb-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mb-4 max-w-md">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar desarrollador…"
          className="h-10 w-full"
        />
      </div>
      {loading ? (
        <p className="text-sm text-[#9CA3AF]" role="status">
          Cargando equipo…
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-[#12131C] px-4 py-8 text-center text-sm text-[#9CA3AF]">
          {USER_MESSAGES.emptyList}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#12131C]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-[#0A0B0E] text-xs uppercase tracking-wide text-[#9CA3AF]">
              <tr>
                <th className="px-4 py-3 font-medium">Desarrollador</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Estado invitación</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size={32} />
                      <span className="font-medium text-[#F9FAFB]">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#9CA3AF]">{u.email}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={onboardingStatus(u.status)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {u.is_active ? (
                        <IconActionButton
                          icon={UserX}
                          label="Desactivar desarrollador"
                          tone="amber"
                          onClick={() => void toggleActive(u)}
                        />
                      ) : (
                        <IconActionButton
                          icon={UserCheck}
                          label="Reactivar desarrollador"
                          tone="emerald"
                          onClick={() => void toggleActive(u)}
                        />
                      )}
                      <IconActionButton
                        icon={Trash2}
                        label="Eliminar del equipo (desactivar)"
                        tone="red"
                        onClick={() => void toggleActive(u)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
