import { useState, useEffect, useMemo } from 'react';
import { Clock, Search, CheckCircle, AlertCircle, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/lib/toast/ToastProvider';
import { useAuth } from '@/features/auth/AuthContext';
import { ApiError } from '@/lib/api/errors';
import type { DayKey, DayAvailableSlots, TeamUserAvailability, TimeSlot } from '../types';
import { DAY_KEYS_LIST, DAY_NAMES, AVAILABILITY_MESSAGES } from '../messages';
import { getMondayOfWeek, validateMeetingCriteria, timeToMinutes } from '../utils';
import { getTeamAvailability, searchMeetingSlots, createMeeting } from '../api';

export function ScheduleMeetingSection() {
  const { user } = useAuth();
  const { showToast } = useToast();

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
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [durationHours, setDurationHours] = useState('1');

  // Search Results state (HU_DN_03_36)
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DayAvailableSlots[] | null>(null);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Meeting Creation Modal State
  const [bookingSlot, setBookingSlot] = useState<{
    day: DayKey;
    date: string;
    slot: TimeSlot;
  } | null>(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [creatingMeeting, setCreatingMeeting] = useState(false);

  // Load team users for participants selection
  useEffect(() => {
    if (!isAuthorized) return;
    let active = true;
    async function loadCandidates() {
      setLoadingCandidates(true);
      try {
        const data = await getTeamAvailability(getMondayOfWeek());
        if (!active) return;
        setCandidates(data.users);
        // Default select all or current user if available
        if (data.users.length > 0) {
          setSelectedParticipants(data.users.map((u) => u.user_id));
        }
      } catch {
        // Silently handle if candidates cannot be fetched yet
      } finally {
        if (active) setLoadingCandidates(false);
      }
    }
    loadCandidates();
    return () => {
      active = false;
    };
  }, [isAuthorized]);

  // Validation
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
      const res = await searchMeetingSlots({
        interval_start: intervalStart,
        interval_end: intervalEnd,
        days: selectedDays,
        participant_ids: selectedParticipants,
        duration_hours: Number(durationHours),
        week_start_date: getMondayOfWeek(),
      });

      // Filter to only days that have slots
      const daysWithSlots = res.results.filter((d) => d.slots.length > 0);
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

  const openBookingModal = (day: DayKey, date: string, slot: TimeSlot) => {
    setBookingSlot({ day, date, slot });
    setMeetingTitle('');
    setMeetingLink('');
  };

  const handleCreateMeeting = async () => {
    if (!bookingSlot || !meetingTitle.trim()) return;

    setCreatingMeeting(true);
    try {
      const durMinutes =
        timeToMinutes(bookingSlot.slot.end) - timeToMinutes(bookingSlot.slot.start);
      await createMeeting({
        title: meetingTitle.trim(),
        date: bookingSlot.date,
        start_time: bookingSlot.slot.start,
        end_time: bookingSlot.slot.end,
        duration: durMinutes,
        link: meetingLink.trim() || null,
        participant_ids: selectedParticipants,
      });

      showToast(AVAILABILITY_MESSAGES.meetingCreated, 'success');
      setBookingSlot(null);

      // Re-run search to remove booked slot
      handleSearch();
    } catch {
      showToast(AVAILABILITY_MESSAGES.technicalFailure, 'error');
    } finally {
      setCreatingMeeting(false);
    }
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Criteria Form (HU_DN_03_35) */}
      <div className="bg-[#12131C] p-5 rounded-xl border border-white/6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-[#F9FAFB] flex items-center gap-2">
            <Clock size={16} className="text-blue-400" />
            Definir criterios de búsqueda de reunión
          </h3>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Encuentra automáticamente las franjas horarias en las que coinciden todos los
            participantes seleccionados.
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

      {/* Booking Modal */}
      {bookingSlot && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-[#12131C] border border-white/10 rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <h4 id="booking-modal-title" className="text-sm font-semibold text-[#F9FAFB]">
                Agendar reunión
              </h4>
              <button
                type="button"
                onClick={() => setBookingSlot(null)}
                aria-label="Cerrar"
                className="text-[#6B7280] hover:text-[#F9FAFB] p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-300 space-y-0.5 font-mono">
              <div>
                <strong>Día:</strong> {DAY_NAMES[bookingSlot.day]} ({bookingSlot.date})
              </div>
              <div>
                <strong>Horario:</strong> {bookingSlot.slot.start} – {bookingSlot.slot.end}
              </div>
              <div>
                <strong>Participantes:</strong> {selectedParticipants.length} convocados
              </div>
            </div>

            <div className="space-y-3">
              <TextField
                id="meeting-title"
                label="Título de la reunión *"
                placeholder="ej. Sprint Planning / Sync de equipo"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
              />

              <TextField
                id="meeting-link"
                label="Enlace de videollamada"
                placeholder="https://meet.google.com/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/8">
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
                disabled={creatingMeeting || !meetingTitle.trim()}
              >
                <Video size={14} className="mr-1.5" />
                {creatingMeeting ? 'Agendando…' : 'Confirmar reunión'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
