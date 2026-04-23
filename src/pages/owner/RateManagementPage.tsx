import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyProperties } from '@/hooks/useMyProperties';
import {
  useOwnerRateSeasons,
  useSaveRateSeason,
  useDeleteRateSeason,
  type RateSeasonRecord,
} from '@/hooks/usePropertyRateSeasons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { format, differenceInDays, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Plus, Calendar, Moon, Edit2, Trash2, ChevronLeft,
  Home, Pencil, Check, X, Tag, History, ChevronDown, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIPricingSuggestions } from '@/hooks/useAIPricingSuggestions';

const PRICING_ACTIONS = ['price_override', 'base_price_changed', 'season_created', 'season_updated', 'season_deleted', 'availability_changed'];

export default function RateManagementPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isRu = language === 'ru';
  const t = (en: string, rur: string) => isRu ? rur : en;
  const { allProperties } = useMyProperties();
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<RateSeasonRecord | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data: rates, isLoading } = useOwnerRateSeasons(user?.id, selectedProperty);
  const deleteMutation = useDeleteRateSeason();
  const aiPropId = selectedProperty !== 'all' ? selectedProperty : allProperties[0]?.property_id;
  const { suggestions, generateSuggestions, acceptSuggestion, dismissSuggestion } = useAIPricingSuggestions(aiPropId);

  const activeRates = rates?.filter(r => r.is_active) || [];

  // Fetch activity logs for pricing-related actions
  const propertyIds = selectedProperty === 'all'
    ? allProperties.map(p => p.property_id)
    : [selectedProperty];

  const { data: activityLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['pricing-activity-logs', propertyIds.sort().join(',')],
    queryFn: async () => {
      if (propertyIds.length === 0) return [];
      const { data, error } = await supabase
        .from('property_activity_log')
        .select(`
          *,
          actor:profiles!property_activity_log_actor_id_fkey(id, full_name, avatar_url)
        `)
        .in('property_id', propertyIds)
        .in('action', PRICING_ACTIONS)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: propertyIds.length > 0,
  });

  const handleDelete = (rate: RateSeasonRecord) => {
    const prop = allProperties.find(p => p.property_id === rate.property_id);
    deleteMutation.mutate(
      {
        id: rate.id,
        propertyId: rate.property_id,
        basePricePerNight: prop?.price_per_night || 0,
        actorId: user?.id,
        seasonName: rate.name_en,
      },
      {
        onSuccess: () => {
          toast.success(t('Season deleted', 'Сезон удалён'));
          queryClient.invalidateQueries({ queryKey: ['pricing-activity-logs'] });
        },
      }
    );
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/owner')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{t('Rate Management', 'Управление тарифами')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('Base prices, seasonal rates & discounts', 'Базовые цены, сезоны и скидки')}
          </p>
        </div>
        <Button onClick={() => { setEditingRate(null); setSheetOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          {t('Season', 'Сезон')}
        </Button>
      </div>

      {/* Property filter */}
      {allProperties.length > 1 && (
        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder={t('All properties', 'Все объекты')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('All Properties', 'Все объекты')}</SelectItem>
            {allProperties.map(p => (
              <SelectItem key={p.property_id} value={p.property_id}>
                {p.title || p.property_id.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* ─── AI Pricing Suggestions ─── */}
      {aiPropId && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                {t('AI Price Suggestions', 'AI-рекомендации по ценам')}
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => generateSuggestions.mutate(aiPropId)}
                disabled={generateSuggestions.isPending}
              >
                {generateSuggestions.isPending
                  ? (isRu ? 'Анализ...' : 'Analyzing...')
                  : (isRu ? 'Обновить' : 'Refresh')}
              </Button>
            </div>
            {suggestions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t('No suggestions yet. Click Refresh to generate AI-powered pricing recommendations.',
                   'Пока нет рекомендаций. Нажмите «Обновить» для AI-анализа цен.')}
              </p>
            ) : (
              <div className="space-y-2">
                {suggestions.map(s => {
                  const priceDiff = s.recommended_price - s.current_price;
                  const pctChange = s.current_price > 0 ? Math.round((priceDiff / s.current_price) * 100) : 0;
                  return (
                    <div key={s.id} className="p-3 bg-background rounded-none border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(s.date_from), 'dd MMM', { locale: isRu ? ru : undefined })}
                          {' → '}
                          {format(new Date(s.date_to), 'dd MMM', { locale: isRu ? ru : undefined })}
                        </span>
                        <Badge variant={priceDiff > 0 ? 'default' : 'secondary'} className="text-xs">
                          {priceDiff > 0 ? '+' : ''}{pctChange}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm line-through text-muted-foreground">
                          {s.current_price} {s.currency}
                        </span>
                        <span className="text-sm font-bold">
                          → {s.recommended_price} {s.currency}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {s.confidence}% {t('confidence', 'уверенность')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{s.reasoning}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 text-xs"
                          onClick={(e) => { e.stopPropagation(); acceptSuggestion.mutate(s.id); }}
                        >
                          <Check className="w-3 h-3 mr-1" /> {t('Apply', 'Применить')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={(e) => { e.stopPropagation(); dismissSuggestion.mutate(s.id); }}
                        >
                          <X className="w-3 h-3 mr-1" /> {t('Dismiss', 'Пропустить')}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Section 1: Property Base Prices ─── */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Home className="h-4 w-4" />
          {t('Base Prices', 'Базовые цены')}
        </h2>
        <div className="space-y-2">
          {(selectedProperty === 'all' ? allProperties : allProperties.filter(p => p.property_id === selectedProperty)).map(prop => {
            const seasonCount = rates?.filter(r => r.property_id === prop.property_id && r.is_active).length || 0;
            return (
              <PropertyPriceRow
                key={prop.property_id}
                propertyId={prop.property_id}
                title={isRu ? (prop.title_ru || prop.title) : prop.title}
                pricePerNight={prop.price_per_night || 0}
                currency={prop.currency || 'THB'}
                seasonCount={seasonCount}
                isRu={isRu}
                userId={user?.id}
              />
            );
          })}
        </div>
      </div>

      <Separator />

      {/* ─── Section 2: Seasonal Rates ─── */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {t('Seasonal Rates', 'Сезонные тарифы')}
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-none" />)}
          </div>
        ) : activeRates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">{t('No Rate Seasons', 'Нет сезонов')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('Add seasonal rates for your properties', 'Добавьте сезонные тарифы для ваших объектов')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeRates.map(rate => {
              const property = allProperties.find(p => p.property_id === rate.property_id);
              const today = new Date();
              const start = new Date(rate.start_date);
              const end = new Date(rate.end_date);
              const isCurrentSeason = today >= start && today <= end;
              const daysUntil = differenceInDays(start, today);
              const basePrice = property?.price_per_night || 0;
              const diff = basePrice > 0 ? Math.round(((rate.nightly_rate - basePrice) / basePrice) * 100) : 0;

              return (
                <Card key={rate.id} className={isCurrentSeason ? 'border-primary/50 bg-primary/3' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{isRu ? (rate.name_ru || rate.name_en) : rate.name_en}</h3>
                          {isCurrentSeason && <Badge className="text-[10px]">{t('Active', 'Активен')}</Badge>}
                          {!isCurrentSeason && daysUntil > 0 && daysUntil <= 30 && (
                            <Badge variant="outline" className="text-[10px]">
                              {t(`in ${daysUntil}d`, `через ${daysUntil} дн.`)}
                            </Badge>
                          )}
                        </div>
                        {property && <p className="text-xs text-muted-foreground">{property.title}</p>}
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(start, 'dd MMM', { locale: isRu ? ru : undefined })} — {format(end, 'dd MMM yyyy', { locale: isRu ? ru : undefined })}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rate.weekly_discount && (
                            <Badge variant="secondary" className="text-[10px]">
                              <Tag className="h-2.5 w-2.5 mr-0.5" />7+: -{rate.weekly_discount}%
                            </Badge>
                          )}
                          {rate.monthly_discount && (
                            <Badge variant="secondary" className="text-[10px]">
                              <Tag className="h-2.5 w-2.5 mr-0.5" />28+: -{rate.monthly_discount}%
                            </Badge>
                          )}
                          {rate.early_booking_discount && (
                            <Badge variant="secondary" className="text-[10px]">
                              Early Bird: -{rate.early_booking_discount}%
                            </Badge>
                          )}
                          {rate.last_minute_discount && (
                            <Badge variant="secondary" className="text-[10px]">
                              Last Min: -{rate.last_minute_discount}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-1 justify-end">
                          <Moon className="h-3 w-3 text-muted-foreground" />
                          <span className="font-semibold">฿{rate.nightly_rate.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">/{t('night', 'ночь')}</span>
                        </div>
                        {diff !== 0 && (
                          <p className={cn("text-xs", diff > 0 ? "text-warning" : "text-success")}>
                            {diff > 0 ? '+' : ''}{diff}% {t('vs base', 'от базы')}
                          </p>
                        )}
                        {rate.min_stay_nights && rate.min_stay_nights > 1 && (
                          <p className="text-[10px] text-muted-foreground">min {rate.min_stay_nights} {t('nights', 'ночей')}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingRate(rate); setSheetOpen(true); }}>
                        <Edit2 className="h-3 w-3 mr-1" />{t('Edit', 'Изменить')}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(rate)}>
                        <Trash2 className="h-3 w-3 mr-1" />{t('Delete', 'Удалить')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* ─── Section 3: Activity History ─── */}
      <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between px-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              <History className="h-4 w-4" />
              {t('Change History', 'История изменений')}
              {activityLogs.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">{activityLogs.length}</Badge>
              )}
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", historyOpen && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          {logsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-none" />)}
            </div>
          ) : activityLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t('No changes recorded yet', 'Изменений пока нет')}
            </p>
          ) : (
            activityLogs.map((log: any) => {
              const prop = allProperties.find(p => p.property_id === log.property_id);
              return (
                <Card key={log.id}>
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {log.actor?.full_name || t('System', 'Система')}
                        </span>
                        <ActivityActionBadge action={log.action} isRu={isRu} />
                      </div>
                      {prop && <p className="text-[10px] text-muted-foreground">{prop.title}</p>}
                      <ActivityDetails details={log.details} action={log.action} isRu={isRu} />
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: isRu ? ru : undefined })}
                    </span>
                  </CardContent>
                </Card>
              );
            })
          )}
        </CollapsibleContent>
      </Collapsible>

      <RateSeasonSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editingRate={editingRate}
        properties={allProperties}
        ownerId={user?.id || ''}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['pricing-activity-logs'] })}
      />
    </div>
  );
}

/* ─── Activity log helpers ─── */
function ActivityActionBadge({ action, isRu }: { action: string; isRu: boolean }) {
  const labels: Record<string, [string, string, string]> = {
    price_override: ['Price Override', 'Изменение цены', 'bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary'],
    base_price_changed: ['Base Price', 'Базовая цена', 'bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary'],
    season_created: ['Season Created', 'Сезон создан', 'bg-success/10 text-success dark:bg-success/30 dark:text-success'],
    season_updated: ['Season Updated', 'Сезон обновлён', 'bg-accent/10 text-accent dark:bg-accent/30 dark:text-accent'],
    season_deleted: ['Season Deleted', 'Сезон удалён', 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'],
    availability_changed: ['Availability', 'Доступность', 'bg-success/10 text-success dark:bg-success/30 dark:text-success'],
  };
  const [en, rur, color] = labels[action] || [action, action, 'bg-muted text-muted-foreground'];
  return <Badge className={cn("text-[10px] font-normal", color)}>{isRu ? rur : en}</Badge>;
}

function ActivityDetails({ details, action, isRu }: { details: any; action: string; isRu: boolean }) {
  if (!details) return null;
  
  if (action === 'price_override' && details.old_value !== undefined) {
    return (
      <p className="text-xs text-muted-foreground mt-0.5">
        {details.date}: {details.old_value?.toLocaleString()} → {details.new_value?.toLocaleString()}
      </p>
    );
  }
  if (action === 'base_price_changed') {
    return (
      <p className="text-xs text-muted-foreground mt-0.5">
        {details.old_value?.toLocaleString()} → {details.new_value?.toLocaleString()}
      </p>
    );
  }
  if ((action === 'season_created' || action === 'season_updated') && details.name) {
    return (
      <p className="text-xs text-muted-foreground mt-0.5">
        {details.name}: ฿{details.nightly_rate?.toLocaleString()}/{isRu ? 'ночь' : 'night'} ({details.start_date} — {details.end_date})
      </p>
    );
  }
  if (action === 'season_deleted' && details.name) {
    return <p className="text-xs text-muted-foreground mt-0.5">{details.name}</p>;
  }
  if (action === 'availability_changed' && details.count) {
    return (
      <p className="text-xs text-muted-foreground mt-0.5">
        {details.count} {isRu ? 'дней' : 'days'} → {details.status}
      </p>
    );
  }
  return null;
}

/* ─── Inline price editor row ─── */
function PropertyPriceRow({
  propertyId, title, pricePerNight, currency, seasonCount, isRu, userId,
}: {
  propertyId: string;
  title: string;
  pricePerNight: number;
  currency: string;
  seasonCount: number;
  isRu: boolean;
  userId?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(pricePerNight));
  const queryClient = useQueryClient();

  const save = async () => {
    const num = Number(value);
    if (!num || num <= 0) return;
    const { error } = await supabase
      .from('properties')
      .update({ price_per_night: num } as any)
      .eq('id', propertyId);
    if (error) {
      toast.error(isRu ? 'Ошибка сохранения' : 'Save failed');
    } else {
      toast.success(isRu ? 'Цена обновлена' : 'Price updated');

      // Log base price change
      if (userId && num !== pricePerNight) {
        try {
          await supabase.from('property_activity_log').insert({
            property_id: propertyId,
            actor_id: userId,
            actor_role: 'owner',
            action: 'base_price_changed',
            entity_type: 'property',
            entity_id: propertyId,
            details: { old_value: pricePerNight, new_value: num } as any,
          });
        } catch { /* ignored */ }
      }

      queryClient.invalidateQueries({ queryKey: ['company-properties'] });
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-activity-logs'] });
    }
    setEditing(false);
  };

  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {seasonCount > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {seasonCount} {isRu ? 'сезон.' : 'season(s)'}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-28 h-8 text-right"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
              />
              <span className="text-xs text-muted-foreground">{currency}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={save}><Check className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5" /></Button>
            </>
          ) : (
            <>
              <span className="font-semibold text-sm">฿{pricePerNight.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">/{isRu ? 'ночь' : 'night'}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setValue(String(pricePerNight)); setEditing(true); }}>
                <Pencil className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Season create/edit sheet ─── */
function RateSeasonSheet({
  open, onOpenChange, editingRate, properties, ownerId, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingRate: RateSeasonRecord | null;
  properties: any[];
  ownerId: string;
  onSaved?: () => void;
}) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = (en: string, rur: string) => isRu ? rur : en;
  const saveMutation = useSaveRateSeason();

  const [form, setForm] = useState(getDefaultForm(editingRate, properties));

  const handleOpenChange = (v: boolean) => {
    if (v) setForm(getDefaultForm(editingRate, properties));
    onOpenChange(v);
  };

  useState(() => {
    setForm(getDefaultForm(editingRate, properties));
  });

  const selectedProp = properties.find(p => p.property_id === form.property_id);
  const basePrice = selectedProp?.price_per_night || 0;
  const nightlyNum = Number(form.nightly_rate) || 0;
  const diff = basePrice > 0 && nightlyNum > 0 ? Math.round(((nightlyNum - basePrice) / basePrice) * 100) : 0;

  const handleSave = () => {
    const season = {
      property_id: form.property_id,
      owner_id: ownerId,
      name_en: form.name_en,
      name_ru: form.name_ru || null,
      start_date: form.start_date,
      end_date: form.end_date,
      nightly_rate: Number(form.nightly_rate) || 0,
      weekly_rate: form.weekly_rate ? Number(form.weekly_rate) : null,
      monthly_rate: form.monthly_rate ? Number(form.monthly_rate) : null,
      min_stay_nights: Number(form.min_stay_nights) || 1,
      early_booking_discount: form.early_booking_discount ? Number(form.early_booking_discount) : null,
      early_booking_days: form.early_booking_days ? Number(form.early_booking_days) : null,
      last_minute_discount: form.last_minute_discount ? Number(form.last_minute_discount) : null,
      last_minute_days: form.last_minute_days ? Number(form.last_minute_days) : null,
      weekly_discount: form.weekly_discount ? Number(form.weekly_discount) : null,
      monthly_discount: form.monthly_discount ? Number(form.monthly_discount) : null,
    };

    saveMutation.mutate(
      { season: season as any, id: editingRate?.id, basePricePerNight: basePrice },
      {
        onSuccess: () => {
          toast.success(t('Saved', 'Сохранено'));
          onOpenChange(false);
          onSaved?.();
        },
        onError: () => toast.error(t('Save failed', 'Ошибка сохранения')),
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {editingRate ? t('Edit Season', 'Редактировать сезон') : t('New Season', 'Новый сезон')}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          {/* Property selector */}
          <div>
            <Label>{t('Property', 'Объект')}</Label>
            <Select value={form.property_id} onValueChange={v => setForm(f => ({ ...f, property_id: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {properties.map(p => (
                  <SelectItem key={p.property_id} value={p.property_id}>
                    {p.title || p.property_id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {basePrice > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('Base price', 'Базовая цена')}: ฿{basePrice.toLocaleString()}/{t('night', 'ночь')}
              </p>
            )}
          </div>

          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('Name (EN)', 'Название (EN)')}</Label>
              <Input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} placeholder="High Season" />
            </div>
            <div>
              <Label>{t('Name (RU)', 'Название (RU)')}</Label>
              <Input value={form.name_ru} onChange={e => setForm(f => ({ ...f, name_ru: e.target.value }))} placeholder="Высокий сезон" />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('Start Date', 'Начало')}</Label>
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div>
              <Label>{t('End Date', 'Конец')}</Label>
              <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>

          {/* Nightly rate */}
          <div>
            <Label>{t('Nightly Rate (฿)', 'Цена за ночь (฿)')}</Label>
            <Input type="number" value={form.nightly_rate} onChange={e => setForm(f => ({ ...f, nightly_rate: e.target.value }))} />
            {diff !== 0 && (
              <p className={cn("text-xs mt-1", diff > 0 ? "text-warning" : "text-success")}>
                {diff > 0 ? '+' : ''}{diff}% {t('vs base price', 'от базовой цены')}
              </p>
            )}
          </div>

          {/* Min stay */}
          <div>
            <Label>{t('Min Stay (nights)', 'Мин. ночей')}</Label>
            <Input type="number" value={form.min_stay_nights} onChange={e => setForm(f => ({ ...f, min_stay_nights: e.target.value }))} />
          </div>

          <Separator />

          {/* Discounts */}
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Tag className="h-4 w-4" />
            {t('Season Discounts', 'Скидки сезона')}
          </h3>
          <p className="text-xs text-muted-foreground -mt-2">
            {t('Override property defaults for this season. Leave blank to use property settings.',
               'Переопределить настройки объекта для этого сезона. Оставьте пустым для дефолтных.')}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t('Weekly discount %', 'Скидка 7+ ночей %')}</Label>
              <Input type="number" placeholder={t('e.g. 10', 'напр. 10')} value={form.weekly_discount} onChange={e => setForm(f => ({ ...f, weekly_discount: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">{t('Monthly discount %', 'Скидка 28+ ночей %')}</Label>
              <Input type="number" placeholder={t('e.g. 20', 'напр. 20')} value={form.monthly_discount} onChange={e => setForm(f => ({ ...f, monthly_discount: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t('Early Bird %', 'Раннее бронир. %')}</Label>
              <Input type="number" placeholder={t('e.g. 15', 'напр. 15')} value={form.early_booking_discount} onChange={e => setForm(f => ({ ...f, early_booking_discount: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">{t('Days ahead', 'Дней до заезда')}</Label>
              <Input type="number" placeholder={t('e.g. 30', 'напр. 30')} value={form.early_booking_days} onChange={e => setForm(f => ({ ...f, early_booking_days: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t('Last Minute %', 'Горящие скидки %')}</Label>
              <Input type="number" placeholder={t('e.g. 10', 'напр. 10')} value={form.last_minute_discount} onChange={e => setForm(f => ({ ...f, last_minute_discount: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">{t('Days before', 'За сколько дней')}</Label>
              <Input type="number" placeholder={t('e.g. 3', 'напр. 3')} value={form.last_minute_days} onChange={e => setForm(f => ({ ...f, last_minute_days: e.target.value }))} />
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={!form.name_en || !form.start_date || !form.end_date || !form.nightly_rate || saveMutation.isPending}
          >
            {t('Save', 'Сохранить')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function getDefaultForm(editingRate: RateSeasonRecord | null, properties: any[]) {
  if (editingRate) {
    return {
      property_id: editingRate.property_id,
      name_en: editingRate.name_en,
      name_ru: editingRate.name_ru || '',
      start_date: editingRate.start_date,
      end_date: editingRate.end_date,
      nightly_rate: String(editingRate.nightly_rate),
      weekly_rate: editingRate.weekly_rate ? String(editingRate.weekly_rate) : '',
      monthly_rate: editingRate.monthly_rate ? String(editingRate.monthly_rate) : '',
      min_stay_nights: String(editingRate.min_stay_nights || 1),
      weekly_discount: editingRate.weekly_discount ? String(editingRate.weekly_discount) : '',
      monthly_discount: editingRate.monthly_discount ? String(editingRate.monthly_discount) : '',
      early_booking_discount: editingRate.early_booking_discount ? String(editingRate.early_booking_discount) : '',
      early_booking_days: editingRate.early_booking_days ? String(editingRate.early_booking_days) : '',
      last_minute_discount: editingRate.last_minute_discount ? String(editingRate.last_minute_discount) : '',
      last_minute_days: editingRate.last_minute_days ? String(editingRate.last_minute_days) : '',
    };
  }
  return {
    property_id: properties[0]?.property_id || '',
    name_en: '', name_ru: '', start_date: '', end_date: '',
    nightly_rate: '', weekly_rate: '', monthly_rate: '', min_stay_nights: '1',
    weekly_discount: '', monthly_discount: '',
    early_booking_discount: '', early_booking_days: '',
    last_minute_discount: '', last_minute_days: '',
  };
}
