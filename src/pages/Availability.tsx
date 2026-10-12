import React, { useState } from 'react';
import { Clock, Calculator, Check, AlertCircle, Calendar as CalIcon, List, Users, ChevronDown } from 'lucide-react';
import { useApp } from '../store';
import { AppShell } from '../components/Layout';
import { Button, Avatar, SectionHeader, Card, Select, Input, Modal } from '../components/ui';
import { WeeklyAvailability, TimeRange } from '../types';

const DAY_KEYS: (keyof WeeklyAvailability)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
  thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
};
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minutesToTime(m: number): string {
  return `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
}

function nextWeekdayDate(dayKey: keyof WeeklyAvailability): string {
  const idx: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  const target = idx[dayKey];
  const today = new Date();
  let diff = (target - today.getDay() + 7) % 7;
  if (diff === 0) diff = 7;
  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

// Find intersection of available time slots across users
function findCommonAvailableSlots(
  usersAvail: WeeklyAvailability[],
  dayKey: keyof WeeklyAvailability,
  rangeStart: number,
  rangeEnd: number,
  minDuration: number,
): TimeRange[] {
  if (!usersAvail.length) return [];
  const clip = (slots: TimeRange[]) =>
    slots
      .map(s => ({ start: Math.max(timeToMinutes(s.start), rangeStart), end: Math.min(timeToMinutes(s.end), rangeEnd) }))
      .filter(s => s.end - s.start >= minDuration)
      .map(s => ({ start: minutesToTime(s.start), end: minutesToTime(s.end) }));

  let common = clip(usersAvail[0][dayKey] ?? []);
  for (let i = 1; i < usersAvail.length; i++) {
    const next: TimeRange[] = [];
    const b = clip(usersAvail[i][dayKey] ?? []);
    for (const a of common) {
      for (const bSlot of b) {
        const start = Math.max(timeToMinutes(a.start), timeToMinutes(bSlot.start));
        const end = Math.min(timeToMinutes(a.end), timeToMinutes(bSlot.end));
        if (end - start >= minDuration) next.push({ start: minutesToTime(start), end: minutesToTime(end) });
      }
    }
    common = next;
  }
  return common;
}

// ─── Visual grid: shows available slots as green blocks ───────────────────────
function AvailabilityGrid({ availability, label }: { availability: WeeklyAvailability; label: string }) {
  const daysToShow = DAY_KEYS.filter(d => (availability[d] ?? []).length > 0);
  if (daysToShow.length === 0)
    return <p className="text-xs text-[#6B7280] py-4 text-center">Sin disponibilidad configurada.</p>;
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        {label && <p className="text-xs font-medium text-[#9CA3AF] mb-2">{label}</p>}
        <div className="flex gap-px mb-1">
          <div className="w-12 shrink-0" />
          {daysToShow.map(d => (
            <div key={d} className="flex-1 text-center text-xs text-[#6B7280]">{DAY_LABELS[d].slice(0, 3)}</div>
          ))}
        </div>
        {HOURS.map(h => (
          <div key={h} className="flex gap-px" style={{ height: 22 }}>
            <div className="w-12 shrink-0 text-xs text-[#4B5563] text-right pr-2 leading-[22px]">{h}:00</div>
            {daysToShow.map(d => {
              const slots = availability[d] ?? [];
              const inSlot = slots.some(s => {
                const sh = timeToMinutes(s.start), eh = timeToMinutes(s.end), hm = h * 60;
                return hm >= sh && hm < eh;
              });
              return (
                <div key={d} className={`flex-1 border-b border-white/4 rounded-sm transition-colors ${inSlot ? 'bg-emerald-500/25 border-b-emerald-500/20' : ''}`} />
              );
            })}
          </div>
        ))}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <div className="w-3 h-3 rounded-sm bg-emerald-500/25" />Disponible
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <div className="w-3 h-3 rounded-sm bg-white/4 border border-white/8" />No disponible
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Selectable result grid for calculator output ─────────────────────────────
function SelectableSlotGrid({ results, onSelect }: {
  results: Record<string, TimeRange[]>;
  onSelect: (dayKey: keyof WeeklyAvailability, slot: TimeRange) => void;
}) {
  const activeDays = DAY_KEYS.filter(d => (results[d] ?? []).length > 0);
  if (activeDays.length === 0)
    return (
      <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
        <AlertCircle size={15} className="text-amber-400 shrink-0" />
        <p className="text-sm text-amber-400">No se encontraron franjas libres comunes con esos parámetros.</p>
      </div>
    );
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {activeDays.map(d => (
        <div key={d} className="bg-[#0A0B0E] rounded-xl p-3 border border-white/6">
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">{DAY_LABELS[d]}</p>
          <div className="flex flex-col gap-1.5">
            {results[d].map((slot, i) => {
              const dur = timeToMinutes(slot.end) - timeToMinutes(slot.start);
              return (
                <button
                  key={i}
                  onClick={() => onSelect(d as keyof WeeklyAvailability, slot)}
                  className="flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/25 hover:bg-emerald-500/18 hover:border-emerald-500/50 rounded-lg px-3 py-2 transition-colors text-left group"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-mono text-emerald-400 group-hover:text-emerald-300 block">
                      {slot.start} – {slot.end}
                    </span>
                    <span className="text-xs text-[#6B7280]">{dur}min</span>
                  </div>
                  <span className="text-emerald-500/50 group-hover:text-emerald-400 text-xs">→</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Availability() {
  const { state, dispatch, showToast, navigate } = useApp();
  const { currentUser, users, projects } = state;
  if (!currentUser) return null;

  const isManager = currentUser.role === 'manager' || currentUser.role === 'admin';
  const myProjects = isManager
    ? projects
    : projects.filter(p => p.memberIds.includes(currentUser.id));

  // ── View state ─────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [viewProjectId, setViewProjectId] = useState(myProjects[0]?.id ?? '');
  const [viewFilter, setViewFilter] = useState<'common' | string>('common');
  const [viewDay, setViewDay] = useState<keyof WeeklyAvailability | 'all'>('all');

  const viewProject = projects.find(p => p.id === viewProjectId);
  const viewMembers = viewProject
    ? users.filter(u => viewProject.memberIds.includes(u.id) && u.availability)
    : [];

  // Build common availability from free slot intersection
  function getCommonAvail(dayKey: keyof WeeklyAvailability | 'all'): Record<string, TimeRange[]> {
    const avList = viewMembers.map(u => u.availability!);
    const days = dayKey === 'all' ? DAY_KEYS : [dayKey as keyof WeeklyAvailability];
    const result: Record<string, TimeRange[]> = {};
    for (const d of days) {
      result[d] = findCommonAvailableSlots(avList, d, 7 * 60, 20 * 60, 30);
    }
    return result;
  }

  // Build WeeklyAvailability from a slot map (for AvailabilityGrid display)
  function slotsToAvailability(slots: Record<string, TimeRange[]>): WeeklyAvailability {
    const base: WeeklyAvailability = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] };
    for (const d of DAY_KEYS) base[d] = slots[d] ?? [];
    return base;
  }

  // ── Calculator state (manager only) ───────────────────────────────────────
  const [calcProjectId, setCalcProjectId] = useState('');
  const [calcParticipants, setCalcParticipants] = useState<string[]>([]);
  const [calcDay, setCalcDay] = useState<keyof WeeklyAvailability | 'all'>('monday');
  const [calcDuration, setCalcDuration] = useState('60');
  const [calcStart, setCalcStart] = useState('08:00');
  const [calcEnd, setCalcEnd] = useState('18:00');
  const [calcResults, setCalcResults] = useState<Record<string, TimeRange[]> | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcResultView, setCalcResultView] = useState<'visual' | 'list'>('visual');

  const calcProject = projects.find(p => p.id === calcProjectId);
  const calcProjectMembers = calcProject ? users.filter(u => calcProject.memberIds.includes(u.id)) : [];

  async function calculate() {
    if (!calcParticipants.length) { showToast('Selecciona al menos un participante.', 'error'); return; }
    setCalcLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const avList = calcParticipants.map(uid => {
      const u = users.find(u => u.id === uid);
      return u?.availability ?? { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] };
    });
    const days = calcDay === 'all' ? DAY_KEYS : [calcDay as keyof WeeklyAvailability];
    const results: Record<string, TimeRange[]> = {};
    for (const d of days) {
      results[d] = findCommonAvailableSlots(avList, d, timeToMinutes(calcStart), timeToMinutes(calcEnd), parseInt(calcDuration));
    }
    setCalcResults(results);
    setCalcLoading(false);
  }

  // ── Meeting creation overlay ───────────────────────────────────────────────
  const [selectedSlot, setSelectedSlot] = useState<{ dayKey: keyof WeeklyAvailability; slot: TimeRange } | null>(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [creatingMeeting, setCreatingMeeting] = useState(false);

  function handleSlotSelect(dayKey: keyof WeeklyAvailability, slot: TimeRange) {
    setSelectedSlot({ dayKey, slot });
    setMeetingTitle('');
    setMeetingLink(calcProject?.meetingLink ?? viewProject?.meetingLink ?? '');
  }

  async function createMeeting() {
    if (!selectedSlot || !meetingTitle.trim()) return;
    setCreatingMeeting(true);
    await new Promise(r => setTimeout(r, 400));
    const projectId = calcProjectId || viewProjectId;
    const participants = calcParticipants.length ? calcParticipants : viewMembers.map(u => u.id);
    const date = nextWeekdayDate(selectedSlot.dayKey);
    const dur = timeToMinutes(selectedSlot.slot.end) - timeToMinutes(selectedSlot.slot.start);
    dispatch({
      type: 'ADD_MEETING',
      meeting: {
        id: `m${Date.now()}`,
        projectId,
        title: meetingTitle,
        description: `Agendada desde el módulo de disponibilidad. Franja: ${selectedSlot.slot.start}–${selectedSlot.slot.end} ${DAY_LABELS[selectedSlot.dayKey]}.`,
        date,
        startTime: selectedSlot.slot.start,
        duration: dur,
        participantIds: participants,
        link: meetingLink || (calcProject?.meetingLink ?? viewProject?.meetingLink ?? ''),
        status: 'scheduled',
        creatorId: currentUser?.id ?? '',
      },
    });
    setCreatingMeeting(false);
    setSelectedSlot(null);
    showToast('Reunión creada. Puedes verla en el Calendario.');
    navigate({ page: 'calendar' });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <AppShell title="Disponibilidad">
      <SectionHeader
        title="Disponibilidad"
        description="Visualiza las franjas libres del equipo y agenda reuniones desde los bloques disponibles."
      />

      {/* ── Calculator (manager only, full width) ────────────────────────── */}
      {isManager && (
        <Card className="p-5 mb-6">
          <h2 className="text-sm font-semibold text-[#F9FAFB] flex items-center gap-2 mb-4">
            <Calculator size={15} className="text-violet-400" />
            Calcular disponibilidad común
          </h2>
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Left: parameters */}
            <div className="flex flex-col gap-4">
              <Select
                label="Proyecto"
                value={calcProjectId}
                onChange={e => { setCalcProjectId(e.target.value); setCalcParticipants([]); setCalcResults(null); }}
                options={[{ value: '', label: 'Seleccionar proyecto…' }, ...myProjects.map(p => ({ value: p.id, label: p.name }))]}
              />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Día"
                  value={calcDay as string}
                  onChange={e => setCalcDay(e.target.value as any)}
                  options={[
                    { value: 'all', label: 'Toda la semana' },
                    ...DAY_KEYS.map(d => ({ value: d, label: DAY_LABELS[d] })),
                  ]}
                />
                <Select
                  label="Duración mínima"
                  value={calcDuration}
                  onChange={e => setCalcDuration(e.target.value)}
                  options={[
                    { value: '15', label: '15 min' }, { value: '30', label: '30 min' },
                    { value: '45', label: '45 min' }, { value: '60', label: '1 hora' },
                    { value: '90', label: '1.5h' }, { value: '120', label: '2h' },
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Rango desde" type="time" value={calcStart} onChange={e => setCalcStart(e.target.value)} />
                <Input label="Rango hasta" type="time" value={calcEnd} onChange={e => setCalcEnd(e.target.value)} />
              </div>
            </div>
            {/* Right: participants */}
            <div>
              <label className="block text-sm font-medium text-[#F9FAFB] mb-1.5">Participantes</label>
              {!calcProjectId ? (
                <div className="flex items-center justify-center h-32 bg-[#0A0B0E] rounded-lg border border-white/6">
                  <p className="text-xs text-[#4B5563]">Selecciona un proyecto primero.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto bg-[#0A0B0E] rounded-lg border border-white/6 p-2">
                  {calcProjectMembers.map(u => {
                    const hasAv = !!u.availability;
                    return (
                      <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/4 rounded px-2 py-1.5 transition-colors">
                        <input
                          type="checkbox"
                          checked={calcParticipants.includes(u.id)}
                          disabled={!hasAv}
                          onChange={e => setCalcParticipants(p => e.target.checked ? [...p, u.id] : p.filter(id => id !== u.id))}
                          className="accent-blue-500"
                        />
                        <Avatar name={`${u.name} ${u.lastName}`} size={22} />
                        <span className={`text-xs ${hasAv ? 'text-[#9CA3AF]' : 'text-[#4B5563]'}`}>
                          {u.name} {u.lastName}{!hasAv && <span className="ml-1 opacity-60">(sin disponibilidad)</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <Button
            onClick={calculate}
            loading={calcLoading}
            disabled={!calcProjectId || !calcParticipants.length}
            icon={<Calculator size={15} />}
            className="w-full mt-4"
          >
            Calcular disponibilidad
          </Button>
        </Card>
      )}

      {/* ── Calculator results (full width) ──────────────────────────────── */}
      {calcResults !== null && (
        <Card className="p-5 mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#F9FAFB]">Franjas libres comunes</h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {calcDay === 'all' ? 'Toda la semana' : DAY_LABELS[calcDay as keyof WeeklyAvailability]}
                {' · '}{calcStart}–{calcEnd}{' · '}mín. {calcDuration}min
                {' · '}{calcParticipants.length} participante{calcParticipants.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-[#12131C] rounded-lg p-1">
              <button
                onClick={() => setCalcResultView('visual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${calcResultView === 'visual' ? 'bg-[#1E1F2B] text-[#F9FAFB]' : 'text-[#6B7280] hover:text-[#9CA3AF]'}`}
              >
                <CalIcon size={12} /> Visual
              </button>
              <button
                onClick={() => setCalcResultView('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${calcResultView === 'list' ? 'bg-[#1E1F2B] text-[#F9FAFB]' : 'text-[#6B7280] hover:text-[#9CA3AF]'}`}
              >
                <List size={12} /> Lista
              </button>
            </div>
          </div>
          <p className="text-xs text-[#6B7280] mb-4 flex items-center gap-1.5">
            <Check size={12} className="text-emerald-400" />
            Haz clic en una franja para agendar una reunión directamente.
          </p>
          {calcResultView === 'visual' ? (
            <SelectableSlotGrid results={calcResults} onSelect={handleSlotSelect} />
          ) : (
            <div className="space-y-5">
              {DAY_KEYS.filter(d => (calcResults[d] ?? []).length > 0).map(d => (
                <div key={d}>
                  <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">{DAY_LABELS[d]}</p>
                  <div className="flex flex-col gap-2">
                    {calcResults[d].map((slot, i) => {
                      const dur = timeToMinutes(slot.end) - timeToMinutes(slot.start);
                      return (
                        <div key={i} className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg px-3 py-2.5 transition-colors">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          <div className="flex-1">
                            <span className="text-sm font-mono text-emerald-400">{slot.start} – {slot.end}</span>
                            <span className="text-xs text-[#6B7280] ml-3">{dur}min disponibles</span>
                          </div>
                          <button
                            onClick={() => handleSlotSelect(d as keyof WeeklyAvailability, slot)}
                            className="shrink-0 px-2.5 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-md hover:bg-emerald-500/35 transition-colors"
                          >
                            Seleccionar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {DAY_KEYS.every(d => !(calcResults[d] ?? []).length) && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <AlertCircle size={15} className="text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-400">No se encontraron franjas libres comunes con esos parámetros.</p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ── Team availability view (full width) ──────────────────────────── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={viewProjectId}
              onChange={e => { setViewProjectId(e.target.value); setViewFilter('common'); }}
              options={[{ value: '', label: 'Seleccionar proyecto…' }, ...myProjects.map(p => ({ value: p.id, label: p.name }))]}
            />
            {viewProjectId && (
              <>
                <Select
                  value={viewFilter}
                  onChange={e => setViewFilter(e.target.value)}
                  options={[
                    { value: 'common', label: '● Disponibilidad común' },
                    ...viewMembers.map(u => ({ value: u.id, label: `${u.name} ${u.lastName}` })),
                  ]}
                />
                <Select
                  value={viewDay as string}
                  onChange={e => setViewDay(e.target.value as any)}
                  options={[
                    { value: 'all', label: 'Toda la semana' },
                    ...DAY_KEYS.map(d => ({ value: d, label: DAY_LABELS[d] })),
                  ]}
                />
              </>
            )}
          </div>
          <div className="flex items-center gap-1 bg-[#12131C] rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'calendar' ? 'bg-[#1E1F2B] text-[#F9FAFB]' : 'text-[#6B7280] hover:text-[#9CA3AF]'}`}
            >
              <CalIcon size={12} /> Calendario
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-[#1E1F2B] text-[#F9FAFB]' : 'text-[#6B7280] hover:text-[#9CA3AF]'}`}
            >
              <List size={12} /> Lista
            </button>
          </div>
        </div>

        {!viewProjectId ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock size={28} className="text-[#374151] mb-3" />
            <p className="text-sm text-[#6B7280]">Selecciona un proyecto para ver la disponibilidad del equipo.</p>
          </div>
        ) : viewMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users size={28} className="text-[#374151] mb-3" />
            <p className="text-sm text-[#6B7280]">Los miembros del proyecto aún no han configurado su disponibilidad.</p>
            <p className="text-xs text-[#4B5563] mt-1">Cada usuario puede hacerlo desde su Perfil.</p>
          </div>
        ) : viewFilter === 'common' ? (
          (() => {
            const common = getCommonAvail(viewDay);
            const hasAny = DAY_KEYS.some(d => (common[d] ?? []).length > 0);
            if (viewMode === 'calendar') {
              return (
                <>
                  <p className="text-xs text-[#6B7280] mb-3">
                    Intersección de disponibilidad de {viewMembers.length} miembro{viewMembers.length !== 1 ? 's' : ''}
                  </p>
                  <AvailabilityGrid availability={slotsToAvailability(common)} label="" />
                </>
              );
            }
            return (
              <div className="space-y-3">
                {(viewDay === 'all' ? DAY_KEYS : [viewDay as keyof WeeklyAvailability]).map(d => {
                  const slots = common[d] ?? [];
                  return (
                    <div key={d} className="flex items-start gap-3">
                      <span className="text-xs font-medium text-[#9CA3AF] w-24 shrink-0 pt-0.5">{DAY_LABELS[d]}</span>
                      <div className="flex flex-wrap gap-2">
                        {slots.length === 0 ? (
                          <span className="text-xs text-[#4B5563]">Sin disponibilidad común</span>
                        ) : (
                          slots.map((s, i) => (
                            <span key={i} className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded">
                              {s.start}–{s.end}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
                {!hasAny && (
                  <p className="text-xs text-[#6B7280] py-4 text-center">
                    No hay franjas en común entre los miembros seleccionados.
                  </p>
                )}
              </div>
            );
          })()
        ) : (
          (() => {
            const user = users.find(u => u.id === viewFilter);
            if (!user?.availability)
              return <p className="text-sm text-[#6B7280] text-center py-8">Sin disponibilidad configurada.</p>;
            if (viewMode === 'calendar')
              return <AvailabilityGrid availability={user.availability} label={`Disponibilidad de ${user.name} ${user.lastName}`} />;
            const daysToShow = viewDay === 'all' ? DAY_KEYS : [viewDay as keyof WeeklyAvailability];
            return (
              <div className="space-y-3">
                {daysToShow.map(d => {
                  const slots = user.availability![d] ?? [];
                  return (
                    <div key={d} className="flex items-start gap-3">
                      <span className="text-xs font-medium text-[#9CA3AF] w-24 shrink-0 pt-0.5">{DAY_LABELS[d]}</span>
                      <div className="flex flex-wrap gap-2">
                        {slots.length === 0 ? (
                          <span className="text-xs text-[#4B5563]">No disponible</span>
                        ) : (
                          slots.map((s, i) => (
                            <span key={i} className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded">
                              {s.start}–{s.end}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()
        )}
      </Card>

      {/* ── Meeting creation modal ────────────────────────────────────────── */}
      <Modal
        open={!!selectedSlot}
        onClose={() => setSelectedSlot(null)}
        title="Agendar reunión"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedSlot(null)}>Cancelar</Button>
            <Button onClick={createMeeting} loading={creatingMeeting} disabled={!meetingTitle.trim()}>
              Crear reunión
            </Button>
          </>
        }
      >
        {selectedSlot && (
          <div className="flex flex-col gap-4">
            <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-4 py-3">
              <p className="text-sm font-medium text-emerald-400">
                {DAY_LABELS[selectedSlot.dayKey]} · {selectedSlot.slot.start} – {selectedSlot.slot.end}
              </p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Próximo {DAY_LABELS[selectedSlot.dayKey].toLowerCase()}: {nextWeekdayDate(selectedSlot.dayKey)}
              </p>
            </div>
            <Input
              label="Título de la reunión *"
              placeholder="Sprint Planning, Daily Standup, Retrospectiva…"
              value={meetingTitle}
              onChange={e => setMeetingTitle(e.target.value)}
            />
            <Input
              label="Enlace de reunión"
              placeholder="https://meet.google.com/…"
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
              hint="Pre-cargado desde el enlace del proyecto."
            />
            {calcParticipants.length > 0 && (
              <div>
                <p className="text-sm font-medium text-[#F9FAFB] mb-2">Participantes ({calcParticipants.length})</p>
                <div className="flex flex-wrap gap-2">
                  {calcParticipants.map(id => {
                    const u = users.find(u => u.id === id);
                    return u ? (
                      <div key={id} className="flex items-center gap-1.5 bg-[#1E1F2B] border border-white/8 rounded-full px-2.5 py-1">
                        <Avatar name={`${u.name} ${u.lastName}`} size={18} />
                        <span className="text-xs text-[#9CA3AF]">{u.name}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
