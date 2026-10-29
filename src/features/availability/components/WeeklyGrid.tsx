import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save, RotateCcw, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/toast/ToastProvider';
import { ApiError } from '@/lib/api/errors';
import type { DayKey, WeeklySlots } from '../types';
import { DAY_KEYS_LIST, DAY_NAMES, AVAILABILITY_MESSAGES } from '../messages';
import {
  getMondayOfWeek,
  addWeeks,
  formatWeekRange,
  getDateForWeekday,
  slotsToHourlyGrid,
  hourlyGridToSlots,
  areWeeklySlotsEqual,
} from '../utils';
import { getMyAvailability, saveMyAvailability } from '../api';

const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);

export function WeeklyGrid() {
  const { showToast } = useToast();
  const [currentWeek, setCurrentWeek] = useState(() => getMondayOfWeek());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isInherited, setIsInherited] = useState(false);

  // Stored state from backend
  const [savedSlots, setSavedSlots] = useState<WeeklySlots>(() => ({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  }));

  // Editable grid state: Record<DayKey, boolean[24]>
  const [gridState, setGridState] = useState<Record<DayKey, boolean[]>>(() => {
    const initial: Record<string, boolean[]> = {};
    for (const d of DAY_KEYS_LIST) {
      initial[d] = Array<boolean>(24).fill(false);
    }
    return initial as Record<DayKey, boolean[]>;
  });

  // Load availability when week changes
  useEffect(() => {
    let active = true;
    async function loadWeek() {
      setLoading(true);
      try {
        const data = await getMyAvailability(currentWeek);
        if (!active) return;
        setSavedSlots(data.slots);
        setIsInherited(data.is_inherited);

        const newGrid: Record<string, boolean[]> = {};
        for (const d of DAY_KEYS_LIST) {
          newGrid[d] = slotsToHourlyGrid(data.slots[d] ?? []);
        }
        setGridState(newGrid as Record<DayKey, boolean[]>);
      } catch {
        if (!active) return;
        showToast(AVAILABILITY_MESSAGES.technicalLoadFailure, 'error');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadWeek();
    return () => {
      active = false;
    };
  }, [currentWeek, showToast]);

  // Convert current gridState back to WeeklySlots for comparison and saving
  const currentWeeklySlots: WeeklySlots = useMemo(() => {
    const slots: Record<string, ReturnType<typeof hourlyGridToSlots>> = {};
    for (const d of DAY_KEYS_LIST) {
      slots[d] = hourlyGridToSlots(gridState[d]);
    }
    return slots as WeeklySlots;
  }, [gridState]);

  const hasChanges = useMemo(() => {
    return !areWeeklySlotsEqual(savedSlots, currentWeeklySlots);
  }, [savedSlots, currentWeeklySlots]);

  const toggleHour = (day: DayKey, hour: number) => {
    setGridState((prev) => {
      const nextDayHours = [...prev[day]];
      nextDayHours[hour] = !nextDayHours[hour];
      return {
        ...prev,
        [day]: nextDayHours,
      };
    });
  };

  const handleCancelChanges = () => {
    const resetGrid: Record<string, boolean[]> = {};
    for (const d of DAY_KEYS_LIST) {
      resetGrid[d] = slotsToHourlyGrid(savedSlots[d] ?? []);
    }
    setGridState(resetGrid as Record<DayKey, boolean[]>);
  };

  const handleSave = async () => {
    if (!hasChanges) {
      showToast(AVAILABILITY_MESSAGES.noChangesToSave, 'info');
      return;
    }

    setSaving(true);
    try {
      const res = await saveMyAvailability({
        week_start_date: currentWeek,
        slots: currentWeeklySlots,
      });
      setSavedSlots(currentWeeklySlots);
      setIsInherited(false);
      showToast(res.message || AVAILABILITY_MESSAGES.availabilitySaved, 'success');
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && err.code === 'NO_CHANGES_TO_SAVE') {
        showToast(AVAILABILITY_MESSAGES.noChangesToSave, 'info');
      } else {
        showToast(AVAILABILITY_MESSAGES.technicalFailure, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Week Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#12131C] p-4 rounded-xl border border-white/6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#1E1F2B] rounded-lg p-1 border border-white/8">
            <button
              type="button"
              onClick={() => setCurrentWeek((w) => addWeeks(w, -1))}
              disabled={loading || saving}
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
              disabled={loading || saving}
              aria-label="Semana siguiente"
              className="p-1.5 rounded text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5 disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setCurrentWeek(getMondayOfWeek())}
            disabled={loading || saving}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Hoy
          </button>
          {isInherited && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full"
              title="Disponibilidad reutilizada de la última semana guardada"
            >
              <Info size={11} />
              Heredada
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancelChanges}
            disabled={!hasChanges || saving || loading}
          >
            <RotateCcw size={14} className="mr-1.5" />
            Cancelar cambios
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving || loading}
          >
            <Save size={14} className="mr-1.5" />
            {saving ? 'Guardando…' : 'Guardar disponibilidad'}
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-[#9CA3AF] px-1">
        <p>Haz clic en cualquier bloque de una hora para alternar disponibilidad.</p>
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

      {/* Weekly Grid (7 cols x 24 rows) */}
      <div className="bg-[#12131C] rounded-xl border border-white/6 overflow-hidden">
        <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="sticky top-0 bg-[#1A1C28] z-10 border-b border-white/10">
              <tr>
                <th className="w-16 p-2 text-center text-xs font-semibold text-[#6B7280]">Hora</th>
                {DAY_KEYS_LIST.map((day) => {
                  const dateStr = getDateForWeekday(currentWeek, day);
                  const [, , dayNum] = dateStr.split('-');
                  return (
                    <th key={day} className="p-2 text-center border-l border-white/6">
                      <div className="text-xs font-semibold text-[#F9FAFB]">{DAY_NAMES[day]}</div>
                      <div className="text-[11px] text-[#6B7280]">{dayNum}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {HOURS_24.map((hour) => {
                const hourFormatted = `${String(hour).padStart(2, '0')}:00`;
                return (
                  <tr
                    key={hour}
                    className="border-b border-white/4 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="p-1.5 text-center text-xs font-mono text-[#6B7280] select-none">
                      {hourFormatted}
                    </td>
                    {DAY_KEYS_LIST.map((day) => {
                      const isAvailable = gridState[day][hour];
                      return (
                        <td key={day} className="p-1 border-l border-white/6 text-center">
                          <button
                            type="button"
                            onClick={() => toggleHour(day, hour)}
                            disabled={loading || saving}
                            aria-label={`${DAY_NAMES[day]} ${hourFormatted} - ${isAvailable ? 'Disponible' : 'No disponible'}`}
                            className={`w-full py-1.5 px-2 rounded text-xs font-semibold transition-all duration-150 select-none ${
                              isAvailable
                                ? 'bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950/20'
                                : 'bg-white/[0.03] hover:bg-white/[0.08] text-[#4B5563] border border-white/6'
                            }`}
                          >
                            {isAvailable ? 'D' : 'ND'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
