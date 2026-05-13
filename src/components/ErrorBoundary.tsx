import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createErrorHandler } from '@/lib/errorHandler';
import { getStoredLang as getLang } from '@/lib/languageConfig';

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

// Bilingual error messages
const ERROR_MESSAGES = {
  chunk: {
    title: { en: 'Connection issue', ru: 'Проблема с подключением' },
    desc: { en: 'Some components could not be loaded. Please check your connection and try again.', ru: 'Не удалось загрузить некоторые компоненты. Проверьте подключение и попробуйте снова.' },
  },
  generic: {
    title: { en: 'This page failed to load', ru: 'Страница не загрузилась' },
    desc: { en: 'Try again, or reload the page. We have logged the issue.', ru: 'Попробуйте снова или перезагрузите страницу. Мы записали ошибку.' },
  },
  tryAgain: { en: 'Try again', ru: 'Попробовать снова' },
  reload: { en: 'Reload page', ru: 'Перезагрузить' },
};

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
    // Bible-v2 audit C1: forward to Sentry so boundary-caught crashes show
    // up in ops dashboards alongside unhandled rejections. componentStack
    // gives Sentry a React-aware trace for the failed subtree.
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack ?? '' } },
      tags: { source: 'ErrorBoundary' },
    });
    this.props.onError?.(error, errorInfo);

    // Stale chunk auto-recovery: when a deploy invalidates the previous
    // bundle, lazy-loaded routes throw "Failed to fetch dynamically
    // imported module". A one-shot reload pulls the new index.html and
    // re-resolves the chunk hashes. We guard against loops with a session
    // marker — if we already reloaded once and still hit the error, fall
    // through to the manual UI so the user isn't stuck reloading.
    const msg = error?.message ?? '';
    const isChunkError =
      msg.includes('dynamically imported') ||
      msg.includes('Failed to fetch') ||
      msg.includes('Loading chunk');
    if (isChunkError && typeof window !== 'undefined') {
      const RELOAD_KEY = '__myuno_chunk_reload__';
      const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY);
      if (!alreadyReloaded) {
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        window.location.reload();
      }
    }
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

      const isChunkError = this.state.error?.message?.includes('dynamically imported') ||
                          this.state.error?.message?.includes('Failed to fetch') ||
                          this.state.error?.message?.includes('Loading chunk');

      const lang = getLang();
      const messages = isChunkError ? ERROR_MESSAGES.chunk : ERROR_MESSAGES.generic;

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
          <div className="w-16 h-16 rounded-none bg-destructive/8 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {messages.title[lang]}
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {messages.desc[lang]}
          </p>
          <div className="flex gap-2">
            {!isChunkError && (
              <Button onClick={this.handleReset} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                {ERROR_MESSAGES.tryAgain[lang]}
              </Button>
            )}
            {isChunkError ? (
              <Button onClick={this.handleReload} variant="default" size="sm">
                {ERROR_MESSAGES.reload[lang]}
              </Button>
            ) : null}
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
    const lang = getLang();

    // Clear stale-chunk reload marker after a successful mount — the next
    // chunk failure should be allowed exactly one fresh auto-reload attempt.
    if (typeof window !== 'undefined') {
      try { sessionStorage.removeItem('__myuno_chunk_reload__'); } catch { /* ignore */ }
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      errorLog.silent(event.reason, 'unhandled_rejection');
      
      const message = event.reason?.message || String(event.reason);

      // Suppress non-user-facing browser/PWA noise (service worker lifecycle,
      // push subscription, abort errors). These are not actionable and confuse users
      // — e.g. surfacing as "An error occurred" right after a successful Google login.
      if (
        message.includes('ServiceWorker') ||
        message.includes('service worker') ||
        message.includes('push service') ||
        message.includes('PushSubscription') ||
        message.includes('AbortError') ||
        message.includes('The operation was aborted') ||
        message.includes('The object is in an invalid state') ||
        event.reason?.name === 'AbortError'
      ) {
        event.preventDefault();
        return;
      }

      if (message.includes('dynamically imported') ||
          message.includes('Failed to fetch') ||
          message.includes('Loading chunk')) {
        // Stale-chunk auto-reload (one shot, guarded). Same logic as
        // ErrorBoundary.componentDidCatch — handles cases where the failed
        // import bubbles as an unhandled rejection instead of a render
        // error (e.g. an awaited dynamic import outside a Suspense tree).
        const RELOAD_KEY = '__myuno_chunk_reload__';
        const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY);
        if (!alreadyReloaded) {
          sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
          window.location.reload();
        } else {
          toast.error(
            lang === 'ru'
              ? 'Не удалось загрузить компонент. Обновите страницу.'
              : 'Failed to load component. Please refresh the page.',
            {
              action: {
                label: lang === 'ru' ? 'Обновить' : 'Refresh',
                onClick: () => window.location.reload(),
              },
            }
          );
        }
      } else {
        toast.error(
          lang === 'ru'
            ? 'Запрос не выполнен. Попробуйте ещё раз.'
            : 'Request failed. Please try again.'
        );
      }
      
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      errorLog.silent(event.error, 'global_error');
      if (event.error?.message?.includes('dynamically imported')) {
        event.preventDefault();
        toast.error(
          lang === 'ru'
            ? 'Проблема с подключением. Обновите страницу.'
            : 'Connection issue. Please refresh the page.'
        );
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
