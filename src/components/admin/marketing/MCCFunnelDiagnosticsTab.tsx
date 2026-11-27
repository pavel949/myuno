import { csvCell } from '@/lib/export/csvSafe';
import React, { useState } from 'react';
import { useMCCNavigation } from '@/pages/admin/marketing/MarketingDashboard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, ArrowRight, Download, Globe, Loader2 } from 'lucide-react';
import { useLandingRegistry } from '@/hooks/useLandingRegistry';
import { useFunnelDiagnostics } from '@/hooks/useMCCControlTower';
import { cn } from '@/lib/utils';

const STAGE_LABELS: Record<string, { en: string; ru: string }> = {
  landing_view: { en: 'Views', ru: 'Просмотры' },
  primary_cta_click: { en: 'CTA Clicks', ru: 'Клики CTA' },
  intent_started: { en: 'Intents', ru: 'Интенты' },
  first_service_completed: { en: 'Completion events', ru: 'События завершения' },
  second_service_started: { en: '2nd Action', ru: '2-е действие' },
};

export function MCCFunnelDiagnosticsTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { navContext, navigateTo } = useMCCNavigation();
  const appliedContext = React.useRef<string | null>(null);
  const [selectedLanding, setSelectedLanding] = useState<string>('');
  const [days, setDays] = useState<number>(7);

  const { data: landings, isLoading: landingsLoading, isError: landingsError, refetch: refetchLandings } = useLandingRegistry();
  React.useEffect(() => {
    const id = navContext.landingId;
    if (id && appliedContext.current !== id && landings?.some(landing => landing.landing_id === id)) {
      appliedContext.current = id;
      setSelectedLanding(id);
    }
  }, [navContext.landingId, landings]);
  const { data: diagnostics, isLoading, isError, refetch } = useFunnelDiagnostics(selectedLanding, days);

  const counts = diagnostics?.counts || [];
  const maxCount = Math.max(...counts.map(c => c.count), 1);
  const exportCSV = () => {
    if (!diagnostics || isError) return;
    const rows = [['stage', 'recorded_events'], ...counts.map(step => [step.stage, String(step.count)])];
    const csv = '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `myuno-events-${selectedLanding.replace(/[^a-z0-9_-]/gi, '_')}-${days}d.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {isRu ? 'Диагностика воронки' : 'Funnel Diagnostics'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Зарегистрированные события по этапам выбранного лендинга' : 'Recorded events by stage for the selected landing'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedLanding} onValueChange={value => {
            setSelectedLanding(value);
            navigateTo('funnel-diag', { landingId: value });
          }}>
            <SelectTrigger disabled={landingsLoading || landingsError} className="min-h-11 w-[180px]">
              <SelectValue placeholder={isRu ? 'Выберите лендинг' : 'Select landing'} />
            </SelectTrigger>
            <SelectContent>
              {(landings || []).map((l) => (
                <SelectItem key={l.landing_id} value={l.landing_id}>
                  {isRu ? l.name_ru || l.name_en : l.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="min-h-11 w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{isRu ? '1 день' : '1 day'}</SelectItem>
              <SelectItem value="7">{isRu ? '7 дней' : '7 days'}</SelectItem>
              <SelectItem value="14">{isRu ? '14 дней' : '14 days'}</SelectItem>
              <SelectItem value="30">{isRu ? '30 дней' : '30 days'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {landingsError && <div role="alert" className="border border-warning p-4">
        {isRu ? 'Не удалось загрузить лендинги.' : 'Could not load landings.'}
        <Button variant="outline" onClick={() => void refetchLandings()}>{isRu ? 'Повторить' : 'Retry'}</Button>
      </div>}
      {landingsLoading && <p role="status">{isRu ? 'Загрузка лендингов…' : 'Loading landings…'}</p>}
      {!landingsLoading && !landingsError && landings?.length === 0 && <p role="status">{isRu ? 'Нет лендингов для анализа.' : 'No landings available for analysis.'}</p>}
      {!selectedLanding ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Выберите лендинг для анализа' : 'Select a landing to analyze'}
            </p>
          </CardContent>
        </Card>
      ) : isError ? (
        <div role="alert" className="border border-warning p-4">
          {isRu ? 'События недоступны. Это не означает отсутствие событий.' : 'Events are unavailable. This does not mean there are no events.'}
          <Button variant="outline" onClick={() => void refetch()}>{isRu ? 'Повторить' : 'Retry'}</Button>
        </div>
      ) : isLoading || !diagnostics ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Step Drop-off Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{isRu ? 'Воронка шагов' : 'Step Funnel'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {counts.map((step, idx) => {
                  const label = STAGE_LABELS[step.stage] || { en: step.stage, ru: step.stage };
                  const widthPct = maxCount > 0 ? (step.count / maxCount) * 100 : 0;

                  return (
                    <div key={step.stage}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{isRu ? label.ru : label.en}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold tabular-nums">{step.count}</span>
                        </div>
                      </div>
                      <div className="h-8 bg-muted rounded-none overflow-hidden">
                        <div
                          className="h-full bg-primary flex items-center justify-end px-2 transition-all"
                          style={{ width: `${widthPct}%` }}
                        >
                          {step.count > 0 && (
                            <span className="text-xs font-medium text-primary-foreground">{step.count}</span>
                          )}
                        </div>
                      </div>
                      {idx < counts.length - 1 && (
                        <div className="flex items-center justify-center py-1">
                          <ArrowRight className="h-3 w-3 text-muted-foreground rotate-90" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {counts.every(c => c.count === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isRu ? 'Нет событий за выбранный период' : 'No events in selected period'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="min-h-11" onClick={() => navigateTo('landings', { landingId: selectedLanding })}>
              <Globe className="h-4 w-4 mr-2" />
              {isRu ? 'Управление лендингами' : 'Manage landings'}
            </Button>
            <Button variant="outline" size="sm" className="min-h-11" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              {isRu ? 'Экспорт CSV' : 'Export CSV'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
