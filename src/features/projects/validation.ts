import { PROJECT_MESSAGES } from './messages';

export interface ProjectFormValues {
  name: string;
  description: string;
  priority: string;
  techStackInput: string;
  meetingLink: string;
  managerId: string;
}

export function validateProjectForm(
  values: ProjectFormValues,
): Partial<Record<keyof ProjectFormValues, string>> {
  const errors: Partial<Record<keyof ProjectFormValues, string>> = {};
  if (!values.name.trim()) {
    errors.name = PROJECT_MESSAGES.nameRequired;
  } else if (values.name.length > 100) {
    errors.name = 'El nombre del proyecto no puede exceder 100 caracteres.';
  }
  if (values.description.length > 2000) {
    errors.description = 'La descripción no puede exceder 2000 caracteres.';
  }
  if (!values.managerId) {
    errors.managerId = PROJECT_MESSAGES.managerRequired;
  }
  const link = values.meetingLink.trim();
  if (link) {
    try {
      const parsed = new URL(link);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        errors.meetingLink = PROJECT_MESSAGES.meetingLinkInvalid;
      }
    } catch {
      errors.meetingLink = PROJECT_MESSAGES.meetingLinkInvalid;
    }
  }
  return errors;
}

export function parseTechStack(input: string): string[] {
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}
