import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { UNDER_DEVELOPMENT_EVENT, UNDER_DEVELOPMENT_MESSAGE } from '@/lib/underDevelopment';

/** Dismissible banner for out-of-scope controls (EP-01 stub behaviour). */
export function DevelopmentNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onNotice = () => setVisible(true);
    window.addEventListener(UNDER_DEVELOPMENT_EVENT, onNotice);
    return () => window.removeEventListener(UNDER_DEVELOPMENT_EVENT, onNotice);
  }, []);

  if (!visible) return null;

  return (
    <div className="border-b border-white/10 px-4 py-2 sm:px-6">
      <Alert variant="info" onDismiss={() => setVisible(false)}>
        {UNDER_DEVELOPMENT_MESSAGE}
      </Alert>
    </div>
  );
}
