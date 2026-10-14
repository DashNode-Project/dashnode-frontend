import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Calendar,
  List,
  Video,
  Plus,
  ExternalLink,
  Copy,
  Trash2,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Link as LinkIcon,
  X,
  AlertCircle,
  Pencil,
  Ban,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconActionButton } from '@/components/ui/IconActionButton';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/features/auth/AuthContext';
import { useToast } from '@/lib/toast/ToastProvider';
import { PATHS } from '@/app/paths';
import { ApiError } from '@/lib/api/errors';
import type { MeetingDTO } from '@/features/availability/types';
import { AVAILABILITY_MESSAGES } from '@/features/availability/messages';
import {
  buildGoogleCalendarUrl,
  isValidUrl,
  formatMeetingCopyData,
} from '@/features/availability/utils';
import {
  listMeetings,
  getMeetingDetail,
  cancelMeeting,
  respondMeeting,
  updateMeetingSummary,
  updateMeeting,
  deleteMeeting,
  restoreMeeting,
} from '@/features/availability/api';
import {
  isMeetingPast,
  isMeetingUpcoming,
  meetingStatusLabel,
} from '@/features/meetings/meetingTime';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEKDAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function getTypeBadgeStyle(type: string) {
  switch (type.toLowerCase()) {
    case 'daily':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'planning':
      return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    case 'review':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'retro':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    default:
      return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  }
}

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
      return {
        label: 'Completada',
        style: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      };
    case 'cancelled':
      return {
        label: 'Cancelada',
        style: 'bg-red-500/15 text-red-400 border-red-500/30',
      };
    default:
      return {
        label: 'Pendiente',
        style: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      };
  }
}

function getResponseBadge(response: string) {
  switch (response.toLowerCase()) {
    case 'aceptada':
      return {
        label: 'Aceptada',
        style: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      };
    case 'rechazada':
      return {
        label: 'Rechazada',
        style: 'bg-red-500/15 text-red-400 border-red-500/30',
      };
    default:
      return {
        label: 'Pendiente',
        style: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      };
  }
}

