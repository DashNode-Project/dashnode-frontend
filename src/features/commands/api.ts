import { apiRequest } from '@/lib/api/client';

export type CommandType = 'PAGE' | 'ACTION';
export type CommandScope = 'GLOBAL' | 'PROJECT';

export interface CommandProjectRef {
  id: string;
  name: string;
}

export interface CommandItem {
  id: string;
  label: string;
  type: CommandType;
  scope: CommandScope;
  route: string | null;
  route_template: string | null;
  action: string | null;
  keywords: string[];
  project: CommandProjectRef | null;
}

export interface CommandCatalogResponse {
  catalog_version: string;
  commands: CommandItem[];
  projects: CommandProjectRef[];
}

export async function fetchCommandCatalog(): Promise<CommandCatalogResponse> {
  return apiRequest<CommandCatalogResponse>('/commands');
}
