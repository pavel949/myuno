import { getStoredLang } from '@/lib/languageConfig';
import { toast } from 'sonner';

type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

interface ErrorHandlerOptions {
  severity?: ErrorSeverity;
  showToast?: boolean;
  toastTitle?: string;
  toastTitleRu?: string;
  toastDescription?: string;
  toastDescriptionRu?: string;
  context?: ErrorContext;
  silent?: boolean;
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('aborted') || msg.includes('aborterror') || msg.includes('signal is aborted');
  }
  if (typeof error === 'string') {
    const msg = error.toLowerCase();
    return msg.includes('aborted') || msg.includes('aborterror') || msg.includes('signal is aborted');
  }
  return false;
}

// Default error messages by type
const DEFAULT_MESSAGES: Record<string, { en: string; ru: string }> = {
  network: {
    en: 'Network error. Please check your connection.',
    ru: 'Ошибка сети. Проверьте подключение.',
  },
  auth: {
    en: 'Authentication error. Please sign in again.',
    ru: 'Ошибка авторизации. Войдите снова.',
  },
  permission: {
    en: 'You don\'t have permission for this action.',
    ru: 'У вас нет прав для этого действия.',
  },
  validation: {
    en: 'Please check the entered data.',
    ru: 'Проверьте введённые данные.',
  },
  server: {
    en: 'Server error. Please try again later.',
    ru: 'Ошибка сервера. Попробуйте позже.',
  },
  unknown: {
    en: 'An unexpected error occurred.',
    ru: 'Произошла непредвиденная ошибка.',
  },
};

// Detect error type from error object
function detectErrorType(error: unknown): keyof typeof DEFAULT_MESSAGES {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    if (message.includes('auth') || message.includes('401') || message.includes('unauthorized')) {
      return 'auth';
    }
    if (message.includes('permission') || message.includes('403') || message.includes('forbidden')) {
      return 'permission';
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return 'validation';
    }
    if (message.includes('500') || message.includes('server')) {
      return 'server';
    }
  }
  
  return 'unknown';
}

const getCurrentLanguage = getStoredLang;

// Error queue for batching reports
let errorQueue: Array<{ error: unknown; context: ErrorContext; severity: ErrorSeverity; timestamp: string }> = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

// Flush error queue to backend (batched)
async function flushErrorQueue() {
  if (errorQueue.length === 0) return;
  
  const batch = [...errorQueue];
  errorQueue = [];
  flushTimeout = null;
  
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) return;
    
    // Log to analytics_events table (lightweight, no external service needed)
    await fetch(`${supabaseUrl}/rest/v1/analytics_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(batch.map(item => ({
        event_name: `error_${item.severity}`,
        page_path: window.location.pathname,
        user_agent: navigator.userAgent,
        session_id: sessionStorage.getItem('session_id') || crypto.randomUUID(),
        event_data: {
          message: item.error instanceof Error ? item.error.message : String(item.error),
          stack: item.error instanceof Error ? item.error.stack?.split('\n').slice(0, 5).join('\n') : undefined,
          component: item.context.component,
          action: item.context.action,
          timestamp: item.timestamp,
          url: window.location.href,
          metadata: item.context.metadata,
        },
      }))),
    });
  } catch {
    // Silent fail - don't create error loops
  }
}

// Queue error for batched reporting
function queueErrorReport(error: unknown, context: ErrorContext, severity: ErrorSeverity) {
  errorQueue.push({ 
    error, 
    context, 
    severity, 
    timestamp: new Date().toISOString() 
  });
  
  // Flush after 2 seconds or when queue reaches 10 items
  if (errorQueue.length >= 10) {
    if (flushTimeout) clearTimeout(flushTimeout);
    flushErrorQueue();
  } else if (!flushTimeout) {
    flushTimeout = setTimeout(flushErrorQueue, 2000);
  }
}

// Format error for logging
function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ''}`;
  }
  if (typeof error === 'string') {
    return error;
  }
  return JSON.stringify(error, null, 2);
}

