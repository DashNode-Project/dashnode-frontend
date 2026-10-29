import { ExternalLink, Pencil, Video } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { PATHS } from '@/app/paths';
import { listMeetings } from '@/features/availability/api';
import type { MeetingDTO, ParticipantDTO } from '@/features/availability/types';
import { Avatar, Card } from '@/components/ui/demo-ui';
import { Button } from '@/components/ui/Button';
import { useProjectWorkspace } from './ProjectWorkspaceContext';
import { useToast } from '@/lib/toast/ToastProvider';
import { AVAILABILITY_MESSAGES } from '@/features/availability/messages';

export default function ProjectMeetingsTab() {
  const { project } = useProjectWorkspace();
  const { showToast } = useToast();
  const [meetings, setMeetings] = useState<MeetingDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await listMeetings();
        if (!cancelled) {
          setMeetings(all.filter((m) => m.project_id === project.id && m.status !== 'cancelled'));
        }
      } catch {
        if (!cancelled) showToast(AVAILABILITY_MESSAGES.technicalLoadFailure, 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project.id, showToast]);

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return meetings
      .filter((m) => m.status === 'scheduled' && m.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [meetings]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#F9FAFB]">Reuniones del proyecto</h2>
        <Button variant="secondary" size="sm" iconLeft={<Video size={14} />}>
          <Link to={PATHS.availability}>Programar reunión</Link>
        </Button>
      </div>
      {loading ? (
        <p className="text-sm text-[#9CA3AF]">Cargando reuniones…</p>
      ) : upcoming.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#9CA3AF]">
          No hay reuniones próximas para este proyecto.
        </Card>
      ) : (
        <div className="grid gap-3">
          {upcoming.map((m) => (
            <Card key={m.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15">
                <Video size={18} className="text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#F9FAFB]">{m.title}</p>
                <p className="text-xs text-[#9CA3AF]">
                  {m.date} · {m.start_time} – {m.end_time} · {m.type}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {(m.participants ?? []).slice(0, 6).map((p: ParticipantDTO) => (
                    <Avatar key={p.user_id} name={p.name ?? p.user_id} size={28} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  to={PATHS.meetings}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-white/8 hover:text-[#F9FAFB]"
                  title="Editar en reuniones"
                >
                  <Pencil size={14} />
                </Link>
                {m.link ? (
                  <a
                    href={m.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-blue-500/10 hover:text-blue-300"
                    title="Enlace de reunión"
                  >
                    <ExternalLink size={14} />
                  </a>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
