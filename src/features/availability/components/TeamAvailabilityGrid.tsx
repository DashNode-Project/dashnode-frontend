import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Users, AlertCircle } from 'lucide-react';
import { useToast } from '@/lib/toast/ToastProvider';
import { useAuth } from '@/features/auth/AuthContext';
import { ApiError } from '@/lib/api/errors';
import type { DayKey, TeamUserAvailability } from '../types';
import { DAY_KEYS_LIST, DAY_NAMES, AVAILABILITY_MESSAGES } from '../messages';
import {
  getMondayOfWeek,
  addWeeks,
  formatWeekRange,
  getDateForWeekday,
  slotsToHourlyGrid,
} from '../utils';
import { getTeamAvailability } from '../api';

const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);

export function TeamAvailabilityGrid() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [currentWeek, setCurrentWeek] = useState(() => getMondayOfWeek());
  const [loading, setLoading] = useState(false);
  const [usersAvailability, setUsersAvailability] = useState<TeamUserAvailability[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayKey>('monday');
  const [apiDenied, setApiDenied] = useState(false);

  // If user is developer, immediately mark denied
  const isAuthorized = user?.role === 'admin' || user?.role === 'manager';
  const denied = !isAuthorized || apiDenied;

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    let active = true;
    async function loadTeam() {
      setLoading(true);
      setApiDenied(false);
      try {
        const data = await getTeamAvailability(currentWeek);
        if (!active) return;
        setUsersAvailability(data.users);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 403) {
          setApiDenied(true);
        } else {
          showToast(AVAILABILITY_MESSAGES.technicalLoadFailure, 'error');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadTeam();
    return () => {
      active = false;
    };
  }, [currentWeek, isAuthorized, showToast]);

  if (denied || !isAuthorized) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center space-y-2">
        <AlertCircle size={24} className="mx-auto text-red-400" />
        <h3 className="text-sm font-semibold text-red-400">Acceso restringido</h3>
        <p className="text-xs text-[#9CA3AF]">{AVAILABILITY_MESSAGES.accessDenied}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week Selector and Day filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#12131C] p-4 rounded-xl border border-white/6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#1E1F2B] rounded-lg p-1 border border-white/8">
            <button
              type="button"
              onClick={() => setCurrentWeek((w) => addWeeks(w, -1))}
              disabled={loading}
              aria-label="Semana anterior"
              className="p-1.5 rounded text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-xs font-medium text-[#F9FAFB]">
              {formatWeekRange(currentWeek)}
            </span>
            <button
              type="button"
              onClick={() => setCurrentWeek((w) => addWeeks(w, 1))}
              disabled={loading}
              aria-label="Semana siguiente"
              className="p-1.5 rounded text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5 disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setCurrentWeek(getMondayOfWeek())}
            disabled={loading}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Hoy
          </button>
        </div>

        {/* Day selection tabs */}
        <div className="flex items-center gap-1 overflow-x-auto bg-[#1A1C28] p-1 rounded-lg border border-white/6">
          {DAY_KEYS_LIST.map((day) => {
            const dateStr = getDateForWeekday(currentWeek, day);
            const [, , dNum] = dateStr.split('-');
            const isActive = selectedDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5'
                }`}
              >
                {DAY_NAMES[day]} {dNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-[#9CA3AF] px-1">
        <p className="flex items-center gap-1.5">
          <Users size={14} className="text-[#6B7280]" />
          Visualizando {usersAvailability.length} integrante
          {usersAvailability.length !== 1 ? 's' : ''} del equipo para el{' '}
          <strong className="text-[#F9FAFB]">{DAY_NAMES[selectedDay]}</strong>.
        </p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold bg-emerald-500/25 border border-emerald-500/40 text-emerald-400">
              D
            </span>
            Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold bg-white/4 border border-white/8 text-[#4B5563]">
              ND
            </span>
            No disponible
          </span>
        </div>
      </div>

      {/* Team Grid Table: 1 row per user, columns = 24 hours */}
      <div className="bg-[#12131C] rounded-xl border border-white/6 overflow-hidden">
        {usersAvailability.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#6B7280]">
            No hay integrantes visibles en esta semana.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-[#1A1C28] border-b border-white/10 sticky top-0 z-10">
                <tr>
                  <th className="p-3 text-xs font-semibold text-[#9CA3AF] w-48 sticky left-0 bg-[#1A1C28] z-20 border-r border-white/6">
                    Usuario
                  </th>
                  {HOURS_24.map((hour) => (
                    <th
                      key={hour}
                      className="p-1.5 text-center text-[11px] font-mono font-medium text-[#6B7280] border-r border-white/4 w-9"
                    >
                      {String(hour).padStart(2, '0')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usersAvailability.map((member) => {
                  const daySlots = member.slots[selectedDay] ?? [];
                  const hourBooleans = slotsToHourlyGrid(daySlots);
                  return (
                    <tr
                      key={member.user_id}
                      className="border-b border-white/4 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="p-3 text-xs font-medium text-[#F9FAFB] sticky left-0 bg-[#12131C] z-10 border-r border-white/6 truncate max-w-[200px]">
                        <div>{member.name}</div>
                        <div className="text-[10px] text-[#6B7280] font-normal truncate">
                          {member.email} · {member.role}
                        </div>
                      </td>
                      {HOURS_24.map((hour) => {
                        const isAvail = hourBooleans[hour];
                        return (
                          <td key={hour} className="p-1 text-center border-r border-white/4">
                            <span
                              aria-label={`${member.name} ${String(hour).padStart(2, '0')}:00 - ${
                                isAvail ? 'Disponible' : 'No disponible'
                              }`}
                              className={`inline-flex items-center justify-center w-7 h-7 rounded text-[10px] font-bold transition-colors select-none ${
                                isAvail
                                  ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-white/[0.02] text-[#4B5563] border border-white/4'
                              }`}
                            >
                              {isAvail ? 'D' : 'ND'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
