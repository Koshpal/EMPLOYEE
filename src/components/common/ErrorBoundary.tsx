import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * Top-level safety net so a render error shows a recoverable screen instead of a
 * white page.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-bg-secondary)] p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-error)]/10 text-[var(--color-error)]">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="font-heading text-xl font-bold text-[var(--color-text-primary)]">
          Something went wrong
        </h1>
        <p className="max-w-sm text-sm text-[var(--color-text-secondary)]">
          The page hit an unexpected error. Reloading usually fixes it.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" />
          Reload
        </button>
      </div>
    );
  }
}
