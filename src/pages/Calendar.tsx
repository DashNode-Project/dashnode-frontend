import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Video, Plus } from 'lucide-react';
import { useApp } from '../store';
import { AppShell } from '../components/Layout';
import { Button, SectionHeader, Modal, Card, Badge } from '../components/ui';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function Calendar() {
  const { state, navigate } = useApp();
  const { currentUser, meetings, projects, users } = state;
  if (!currentUser) return null;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [viewMeeting, setViewMeeting] = useState<(typeof meetings)[0] | null>(null);

  const role = currentUser.role;
  const myMeetings = role === 'admin'
    ? meetings
    : meetings.filter(m => {
        const proj = projects.find(p => p.id === m.projectId);
        return proj && (proj.managerId === currentUser.id || proj.memberIds.includes(currentUser.id));
      });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setSelectedDay(null); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); setSelectedDay(null); };

  function meetingsForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return myMeetings.filter(m => m.date === dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  function meetingsForMonth() {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return myMeetings.filter(m => m.date.startsWith(prefix));
  }

  const isToday = (day: number) => now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
  const isSelected = (day: number) => selectedDay === day;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedDayMeetings = selectedDay ? meetingsForDay(selectedDay) : [];
  const monthMeetings = meetingsForMonth();

  const statusColor = (s: string) => ({ scheduled: '#3B82F6', completed: '#10B981', cancelled: '#EF4444' }[s] ?? '#6B7280');

  return (
    <AppShell title="Calendario">
      <SectionHeader
        title="Calendario"
        description={`${monthMeetings.length} reuniones en ${MONTHS[month]} ${year}`}
        actions={
          role !== 'developer' && (
            <Button icon={<Plus size={15} />} onClick={() => navigate({ page: 'meetings' })}>Programar reunión</Button>
          )
        }
      />

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Calendar grid */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-5">
              <button onClick={prevMonth} className="w-8 h-8 rounded-md flex items-center justify-center text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/8 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <h2 className="font-bold text-[#F9FAFB]">{MONTHS[month]} {year}</h2>
              <button onClick={nextMonth} className="w-8 h-8 rounded-md flex items-center justify-center text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/8 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS_SHORT.map(d => (
                <div key={d} className="text-center text-xs font-medium text-[#6B7280] py-2">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const dayMeetings = meetingsForDay(day);
                const today = isToday(day);
                const selected = isSelected(day);
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(selected ? null : day)}
                    className={`min-h-[72px] p-1.5 rounded-lg border text-left transition-colors relative ${
                      selected ? 'border-blue-500/50 bg-blue-500/10' :
                      today ? 'border-blue-500/30 bg-blue-500/5' :
                      'border-white/4 hover:border-white/12 hover:bg-white/2'
                    }`}
                  >
                    <span className={`text-xs font-semibold block mb-1 ${today ? 'text-blue-400' : selected ? 'text-blue-300' : 'text-[#9CA3AF]'}`}>{day}</span>
                    <div className="flex flex-col gap-0.5">
                      {dayMeetings.slice(0, 2).map(m => (
                        <button key={m.id} onClick={e => { e.stopPropagation(); setViewMeeting(m); }}
                          className="text-left w-full text-xs px-1 py-0.5 rounded truncate transition-colors hover:opacity-80"
                          style={{ background: `${statusColor(m.status)}25`, color: statusColor(m.status) }}>
                          {m.startTime}
                        </button>
                      ))}
                      {dayMeetings.length > 2 && (
                        <span className="text-xs text-[#6B7280] px-1">+{dayMeetings.length - 2}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/6">
              <div className="flex items-center gap-1.5 text-xs text-[#6B7280]"><div className="w-2 h-2 rounded-full bg-blue-400" />Programada</div>
              <div className="flex items-center gap-1.5 text-xs text-[#6B7280]"><div className="w-2 h-2 rounded-full bg-emerald-400" />Completada</div>
              <div className="flex items-center gap-1.5 text-xs text-[#6B7280]"><div className="w-2 h-2 rounded-full bg-red-400" />Cancelada</div>
            </div>
          </Card>
        </div>

        {/* Right panel: selected day or month list */}
        <div className="space-y-4">
          {selectedDay && (
            <Card className="p-4">
              <h3 className="font-semibold text-[#F9FAFB] mb-3">
                {DAYS_FULL[new Date(year, month, selectedDay).getDay()]} {selectedDay} de {MONTHS[month]}
              </h3>
              {selectedDayMeetings.length === 0 ? (
                <p className="text-sm text-[#6B7280]">Sin reuniones este día.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {selectedDayMeetings.map(m => {
                    const proj = projects.find(p => p.id === m.projectId);
                    return (
                      <button key={m.id} onClick={() => setViewMeeting(m)}
                        className="flex items-start gap-2 p-2.5 rounded-lg bg-[#1E1F2B] hover:bg-[#20222D] transition-colors text-left w-full border border-white/4">
                        <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5" style={{ background: statusColor(m.status) }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#F9FAFB] truncate">{m.title}</p>
                          <p className="text-xs text-[#6B7280]">{m.startTime} · {m.duration}min</p>
                          {proj && <p className="text-xs text-[#9CA3AF]">{proj.name}</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* Month events list */}
          <Card className="p-4">
            <h3 className="font-semibold text-[#F9FAFB] mb-3">
              {MONTHS[month]} {year} ({monthMeetings.length})
            </h3>
            {monthMeetings.length === 0 ? (
              <p className="text-sm text-[#6B7280]">Sin reuniones este mes.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                {monthMeetings.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).map(m => {
                  const dayNum = parseInt(m.date.slice(-2));
                  const proj = projects.find(p => p.id === m.projectId);
                  return (
                    <button key={m.id} onClick={() => { setViewMeeting(m); setSelectedDay(dayNum); }}
                      className="flex items-center gap-3 py-2 border-b border-white/4 last:border-0 text-left w-full hover:bg-white/2 rounded px-1 transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: `${statusColor(m.status)}15`, color: statusColor(m.status) }}>
                        {dayNum}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#F9FAFB] truncate">{m.title}</p>
                        <p className="text-xs text-[#6B7280]">{m.startTime} · {proj?.name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Meeting detail modal */}
      {viewMeeting && (
        <Modal open={!!viewMeeting} onClose={() => setViewMeeting(null)} title={viewMeeting.title} size="md">
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-[#9CA3AF]">{viewMeeting.date} · {viewMeeting.startTime} · {viewMeeting.duration}min</span>
              <Badge variant={viewMeeting.status === 'completed' ? 'green' : viewMeeting.status === 'cancelled' ? 'red' : 'blue'}>
                {{ scheduled: 'Programada', completed: 'Completada', cancelled: 'Cancelada' }[viewMeeting.status]}
              </Badge>
            </div>
            {(() => {
              const proj = projects.find(p => p.id === viewMeeting.projectId);
              return proj && <p className="text-sm text-[#9CA3AF]">Proyecto: {proj.name}</p>;
            })()}
            {viewMeeting.description && <p className="text-sm text-[#9CA3AF]">{viewMeeting.description}</p>}
            <div>
              <p className="text-xs text-[#6B7280] mb-2">Participantes</p>
              <div className="flex flex-wrap gap-2">
                {users.filter(u => viewMeeting.participantIds.includes(u.id)).map(u => (
                  <div key={u.id} className="flex items-center gap-1.5 bg-[#1E1F2B] border border-white/8 rounded-md px-2 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span className="text-xs text-[#9CA3AF]">{u.name} {u.lastName}</span>
                  </div>
                ))}
              </div>
            </div>
            {viewMeeting.summary && (
              <div className="bg-[#1E1F2B] border border-white/8 rounded-lg p-3">
                <p className="text-xs text-[#6B7280] mb-1">Resumen</p>
                <p className="text-sm text-[#F9FAFB]">{viewMeeting.summary}</p>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              <a href={viewMeeting.link} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="sm" icon={<Video size={13} />}>Unirse</Button>
              </a>
              <Button variant="ghost" size="sm" onClick={() => navigate({ page: 'meetings' })}>Ver en Reuniones</Button>
            </div>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
