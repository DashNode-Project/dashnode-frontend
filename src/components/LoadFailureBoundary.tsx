import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { MESSAGES } from '@/lib/messages';

interface Props {
  children: ReactNode;
  /** Called by the "Reintentar" button. Defaults to reloading the page. */
  onRetry?: () => void;
}

interface State {
  failed: boolean;
}

/**
 * Catches failures while loading a screen (e.g. its code chunk cannot be downloaded) and shows
 * the literal load-failure message instead of a blank page.
 */
export class LoadFailureBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Only metadata is logged: never user data.
    console.error('Screen failed to load', error.name, info.componentStack?.split('\n')[1]?.trim());
  }

  private retry = () => {
    if (this.props.onRetry) {
      this.setState({ failed: false });
      this.props.onRetry();
      return;
    }
    window.location.reload();
  };

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <main
        id="main"
        className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <Alert variant="error">{MESSAGES.loadFailure}</Alert>
        <Button variant="outline" onClick={this.retry}>
          <RefreshCw size={14} aria-hidden="true" />
          Reintentar
        </Button>
      </main>
    );
  }
}
