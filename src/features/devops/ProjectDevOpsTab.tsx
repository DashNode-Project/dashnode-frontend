import { ClipboardCopy, ExternalLink, History, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/toast/ToastProvider';
import { fetchDevOpsProfile, listDevOpsRevisions, upsertDevOpsProfile } from './api';
import { DEVOPS_MESSAGES } from './messages';
import type {
  DevOpsEnvironment,
  DevOpsProfile,
  DevOpsRevision,
  PipelineStage,
  UpsertDevOpsPayload,
} from './types';

function MarkdownBlock({ title, content }: { title: string; content?: string | null }) {
  if (!content?.trim()) return null;
  return (
    <section className="rounded-xl border border-white/10 bg-[#12131C] p-5">
      <h2 className="text-sm font-semibold text-[#F9FAFB]">{title}</h2>
      <pre className="mt-3 whitespace-pre-wrap text-sm text-[#D1D5DB]">{content}</pre>
    </section>
  );
}

function emptyStage(order: number): PipelineStage {
  return {
    order,
    name: '',
    tool: '',
    commands: '',
    trigger_event: '',
    is_required: true,
  };
}

function emptyEnv(): DevOpsEnvironment {
  return {
    name: '',
    url: '',
    branch: '',
    deploy_strategy: '',
    requires_approval: false,
  };
}

export default function ProjectDevOpsTab() {
  const { projectId = '' } = useParams();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<DevOpsProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<UpsertDevOpsPayload | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [revisions, setRevisions] = useState<DevOpsRevision[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!projectId) return;
      setError(null);
      try {
        const data = await fetchDevOpsProfile(projectId);
        if (!cancelled) setProfile(data);
      } catch {
        if (!cancelled) setError(DEVOPS_MESSAGES.loadError);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const startEdit = () => {
    if (!profile) return;
    setDraft({
      repository_url: profile.repository_url ?? '',
      ci_cd_provider: profile.ci_cd_provider ?? '',
      branching_strategy: profile.branching_strategy ?? '',
      branching_rules_md: profile.branching_rules_md ?? '',
      pipeline_stages: profile.pipeline_stages.length ? profile.pipeline_stages : [emptyStage(1)],
      environments: profile.environments.length ? profile.environments : [emptyEnv()],
      quality_gates_md: profile.quality_gates_md ?? '',
      deployment_runbook_md: profile.deployment_runbook_md ?? '',
      rollback_observability_md: profile.rollback_observability_md ?? '',
      change_summary: '',
    });
    setEditing(true);
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    try {
      const res = await listDevOpsRevisions(projectId);
      setRevisions(res.items);
    } catch {
      setRevisions([]);
    }
  };

  const onSave = async () => {
    if (!draft || !projectId) return;
    setBusy(true);
    try {
      const saved = await upsertDevOpsProfile(projectId, draft);
      setProfile(saved);
      setEditing(false);
      setDraft(null);
      showToast(DEVOPS_MESSAGES.saveSuccess, 'success');
    } catch {
      showToast(DEVOPS_MESSAGES.saveError, 'error');
    } finally {
      setBusy(false);
    }
  };

  const copyCommand = async (commands: string) => {
    try {
      await navigator.clipboard.writeText(commands);
      showToast(DEVOPS_MESSAGES.copyOk, 'success');
    } catch {
      showToast(DEVOPS_MESSAGES.saveError, 'error');
    }
  };

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6 text-sm text-rose-200">
        {error}
      </div>
    );
  }

  if (!profile) {
    return <div className="text-sm text-[#9CA3AF]">Cargando prácticas DevOps…</div>;
  }

  const view = editing && draft ? draft : profile;
  const stages = view.pipeline_stages;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[#F9FAFB]">Prácticas y arquitectura DevOps</h1>
          {profile.updated_at ? (
            <p className="mt-1 text-sm text-[#9CA3AF]">
              Última actualización: {new Date(profile.updated_at).toLocaleString('es-CO')}
              {profile.updated_by ? ` · ${profile.updated_by.name}` : ''}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.is_configured ? (
            <Button type="button" variant="secondary" onClick={() => void openHistory()}>
              <History size={16} aria-hidden className="mr-2" />
              {DEVOPS_MESSAGES.history}
            </Button>
          ) : null}
          {profile.can_edit && !editing ? (
            <Button type="button" onClick={startEdit}>
              <Pencil size={16} aria-hidden className="mr-2" />
              {profile.is_configured ? DEVOPS_MESSAGES.edit : DEVOPS_MESSAGES.emptyAction}
            </Button>
          ) : null}
          {editing ? (
            <>
              <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                {DEVOPS_MESSAGES.cancel}
              </Button>
              <Button type="button" disabled={busy} onClick={() => void onSave()}>
                {DEVOPS_MESSAGES.save}
              </Button>
            </>
          ) : null}
        </div>
      </header>

      {!profile.is_configured && !editing ? (
        <div className="rounded-xl border border-white/10 bg-[#12131C] p-8 text-center text-sm text-[#9CA3AF]">
          {DEVOPS_MESSAGES.emptyTitle}
        </div>
      ) : null}

      {(profile.is_configured || editing) && (
        <>
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-[#12131C] p-4">
              <p className="text-xs text-[#9CA3AF]">Repositorio</p>
              {editing && draft ? (
                <input
                  className="mt-2 w-full rounded border border-white/10 bg-black/20 px-2 py-1 text-sm"
                  value={draft.repository_url ?? ''}
                  onChange={(e) => setDraft({ ...draft, repository_url: e.target.value })}
                />
              ) : view.repository_url ? (
                <a
                  href={view.repository_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-sky-300 hover:underline"
                >
                  {view.repository_url}
                  <ExternalLink size={14} aria-hidden />
                </a>
              ) : (
                <p className="mt-2 text-sm text-[#6B7280]">—</p>
              )}
            </div>
            <div className="rounded-xl border border-white/10 bg-[#12131C] p-4">
              <p className="text-xs text-[#9CA3AF]">Proveedor CI/CD</p>
              {editing && draft ? (
                <input
                  className="mt-2 w-full rounded border border-white/10 bg-black/20 px-2 py-1 text-sm"
                  value={draft.ci_cd_provider ?? ''}
                  onChange={(e) => setDraft({ ...draft, ci_cd_provider: e.target.value })}
                />
              ) : (
                <p className="mt-2 text-sm text-[#F9FAFB]">{view.ci_cd_provider || '—'}</p>
              )}
            </div>
            <div className="rounded-xl border border-white/10 bg-[#12131C] p-4">
              <p className="text-xs text-[#9CA3AF]">Estrategia de ramas</p>
              {editing && draft ? (
                <input
                  className="mt-2 w-full rounded border border-white/10 bg-black/20 px-2 py-1 text-sm"
                  value={draft.branching_strategy ?? ''}
                  onChange={(e) => setDraft({ ...draft, branching_strategy: e.target.value })}
                />
              ) : (
                <p className="mt-2 text-sm text-[#F9FAFB]">{view.branching_strategy || '—'}</p>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#F9FAFB]">Pipeline CI/CD</h2>
              {editing && draft ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      pipeline_stages: [
                        ...draft.pipeline_stages,
                        emptyStage(draft.pipeline_stages.length + 1),
                      ],
                    })
                  }
                >
                  <Plus size={14} className="mr-1" /> Etapa
                </Button>
              ) : null}
            </div>
            <ol className="grid gap-3 md:grid-cols-2">
              {stages.map((stage, index) => (
                <li
                  key={`${stage.order}-${index}`}
                  className="rounded-xl border border-white/10 bg-[#12131C] p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[#F9FAFB]">
                      {stage.order}. {stage.name || 'Etapa'}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${stage.is_required ? 'bg-emerald-500/15 text-emerald-200' : 'bg-amber-500/15 text-amber-200'}`}
                    >
                      {stage.is_required ? 'Obligatoria' : 'Opcional'}
                    </span>
                  </div>
                  {!editing ? (
                    <>
                      <p className="mt-1 text-xs text-[#9CA3AF]">
                        {stage.tool} · {stage.trigger_event}
                      </p>
                      <div className="mt-2 flex items-start gap-2">
                        <code className="flex-1 rounded bg-black/30 p-2 text-xs text-[#E5E7EB]">
                          {stage.commands}
                        </code>
                        <button
                          type="button"
                          className="rounded border border-white/10 p-2 text-[#9CA3AF] hover:bg-white/5"
                          aria-label="Copiar comando"
                          onClick={() => void copyCommand(stage.commands)}
                        >
                          <ClipboardCopy size={14} />
                        </button>
                      </div>
                    </>
                  ) : null}
                  {editing && draft ? (
                    <div className="mt-3 space-y-2">
                      <input
                        className="w-full rounded border border-white/10 bg-black/20 px-2 py-1 text-xs"
                        placeholder="Nombre"
                        value={stage.name}
                        onChange={(e) => {
                          const next = [...draft.pipeline_stages];
                          next[index] = { ...stage, name: e.target.value };
                          setDraft({ ...draft, pipeline_stages: next });
                        }}
                      />
                      <textarea
                        className="w-full rounded border border-white/10 bg-black/20 px-2 py-1 text-xs"
                        placeholder="Comandos"
                        rows={2}
                        value={stage.commands}
                        onChange={(e) => {
                          const next = [...draft.pipeline_stages];
                          next[index] = { ...stage, commands: e.target.value };
                          setDraft({ ...draft, pipeline_stages: next });
                        }}
                      />
                      <button
                        type="button"
                        className="text-xs text-rose-300"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            pipeline_stages: draft.pipeline_stages.filter((_, i) => i !== index),
                          })
                        }
                      >
                        <Trash2 size={12} className="inline" /> Quitar
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>

          {!editing ? (
            <>
              <MarkdownBlock
                title="Flujo Git y reglas de ramas"
                content={profile.branching_rules_md}
              />
              <MarkdownBlock title="Quality gates" content={profile.quality_gates_md} />
              <MarkdownBlock
                title="Runbook de despliegue"
                content={profile.deployment_runbook_md}
              />
              <MarkdownBlock
                title="Rollback y observabilidad"
                content={profile.rollback_observability_md}
              />
            </>
          ) : draft ? (
            <div className="space-y-3">
              <label className="block text-sm text-[#F9FAFB]">
                {DEVOPS_MESSAGES.changeSummary}
              </label>
              <input
                className="w-full rounded border border-white/10 bg-black/20 px-3 py-2 text-sm"
                value={draft.change_summary}
                onChange={(e) => setDraft({ ...draft, change_summary: e.target.value })}
              />
              <textarea
                className="w-full rounded border border-white/10 bg-black/20 px-3 py-2 text-sm"
                rows={4}
                placeholder="Reglas de ramas (Markdown)"
                value={draft.branching_rules_md ?? ''}
                onChange={(e) => setDraft({ ...draft, branching_rules_md: e.target.value })}
              />
            </div>
          ) : null}
        </>
      )}

      {historyOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/50"
          role="dialog"
          aria-modal
          aria-label="Historial DevOps"
        >
          <div className="h-full w-full max-w-md overflow-y-auto bg-[#0F1017] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#F9FAFB]">Historial</h2>
              <button
                type="button"
                className="text-sm text-[#9CA3AF]"
                onClick={() => setHistoryOpen(false)}
              >
                Cerrar
              </button>
            </div>
            <ul className="mt-4 space-y-3">
              {revisions.map((rev) => (
                <li key={rev.id} className="rounded-lg border border-white/10 p-3 text-sm">
                  <p className="font-medium text-[#F9FAFB]">{rev.change_summary}</p>
                  <p className="mt-1 text-xs text-[#9CA3AF]">
                    {new Date(rev.created_at).toLocaleString('es-CO')}
                    {rev.changed_by ? ` · ${rev.changed_by.name}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
