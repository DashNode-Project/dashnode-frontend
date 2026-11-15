import { describe, expect, it } from 'vitest';
import { PROJECT_WORKSPACE_TABS, visibleProjectTabs } from './projectWorkspaceTabs';

describe('projectWorkspaceTabs', () => {
  it('hides AI metrics tab from developers', () => {
    const tabs = visibleProjectTabs('developer');
    expect(tabs.some((t) => t.segment === 'metricas-ia')).toBe(false);
    expect(tabs.some((t) => t.segment === 'resumen')).toBe(true);
  });

  it('shows AI metrics for managers', () => {
    const tabs = visibleProjectTabs('manager');
    expect(tabs).toHaveLength(
      PROJECT_WORKSPACE_TABS.filter((t) => t.roles.includes('manager')).length,
    );
  });

  it('marks conocimiento tab as implemented', () => {
    const tab = PROJECT_WORKSPACE_TABS.find((t) => t.segment === 'conocimiento');
    expect(tab).toBeDefined();
    expect(tab?.implemented).toBe(true);
  });
});
