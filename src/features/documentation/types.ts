export type DocumentationCategory = 'Técnica' | 'Funcional' | 'Reunión' | 'General' | 'Prompt';

export type DocumentationApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DocumentationEntry {
  id: string;
  project_id: string;
  author_id: string;
  author_name?: string | null;
  title: string;
  category: DocumentationCategory;
  objective?: string | null;
  tags?: string | null;
  content?: string | null;
  external_url?: string | null;
  approval_status: DocumentationApprovalStatus;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  can_edit: boolean;
  can_delete: boolean;
}

export interface CreateDocumentationPayload {
  title: string;
  category: DocumentationCategory;
  objective?: string;
  tags?: string;
  content?: string;
  external_url?: string;
}

export interface UpdateDocumentationPayload {
  title: string;
  category: DocumentationCategory;
  objective?: string;
  tags?: string;
  content?: string;
  external_url?: string;
}

export interface DocumentationOperationResponse {
  message: string;
  entry: DocumentationEntry | null;
}

export interface DocumentationListResponse {
  entries: DocumentationEntry[];
  message?: string | null;
}
