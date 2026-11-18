import { apiRequest } from '@/lib/api/client';

export interface PipelineStage {
  stage: string;
  status: string;
  duration_seconds: number;
  started_at: string;
  finished_at: string;
  skip_reason?: string | null;
}

export interface LatestPipelineResponse {
  run_id: string | null;
  is_simulated: boolean;
  trigger?: string | null;
  triggered_by?: { id: string; name: string } | null;
  created_at?: string | null;
  status?: string | null;
  computed_at: string;
  stages: PipelineStage[];
}

export async function fetchLatestPipeline(projectId: string): Promise<LatestPipelineResponse> {
  return apiRequest<LatestPipelineResponse>(`/projects/${projectId}/devops/pipeline/latest`);
}

export async function triggerPipelineRun(projectId: string): Promise<{ run_id: string }> {
  return apiRequest<{ run_id: string; created_at: string }>(
    `/projects/${projectId}/devops/pipeline/runs`,
    { method: 'POST' },
  );
}
