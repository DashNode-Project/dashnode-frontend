import { RefreshCw } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { MESSAGES } from '@/lib/messages';

/** Full-screen "information could not be loaded" state with a retry action. */
export function LoadFailureScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <main
      id="main"
      className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <Alert variant="error">{MESSAGES.loadFailure}</Alert>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw size={14} aria-hidden="true" />
        Reintentar
      </Button>
    </main>
  );
}
