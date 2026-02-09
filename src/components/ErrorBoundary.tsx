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

// Bilingual error messages
const ERROR_MESSAGES = {
  chunk: {
    title: { en: 'Connection issue', ru: 'Проблема с подключением' },
    desc: { en: 'Some components could not be loaded. Please check your connection and try again.', ru: 'Не удалось загрузить некоторые компоненты. Проверьте подключение и попробуйте снова.' },
  },
  generic: {
    title: { en: 'Something went wrong', ru: 'Произошла ошибка' },
    desc: { en: 'We are working on it. Please try again.', ru: 'Мы работаем над этим. Пожалуйста, попробуйте снова.' },
  },
  tryAgain: { en: 'Try again', ru: 'Попробовать снова' },
  reload: { en: 'Reload page', ru: 'Перезагрузить' },
};

function getLang(): 'en' | 'ru' {
  try {
    const stored = localStorage.getItem('myuno-language');
    if (stored === 'ru') return 'ru';
  } catch {}
  return 'en';
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

      const isChunkError = this.state.error?.message?.includes('dynamically imported') ||
                          this.state.error?.message?.includes('Failed to fetch') ||
                          this.state.error?.message?.includes('Loading chunk');

      const lang = getLang();
      const messages = isChunkError ? ERROR_MESSAGES.chunk : ERROR_MESSAGES.generic;

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/8 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {messages.title[lang]}
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {messages.desc[lang]}
          </p>
          <div className="flex gap-2">
            <Button onClick={this.handleReset} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              {ERROR_MESSAGES.tryAgain[lang]}
            </Button>
            {isChunkError && (
              <Button onClick={this.handleReload} variant="default" size="sm">
                {ERROR_MESSAGES.reload[lang]}
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
    const lang = getLang();
    
    const handleRejection = (event: PromiseRejectionEvent) => {
      errorLog.silent(event.reason, 'unhandled_rejection');
      
      const message = event.reason?.message || String(event.reason);
      if (message.includes('dynamically imported') || 
          message.includes('Failed to fetch') ||
          message.includes('Loading chunk')) {
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
      } else {
        toast.error(
          lang === 'ru' 
            ? 'Произошла ошибка. Попробуйте снова.' 
            : 'An error occurred. Please try again.'
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
