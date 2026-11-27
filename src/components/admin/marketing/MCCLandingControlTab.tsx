import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Globe, Plane, Flower2, Car, Home, Building2,
  FlaskConical, Ban, ChevronRight, Loader2, Eye,
} from 'lucide-react';
import { useLandingRegistry, useToggleLanding, useUpdateLandingVariant } from '@/hooks/useLandingRegistry';

import { useMCCNavigation } from '@/pages/admin/marketing/MarketingDashboard';
import { ABVariantManager } from './ABVariantManager';
import { toast } from 'sonner';

const LANDING_ICONS: Record<string, React.ElementType> = {
  transfer: Plane,
  flowers: Flower2,
  vehicle: Car,
  rental: Home,
  newdev: Building2,
};

export function MCCLandingControlTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { navigateTo } = useMCCNavigation();
  const { data: landings, isLoading, isError, refetch } = useLandingRegistry();

  const toggleMutation = useToggleLanding();
  const variantMutation = useUpdateLandingVariant();
  const [expandedLanding, setExpandedLanding] = React.useState<string | null>(null);

  const handleToggle = (id: string, currentState: boolean) => {
    toggleMutation.mutate(
      { id, is_active: !currentState },
      { onSuccess: () => toast.success(isRu ? 'Статус обновлён' : 'Status updated') }
    );
  };

  const handleVariant = (id: string, field: 'hero_variant' | 'cta_variant', current: string) => {
    const next = current === 'A' ? 'B' : 'A';
    variantMutation.mutate(
      { id, field, value: next },
      { onSuccess: () => toast.success(isRu ? `Вариант → ${next}` : `Switched to ${next}`) }
    );
  };

  if (isError) return <div role="alert" className="space-y-3">
    <p>{isRu ? 'Не удалось загрузить реестр лендингов.' : 'Could not load the landing registry.'}</p>
    <Button variant="outline" onClick={() => refetch()}>{isRu ? 'Повторить' : 'Retry'}</Button>
  </div>;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {isRu ? 'Управление лендингами' : 'Landing Control'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Включение/выключение, A/B тесты, маршруты' : 'Toggle, A/B tests, routes & next actions'}
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {landings?.filter(l => l.is_active).length || 0} / {landings?.length || 0} {isRu ? 'активных' : 'active'}
        </Badge>
      </div>

      {/* Landing Cards */}
      <div className="space-y-4">
        {landings?.map((landing) => {
          const Icon = LANDING_ICONS[landing.landing_id] || Globe;

          return (
            <Card key={landing.id} className={!landing.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-3 rounded-none shrink-0 ${landing.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`h-5 w-5 ${landing.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Name & status */}
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="font-medium">{isRu ? landing.name_ru || landing.name_en : landing.name_en}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <code className="bg-muted px-1.5 py-0.5 rounded-none">{landing.route_path}</code>
                          <ChevronRight className="h-3 w-3" />
                          <code className="bg-muted px-1.5 py-0.5 rounded-none">{landing.target_path}</code>
                        </div>
                      </div>
                      <Switch
                        checked={landing.is_active}
                        onCheckedChange={() => handleToggle(landing.id, landing.is_active)}
                      />
                    </div>

                    <Button variant="outline" className="min-h-11" onClick={() => navigateTo('funnel-diag', { landingId: landing.landing_id })}>
                      <Eye className="mr-2 h-4 w-4" />
                      {isRu ? 'Записанные события' : 'Recorded events'}
                    </Button>

                    {/* Controls Row */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{isRu ? 'Заголовок:' : 'Hero:'}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-h-11 text-xs gap-1"
                          onClick={() => handleVariant(landing.id, 'hero_variant', landing.hero_variant)}
                        >
                          <FlaskConical className="h-3 w-3" />
                          {isRu ? 'Вариант' : 'Variant'} {landing.hero_variant}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">CTA:</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-h-11 text-xs gap-1"
                          onClick={() => handleVariant(landing.id, 'cta_variant', landing.cta_variant)}
                        >
                          <FlaskConical className="h-3 w-3" />
                          {landing.cta_variant}
                        </Button>
                        {landing.cta_label_en && (
                          <span className="text-xs text-muted-foreground">
                            "{isRu ? landing.cta_label_ru || landing.cta_label_en : landing.cta_label_en}"
                          </span>
                        )}
                      </div>
                      <Button
                        variant={expandedLanding === landing.landing_id ? 'secondary' : 'outline'}
                        size="sm"
                        className="min-h-11 text-xs gap-1"
                        onClick={() => setExpandedLanding(expandedLanding === landing.landing_id ? null : landing.landing_id)}
                      >
                        <FlaskConical className="h-3 w-3" />
                        {isRu ? 'A/B тесты' : 'A/B Tests'}
                      </Button>
                    </div>

                    {/* Next Actions */}
                    {landing.next_actions && (landing.next_actions as any[]).length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">{isRu ? 'Следующие действия:' : 'Next Best Actions:'}</span>
                        <div className="flex flex-wrap gap-2">
                          {(landing.next_actions as any[]).map((action: any, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {isRu ? action.label_ru || action.label_en : action.label_en}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Forbidden Elements */}
                    {landing.forbidden_elements && landing.forbidden_elements.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Ban className="h-3 w-3 text-destructive shrink-0" />
                        <div className="flex flex-wrap gap-1">
                          {landing.forbidden_elements.map((el, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs text-destructive border-destructive/30">
                              {el.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* A/B Variant Manager (expanded) */}
                    {expandedLanding === landing.landing_id && (
                      <div className="border-t pt-4 mt-2">
                        <ABVariantManager
                          landingId={landing.landing_id}
                          landingName={isRu ? landing.name_ru || landing.name_en : landing.name_en}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty state */}
      {(!landings || landings.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Нет лендингов в реестре' : 'No landings in registry'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
