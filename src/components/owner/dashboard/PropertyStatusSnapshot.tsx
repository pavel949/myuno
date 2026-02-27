import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyKeysOverview } from '@/hooks/usePropertyKeys';
import { useUtilityOverview } from '@/hooks/useUtilitySchedules';
import { useMyProperties } from '@/hooks/useMyProperties';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import {
  Home, KeyRound, Zap, AlertTriangle, Check, ChevronRight,
  Droplets, Wifi, Building2, Shield, Flame, HelpCircle
} from 'lucide-react';

const UTILITY_ICONS: Record<string, React.ElementType> = {
  electricity: Zap, water: Droplets, internet: Wifi,
  cam: Building2, insurance: Shield, gas: Flame, other: HelpCircle,
};

function isDueThisMonth(dueDay: number | null, lastPaidDate: string | null): 'paid' | 'due' | 'overdue' | 'unknown' {
  if (!dueDay) return 'unknown';
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (lastPaidDate && lastPaidDate.startsWith(currentMonth)) return 'paid';
  if (now.getDate() > dueDay) return 'overdue';
  return 'due';
}

export function PropertyStatusSnapshot() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { allProperties, isLoading: propsLoading } = useMyProperties();
  
  const propertyIds = useMemo(() => allProperties.map(p => p.property_id), [allProperties]);
  
  const { data: allKeys, isLoading: keysLoading } = usePropertyKeysOverview(propertyIds);
  const { data: allUtilities, isLoading: utilLoading } = useUtilityOverview(propertyIds);

  const isLoading = propsLoading || keysLoading || utilLoading;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (allProperties.length === 0) return null;

  // Group keys/utilities by property
  const keysByProp = (allKeys || []).reduce<Record<string, typeof allKeys>>((acc, k) => {
    (acc[k.property_id] ||= []).push(k);
    return acc;
  }, {});

  const utilByProp = (allUtilities || []).reduce<Record<string, typeof allUtilities>>((acc, u) => {
    (acc[u.property_id] ||= []).push(u);
    return acc;
  }, {});

  return (
    <div>
      <h3 className="font-semibold text-[15px] mb-3 flex items-center gap-2">
        <Home className="h-4 w-4 text-primary" />
        {isRu ? 'Статус объектов' : 'Property Status'}
      </h3>
      <div className="space-y-2">
        {allProperties.slice(0, 10).map(prop => {
          const keys = keysByProp[prop.property_id] || [];
          const utils = utilByProp[prop.property_id] || [];
          const overdueUtils = utils.filter(u => isDueThisMonth(u.due_day, u.last_paid_date) === 'overdue');
          const title = isRu ? prop.title_ru : prop.title;

          return (
            <Card
              key={prop.property_id}
              variant="interactive"
              className="cursor-pointer"
              onClick={() => navigate(`/owner/properties/${prop.property_id}/manage`)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {/* Keys info */}
                      {keys.length > 0 ? (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <KeyRound className="h-3 w-3" />
                          {keys[0].assigned_to_name}
                          {keys.length > 1 && ` +${keys.length - 1}`}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
                          <KeyRound className="h-3 w-3" />
                          {isRu ? 'Не назначены' : 'No keys'}
                        </Badge>
                      )}

                      {/* Overdue utilities */}
                      {overdueUtils.length > 0 && (
                        <Badge variant="destructive" className="text-[10px] gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {overdueUtils.length} {isRu ? 'просрочено' : 'overdue'}
                        </Badge>
                      )}

                      {/* All paid */}
                      {utils.length > 0 && overdueUtils.length === 0 && (
                        <Badge variant="outline" className="text-[10px] gap-1 text-success border-success/30">
                          <Check className="h-3 w-3" />
                          {isRu ? 'Платежи ОК' : 'Utilities OK'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
