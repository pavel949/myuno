import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createErrorHandler } from '@/lib/errorHandler';

const errorLog = createErrorHandler('ErrorBoundary');

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    errorLog.silent(error, 'component_error');
    this.props.onError?.(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Check if it's a chunk loading error (dynamic import failure)
      const isChunkError = this.state.error?.message?.includes('dynamically imported') ||
                          this.state.error?.message?.includes('Failed to fetch') ||
                          this.state.error?.message?.includes('Loading chunk');

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {isChunkError ? 'Connection issue' : 'Something went wrong'}
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {isChunkError 
              ? 'Failed to load some components. Please check your connection and try again.'
              : (this.state.error?.message || 'An unexpected error occurred')
            }
          </p>
          <div className="flex gap-2">
            <Button onClick={this.handleReset} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
            {isChunkError && (
              <Button onClick={this.handleReload} variant="default" size="sm">
                Reload page
              </Button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

// Global unhandled rejection handler hook
export function useGlobalErrorHandler() {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      errorLog.silent(event.reason, 'unhandled_rejection');
      
      // Check for chunk loading errors
      const message = event.reason?.message || String(event.reason);
      if (message.includes('dynamically imported') || 
          message.includes('Failed to fetch') ||
          message.includes('Loading chunk')) {
        toast.error('Failed to load component. Please refresh the page.', {
          action: {
            label: 'Refresh',
            onClick: () => window.location.reload(),
          },
        });
      } else {
        toast.error('An error occurred. Please try again.');
      }
      
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      errorLog.silent(event.error, 'global_error');
      // Prevent crash for recoverable errors
      if (event.error?.message?.includes('dynamically imported')) {
        event.preventDefault();
        toast.error('Connection issue. Please refresh the page.');
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
}
