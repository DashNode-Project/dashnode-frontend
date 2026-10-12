import React, { useState } from 'react';
import { Plus, Video, Calendar, List, ExternalLink, Copy, Edit2, Trash2, CalendarPlus, ChevronLeft, ChevronRight, Clock, FileText, Link } from 'lucide-react';
import { useApp } from '../store';
import { AppShell } from '../components/Layout';
import { Button, Avatar, StatusBadge, SectionHeader, Modal, ConfirmModal, Input, Select, EmptyState, Card, Badge } from '../components/ui';
import { Meeting, MeetingStatus } from '../types';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface MeetingForm {
  title: string; projectId: string; description: string;
  date: string; startTime: string; duration: string;
  participantIds: string[]; link: string;
}

const emptyForm: MeetingForm = {
  title: '', projectId: '', description: '', date: new Date().toISOString().slice(0, 10),
  startTime: '10:00', duration: '60', participantIds: [], link: '',
};

function buildGoogleCalendarUrl(m: Meeting, projectName: string, link: string) {
  const start = m.date.replace(/-/g, '') + 'T' + m.startTime.replace(':', '') + '00';
  const endH = parseInt(m.startTime.split(':')[0]) + Math.floor(m.duration / 60);
  const endMin = (parseInt(m.startTime.split(':')[1]) + (m.duration % 60)).toString().padStart(2, '0');
  const end = m.date.replace(/-/g, '') + 'T' + endH.toString().padStart(2, '0') + endMin + '00';
  const desc = encodeURIComponent(`Proyecto: ${projectName}\nEnlace: ${link}\n${m.description ?? ''}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(m.title)}&dates=${start}/${end}&details=${desc}&location=${encodeURIComponent(link)}`;
}

export default function Meetings() {
  const { state, dispatch, showToast } = useApp();
  const { currentUser, users, projects, meetings } = state;
  if (!currentUser) return null;

  const role = currentUser.role;
  const isManager = role === 'admin' || role === 'manager';
  const canSchedule = true; // all roles can schedule meetings

  const myMeetings = role === 'admin'
    ? meetings
    : meetings.filter(m => {
        const proj = projects.find(p => p.id === m.projectId);
        return proj && (proj.managerId === currentUser.id || proj.memberIds.includes(currentUser.id));
      });

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [createOpen, setCreateOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [deleteMeeting, setDeleteMeeting] = useState<Meeting | null>(null);
  const [viewMeeting, setViewMeeting] = useState<Meeting | null>(null);
  const [form, setForm] = useState<MeetingForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | 'all'>('all');

  const filtered = myMeetings.filter(m => statusFilter === 'all' || m.status === statusFilter);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = filtered.filter(m => m.date >= today && m.status === 'scheduled').sort((a, b) => a.date.localeCompare(b.date));
  const past = filtered.filter(m => m.date < today || m.status === 'completed').sort((a, b) => b.date.localeCompare(a.date));

  function openCreate() {
    const userProjs = role === 'admin' ? projects : projects.filter(p => p.managerId === currentUser!.id || p.memberIds.includes(currentUser!.id));
    const firstProj = userProjs[0];
    setForm({ ...emptyForm, projectId: firstProj?.id ?? '', link: firstProj?.meetingLink ?? '', participantIds: currentUser ? [currentUser.id] : [] });
    setCreateOpen(true);
  }

  function openEdit(m: Meeting) {
    setForm({ title: m.title, projectId: m.projectId, description: m.description ?? '', date: m.date, startTime: m.startTime, duration: m.duration.toString(), participantIds: m.participantIds, link: m.link });
    setEditMeeting(m);
  }

  async function handleCreate() {
    if (!form.title.trim() || !form.projectId) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    dispatch({ type: 'ADD_MEETING', meeting: { id: `m${Date.now()}`, ...form, duration: parseInt(form.duration), status: 'scheduled', creatorId: currentUser?.id ?? '' } });
    setSaving(false); setCreateOpen(false);
    showToast('Reunión programada correctamente.');
  }

  async function handleEdit() {
    if (!editMeeting || !form.title.trim()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    dispatch({ type: 'UPDATE_MEETING', meeting: { ...editMeeting, ...form, duration: parseInt(form.duration) } });
    setSaving(false); setEditMeeting(null);
    showToast('Reunión actualizada.');
  }

  async function handleDelete() {
    if (!deleteMeeting) return;
    setDeleting(true);
    await new Promise(r => setTimeout(r, 400));
    dispatch({ type: 'DELETE_MEETING', meetingId: deleteMeeting.id });
    setDeleting(false); setDeleteMeeting(null);
    showToast('Reunión eliminada.', 'info');
  }

  function onProjectChange(projId: string) {
    const proj = projects.find(p => p.id === projId);
    setForm(f => ({ ...f, projectId: projId, link: proj?.meetingLink ?? f.link }));
  }

  const userProjects = role === 'admin' ? projects : projects.filter(p => p.managerId === currentUser.id || p.memberIds.includes(currentUser.id));
  const projectMembers = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    if (!proj) return [];
    return users.filter(u => proj.memberIds.includes(u.id));
  };

  const MeetingForm = () => (
    <div className="flex flex-col gap-4">
      <Input label="Título de la reunión *" placeholder="Sprint Planning – Sprint 3" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <Select label="Proyecto *" value={form.projectId} onChange={e => onProjectChange(e.target.value)}
        options={[{ value: '', label: 'Seleccionar proyecto...' }, ...userProjects.map(p => ({ value: p.id, label: p.name }))]} />
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Input label="Fecha" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </div>
        <Input label="Hora inicio" type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
      </div>
      <Select label="Duración" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
        options={[{ value: '15', label: '15 minutos' }, { value: '30', label: '30 minutos' }, { value: '45', label: '45 minutos' }, { value: '60', label: '1 hora' }, { value: '90', label: '1.5 horas' }, { value: '120', label: '2 horas' }]} />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#F9FAFB]">Participantes</label>
        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
          {projectMembers(form.projectId).map(u => (
            <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/4 rounded px-2 py-1">
              <input type="checkbox" checked={form.participantIds.includes(u.id)}
                onChange={e => setForm(f => ({ ...f, participantIds: e.target.checked ? [...f.participantIds, u.id] : f.participantIds.filter(id => id !== u.id) }))}
                className="accent-blue-500" />
              <Avatar name={`${u.name} ${u.lastName}`} size={20} />
              <span className="text-xs text-[#9CA3AF]">{u.name} {u.lastName}</span>
            </label>
          ))}
        </div>
      </div>
      <Input label="Enlace de reunión" type="url" placeholder="https://meet.google.com/..." value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
        hint="Se usa el enlace institucional del proyecto como valor sugerido." />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#F9FAFB]">Descripción</label>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
          className="w-full bg-[#1E1F2B] border border-white/10 rounded-md p-3 text-sm text-[#F9FAFB] resize-none focus:outline-none focus:border-blue-500" placeholder="Agenda, objetivos..." />
      </div>
    </div>
  );

  const [summaryEdit, setSummaryEdit] = useState<{ meeting: Meeting; text: string; minutesUrl: string } | null>(null);

  function MeetingCard({ m }: { m: Meeting }) {
    const proj = projects.find(p => p.id === m.projectId);
    const participants = users.filter(u => m.participantIds.includes(u.id));
    const isCreator = m.creatorId === currentUser!.id || role === 'admin';
    const isPast = m.status === 'completed' || (m.date < today && m.status !== 'cancelled');
    const gcUrl = proj ? buildGoogleCalendarUrl(m, proj.name, m.link) : '#';
    return (
      <Card className="p-4 hover:border-white/12 transition-colors">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${m.status === 'completed' ? 'bg-emerald-500/15' : m.status === 'cancelled' ? 'bg-red-500/15' : 'bg-blue-500/15'}`}>
            <Video size={16} className={m.status === 'completed' ? 'text-emerald-400' : m.status === 'cancelled' ? 'text-red-400' : 'text-blue-400'} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <button className="text-sm font-semibold text-[#F9FAFB] hover:text-blue-400 transition-colors text-left" onClick={() => setViewMeeting(m)}>
                {m.title}
              </button>
              <StatusBadge status={m.status} />
            </div>
            <div className="flex items-center gap-3 text-xs text-[#6B7280] mb-2 flex-wrap">
              <span className="flex items-center gap-1"><Calendar size={11} />{m.date}</span>
              <span className="flex items-center gap-1"><Clock size={11} />{m.startTime} · {m.duration}min</span>
              {proj && <span className="text-[#9CA3AF]">{proj.name}</span>}
            </div>
            {m.summary && (
              <p className="text-xs text-[#9CA3AF] mb-2 line-clamp-2 italic">"{m.summary}"</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-0.5">
                {participants.slice(0, 4).map(p => <Avatar key={p.id} name={`${p.name} ${p.lastName}`} size={20} className="-ml-1 first:ml-0" />)}
                {participants.length > 4 && <span className="text-xs text-[#6B7280] ml-1">+{participants.length - 4}</span>}
              </div>
              {isPast && isCreator && (
                <button onClick={() => setSummaryEdit({ meeting: m, text: m.summary ?? '', minutesUrl: m.minutesUrl ?? '' })}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 ml-2">
                  <FileText size={11} /> {m.summary ? 'Editar resumen' : 'Agregar resumen'}
                </button>
              )}
              {m.minutesUrl && (
                <a href={m.minutesUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
                  <Link size={11} /> Acta
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Past meetings: no join button, just copy and summary actions */}
            {!isPast && (
              <>
                <a href={m.link} target="_blank" rel="noreferrer" title="Unirse" className="w-7 h-7 rounded-md flex items-center justify-center text-[#6B7280] hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                  <ExternalLink size={13} />
                </a>
                <a href={gcUrl} target="_blank" rel="noreferrer" title="Google Calendar"
                  className="w-7 h-7 rounded-md flex items-center justify-center text-[#6B7280] hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                  <CalendarPlus size={13} />
                </a>
              </>
            )}
            <button title="Copiar enlace" onClick={() => { navigator.clipboard.writeText(m.link); showToast('Enlace copiado.'); }}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[#6B7280] hover:text-[#F9FAFB] hover:bg-white/8 transition-colors">
              <Copy size={13} />
            </button>
            {isCreator && m.status === 'scheduled' && (
              <>
                <button onClick={() => openEdit(m)} className="w-7 h-7 rounded-md flex items-center justify-center text-[#6B7280] hover:text-[#F9FAFB] hover:bg-white/8 transition-colors"><Edit2 size={13} /></button>
                <button onClick={() => setDeleteMeeting(m)} className="w-7 h-7 rounded-md flex items-center justify-center text-[#6B7280] hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
              </>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Calendar view
  function CalendarView() {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const meetingsForDay = (day: number) => {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return myMeetings.filter(m => m.date === dateStr);
    };

    const todayDate = new Date();

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/8 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <h2 className="font-semibold text-[#F9FAFB]">{MONTHS[calMonth]} {calYear}</h2>
          <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/8 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => <div key={d} className="text-center text-xs text-[#6B7280] font-medium py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const dayMeetings = meetingsForDay(day);
            const isToday = todayDate.getFullYear() === calYear && todayDate.getMonth() === calMonth && todayDate.getDate() === day;
            return (
              <div key={day} className={`min-h-[80px] p-1 rounded-lg border transition-colors ${isToday ? 'border-blue-500/40 bg-blue-500/5' : 'border-white/4 hover:border-white/10'}`}>
                <p className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-400' : 'text-[#9CA3AF]'}`}>{day}</p>
                {dayMeetings.slice(0, 2).map(m => (
                  <button key={m.id} onClick={() => setViewMeeting(m)}
                    className={`w-full text-left text-xs px-1 py-0.5 rounded mb-0.5 truncate ${m.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {m.startTime} {m.title}
                  </button>
                ))}
                {dayMeetings.length > 2 && <p className="text-xs text-[#6B7280] px-1">+{dayMeetings.length - 2}</p>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <AppShell title="Reuniones">
      <SectionHeader
        title="Reuniones"
        description={`${upcoming.length} próximas · ${past.length} anteriores`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#1E1F2B] border border-white/10 rounded-md p-1">
              <button onClick={() => setViewMode('list')} className={`px-2 py-1 rounded text-xs transition-colors ${viewMode === 'list' ? 'bg-[#272A38] text-[#F9FAFB]' : 'text-[#6B7280]'}`}>
                <List size={13} />
              </button>
              <button onClick={() => setViewMode('calendar')} className={`px-2 py-1 rounded text-xs transition-colors ${viewMode === 'calendar' ? 'bg-[#272A38] text-[#F9FAFB]' : 'text-[#6B7280]'}`}>
                <Calendar size={13} />
              </button>
            </div>
            <Button icon={<Plus size={15} />} onClick={openCreate}>Programar reunión</Button>
          </div>
        }
      />

      <div className="flex items-center gap-2 mb-5">
        {(['all', 'scheduled', 'completed', 'cancelled'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 h-7 rounded-md text-xs font-medium transition-colors ${statusFilter === s ? 'bg-blue-500/15 text-blue-400' : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5'}`}>
            {{ all: 'Todas', scheduled: 'Programadas', completed: 'Completadas', cancelled: 'Canceladas' }[s]}
          </button>
        ))}
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Próximas</h2>
              <div className="flex flex-col gap-3">
                {upcoming.map(m => <MeetingCard key={m.id} m={m} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Anteriores</h2>
              <div className="flex flex-col gap-3">
                {past.map(m => <MeetingCard key={m.id} m={m} />)}
              </div>
            </section>
          )}
          {filtered.length === 0 && (
            <EmptyState icon={<Video size={22} />} title="Sin reuniones" description="Programa la primera reunión para tu proyecto." action={<Button icon={<Plus size={15} />} onClick={openCreate}>Programar reunión</Button>} />
          )}
        </div>
      ) : (
        <Card className="p-5"><CalendarView /></Card>
      )}

      {/* Create */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Programar reunión" size="lg"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button loading={saving} onClick={handleCreate}>Programar</Button></>}>
        <MeetingForm />
      </Modal>

      {/* Edit */}
      <Modal open={!!editMeeting} onClose={() => setEditMeeting(null)} title="Editar reunión" size="lg"
        footer={<><Button variant="secondary" onClick={() => setEditMeeting(null)}>Cancelar</Button><Button loading={saving} onClick={handleEdit}>Guardar</Button></>}>
        <MeetingForm />
      </Modal>

      {/* View */}
      {viewMeeting && (
        <Modal open={!!viewMeeting} onClose={() => setViewMeeting(null)} title={viewMeeting.title} size="md">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={viewMeeting.status} />
              <span className="text-sm text-[#9CA3AF]">{viewMeeting.date} · {viewMeeting.startTime} · {viewMeeting.duration}min</span>
            </div>
            {viewMeeting.description && <p className="text-sm text-[#9CA3AF]">{viewMeeting.description}</p>}
            <div>
              <p className="text-xs text-[#6B7280] mb-2">Participantes</p>
              <div className="flex flex-wrap gap-2">
                {users.filter(u => viewMeeting.participantIds.includes(u.id)).map(u => (
                  <div key={u.id} className="flex items-center gap-1.5 bg-[#1E1F2B] rounded-md px-2 py-1">
                    <Avatar name={`${u.name} ${u.lastName}`} size={18} />
                    <span className="text-xs text-[#9CA3AF]">{u.name} {u.lastName}</span>
                  </div>
                ))}
              </div>
            </div>
            {viewMeeting.summary && (
              <div className="bg-[#1E1F2B] rounded-lg p-3">
                <p className="text-xs text-[#6B7280] mb-1">Resumen</p>
                <p className="text-sm text-[#F9FAFB] whitespace-pre-wrap">{viewMeeting.summary}</p>
              </div>
            )}
            {viewMeeting.minutesUrl && (
              <a href={viewMeeting.minutesUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                <Link size={14} /> Ver acta de reunión
              </a>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {viewMeeting.status === 'scheduled' && (
                <a href={viewMeeting.link} target="_blank" rel="noreferrer">
                  <Button variant="secondary" size="sm" icon={<ExternalLink size={13} />}>Unirse</Button>
                </a>
              )}
              <button onClick={() => { navigator.clipboard.writeText(viewMeeting.link); showToast('Enlace copiado.'); }}>
                <Button variant="ghost" size="sm" icon={<Copy size={13} />}>Copiar enlace</Button>
              </button>
              {viewMeeting.status === 'scheduled' && (() => {
                const proj = projects.find(p => p.id === viewMeeting.projectId);
                if (!proj) return null;
                const gcUrl = buildGoogleCalendarUrl(viewMeeting, proj.name, viewMeeting.link);
                return (
                  <a href={gcUrl} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="sm" icon={<CalendarPlus size={13} />}>Google Calendar</Button>
                  </a>
                );
              })()}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete */}
      {deleteMeeting && (
        <ConfirmModal open={!!deleteMeeting} onClose={() => setDeleteMeeting(null)} onConfirm={handleDelete}
          title={`Cancelar "${deleteMeeting.title}"`}
          description="Solo tú, como creador, puedes cancelar esta reunión. Los participantes no recibirán notificación automática."
          confirmLabel="Cancelar reunión" loading={deleting} />
      )}

      {/* Summary edit */}
      {summaryEdit && (
        <Modal open={!!summaryEdit} onClose={() => setSummaryEdit(null)} title="Resumen de reunión" size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setSummaryEdit(null)}>Cancelar</Button>
              <Button onClick={() => {
                if ((summaryEdit.text.length) > 2000) { showToast('El resumen no puede superar 2000 caracteres.', 'error'); return; }
                dispatch({ type: 'UPDATE_MEETING', meeting: { ...summaryEdit.meeting, summary: summaryEdit.text, minutesUrl: summaryEdit.minutesUrl, status: 'completed' } });
                setSummaryEdit(null);
                showToast('Resumen guardado.', 'success');
              }}>Guardar</Button>
            </>
          }>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#F9FAFB] block mb-1.5">Resumen <span className="text-[#6B7280] font-normal">(máx. 2000 caracteres)</span></label>
              <textarea
                value={summaryEdit.text}
                onChange={e => setSummaryEdit(s => s ? { ...s, text: e.target.value } : s)}
                rows={6}
                maxLength={2000}
                placeholder="Describe los puntos tratados, acuerdos y próximos pasos..."
                className="w-full bg-[#1E1F2B] border border-white/10 rounded-md p-3 text-sm text-[#F9FAFB] resize-none focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-[#4B5563] mt-1 text-right">{summaryEdit.text.length}/2000</p>
            </div>
            <Input label="Link al acta de reunión (opcional)" type="url" placeholder="https://docs.google.com/document/d/..."
              value={summaryEdit.minutesUrl}
              onChange={e => setSummaryEdit(s => s ? { ...s, minutesUrl: e.target.value } : s)}
            />
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
