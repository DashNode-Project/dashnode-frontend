import { useEffect } from 'react';
import { registerUnderDevelopmentToast } from '@/lib/underDevelopment';
import { useToast } from '@/lib/toast/ToastProvider';

/** Connects legacy under-development events to the toolkit toast. */
export function UnderDevelopmentBridge() {
  const { showToast } = useToast();
  useEffect(
    () => registerUnderDevelopmentToast((message) => showToast(message, 'info')),
    [showToast],
  );
  return null;
}