// Main error handler
export function handleError(error: unknown, options: ErrorHandlerOptions = {}): void {
  const {
    severity = 'error',
    showToast = true,
    toastTitle,
    toastTitleRu,
    toastDescription,
    toastDescriptionRu,
    context = {},
    silent = false,
  } = options;

  const errorType = detectErrorType(error);
  const lang = getCurrentLanguage();
  const isRu = lang === 'ru';
  const isDev = import.meta.env.DEV;

  // Ignore expected request-cancellation noise during navigation.
  if (isAbortError(error)) return;

  // Always log in development
  if (isDev && !silent) {
    const logMethod = severity === 'critical' || severity === 'error' 
      ? console.error 
      : severity === 'warning' 
        ? console.warn 
        : console.log;
    
    logMethod(
      `[${severity.toUpperCase()}]${context.component ? ` [${context.component}]` : ''}${context.action ? ` ${context.action}` : ''}:`,
      formatError(error),
      context.metadata ? { metadata: context.metadata } : ''
    );
  }

  // Show toast notification
  if (showToast && !silent) {
    const defaultMsg = DEFAULT_MESSAGES[errorType];
    
    const title = isRu 
      ? (toastTitleRu || toastTitle || (severity === 'error' ? 'Ошибка' : 'Внимание'))
      : (toastTitle || (severity === 'error' ? 'Error' : 'Warning'));
    
    const description = isRu
      ? (toastDescriptionRu || toastDescription || defaultMsg.ru)
      : (toastDescription || defaultMsg.en);

    toast({
      title,
      description,
      variant: severity === 'error' || severity === 'critical' ? 'destructive' : 'default',
    });
  }

  // In production, report errors/critical issues to backend
  if (!isDev && (severity === 'error' || severity === 'critical') && !silent) {
    queueErrorReport(error, context, severity);
  }
}

// Convenience wrappers
export const errorHandler = {
  // Log error with toast
  error: (error: unknown, options?: Omit<ErrorHandlerOptions, 'severity'>) => 
    handleError(error, { ...options, severity: 'error' }),
  
  // Log warning with optional toast
  warn: (error: unknown, options?: Omit<ErrorHandlerOptions, 'severity'>) => 
    handleError(error, { ...options, severity: 'warning', showToast: options?.showToast ?? false }),
  
  // Critical error - always shows toast
  critical: (error: unknown, options?: Omit<ErrorHandlerOptions, 'severity'>) => 
    handleError(error, { ...options, severity: 'critical', showToast: true }),
  
  // Silent logging (dev only, no toast)
  silent: (error: unknown, context?: ErrorContext) => 
    handleError(error, { silent: false, showToast: false, context }),

  // Network errors
  network: (error: unknown, action?: string) =>
    handleError(error, {
      severity: 'error',
      toastTitle: 'Connection Error',
      toastTitleRu: 'Ошибка соединения',
      context: { action },
    }),

  // Auth errors
  auth: (error: unknown, action?: string) =>
    handleError(error, {
      severity: 'error',
      toastTitle: 'Authentication Error',
      toastTitleRu: 'Ошибка авторизации',
      context: { action },
    }),

  // Validation errors (usually warning level)
  validation: (message: string, messageRu?: string) =>
    handleError(new Error(message), {
      severity: 'warning',
      toastTitle: 'Validation',
      toastTitleRu: 'Проверка данных',
      toastDescription: message,
      toastDescriptionRu: messageRu || message,
    }),
};

// Async wrapper for try-catch
export async function tryCatch<T>(
  fn: () => Promise<T>,
  options?: ErrorHandlerOptions & { fallback?: T }
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, options);
    return options?.fallback;
  }
}

// Sync wrapper for try-catch
export function tryCatchSync<T>(
  fn: () => T,
  options?: ErrorHandlerOptions & { fallback?: T }
): T | undefined {
  try {
    return fn();
  } catch (error) {
    handleError(error, options);
    return options?.fallback;
  }
}

// Hook-friendly error handler creator
export function createErrorHandler(component: string) {
  return {
    error: (error: unknown, action?: string, options?: Omit<ErrorHandlerOptions, 'context'>) =>
      handleError(error, { ...options, context: { component, action } }),
    
    warn: (error: unknown, action?: string) =>
      handleError(error, { severity: 'warning', showToast: false, context: { component, action } }),
    
    silent: (error: unknown, action?: string) =>
      handleError(error, { showToast: false, context: { component, action } }),
  };
}

export default errorHandler;
