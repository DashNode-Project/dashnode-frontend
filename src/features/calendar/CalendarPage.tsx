import { ChevronLeft, ChevronRight, Video } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { listMeetings } from '@/features/availability/api';
import type { MeetingDTO } from '@/features/availability/types';
import { Card, SectionHeader } from '@/components/ui/demo-ui';
import { useToast } from '@/lib/toast/ToastProvider';
import { AVAILABILITY_MESSAGES } from '@/features/availability/messages';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function CalendarPage() {
  const { showToast } = useToast();
  const [meetings, setMeetings] = useState<MeetingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listMeetings();
        if (!cancelled) setMeetings(data);
      } catch {
        if (!cancelled) showToast(AVAILABILITY_MESSAGES.technicalLoadFailure, 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const meetingsByDate = useMemo(() => {
    const map = new Map<string, MeetingDTO[]>();
    for (const m of meetings) {
      if (m.status === 'cancelled') continue;
      const list = map.get(m.date) ?? [];
      list.push(m);
      map.set(m.date, list);
    }
    return map;
  }, [meetings]);

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = new Date(year, month, 1).toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
  });

  const selectedMeetings = selectedDay ? (meetingsByDate.get(selectedDay) ?? []) : [];

  return (
    <div>
      <SectionHeader title="Calendario" subtitle="Reuniones agendadas en DashNode" />
      {loading ? (
        <p className="text-sm text-[#9CA3AF]">Cargando…</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between border-b border-white/6 pb-3">
              <button
                type="button"
                aria-label="Mes anterior"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-white/8"
                onClick={() => {
                  if (month === 0) {
                    setMonth(11);
                    setYear((y) => y - 1);
                  } else setMonth((m) => m - 1);
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <h2 className="text-sm font-semibold capitalize text-[#F9FAFB]">{monthLabel}</h2>
              <button
                type="button"
                aria-label="Mes siguiente"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-white/8"
                onClick={() => {
                  if (month === 11) {
                    setMonth(0);
                    setYear((y) => y + 1);
                  } else setMonth((m) => m + 1);
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#6B7280]">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-1 font-medium">
                  {d}
                </div>
              ))}
              {cells.map((day, idx) => {
                if (day === null) return <div key={`e-${idx}`} />;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const count = meetingsByDate.get(dateStr)?.length ?? 0;
                const isSelected = selectedDay === dateStr;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDay(dateStr)}
                    className={`min-h-[52px] rounded-lg border p-1 text-left transition-colors ${
                      isSelected
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-transparent hover:bg-white/5'
                    }`}
                  >
                    <span className="text-sm text-[#F9FAFB]">{day}</span>
                    {count > 0 ? (
                      <span className="mt-1 block text-[10px] text-violet-300">{count} reun.</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-[#F9FAFB]">
              {selectedDay
                ? new Date(`${selectedDay}T12:00:00`).toLocaleDateString('es-CO', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })
                : 'Seleccione un día'}
            </h3>
            {selectedMeetings.length === 0 ? (
              <p className="text-sm text-[#6B7280]">Sin reuniones este día.</p>
            ) : (
              <ul className="space-y-3">
                {selectedMeetings.map((m) => (
                  <li key={m.id} className="flex gap-2 rounded-lg bg-white/5 p-2">
                    <Video size={14} className="mt-0.5 shrink-0 text-violet-400" />
                    <div>
                      <p className="text-sm font-medium text-[#F9FAFB]">{m.title}</p>
                      <p className="text-xs text-[#9CA3AF]">
                        {m.start_time} – {m.end_time}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
