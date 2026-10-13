import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Clock, Search, CheckCircle, AlertCircle, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/lib/toast/ToastProvider';
import { useAuth } from '@/features/auth/AuthContext';
import { PATHS } from '@/app/paths';
import { ApiError } from '@/lib/api/errors';
import type {
  DayKey,
  DayAvailableSlots,
  TeamUserAvailability,
  TimeSlot,
  ProjectManagedDTO,
} from '../types';
import { DAY_KEYS_LIST, DAY_NAMES, AVAILABILITY_MESSAGES, MEETING_TYPES } from '../messages';
import { getMondayOfWeek, validateMeetingCriteria, timeToMinutes, isValidUrl } from '../utils';
import { getTeamAvailability, searchMeetingSlots, createMeeting, getManagedProjects } from '../api';

export function ScheduleMeetingSection() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isAuthorized = user?.role === 'admin' || user?.role === 'manager';

  // Available participants loaded from team lookup
  const [candidates, setCandidates] = useState<TeamUserAvailability[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Form criteria state (HU_DN_03_35)
  const [intervalStart, setIntervalStart] = useState('08:00');
  const [intervalEnd, setIntervalEnd] = useState('18:00');
  const [selectedDays, setSelectedDays] = useState<DayKey[]>([
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
  ]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(() =>
    user?.id ? [user.id] : ['user-1'],
  );
  const [durationHours, setDurationHours] = useState('1');

  // Search Results state (HU_DN_03_36)
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DayAvailableSlots[] | null>(null);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Meeting Confirmation Modal State (HU_DN_03_37 & HU_DN_03_38)
  const [bookingSlot, setBookingSlot] = useState<{
    day: DayKey;
    date: string;
    slot: TimeSlot;
  } | null>(null);
  const [managedProjects, setManagedProjects] = useState<ProjectManagedDTO[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingType, setMeetingType] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [creatingMeeting, setCreatingMeeting] = useState(false);

  const [modalError, setModalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Load team users once
  useEffect(() => {
    if (!isAuthorized) return;
    let isCurrent = true;
    const fetchUsers = async () => {
      setLoadingCandidates(true);
      try {
        const monday = getMondayOfWeek();
        const resp = await getTeamAvailability(monday);
        if (isCurrent) {
          setCandidates(resp.users);
          if (resp.users.length > 0) {
            setSelectedParticipants(resp.users.map((u) => u.user_id));
          }
        }
      } catch {
        if (isCurrent) {
          showToast(AVAILABILITY_MESSAGES.technicalLoadFailure, 'error');
        }
      } finally {
        if (isCurrent) setLoadingCandidates(false);
      }
    };
    fetchUsers();
    return () => {
      isCurrent = false;
    };
  }, [isAuthorized, showToast]);

  // Validation of Search Criteria
  const validation = useMemo(() => {
    return validateMeetingCriteria(
      intervalStart,
      intervalEnd,
      selectedDays,
      selectedParticipants,
      durationHours,
    );
  }, [intervalStart, intervalEnd, selectedDays, selectedParticipants, durationHours]);

  const toggleDay = (day: DayKey) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSearch = async () => {
    if (!validation.isValid) return;

    setSearching(true);
    setSearchFeedback(null);
    setSearchResults(null);

    try {
      const resp = await searchMeetingSlots({
        interval_start: intervalStart,
        interval_end: intervalEnd,
        days: selectedDays,
        participant_ids: selectedParticipants,
        duration_hours: Number(durationHours),
        week_start_date: getMondayOfWeek(),
      });

      const daysWithSlots = resp.results.filter((d) => d.slots && d.slots.length > 0);
      if (daysWithSlots.length === 0) {
        setSearchFeedback(AVAILABILITY_MESSAGES.noAvailableSlots);
        setSearchResults([]);
      } else {
        setSearchResults(daysWithSlots);
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'NO_AVAILABLE_SLOTS') {
        setSearchFeedback(AVAILABILITY_MESSAGES.noAvailableSlots);
        setSearchResults([]);
      } else {
        showToast(AVAILABILITY_MESSAGES.technicalFailure, 'error');
      }
    } finally {
      setSearching(false);
    }
  };

  const openBookingModal = async (day: DayKey, date: string, slot: TimeSlot) => {
    setBookingSlot({ day, date, slot });
    setMeetingTitle('');
    setMeetingType('General');
    setSelectedProjectId('');
    setMeetingLink('');
    setModalError(null);
    setFieldErrors({});

    setLoadingProjects(true);
    try {
      const projs = (await getManagedProjects().catch(() => [])) || [];
      setManagedProjects(projs);
      if (projs.length > 0 && projs[0]) {
        setSelectedProjectId(projs[0].id);
        if (projs[0].meeting_link) {
          setMeetingLink(projs[0].meeting_link);
        }
      }
    } catch {
      setManagedProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    setFieldErrors((prev) => ({ ...prev, project: '' }));
    const proj = managedProjects.find((p) => p.id === projId);
    if (proj?.meeting_link) {
      setMeetingLink(proj.meeting_link);
    }
  };

  const handleCreateMeeting = async () => {
    if (!bookingSlot) return;

    const errors: Record<string, string> = {};
    if (!meetingTitle.trim()) {
      errors.title = AVAILABILITY_MESSAGES.meetingTitleRequired;
    } else if (meetingTitle.trim().length > 100) {
      errors.title = 'El título no puede superar los 100 caracteres.';
    }

    if (!meetingType) {
      errors.type = AVAILABILITY_MESSAGES.meetingTypeRequired;
    }

    if (managedProjects.length > 0 && !selectedProjectId) {
      errors.project = AVAILABILITY_MESSAGES.projectRequired;
    } else if (selectedProjectId) {
      const proj = managedProjects.find((p) => p.id === selectedProjectId);
      if (proj) {
        // All participants must belong to project (as member or manager)
        const isProjectMember = (pid: string) =>
          proj.member_ids.includes(pid) || (proj.manager_id ? proj.manager_id === pid : false);
        const outsiders = selectedParticipants.filter((pid) => !isProjectMember(pid));
        if (outsiders.length > 0) {
          errors.project = AVAILABILITY_MESSAGES.participantsMustBeMembers;
        }
      }
    }

    if (meetingLink.trim() && !isValidUrl(meetingLink.trim())) {
      errors.link = AVAILABILITY_MESSAGES.invalidMeetingLink;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setModalError(Object.values(errors)[0] ?? null);
      return;
    }

    setCreatingMeeting(true);
    setModalError(null);

    try {
      const durMinutes =
        timeToMinutes(bookingSlot.slot.end) - timeToMinutes(bookingSlot.slot.start);
      await createMeeting({
        title: meetingTitle.trim(),
        type: meetingType,
        project_id: selectedProjectId,
        date: bookingSlot.date,
        start_time: bookingSlot.slot.start,
        end_time: bookingSlot.slot.end,
        duration: durMinutes,
        link: meetingLink.trim() || null,
        participant_ids: selectedParticipants,
      });

      showToast(AVAILABILITY_MESSAGES.meetingScheduled, 'success');
      setBookingSlot(null);
      navigate(PATHS.meetings);
    } catch (err) {
      if (err instanceof ApiError) {
        if (
          err.status === 409 ||
          err.code === 'PARTICIPANT_MEETING_CONFLICT' ||
          err.message?.includes('ya tienen una reunión')
        ) {
          setModalError(AVAILABILITY_MESSAGES.participantMeetingConflict);
        } else {
          setModalError(err.message || AVAILABILITY_MESSAGES.technicalFailure);
        }
      } else {
        setModalError(AVAILABILITY_MESSAGES.technicalFailure);
      }
    } finally {
      setCreatingMeeting(false);
    }
  };

  if (!isAuthorized) {
    return null;
  }

  const selectedParticipantEntities = candidates.filter((c) =>
    selectedParticipants.includes(c.user_id),
  );

  return (
    <div className="space-y-6">
      {/* Criteria Form (HU_DN_03_35) */}
      <div className="bg-[#12131C] p-5 rounded-xl border border-white/6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-[#F9FAFB] flex items-center gap-2">
            <Clock size={16} className="text-blue-400" />
            Búsqueda de horarios para reuniones (Scrum)
          </h2>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Calcula intersecciones de disponibilidad común para tu equipo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Interval Start */}
          <div>
            <label htmlFor="crit-start" className="block text-xs font-medium text-[#9CA3AF] mb-1">
              Hora de inicio (24h) *
            </label>
            <input
              id="crit-start"
              type="time"
              value={intervalStart}
              onChange={(e) => setIntervalStart(e.target.value)}
              className="w-full bg-[#1E1F2B] border border-white/10 rounded-md px-3 py-2 text-xs text-[#F9FAFB] focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Interval End */}
          <div>
            <label htmlFor="crit-end" className="block text-xs font-medium text-[#9CA3AF] mb-1">
              Hora de fin (24h) *
            </label>
            <input
              id="crit-end"
              type="time"
              value={intervalEnd}
              onChange={(e) => setIntervalEnd(e.target.value)}
              className="w-full bg-[#1E1F2B] border border-white/10 rounded-md px-3 py-2 text-xs text-[#F9FAFB] focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Duration in whole hours */}
          <div>
            <label
              htmlFor="crit-duration"
              className="block text-xs font-medium text-[#9CA3AF] mb-1"
            >
              Duración (horas completas) *
            </label>
            <input
              id="crit-duration"
              type="number"
              min="1"
              step="1"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              className="w-full bg-[#1E1F2B] border border-white/10 rounded-md px-3 py-2 text-xs text-[#F9FAFB] focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full h-9"
              onClick={handleSearch}
              disabled={!validation.isValid || searching}
            >
              <Search size={14} className="mr-1.5" />
              {searching ? 'Buscando…' : 'Buscar horarios'}
            </Button>
          </div>
        </div>

        {/* Validation Errors for Interval or Duration */}
        {(validation.intervalError || validation.durationError) && (
          <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{validation.intervalError || validation.durationError}</span>
          </div>
        )}

        {/* Days selection */}
        <div>
          <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
            Días a considerar *{' '}
            {validation.daysError && (
              <span className="text-amber-400 ml-2 font-normal">({validation.daysError})</span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {DAY_KEYS_LIST.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#1E1F2B] text-[#9CA3AF] hover:text-[#F9FAFB] border border-white/6'
                  }`}
                >
                  {DAY_NAMES[day]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Participants selection */}
        <div>
          <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
            Participantes * ({selectedParticipants.length} seleccionado
            {selectedParticipants.length !== 1 ? 's' : ''})
            {validation.participantsError && (
              <span className="text-amber-400 ml-2 font-normal">
                ({validation.participantsError})
              </span>
            )}
          </label>
          {loadingCandidates ? (
            <p className="text-xs text-[#6B7280]">Cargando participantes…</p>
          ) : candidates.length === 0 ? (
            <p className="text-xs text-[#6B7280]">No hay integrantes activos disponibles.</p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-[#1A1C28] rounded-lg border border-white/6">
              {candidates.map((cand) => {
                const isSelected = selectedParticipants.includes(cand.user_id);
                return (
                  <button
                    key={cand.user_id}
                    type="button"
                    onClick={() => toggleParticipant(cand.user_id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'bg-[#1E1F2B] text-[#9CA3AF] hover:text-[#F9FAFB] border border-white/6'
                    }`}
                  >
                    <span className="truncate max-w-[150px]">{cand.name}</span>
                    <span className="text-[10px] text-[#6B7280]">({cand.role})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Results Section (HU_DN_03_36) */}
      {searchFeedback && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-2.5">
          <AlertCircle size={16} className="text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300">{searchFeedback}</p>
        </div>
      )}

      {searchResults && searchResults.length > 0 && (
        <div className="bg-[#12131C] p-5 rounded-xl border border-white/6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F9FAFB] flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-400" />
              Horarios disponibles calculados
            </h3>
            <span className="text-xs text-[#9CA3AF]">
              Haz clic en un horario para agendar la reunión
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((dayItem) => (
              <div
                key={dayItem.day}
                className="bg-[#1A1C28] rounded-lg p-3.5 border border-white/6 space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-white/6 pb-2">
                  <span className="text-xs font-semibold text-[#F9FAFB]">
                    {DAY_NAMES[dayItem.day]}
                  </span>
                  <span className="text-[11px] text-[#6B7280]">{dayItem.date}</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {dayItem.slots.map((slot, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => openBookingModal(dayItem.day, dayItem.date, slot)}
                      className="flex items-center justify-between px-3 py-2 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-xs font-mono transition-colors group text-left"
                    >
                      <span>
                        {slot.start} – {slot.end}
                      </span>
                      <span className="text-[11px] font-sans text-emerald-400 opacity-80 group-hover:opacity-100">
                        Agendar →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation & Scheduling Modal (HU_DN_03_37 & HU_DN_03_38) */}
      {bookingSlot && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg bg-[#12131C] border border-white/10 rounded-xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <h3 id="booking-modal-title" className="text-base font-semibold text-[#F9FAFB]">
                Confirmar reunión
              </h3>
              <button
                type="button"
                onClick={() => setBookingSlot(null)}
                aria-label="Cerrar"
                className="text-[#6B7280] hover:text-[#F9FAFB] p-1 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Read-Only Calculated Information (HU_DN_03_37 Criterion 3 & 4) */}
            <div className="bg-[#1A1C28] border border-white/6 rounded-lg p-3.5 space-y-2 text-xs">
              <p className="text-[11px] uppercase tracking-wide font-semibold text-[#9CA3AF]">
                Detalles calculados (Solo lectura)
              </p>
              <div className="grid grid-cols-2 gap-2 text-[#9CA3AF]">
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Fecha</span>
                  <span className="font-medium text-[#F9FAFB]">
                    {DAY_NAMES[bookingSlot.day]} ({bookingSlot.date})
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Horario</span>
                  <span className="font-mono font-medium text-emerald-400">
                    {bookingSlot.slot.start} – {bookingSlot.slot.end}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Duración</span>
                  <span className="font-medium text-[#F9FAFB]">
                    {timeToMinutes(bookingSlot.slot.end) - timeToMinutes(bookingSlot.slot.start)}{' '}
                    min
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Participantes</span>
                  <span className="font-medium text-[#F9FAFB]">
                    {selectedParticipantEntities.length} convocados
                  </span>
                </div>
              </div>
              <div className="pt-1 flex flex-wrap gap-1.5">
                {selectedParticipantEntities.map((p) => (
                  <span
                    key={p.user_id}
                    className="inline-flex items-center gap-1 bg-[#12131C] border border-white/10 rounded px-2 py-0.5 text-[11px] text-[#D1D5DB]"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Error Banner */}
            {modalError && (
              <div
                role="alert"
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-lg flex items-center gap-2"
              >
                <AlertCircle size={15} className="shrink-0 text-red-400" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Editable Fields (HU_DN_03_38) */}
            <div className="space-y-3.5">
              <div>
                <TextField
                  id="meeting-title"
                  label="Título de la reunión *"
                  placeholder="ej. Sprint Planning / Daily Scrum"
                  value={meetingTitle}
                  onChange={(e) => {
                    setMeetingTitle(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, title: '' }));
                  }}
                  maxLength={100}
                />
                {fieldErrors.title && (
                  <p className="text-[11px] text-red-400 mt-1">{fieldErrors.title}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="meeting-type"
                  className="block text-xs font-medium text-[#9CA3AF] mb-1"
                >
                  Tipo de reunión *
                </label>
                <select
                  id="meeting-type"
                  value={meetingType}
                  onChange={(e) => {
                    setMeetingType(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, type: '' }));
                  }}
                  className="w-full bg-[#1E1F2B] border border-white/10 rounded-md px-3 py-2 text-xs text-[#F9FAFB] focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seleccionar tipo...</option>
                  {MEETING_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {fieldErrors.type && (
                  <p className="text-[11px] text-red-400 mt-1">{fieldErrors.type}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="meeting-project"
                  className="block text-xs font-medium text-[#9CA3AF] mb-1"
                >
                  Proyecto asociado *
                </label>
                {loadingProjects ? (
                  <p className="text-xs text-[#6B7280]">Cargando proyectos gestionados…</p>
                ) : (
                  <select
                    id="meeting-project"
                    value={selectedProjectId}
                    onChange={(e) => handleProjectSelect(e.target.value)}
                    className="w-full bg-[#1E1F2B] border border-white/10 rounded-md px-3 py-2 text-xs text-[#F9FAFB] focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Seleccionar proyecto gestionado...</option>
                    {managedProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
                {fieldErrors.project && (
                  <p className="text-[11px] text-red-400 mt-1">{fieldErrors.project}</p>
                )}
              </div>

              <div>
                <TextField
                  id="meeting-link"
                  label="Ubicación o enlace (opcional)"
                  placeholder="https://meet.google.com/..."
                  value={meetingLink}
                  onChange={(e) => {
                    setMeetingLink(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, link: '' }));
                  }}
                />
                <p className="text-[10px] text-[#6B7280] mt-0.5">
                  Sugerencia precargada del proyecto. Puedes editarlo o dejarlo vacío.
                </p>
                {fieldErrors.link && (
                  <p className="text-[11px] text-red-400 mt-1">{fieldErrors.link}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/8">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setBookingSlot(null)}
                disabled={creatingMeeting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCreateMeeting}
                disabled={creatingMeeting}
              >
                <Video size={14} className="mr-1.5" />
                {creatingMeeting ? 'Programando…' : 'Confirmar reunión'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
