import { ISSUE_MESSAGES } from './messages';

export interface CreateIssueFormValues {
  title: string;
  description?: string;
  severity: string;
  type: string;
}

export interface CreateIssueFormErrors {
  title?: string;
  description?: string;
  severity?: string;
  type?: string;
}

export function validateCreateIssue(values: CreateIssueFormValues): {
  isValid: boolean;
  errors: CreateIssueFormErrors;
} {
  const errors: CreateIssueFormErrors = {};

  const trimmedTitle = values.title?.trim() ?? '';
  if (!trimmedTitle) {
    errors.title = ISSUE_MESSAGES.TITLE_REQUIRED;
  } else if (trimmedTitle.length > 100) {
    errors.title = ISSUE_MESSAGES.TITLE_TOO_LONG;
  }

  const trimmedDesc = values.description?.trim() ?? '';
  if (trimmedDesc.length > 5000) {
    errors.description = ISSUE_MESSAGES.DESCRIPTION_TOO_LONG;
  }

  const trimmedSeverity = values.severity?.trim() ?? '';
  if (!trimmedSeverity) {
    errors.severity = ISSUE_MESSAGES.SEVERITY_REQUIRED;
  }

  const trimmedType = values.type?.trim() ?? '';
  if (!trimmedType) {
    errors.type = ISSUE_MESSAGES.TYPE_REQUIRED;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateEvidenceFile(file: File | null): string | null {
  if (!file) {
    return 'Debe seleccionar un archivo.';
  }

  const name = file.name.toLowerCase();
  const size = file.size;

  const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(name);
  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm)$/i.test(name);
  const isLog = file.type === 'text/plain' || /\.(log|txt)$/i.test(name);

  if (!isImage && !isVideo && !isLog) {
    return ISSUE_MESSAGES.UNSUPPORTED_FORMAT;
  }

  if (isImage && size > 5 * 1024 * 1024) {
    return ISSUE_MESSAGES.FILE_TOO_LARGE;
  }

  if (isVideo && size > 25 * 1024 * 1024) {
    return ISSUE_MESSAGES.FILE_TOO_LARGE;
  }

  if (isLog && size > 1 * 1024 * 1024) {
    return ISSUE_MESSAGES.FILE_TOO_LARGE;
  }

  return null;
}
