import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  RefreshCw, 
  Layers, 
  Home, 
  TrendingUp,
  AlertTriangle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useUserStateDistribution } from '@/hooks/useLandingRegistry';

const STATE_CONFIG: Record<string, { icon: React.ElementType; color: string; label_en: string; label_ru: string }> = {
  anonymous: { icon: Users, color: 'bg-muted text-muted-foreground', label_en: 'Anonymous', label_ru: 'Анонимный' },
  identified: { icon: UserPlus, color: 'bg-info/10 text-info', label_en: 'Identified', label_ru: 'Идентифицирован' },
  first_action: { icon: UserCheck, color: 'bg-success/10 text-success', label_en: 'First Action', label_ru: 'Первое действие' },
  returning: { icon: RefreshCw, color: 'bg-chart-1/10 text-chart-1', label_en: 'Returning', label_ru: 'Возвращающийся' },
  multi_vertical: { icon: Layers, color: 'bg-chart-2/10 text-chart-2', label_en: 'Multi-Vertical', label_ru: 'Мульти-вертикаль' },
  expat_candidate: { icon: Home, color: 'bg-chart-3/10 text-chart-3', label_en: 'Expat Candidate', label_ru: 'Кандидат-экспат' },
  investor_candidate: { icon: TrendingUp, color: 'bg-chart-4/10 text-chart-4', label_en: 'Investor', label_ru: 'Инвестор' },
  dormant: { icon: AlertTriangle, color: 'bg-warning/10 text-warning', label_en: 'Dormant', label_ru: 'Спящий' },
  churned: { icon: XCircle, color: 'bg-destructive/10 text-destructive', label_en: 'Churned', label_ru: 'Отток' },
};

const ALL_STATES = ['anonymous', 'identified', 'first_action', 'returning', 'multi_vertical', 'expat_candidate', 'investor_candidate', 'dormant', 'churned'];

export function MCCUserStatesTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data, isLoading } = useUserStateDistribution();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const distribution = data?.distribution || {};
  const byLanding = data?.byLanding || {};
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {isRu ? 'Состояния пользователей' : 'User States'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isRu ? 'Распределение по поведенческим состояниям (derived)' : 'Behavioral state distribution (event-derived)'}
        </p>
      </div>

      {/* State Distribution Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {ALL_STATES.map((state) => {
          const config = STATE_CONFIG[state];
          const Icon = config.icon;
          const count = distribution[state] || 0;
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';

          return (
            <Card key={state}>
              <CardContent className="p-3 text-center space-y-1">
                <div className={`w-10 h-10 rounded-lg mx-auto flex items-center justify-center ${config.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{isRu ? config.label_ru : config.label_en}</p>
                {total > 0 && (
                  <p className="text-xs text-muted-foreground">{pct}%</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* State Funnel Visualization */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{isRu ? 'Воронка состояний' : 'State Funnel'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ALL_STATES.filter(s => !['churned'].includes(s)).map((state) => {
            const config = STATE_CONFIG[state];
            const count = distribution[state] || 0;
            const maxCount = Math.max(...Object.values(distribution).map(Number), 1);
            const widthPct = Math.max((count / maxCount) * 100, 3);

            return (
              <div key={state} className="flex items-center gap-3">
                <div className="w-32 text-sm text-muted-foreground truncate">
                  {isRu ? config.label_ru : config.label_en}
                </div>
                <div className="flex-1 h-7 bg-muted rounded overflow-hidden">
                  <div
                    className={`h-full rounded flex items-center justify-end px-2 transition-all ${config.color}`}
                    style={{ width: `${widthPct}%`, minWidth: count > 0 ? '2rem' : '0' }}
                  >
                    {count > 0 && (
                      <span className="text-xs font-medium">{count}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {total === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {isRu ? 'Нет данных. Пользователи появятся после первых лендинг-событий.' : 'No data yet. Users appear after first landing events.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Distribution by Source Landing */}
      {Object.keys(byLanding).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{isRu ? 'Состояния по источнику' : 'States by Source Landing'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2 font-medium">{isRu ? 'Лендинг' : 'Landing'}</th>
                    {ALL_STATES.slice(0, 7).map(s => (
                      <th key={s} className="text-center p-2 font-medium text-xs">
                        {(isRu ? STATE_CONFIG[s].label_ru : STATE_CONFIG[s].label_en).slice(0, 8)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(byLanding).map(([landing, states]) => (
                    <tr key={landing} className="border-t">
                      <td className="p-2 font-medium">{landing}</td>
                      {ALL_STATES.slice(0, 7).map(s => (
                        <td key={s} className="p-2 text-center">
                          {(states as Record<string, number>)[s] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* State Transition Rules Reference */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{isRu ? 'Правила переходов' : 'Transition Rules'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            {[
              { from: 'anonymous', to: 'identified', trigger: isRu ? 'Форма отправлена' : 'Form submitted' },
              { from: 'identified', to: 'first_action', trigger: isRu ? 'Первое действие завершено' : 'First service completed' },
              { from: 'first_action', to: 'returning', trigger: isRu ? '2-я сессия (< 14 дней)' : '2nd session (< 14 days)' },
              { from: 'any_active', to: 'multi_vertical', trigger: isRu ? 'Действие в новой вертикали' : 'Action in new vertical' },
              { from: 'any_active', to: 'expat_candidate', trigger: isRu ? 'Аренда + 2 другие вертикали' : 'Rental + 2 other verticals' },
              { from: 'any_active', to: 'investor_candidate', trigger: isRu ? 'DD запрос или 3+ просмотра проектов' : 'DD request or 3+ project views' },
              { from: 'any_active', to: 'dormant', trigger: isRu ? '30 дней без активности' : '30 days no activity' },
              { from: 'dormant', to: 'churned', trigger: isRu ? '90 дней без активности' : '90 days no activity' },
            ].map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2 py-1">
                <Badge variant="outline" className="text-xs shrink-0">{rule.from}</Badge>
                <span className="text-muted-foreground">→</span>
                <Badge variant="secondary" className="text-xs shrink-0">{rule.to}</Badge>
                <span className="text-xs ml-2">{rule.trigger}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
