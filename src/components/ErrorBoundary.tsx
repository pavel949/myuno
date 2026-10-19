import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createErrorHandler } from '@/lib/errorHandler';
import { getStoredLang as getLang } from '@/lib/languageConfig';
import { pickLang } from '@/lib/i18n/pickLang';
import { reloadAfterUserRecovery, requestRecoveryReload } from '@/lib/pwaRecovery';

const errorLog = createErrorHandler('ErrorBoundary');

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  reloading: boolean;
  reloadFailed: boolean;
}

// Bilingual error messages
const ERROR_MESSAGES = {
  chunk: {
    title: { en: 'Connection issue', ru: 'Проблема с подключением', th: 'ปัญหาการเชื่อมต่อ' },
    desc: { en: 'Some components could not be loaded. Please check your connection and try again.', ru: 'Не удалось загрузить некоторые компоненты. Проверьте подключение и попробуйте снова.', th: 'ไม่สามารถโหลดบางส่วนได้ โปรดตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง' },
  },
  generic: {
    title: { en: 'This page failed to load', ru: 'Страница не загрузилась', th: 'หน้านี้โหลดไม่สำเร็จ' },
    desc: { en: 'Try again, or reload the page. We have logged the issue.', ru: 'Попробуйте снова или перезагрузите страницу. Мы записали ошибку.', th: 'ลองอีกครั้งหรือรีเฟรชหน้านี้ เราได้บันทึกปัญหาไว้แล้ว' },
  },
  tryAgain: { en: 'Try again', ru: 'Попробовать снова', th: 'ลองอีกครั้ง' },
  saveWarning: { en: 'Save unfinished changes before reloading.', ru: 'Сохраните незавершённые изменения перед перезагрузкой.', th: 'บันทึกการเปลี่ยนแปลงก่อนรีเฟรช' },
  reloadFailed: { en: 'Reload could not be prepared. Please try again later.', ru: 'Не удалось подготовить перезагрузку. Попробуйте позже.', th: 'ยังไม่สามารถรีเฟรชได้ โปรดลองอีกครั้งภายหลัง' },
  reload: { en: 'Reload page', ru: 'Перезагрузить', th: 'รีเฟรชหน้า' },
};

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    reloading: false,
    reloadFailed: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, reloading: false, reloadFailed: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    errorLog.silent(error, 'component_error');
    // Bible-v2 audit C1: forward to Sentry so boundary-caught crashes show
    // up in ops dashboards alongside unhandled rejections. componentStack
    // gives Sentry a React-aware trace for the failed subtree.
    // A telemetry import/reporting failure must not interrupt the fallback UI.
    void import('@sentry/react')
      .then((Sentry) =>
        Sentry.captureException(error, {
          contexts: { react: { componentStack: errorInfo.componentStack ?? '' } },
          tags: { source: 'ErrorBoundary' },
        }),
      )
      .catch(() => {});
    this.props.onError?.(error, errorInfo);

    // An update-related failure can offer recovery, never reload without consent.
    const msg = error?.message ?? '';
    if (typeof window !== 'undefined' && (msg.includes('dynamically imported') ||
        msg.includes('Failed to fetch') || msg.includes('Loading chunk'))) {
      requestRecoveryReload();
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, reloading: false, reloadFailed: false });
  };

  private handleReload = async () => {
    if (this.state.reloading) return;
    this.setState({ reloading: true, reloadFailed: false });
    try {
      await reloadAfterUserRecovery();
    } catch {
      this.setState({ reloading: false, reloadFailed: true });
    }
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
          {isChunkError && <p className="text-sm text-muted-foreground mb-4">{ERROR_MESSAGES.saveWarning[lang]}</p>}
          {this.state.reloadFailed && <p role="alert" className="text-sm text-destructive mb-4">{ERROR_MESSAGES.reloadFailed[lang]}</p>}
          <div className="flex gap-2">
            {!isChunkError && (
              <Button onClick={this.handleReset} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                {ERROR_MESSAGES.tryAgain[lang]}
              </Button>
            )}
            {isChunkError ? (
              <Button onClick={this.handleReload} variant="default" size="sm" disabled={this.state.reloading}>
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
        requestRecoveryReload();
        toast.error(
          pickLang(lang, {
            ru: 'Не удалось загрузить компонент. Обновите страницу.',
            en: 'Failed to load component. Please refresh the page.',
            th: 'โหลดคอมโพเนนต์ไม่สำเร็จ โปรดรีเฟรชหน้า',
          }),
          {
            action: {
              label: pickLang(lang, { ru: 'Обновить', en: 'Refresh', th: 'รีเฟรช' }),
              onClick: () => requestRecoveryReload(true),
            },
          }
        );
      } else {
        toast.error(
          pickLang(lang, {
            ru: 'Запрос не выполнен. Попробуйте ещё раз.',
            en: 'Request failed. Please try again.',
            th: 'คำขอไม่สำเร็จ โปรดลองอีกครั้ง',
          })
        );
      }
      
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      errorLog.silent(event.error, 'global_error');
      if (event.error?.message?.includes('dynamically imported')) {
        event.preventDefault();
        toast.error(
          pickLang(lang, {
            ru: 'Проблема с подключением. Обновите страницу.',
            en: 'Connection issue. Please refresh the page.',
            th: 'ปัญหาการเชื่อมต่อ โปรดรีเฟรชหน้า',
          })
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