export default function MeetingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState<MeetingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [activeTab, setActiveTab] = useState<'proximas' | 'pasadas'>('proximas');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>(
    'all',
  );

  // Calendar state
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  // Modal states
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingDTO | null>(null);
  const [cancelModalMeeting, setCancelModalMeeting] = useState<MeetingDTO | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const [summaryModalMeeting, setSummaryModalMeeting] = useState<MeetingDTO | null>(null);
  const [summaryText, setSummaryText] = useState('');
  const [minutesUrlText, setMinutesUrlText] = useState('');
  const [savingSummary, setSavingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [gcError, setGcError] = useState<string | null>(null);
  const [clipboardError, setClipboardError] = useState<string | null>(null);

  const [respondingMeetingId, setRespondingMeetingId] = useState<string | null>(null);

  const [editMeeting, setEditMeeting] = useState<MeetingDTO | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editParticipantIds, setEditParticipantIds] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteModalMeeting, setDeleteModalMeeting] = useState<MeetingDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listMeetings();
      setMeetings(data);
    } catch {
      showToast(AVAILABILITY_MESSAGES.technicalLoadFailure, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
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

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const isMeetingRealizada = useCallback(
    (m: MeetingDTO) => {
      if (m.status === 'completed') return true;
      if (m.status === 'cancelled') return false;
      if (m.date < todayStr) return true;
      if (m.date === todayStr) {
        const nowTime = new Date().toTimeString().slice(0, 5);
        return m.end_time <= nowTime;
      }
      return false;
    },
    [todayStr],
  );

  const upcomingMeetings = useMemo(() => {
    return meetings
      .filter((m) => isMeetingUpcoming(m))
      .sort((a, b) => {
        const d = a.date.localeCompare(b.date);
        return d !== 0 ? d : a.start_time.localeCompare(b.start_time);
      });
  }, [meetings]);

  const pastMeetings = useMemo(() => {
    return meetings
      .filter((m) => m.status === 'cancelled' || isMeetingPast(m))
      .sort((a, b) => {
        const d = b.date.localeCompare(a.date);
        return d !== 0 ? d : b.start_time.localeCompare(a.start_time);
      });
  }, [meetings]);

  const currentTabMeetings = useMemo(() => {
    const base = activeTab === 'proximas' ? upcomingMeetings : pastMeetings;
    if (statusFilter === 'all') return base;
    return base.filter((m) => m.status === statusFilter);
  }, [activeTab, upcomingMeetings, pastMeetings, statusFilter]);

  const openDetail = async (m: MeetingDTO) => {
    setGcError(null);
    setClipboardError(null);
    try {
      const detail = await getMeetingDetail(m.id);
      setSelectedMeeting(detail);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        showToast(AVAILABILITY_MESSAGES.meetingDetailForbidden, 'error');
      } else {
        showToast(AVAILABILITY_MESSAGES.technicalLoadFailure, 'error');
      }
    }
  };

  const handleCopyLink = (link: string | null) => {
    if (!link) return;
    try {
      void navigator?.clipboard?.writeText?.(link);
    } catch {
      // ignore clipboard error in test/unsupported environments
    }
    showToast('Enlace copiado.', 'success');
  };

  const handleOpenGoogleCalendar = (m: MeetingDTO) => {
    setGcError(null);
    setClipboardError(null);
    const emails =
      m.participants?.map((p) => p.email).filter((email): email is string => Boolean(email)) ?? [];
    const gcUrl = buildGoogleCalendarUrl(
      m.title,
      m.date,
      m.start_time,
      m.duration,
      m.project_name,
      m.link,
      m.description,
      emails,
    );
    try {
      const win = window.open(gcUrl, '_blank', 'noopener,noreferrer');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        setGcError(AVAILABILITY_MESSAGES.googleCalendarOpenFailed);
        showToast(AVAILABILITY_MESSAGES.googleCalendarOpenFailed, 'error');
      }
    } catch {
      setGcError(AVAILABILITY_MESSAGES.googleCalendarOpenFailed);
      showToast(AVAILABILITY_MESSAGES.googleCalendarOpenFailed, 'error');
    }
  };

  const handleCopyMeetingData = (m: MeetingDTO) => {
    const text = formatMeetingCopyData(m);
    if (!navigator?.clipboard?.writeText) {
      setClipboardError(AVAILABILITY_MESSAGES.clipboardCopyFailed);
      showToast(AVAILABILITY_MESSAGES.clipboardCopyFailed, 'error');
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast(AVAILABILITY_MESSAGES.meetingDataCopied, 'success');
        setClipboardError(null);
      })
      .catch(() => {
        setClipboardError(AVAILABILITY_MESSAGES.clipboardCopyFailed);
        showToast(AVAILABILITY_MESSAGES.clipboardCopyFailed, 'error');
      });
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalMeeting) return;
    setCancelling(true);
    try {
      await cancelMeeting(cancelModalMeeting.id);
      showToast(AVAILABILITY_MESSAGES.meetingCancelled, 'success');
      setCancelModalMeeting(null);
      if (selectedMeeting?.id === cancelModalMeeting.id) {
        setSelectedMeeting(null);
      }
      loadMeetings();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ONLY_CREATOR_CAN_CANCEL') {
        showToast(AVAILABILITY_MESSAGES.onlyCreatorCanCancel, 'error');
      } else {
        showToast(AVAILABILITY_MESSAGES.technicalFailure, 'error');
      }
    } finally {
      setCancelling(false);
    }
  };

  const handleRespond = async (meetingId: string, response: 'aceptada' | 'rechazada') => {
    setRespondingMeetingId(meetingId);
    try {
      const updated = await respondMeeting(meetingId, response);
      showToast(AVAILABILITY_MESSAGES.meetingResponseRegistered, 'success');
      setSelectedMeeting(updated);
      loadMeetings();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'MEETING_CANCELLED') {
        showToast(AVAILABILITY_MESSAGES.meetingCancelledCannotRespond, 'error');
      } else if (err instanceof ApiError && err.code === 'MEETING_ALREADY_PAST') {
        showToast(AVAILABILITY_MESSAGES.meetingAlreadyPastCannotRespond, 'error');
      } else {
        showToast(AVAILABILITY_MESSAGES.technicalFailure, 'error');
      }
    } finally {
      setRespondingMeetingId(null);
    }
  };

  const openEditMeeting = async (m: MeetingDTO) => {
    setEditError(null);
    try {
      const detail = await getMeetingDetail(m.id);
      setEditMeeting(detail);
      setEditTitle(detail.title);
      setEditLink(detail.link ?? '');
      const ids = detail.participants?.map((p) => p.user_id) ?? detail.participant_ids ?? [];
      setEditParticipantIds(ids);
    } catch {
      showToast(AVAILABILITY_MESSAGES.technicalLoadFailure, 'error');
    }
  };

  const toggleEditParticipant = (userId: string) => {
    setEditParticipantIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSaveEdit = async () => {
    if (!editMeeting || savingEdit) return;
    const title = editTitle.trim();
    if (!title) {
      setEditError(AVAILABILITY_MESSAGES.meetingTitleRequired);
      return;
    }
    if (editLink.trim() && !isValidUrl(editLink.trim())) {
      setEditError(AVAILABILITY_MESSAGES.invalidMeetingLink);
      return;
    }
    if (editParticipantIds.length === 0) {
      setEditError('Seleccione al menos un participante.');
      return;
    }
    setSavingEdit(true);
    setEditError(null);
    try {
      const updated = await updateMeeting(editMeeting.id, {
        title,
        link: editLink.trim() || null,
        participant_ids: editParticipantIds,
      });
      showToast('Reunión actualizada.', 'success');
      setEditMeeting(null);
      if (selectedMeeting?.id === updated.id) setSelectedMeeting(updated);
      loadMeetings();
    } catch (err) {
      if (err instanceof ApiError) {
        setEditError(err.message || AVAILABILITY_MESSAGES.technicalFailure);
      } else {
        setEditError(AVAILABILITY_MESSAGES.technicalFailure);
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalMeeting || deleting) return;
    setDeleting(true);
    try {
      const result = await deleteMeeting(deleteModalMeeting.id);
      showToast(result.message || AVAILABILITY_MESSAGES.meetingDeleted, 'success');
      setDeleteModalMeeting(null);
      if (selectedMeeting?.id === deleteModalMeeting.id) setSelectedMeeting(null);
      loadMeetings();
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error');
      } else {
        showToast(AVAILABILITY_MESSAGES.technicalFailure, 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (m: MeetingDTO) => {
    setRestoringId(m.id);
    try {
      const updated = await restoreMeeting(m.id);
      showToast(AVAILABILITY_MESSAGES.meetingRestored, 'success');
      if (selectedMeeting?.id === m.id) setSelectedMeeting(updated);
      loadMeetings();
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error');
      } else {
        showToast(AVAILABILITY_MESSAGES.technicalFailure, 'error');
      }
    } finally {
      setRestoringId(null);
    }
  };

  const openSummaryModal = (m: MeetingDTO) => {
    setSummaryModalMeeting(m);
    setSummaryText(m.summary || '');
    setMinutesUrlText(m.minutes_url || '');
    setSummaryError(null);
  };

  const handleSaveSummary = async () => {
    if (!summaryModalMeeting) return;

    if (!summaryText.trim()) {
      setSummaryError(AVAILABILITY_MESSAGES.summaryRequired);
      return;
    }

    if (summaryText.length > 2000) {
      setSummaryError(AVAILABILITY_MESSAGES.summaryTooLong);
      return;
    }

    if (minutesUrlText.trim() && !isValidUrl(minutesUrlText.trim())) {
      setSummaryError(AVAILABILITY_MESSAGES.invalidMinutesUrl);
      return;
    }

    setSavingSummary(true);
    setSummaryError(null);
    try {
      const updated = await updateMeetingSummary(summaryModalMeeting.id, {
        summary: summaryText.trim(),
        minutes_url: minutesUrlText.trim() || null,
      });
      showToast(AVAILABILITY_MESSAGES.meetingSummarySaved, 'success');
      setSummaryModalMeeting(null);
      if (selectedMeeting?.id === summaryModalMeeting.id) {
        setSelectedMeeting(updated);
      }
      loadMeetings();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'MEETING_NOT_COMPLETED') {
        setSummaryError(AVAILABILITY_MESSAGES.meetingNotCompleted);
      } else {
        setSummaryError(AVAILABILITY_MESSAGES.technicalFailure);
      }
    } finally {
      setSavingSummary(false);
    }
  };

  // Calendar cells
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [calYear, calMonth]);

  const meetingsByDay = useMemo(() => {
    const map: Record<string, MeetingDTO[]> = {};
    for (const m of meetings) {
      if (!map[m.date]) map[m.date] = [];
      map[m.date]?.push(m);
    }
    return map;
  }, [meetings]);

  const isUserParticipant = (m: MeetingDTO) => {
    if (!user) return false;
    if (m.participants && m.participants.length > 0) {
      return m.participants.some((p) => p.user_id === user.id);
    }
    return m.participant_ids.includes(user.id);
  };

  const isUserCreator = (m: MeetingDTO) => {
    if (!user) return false;
    return m.creator_id === user.id;
  };

  const isUserCreatorOrAdmin = (m: MeetingDTO) => {
    if (!user) return false;
    return user.role === 'admin' || m.creator_id === user.id;
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F9FAFB]">Reuniones</h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            {upcomingMeetings.length} próximas · {pastMeetings.length} anteriores
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View switcher (HU_DN_03_40) */}
          <div className="flex items-center bg-[#1E1F2B] border border-white/10 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="Vista Lista"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
              }`}
            >
              <List size={14} />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              aria-label="Vista Calendario"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
              }`}
            >
              <Calendar size={14} />
              Calendario
            </button>
          </div>

          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(PATHS.availability)}
              className="flex items-center gap-1.5"
            >
              <Plus size={15} />
              Programar reunión
            </Button>
          )}
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/6 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('proximas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'proximas'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5'
            }`}
          >
            Próximas ({upcomingMeetings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pasadas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'pasadas'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5'
            }`}
          >
            Pasadas ({pastMeetings.length})
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {(['all', 'scheduled', 'completed', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-white/10 text-white'
                  : 'text-[#6B7280] hover:text-[#9CA3AF] hover:bg-white/5'
              }`}
            >
              {
                {
                  all: 'Todas',
                  scheduled: 'Programadas',
                  completed: 'Completadas',
                  cancelled: 'Canceladas',
                }[s]
              }
            </button>
          ))}
        </div>
      </div>

      {/* Content Body */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-xs text-[#9CA3AF]">
          Cargando reuniones…
        </div>
      ) : viewMode === 'list' ? (
        /* List View (HU_DN_03_39) */
        currentTabMeetings.length === 0 ? (
          <div className="bg-[#12131C] border border-white/6 rounded-xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center">
              <Video size={22} />
            </div>
            <p className="text-sm font-medium text-[#F9FAFB]">
              {AVAILABILITY_MESSAGES.noMeetingsToShow}
            </p>
            <p className="text-xs text-[#6B7280]">
              {activeTab === 'proximas'
                ? 'No tienes reuniones programadas próximamente.'
                : 'No se encontraron reuniones anteriores.'}
            </p>
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(PATHS.availability)}
                className="mt-2"
              >
                Buscar disponibilidad
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {currentTabMeetings.map((m) => {
              const effectiveStatus = meetingStatusLabel(m);
              const statusInfo = getStatusBadge(effectiveStatus);
              const isPastTab = activeTab === 'pasadas';
              const ended =
                m.status !== 'cancelled' && (m.status === 'completed' || isMeetingPast(m));
              const isCreator = isUserCreatorOrAdmin(m);
              const canEdit = isUserCreator(m) && m.status === 'scheduled' && isMeetingUpcoming(m);
              const canRestore =
                isUserCreator(m) &&
                m.status === 'cancelled' &&
                isMeetingUpcoming({
                  date: m.date,
                  start_time: m.start_time,
                  status: 'scheduled',
                });

              return (
                <div
                  key={m.id}
                  className={`rounded-xl p-4 flex items-start gap-4 transition-all duration-200 ${
                    isPastTab
                      ? 'border border-white/5 bg-[#0E0F14]/80 opacity-90'
                      : 'border border-blue-500/15 bg-[#12131C] shadow-sm hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-md hover:shadow-blue-500/5'
                  }`}
                >
                  {/* Status Indicator Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      effectiveStatus === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : effectiveStatus === 'cancelled'
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-blue-500/15 text-blue-400'
                    }`}
                  >
                    <Video size={18} />
                  </div>

                  {/* Meeting Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <button
                        type="button"
                        onClick={() => openDetail(m)}
                        className="text-sm font-semibold text-[#F9FAFB] hover:text-blue-400 transition-colors text-left"
                      >
                        {m.title}
                      </button>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getTypeBadgeStyle(
                          m.type,
                        )}`}
                      >
                        {m.type}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusInfo.style}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#6B7280] mb-2 flex-wrap">
                      <span className="flex items-center gap-1 text-[#9CA3AF]">
                        <Calendar size={12} />
                        {m.date}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[#9CA3AF]">
                        <Clock size={12} />
                        {m.start_time} · {m.duration}min
                      </span>
                      {m.project_name && (
                        <span className="text-blue-300/80 font-medium">{m.project_name}</span>
                      )}
                    </div>

                    {m.summary && (
                      <p className="text-xs text-[#9CA3AF] mb-2 line-clamp-2 italic bg-[#1A1C28] p-2 rounded border border-white/4">
                        "{m.summary}"
                      </p>
                    )}

                    <div className="flex items-center gap-3 flex-wrap text-xs">
                      {m.participants && m.participants.length > 0 && (
                        <div className="flex items-center gap-1">
                          {m.participants.slice(0, 8).map((p) => (
                            <span
                              key={p.user_id}
                              title={p.name ?? p.user_id}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/25 to-violet-600/25 text-[10px] font-semibold text-[#F9FAFB] ring-1 ring-white/10"
                            >
                              {(p.name ?? '?')
                                .trim()
                                .split(/\s+/)
                                .slice(0, 2)
                                .map((part) => part[0]?.toUpperCase() ?? '')
                                .join('')}
                            </span>
                          ))}
                        </div>
                      )}

                      {ended && isCreator && (
                        <button
                          type="button"
                          title="Registrar o editar resumen y acta"
                          onClick={() => openSummaryModal(m)}
                          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                        >
                          <FileText size={12} />
                          {m.summary ? 'Editar resumen' : 'Registrar resumen y acta'}
                        </button>
                      )}

                      {m.minutes_url && (
                        <a
                          href={m.minutes_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                        >
                          <LinkIcon size={12} />
                          Ver acta
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <IconActionButton
                      icon={Eye}
                      label="Ver detalle de la reunión"
                      tone="blue"
                      onClick={() => void openDetail(m)}
                    />
                    {canEdit ? (
                      <IconActionButton
                        icon={Pencil}
                        label="Editar reunión"
                        tone="violet"
                        onClick={() => void openEditMeeting(m)}
                      />
                    ) : null}
                    {!isPastTab && m.link ? (
                      <a
                        href={m.link}
                        target="_blank"
                        rel="noreferrer"
                        title="Unirse a la videollamada"
                        aria-label="Unirse a la videollamada"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-400 transition-colors hover:bg-blue-500/15 hover:text-blue-300"
                      >
                        <ExternalLink size={16} aria-hidden="true" />
                      </a>
                    ) : null}
                    {!isPastTab ? (
                      <IconActionButton
                        icon={CalendarPlus}
                        label="Enviar a Google Calendar"
                        tone="emerald"
                        onClick={() => handleOpenGoogleCalendar(m)}
                      />
                    ) : null}
                    {m.link ? (
                      <IconActionButton
                        icon={Copy}
                        label="Copiar enlace de la reunión"
                        tone="neutral"
                        onClick={() => handleCopyLink(m.link)}
                      />
                    ) : null}
                    {canRestore ? (
                      <IconActionButton
                        icon={RotateCcw}
                        label="Recuperar reunión cancelada"
                        tone="emerald"
                        disabled={restoringId === m.id}
                        onClick={() => void handleRestore(m)}
                      />
                    ) : null}
                    {isUserCreator(m) && m.status === 'scheduled' && isMeetingUpcoming(m) ? (
                      <IconActionButton
                        icon={Ban}
                        label="Cancelar reunión"
                        tone="amber"
                        onClick={() => setCancelModalMeeting(m)}
                      />
                    ) : null}
                    {isUserCreator(m) && m.status === 'scheduled' ? (
                      <IconActionButton
                        icon={Trash2}
                        label="Eliminar reunión y liberar horario"
                        tone="red"
                        onClick={() => setDeleteModalMeeting(m)}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Calendar View (HU_DN_03_40) */
        <div className="bg-[#12131C] border border-white/6 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/6">
            <button
              type="button"
              onClick={() => {
                if (calMonth === 0) {
                  setCalMonth(11);
                  setCalYear((y) => y - 1);
                } else {
                  setCalMonth((m) => m - 1);
                }
              }}
              aria-label="Mes anterior"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/8 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-sm font-semibold text-[#F9FAFB]">
              {MONTH_NAMES[calMonth]} {calYear}
            </h2>
            <button
              type="button"
              onClick={() => {
                if (calMonth === 11) {
                  setCalMonth(0);
                  setCalYear((y) => y + 1);
                } else {
                  setCalMonth((m) => m + 1);
                }
              }}
              aria-label="Mes siguiente"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/8 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#6B7280] pb-1">
            {WEEKDAY_NAMES.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="min-h-[85px]" />;
              }

              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(
                day,
              ).padStart(2, '0')}`;
              const dayMeetings = meetingsByDay[dateStr] || [];
              const isToday = dateStr === todayStr;

              return (
                <div
                  key={`day-${day}`}
                  className={`min-h-[85px] p-1.5 rounded-lg border transition-colors flex flex-col gap-1 ${
                    isToday
                      ? 'bg-blue-500/8 border-blue-500/40'
                      : 'bg-[#1A1C28]/60 border-white/4 hover:border-white/10'
                  }`}
                >
                  <span
                    className={`text-[11px] font-medium ${
                      isToday ? 'text-blue-400 font-bold' : 'text-[#9CA3AF]'
                    }`}
                  >
                    {day}
                  </span>

                  <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[75px]">
                    {dayMeetings.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => openDetail(m)}
                        title={`${m.start_time} - ${m.title} (${m.type})`}
                        className={`text-left text-[10px] px-1.5 py-0.5 rounded truncate border transition-colors ${getTypeBadgeStyle(
                          m.type,
                        )}`}
                      >
                        <span className="font-mono font-medium mr-1">{m.start_time}</span>
                        <span>{m.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Meeting Detail Modal (HU_DN_03_41) */}
      {selectedMeeting && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="meeting-detail-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg bg-[#12131C] border border-white/10 rounded-xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-white/8 pb-3">
              <div>
                <h3 id="meeting-detail-title" className="text-base font-semibold text-[#F9FAFB]">
                  {selectedMeeting.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getTypeBadgeStyle(
                      selectedMeeting.type,
                    )}`}
                  >
                    {selectedMeeting.type}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                      getStatusBadge(selectedMeeting.status).style
                    }`}
                  >
                    {getStatusBadge(selectedMeeting.status).label}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMeeting(null)}
                aria-label="Cerrar detalle"
                className="text-[#6B7280] hover:text-[#F9FAFB] p-1 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {gcError && (
              <div
                role="alert"
                className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg flex items-center justify-between gap-2"
              >
                <span>{gcError}</span>
                <button
                  type="button"
                  onClick={() => handleCopyMeetingData(selectedMeeting)}
                  className="text-xs font-medium text-amber-300 hover:text-white underline underline-offset-2 shrink-0"
                >
                  Copiar datos de la reunión
                </button>
              </div>
            )}

            {clipboardError && (
              <div
                role="alert"
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg flex items-center gap-2"
              >
                <AlertCircle size={14} className="shrink-0" />
                <span>{clipboardError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#1A1C28] p-3 rounded-lg border border-white/6 text-[#9CA3AF]">
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Proyecto</span>
                  <span className="font-medium text-[#F9FAFB]">
                    {selectedMeeting.project_name || 'No especificado'}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Fecha y horario</span>
                  <span className="font-medium text-[#F9FAFB]">
                    {selectedMeeting.date} ({selectedMeeting.start_time} –{' '}
                    {selectedMeeting.end_time})
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Duración</span>
                  <span className="font-medium text-[#F9FAFB]">
                    {selectedMeeting.duration} minutos
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Convocada por</span>
                  <span className="font-medium text-[#F9FAFB]">
                    {selectedMeeting.creator_name || 'Organizador'}
                  </span>
                </div>
              </div>

              {selectedMeeting.link && (
                <div className="flex items-center justify-between bg-[#1A1C28] px-3 py-2 rounded-lg border border-white/6">
                  <span className="truncate max-w-[320px] text-blue-400 font-mono text-[11px]">
                    {selectedMeeting.link}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={selectedMeeting.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                    >
                      <ExternalLink size={12} />
                      Unirse
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(selectedMeeting.link)}
                      className="text-xs text-[#9CA3AF] hover:text-[#F9FAFB] px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* Participants & Responses */}
              <div>
                <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1.5">
                  Participantes y respuestas
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedMeeting.participants && selectedMeeting.participants.length > 0 ? (
                    selectedMeeting.participants.map((p) => {
                      const respInfo = getResponseBadge(p.response);
                      return (
                        <div
                          key={p.user_id}
                          className="flex items-center justify-between bg-[#1A1C28] px-3 py-1.5 rounded-lg border border-white/6"
                        >
                          <span className="font-medium text-[#F9FAFB]">
                            {p.name || p.email || p.user_id}
                          </span>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${respInfo.style}`}
                          >
                            {respInfo.label}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[#6B7280]">No hay participantes registrados.</p>
                  )}
                </div>
              </div>

              {/* Participant Response Action (HU_DN_03_44) */}
              {isUserParticipant(selectedMeeting) &&
                selectedMeeting.status === 'scheduled' &&
                !isMeetingRealizada(selectedMeeting) && (
                  <div className="bg-blue-500/8 border border-blue-500/20 p-3 rounded-lg flex items-center justify-between">
                    <span className="text-xs text-blue-300 font-medium">
                      ¿Asistirás a esta reunión?
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleRespond(selectedMeeting.id, 'aceptada')}
                        disabled={respondingMeetingId === selectedMeeting.id}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white h-7 text-xs"
                      >
                        Aceptar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRespond(selectedMeeting.id, 'rechazada')}
                        disabled={respondingMeetingId === selectedMeeting.id}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 text-xs"
                      >
                        Rechazar
                      </Button>
                    </div>
                  </div>
                )}

              {/* Summary and Minutes Section */}
              {selectedMeeting.summary && (
                <div className="bg-[#1A1C28] p-3 rounded-lg border border-white/6 space-y-1">
                  <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">
                    Resumen de acuerdos
                  </p>
                  <p className="text-xs text-[#F9FAFB] whitespace-pre-wrap">
                    {selectedMeeting.summary}
                  </p>
                </div>
              )}

              {selectedMeeting.minutes_url && (
                <a
                  href={selectedMeeting.minutes_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  <LinkIcon size={13} />
                  Ver acta de reunión
                </a>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/8 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenGoogleCalendar(selectedMeeting)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                >
                  <CalendarPlus size={13} />
                  Enviar a Google Calendar
                </button>

                {isMeetingRealizada(selectedMeeting) && isUserCreatorOrAdmin(selectedMeeting) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openSummaryModal(selectedMeeting)}
                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 text-xs"
                  >
                    <FileText size={13} className="mr-1" />
                    {selectedMeeting.summary ? 'Editar resumen' : 'Registrar resumen y acta'}
                  </Button>
                )}
              </div>

              {isUserCreator(selectedMeeting) &&
                selectedMeeting.status === 'scheduled' &&
                !isMeetingRealizada(selectedMeeting) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCancelModalMeeting(selectedMeeting)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                  >
                    <Trash2 size={13} className="mr-1" />
                    Cancelar reunión
                  </Button>
                )}
            </div>
          </div>
        </div>
      )}

      {editMeeting ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-meeting-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-[#12131C] border border-white/10 rounded-xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <h4 id="edit-meeting-title" className="text-sm font-semibold text-[#F9FAFB]">
                Editar reunión
              </h4>
              <button
                type="button"
                onClick={() => setEditMeeting(null)}
                aria-label="Cerrar"
                className="text-[#6B7280] hover:text-[#F9FAFB] p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>
            {editError ? (
              <div
                role="alert"
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg"
              >
                {editError}
              </div>
            ) : null}
            <TextField
              label="Título de la reunión"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={100}
            />
            <TextField
              label="Ubicación o enlace"
              value={editLink}
              onChange={(e) => setEditLink(e.target.value)}
              placeholder="https://meet.google.com/…"
            />
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-[#9CA3AF]">Participantes</legend>
              {(editMeeting.participants ?? []).map((p) => (
                <label
                  key={p.user_id}
                  className="flex items-center gap-2 rounded-lg border border-white/8 bg-[#1A1C28] px-3 py-2 text-xs text-[#F9FAFB]"
                >
                  <input
                    type="checkbox"
                    checked={editParticipantIds.includes(p.user_id)}
                    onChange={() => toggleEditParticipant(p.user_id)}
                    title={`Incluir a ${p.name ?? p.email ?? p.user_id}`}
                  />
                  {p.name || p.email || p.user_id}
                </label>
              ))}
            </fieldset>
            {isMeetingPast(editMeeting) &&
            editMeeting.status !== 'cancelled' &&
            isUserCreatorOrAdmin(editMeeting) ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-purple-400"
                onClick={() => {
                  setEditMeeting(null);
                  openSummaryModal(editMeeting);
                }}
              >
                <FileText size={13} className="mr-1" />
                Editar resumen y acta
              </Button>
            ) : null}
            <div className="flex justify-end gap-2 pt-2 border-t border-white/8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditMeeting(null)}
                disabled={savingEdit}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => void handleSaveEdit()}
                disabled={savingEdit}
              >
                {savingEdit ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteModalMeeting ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-meeting-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm bg-[#12131C] border border-white/10 rounded-xl shadow-2xl p-5 space-y-4">
            <h4 id="delete-meeting-title" className="text-sm font-semibold text-[#F9FAFB]">
              Eliminar reunión
            </h4>
            <p className="text-xs text-[#9CA3AF]">{AVAILABILITY_MESSAGES.deleteMeetingConfirm}</p>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteModalMeeting(null)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => void handleConfirmDelete()}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Cancel Confirmation Modal (HU_DN_03_45) */}
      {cancelModalMeeting && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm bg-[#12131C] border border-white/10 rounded-xl shadow-2xl p-5 space-y-4">
            <h4 id="cancel-modal-title" className="text-sm font-semibold text-[#F9FAFB]">
              Cancelar reunión
            </h4>
            <p className="text-xs text-[#9CA3AF]">{AVAILABILITY_MESSAGES.cancelConfirmMessage}</p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCancelModalMeeting(null)}
                disabled={cancelling}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                {cancelling ? 'Cancelando…' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary and Minutes Registration Modal (HU_DN_03_41) */}
      {summaryModalMeeting && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="summary-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-[#12131C] border border-white/10 rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <h4 id="summary-modal-title" className="text-sm font-semibold text-[#F9FAFB]">
                Registrar resumen y acta
              </h4>
              <button
                type="button"
                onClick={() => setSummaryModalMeeting(null)}
                className="text-[#6B7280] hover:text-[#F9FAFB] p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            {summaryError && (
              <div
                role="alert"
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg flex items-center gap-2"
              >
                <AlertCircle size={14} className="shrink-0" />
                <span>{summaryError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="meeting-summary-text"
                  className="block text-xs font-medium text-[#9CA3AF] mb-1"
                >
                  Resumen de la reunión (máx. 2000 caracteres)
                </label>
                <textarea
                  id="meeting-summary-text"
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  maxLength={2000}
                  rows={5}
                  placeholder="Acuerdos principales, notas de seguimiento, decisiones clave…"
                  className="w-full bg-[#1E1F2B] border border-white/10 rounded-md p-3 text-xs text-[#F9FAFB] resize-none focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-[#6B7280] text-right mt-0.5">
                  {summaryText.length}/2000
                </p>
              </div>

              <div>
                <TextField
                  id="minutes-url"
                  label="Enlace del acta (opcional)"
                  placeholder="https://docs.google.com/document/d/..."
                  value={minutesUrlText}
                  onChange={(e) => setMinutesUrlText(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSummaryModalMeeting(null)}
                disabled={savingSummary}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveSummary}
                disabled={savingSummary}
              >
                {savingSummary ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
