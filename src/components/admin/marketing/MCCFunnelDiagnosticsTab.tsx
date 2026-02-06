import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, ArrowRight, Download, FlaskConical, Loader2 } from 'lucide-react';
import { useLandingRegistry } from '@/hooks/useLandingRegistry';
import { useFunnelDiagnostics } from '@/hooks/useMCCControlTower';
import { cn } from '@/lib/utils';

const STAGE_LABELS: Record<string, { en: string; ru: string }> = {
  landing_view: { en: 'Views', ru: 'Просмотры' },
  primary_cta_click: { en: 'CTA Clicks', ru: 'Клики CTA' },
  intent_started: { en: 'Intents', ru: 'Интенты' },
  first_service_completed: { en: 'Completed', ru: 'Завершено' },
  second_service_started: { en: '2nd Action', ru: '2-е действие' },
};

export function MCCFunnelDiagnosticsTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [selectedLanding, setSelectedLanding] = useState<string>('');
  const [days, setDays] = useState<number>(7);

  const { data: landings } = useLandingRegistry();
  const { data: diagnostics, isLoading } = useFunnelDiagnostics(selectedLanding, days);

  const counts = diagnostics?.counts || [];
  const maxCount = Math.max(...counts.map(c => c.count), 1);

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
            {isRu ? 'Анализ потерь по шагам для каждого лендинга' : 'Step-by-step drop-off analysis per landing'}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedLanding} onValueChange={setSelectedLanding}>
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[100px]">
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

      {!selectedLanding ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Выберите лендинг для анализа' : 'Select a landing to analyze'}
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
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
                  const prev = idx > 0 ? counts[idx - 1].count : step.count;
                  const dropPct = prev > 0 ? ((1 - step.count / prev) * 100).toFixed(0) : '0';
                  const label = STAGE_LABELS[step.stage] || { en: step.stage, ru: step.stage };
                  const widthPct = maxCount > 0 ? (step.count / maxCount) * 100 : 0;

                  return (
                    <div key={step.stage}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{isRu ? label.ru : label.en}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold tabular-nums">{step.count}</span>
                          {idx > 0 && Number(dropPct) > 0 && (
                            <Badge variant={Number(dropPct) > 50 ? 'destructive' : 'secondary'} className="text-xs">
                              -{dropPct}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="h-8 bg-muted rounded overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-chart-1 rounded flex items-center justify-end px-2 transition-all"
                          style={{ width: `${Math.max(widthPct, 2)}%` }}
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
            <Button variant="outline" size="sm">
              <FlaskConical className="h-4 w-4 mr-2" />
              {isRu ? 'Создать эксперимент' : 'Create Experiment'}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {isRu ? 'Экспорт CSV' : 'Export CSV'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
