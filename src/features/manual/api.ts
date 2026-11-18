import { apiRequest } from '@/lib/api/client';

export interface SystemKnowledgeEntry {
  id: string;
  question: string;
  answer_md: string;
  tags: string;
  updated_at: string;
}

export async function searchSystemKnowledge(query: string): Promise<SystemKnowledgeEntry[]> {
  const q = query.trim();
  const suffix = q ? `?q=${encodeURIComponent(q)}` : '';
  const res = await apiRequest<{ items: SystemKnowledgeEntry[] }>(`/knowledge/system${suffix}`);
  return res.items;
}
