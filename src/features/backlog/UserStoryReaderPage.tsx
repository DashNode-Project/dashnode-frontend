import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { projectTabPath } from '@/app/paths';
import { listProjectMembers } from '@/features/projects/api';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { useToast } from '@/lib/toast/ToastProvider';
import { getProjectBacklog } from './api';
import { flattenStories, visibleProjectMembers } from './backlogHelpers';
import { UserStoryContent } from './UserStoryContent';
import type { BacklogTreeDTO, UserStoryDTO } from './types';

export default function UserStoryReaderPage() {
  const { projectId = '', storyId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const layout = searchParams.get('layout') === 'all' ? 'all' : 'single';
  const { showToast } = useToast();
  const [tree, setTree] = useState<BacklogTreeDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const backlog = await getProjectBacklog(projectId);
        if (!cancelled) setTree(backlog);
      } catch (error) {
        if (!cancelled) {
          showToast(
            error instanceof ApiError && !isTechnicalFailure(error)
              ? error.message
              : MESSAGES.loadFailure,
            'error',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, showToast]);

  const [memberMap, setMemberMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!projectId) return;
    void listProjectMembers(projectId).then((rows) => {
      const visible = visibleProjectMembers(rows);
      setMemberMap(new Map(visible.map((m) => [m.user_id, m.name])));
    });
  }, [projectId]);

  const stories = useMemo(() => flattenStories(tree), [tree]);
  const activeId = storyId ?? stories[0]?.id;
  const index = stories.findIndex((s) => s.id === activeId);
  const current = index >= 0 ? stories[index] : stories[0];

  function goTo(story: UserStoryDTO) {
    const qs = searchParams.toString();
    navigate(`${projectTabPath(projectId, 'backlog')}/leer/${story.id}${qs ? `?${qs}` : ''}`, {
      replace: true,
    });
  }

  if (loading) {
    return (
      <p className="animate-pulse text-sm text-[#9CA3AF]" role="status">
        Cargando historias…
      </p>
    );
  }

  if (!tree || stories.length === 0) {
    return (
      <p className="text-sm text-[#9CA3AF]">
        No hay historias para mostrar.{' '}
        <Link to={projectTabPath(projectId, 'backlog')} className="text-blue-400 hover:underline">
          Volver al backlog
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to={projectTabPath(projectId, 'backlog')} className="text-sm text-blue-400 hover:underline">
          ← Backlog
        </Link>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={layout === 'single' ? 'primary' : 'secondary'}
            onClick={() => setSearchParams({ layout: 'single' })}
          >
            Una a una
          </Button>
          <Button
            type="button"
            size="sm"
            variant={layout === 'all' ? 'primary' : 'secondary'}
            onClick={() => setSearchParams({ layout: 'all' })}
          >
            Todas (scroll)
          </Button>
        </div>
      </div>

      {layout === 'all' ? (
        <div className="space-y-8">
          {stories.map((story) => (
            <section
              key={story.id}
              id={story.id}
              className="scroll-mt-6 rounded-xl border border-white/6 bg-[#12131C] p-6"
            >
              <UserStoryContent story={story} tree={tree} memberMap={memberMap} />
            </section>
          ))}
        </div>
      ) : current ? (
        <div className="rounded-xl border border-white/6 bg-[#12131C] p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={index <= 0}
              aria-label="Anterior"
              onClick={() => {
                if (index > 0) goTo(stories[index - 1]!);
              }}
            >
              <ChevronLeft size={16} aria-hidden />
            </Button>
            <span className="text-xs text-[#6B7280]">
              {index + 1} / {stories.length}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={index < 0 || index >= stories.length - 1}
              aria-label="Siguiente"
              onClick={() => {
                if (index >= 0 && index < stories.length - 1) goTo(stories[index + 1]!);
              }}
            >
              <ChevronRight size={16} aria-hidden />
            </Button>
          </div>
          <UserStoryContent story={current} tree={tree} memberMap={memberMap} />
        </div>
      ) : null}
    </div>
  );
}
