import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProjectModal } from '@/features/projects/ProjectModal';
import { ISSUE_MESSAGES, RESTORABLE_TASK_STATUS_OPTIONS } from '../messages';
import type { Issue } from '../types';
import { validateResolutionNote } from '../validation';

interface ResolveIssueModalProps {
  issue: Issue;
  mode?: 'resolve' | 'close';
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: { resolution_note?: string; task_status?: string | null }) => Promise<void>;
}

const VALID_RESTORE_SET = new Set<string>(RESTORABLE_TASK_STATUS_OPTIONS.map((o) => o.value));

function defaultTaskStatus(previous?: string | null): string {
  if (previous && VALID_RESTORE_SET.has(previous)) {
    return previous;
  }
  return 'IN_PROGRESS';
}

export function ResolveIssueModal({
  issue,
  mode = 'resolve',
  loading,
  onClose,
  onSubmit,
}: ResolveIssueModalProps) {
  const [resolutionNote, setResolutionNote] = useState('');
  const [taskStatus, setTaskStatus] = useState(() => defaultTaskStatus(issue.task_previous_status));
  const [noteError, setNoteError] = useState<string | null>(null);

  const isLinkedToTask = Boolean(issue.task_id);
  const showTaskSelector =
    isLinkedToTask && (mode === 'resolve' || issue.task_status === 'CORRECTION');
  const hasOtherOpenIssues = (issue.other_open_issues_count ?? 0) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'resolve') {
      const err = validateResolutionNote(resolutionNote);
      if (err) {
        setNoteError(err);
        return;
      }
      setNoteError(null);
      await onSubmit({
        resolution_note: resolutionNote.trim(),
        task_status: showTaskSelector && !hasOtherOpenIssues ? taskStatus : undefined,
      });
      return;
    }

    await onSubmit({
      task_status: showTaskSelector && !hasOtherOpenIssues ? taskStatus : undefined,
    });
  };

  return (
    <ProjectModal
      title={mode === 'resolve' ? 'Resolver issue' : 'Cerrar issue'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading
              ? mode === 'resolve'
                ? 'Resolviendo…'
                : 'Cerrando…'
              : mode === 'resolve'
                ? 'Resolver'
                : 'Cerrar issue'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <p className="text-xs text-[#9CA3AF]">
          Issue: <span className="font-medium text-[#F9FAFB]">{issue.title}</span>
        </p>

        {mode === 'resolve' ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="issue-resolution-note" className="text-sm font-medium text-[#F9FAFB]">
                Nota de resolución *
              </label>
              <span className="text-xs text-[#6B7280]">{resolutionNote.length}/2000</span>
            </div>
            <textarea
              id="issue-resolution-note"
              rows={4}
              maxLength={2000}
              value={resolutionNote}
              onChange={(e) => {
                setResolutionNote(e.target.value);
                if (noteError) setNoteError(null);
              }}
              placeholder="Describe la causa raíz y la solución aplicada..."
              className="w-full resize-none rounded-md border border-white/10 bg-[#1E1F2B] p-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-blue-500 focus:outline-none"
              aria-invalid={noteError ? 'true' : 'false'}
              aria-describedby={noteError ? 'issue-resolution-note-error' : undefined}
            />
            {noteError && (
              <p id="issue-resolution-note-error" role="alert" className="text-xs text-red-400">
                {noteError}
              </p>
            )}
          </div>
        ) : (
          issue.resolution_note && (
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs">
              <p className="font-semibold text-emerald-400 mb-1">Nota de resolución</p>
              <p className="text-[#F9FAFB]">{issue.resolution_note}</p>
            </div>
          )
        )}

        {showTaskSelector && (
          <div className="space-y-2 rounded-lg border border-white/10 bg-[#12131C] p-3">
            {issue.task_name && (
              <p className="text-xs text-[#9CA3AF]">
                Tarea vinculada:{' '}
                <span className="font-medium text-[#F9FAFB]">{issue.task_name}</span>
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="issue-restore-task-status"
                className="text-sm font-medium text-[#F9FAFB]"
              >
                Estado de la tarea
              </label>
              <select
                id="issue-restore-task-status"
                value={taskStatus}
                disabled={loading || hasOtherOpenIssues}
                onChange={(e) => setTaskStatus(e.target.value)}
                className="h-10 rounded-md border border-white/10 bg-[#1E1F2B] px-3 text-sm text-[#F9FAFB] focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {RESTORABLE_TASK_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {hasOtherOpenIssues && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300"
              >
                <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{ISSUE_MESSAGES.TASK_OTHER_OPEN_ISSUES}</span>
              </div>
            )}
          </div>
        )}
      </form>
    </ProjectModal>
  );
}
