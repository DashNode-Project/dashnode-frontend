import { describe, expect, it } from 'vitest';
import { PROJECT_MESSAGES } from './messages';
import { validateProjectForm } from './validation';

describe('validateProjectForm', () => {
  it('requires name and manager', () => {
    const errors = validateProjectForm({
      name: '',
      description: '',
      priority: 'media',
      techStackInput: '',
      meetingLink: '',
      managerId: '',
    });
    expect(errors.name).toBe(PROJECT_MESSAGES.nameRequired);
    expect(errors.managerId).toBe(PROJECT_MESSAGES.managerRequired);
  });

  it('parses tech stack tags', async () => {
    const { parseTechStack } = await import('./validation');
    expect(parseTechStack('React, Node, ,')).toEqual(['React', 'Node']);
  });

  it('rejects long names and descriptions', () => {
    const errors = validateProjectForm({
      name: 'x'.repeat(101),
      description: 'y'.repeat(2001),
      priority: 'media',
      techStackInput: '',
      meetingLink: '',
      managerId: 'mgr-1',
    });
    expect(errors.name).toBeDefined();
    expect(errors.description).toBeDefined();
  });

  it('rejects invalid meeting links', () => {
    const errors = validateProjectForm({
      name: 'Demo',
      description: '',
      priority: 'media',
      techStackInput: '',
      meetingLink: 'not-url',
      managerId: 'mgr-1',
    });
    expect(errors.meetingLink).toBe(PROJECT_MESSAGES.meetingLinkInvalid);
  });

  it('rejects non-http meeting protocols', () => {
    const errors = validateProjectForm({
      name: 'Demo',
      description: '',
      priority: 'media',
      techStackInput: '',
      meetingLink: 'ftp://files.example.com/x',
      managerId: 'mgr-1',
    });
    expect(errors.meetingLink).toBe(PROJECT_MESSAGES.meetingLinkInvalid);
  });
});
