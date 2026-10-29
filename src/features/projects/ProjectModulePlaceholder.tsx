import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router';
import { projectTabPath } from '@/app/paths';
import { notifyUnderDevelopment } from '@/lib/underDevelopment';
import { PROJECT_WORKSPACE_TABS } from './projectWorkspaceTabs';

export default function ProjectModulePlaceholder() {
  const { projectId = '', moduleTab = '' } = useParams();
  const tab = PROJECT_WORKSPACE_TABS.find((t) => t.segment === moduleTab);

  useEffect(() => {
    if (moduleTab === 'resumen') return;
    if (tab && !tab.implemented) {
      notifyUnderDevelopment(tab.label);
    }
  }, [moduleTab, tab]);

  if (moduleTab === 'resumen') {
    return <Navigate to={projectTabPath(projectId, 'resumen')} replace />;
  }

  if (tab?.implemented) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/6 bg-[#12131C] p-8 text-center">
      <p className="text-sm text-[#9CA3AF]">
        El módulo «{tab?.label ?? moduleTab}» estará disponible en un sprint posterior.
      </p>
    </div>
  );
}
