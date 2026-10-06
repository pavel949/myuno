import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStoredLang } from '@/lib/languageConfig';
import { pickLang } from '@/lib/i18n/pickLang';

interface Props {
  children: ReactNode;
  /** Widget name for error logging */
  widgetName?: string;
}

interface State {
  hasError: boolean;
}

/**
 * Lightweight error boundary for individual dashboard widgets.
 * Prevents a single broken widget from crashing the entire dashboard.
 */
export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[Widget:${this.props.widgetName || 'unknown'}]`, error, info);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const lang = getStoredLang();
    return (
      <div className="flex items-center gap-3 p-4 rounded-none border border-border bg-muted/30 text-muted-foreground">
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
        <span className="text-sm flex-1">
          {pickLang(lang, { ru: 'Раздел временно недоступен', en: 'Widget temporarily unavailable', th: 'วิดเจ็ตไม่พร้อมใช้งานชั่วคราว' })}
        </span>
        <Button variant="ghost" size="sm" onClick={this.handleRetry} className="h-7 text-xs">
          <RefreshCw className="h-3 w-3 mr-1" />
          {pickLang(lang, { ru: 'Повторить', en: 'Retry', th: 'ลองใหม่' })}
        </Button>
      </div>
    );
  }
}
