export interface PipelineStage {
  order: number;
  name: string;
  tool: string;
  commands: string;
  trigger_event: string;
  is_required: boolean;
  notes?: string | null;
}

export interface DevOpsEnvironment {
  name: string;
  url?: string | null;
  branch: string;
  deploy_strategy: string;
  requires_approval: boolean;
  notes?: string | null;
}

export interface UserRef {
  id: string;
  name: string;
}

export interface DevOpsProfile {
  project_id: string;
  is_configured: boolean;
  can_edit: boolean;
  repository_url?: string | null;
  ci_cd_provider?: string | null;
  branching_strategy?: string | null;
  branching_rules_md?: string | null;
  pipeline_stages: PipelineStage[];
  environments: DevOpsEnvironment[];
  quality_gates_md?: string | null;
  deployment_runbook_md?: string | null;
  rollback_observability_md?: string | null;
  updated_by?: UserRef | null;
  updated_at?: string | null;
}

export interface DevOpsRevision {
  id: string;
  change_summary: string;
  changed_by?: UserRef | null;
  created_at: string;
  snapshot: Record<string, unknown>;
}

export interface UpsertDevOpsPayload {
  repository_url?: string | null;
  ci_cd_provider?: string | null;
  branching_strategy?: string | null;
  branching_rules_md?: string | null;
  pipeline_stages: PipelineStage[];
  environments: DevOpsEnvironment[];
  quality_gates_md?: string | null;
  deployment_runbook_md?: string | null;
  rollback_observability_md?: string | null;
  change_summary: string;
}
