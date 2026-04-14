import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyProperties } from '@/hooks/useMyProperties';
import { usePropertyKeysOverview } from '@/hooks/usePropertyKeys';
import { useUtilityOverview } from '@/hooks/useUtilitySchedules';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { typedFrom } from '@/lib/untypedTables';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse, ChevronDown, ChevronRight, Check,
  AlertTriangle, X, Filter, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type HealthStatus = 'ok' | 'warning' | 'missing';

interface HealthCheck {
  id: string;
  category: string;
  labelEn: string;
  labelRu: string;
  status: HealthStatus;
  detail?: string;
  detailRu?: string;
  actionPath?: string;
  icon: string;
}

interface PropertyHealthReport {
  propertyId: string;
  title: string;
  titleRu: string;
  coverImage: string | null;
  score: number;
  checks: HealthCheck[];
  issueCount: number;
}

function isDueThisMonth(dueDay: number | null, lastPaidDate: string | null): 'paid' | 'due' | 'overdue' | 'unknown' {
  if (!dueDay) return 'unknown';
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (lastPaidDate && lastPaidDate.startsWith(currentMonth)) return 'paid';
  if (now.getDate() > dueDay) return 'overdue';
  return 'due';
}

/** Fetch extra property fields not in useMyProperties */
function usePropertyHealthFields(propertyIds: string[]) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['property-health-fields', propertyIds],
    queryFn: async () => {
      if (!propertyIds.length) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('id, management_document_url, house_rules, house_rules_ru, images, auto_report_enabled, report_recipients')
        .in('id', propertyIds);
      if (error) throw error;
      return data || [];
    },
    enabled: propertyIds.length > 0 && !!user,
    staleTime: 60000,
  });
}

/** Fetch portal settings existence for properties */
function usePortalSettingsOverview(propertyIds: string[]) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['portal-settings-overview', propertyIds],
    queryFn: async () => {
      if (!propertyIds.length) return [];
      const { data, error } = await typedFrom('owner_portal_settings')
        .select('property_id')
        .select('property_id')
        .in('property_id', propertyIds);
      if (error) throw error;
      return (data || []) as { property_id: string }[];
    },
    enabled: propertyIds.length > 0 && !!user,
    staleTime: 60000,
  });
}

function usePortfolioHealth() {
  const { allProperties, isLoading: propsLoading } = useMyProperties();
  const propertyIds = useMemo(() => allProperties.map(p => p.property_id), [allProperties]);

  const { data: healthFields, isLoading: fieldsLoading } = usePropertyHealthFields(propertyIds);
  const { data: allKeys, isLoading: keysLoading } = usePropertyKeysOverview(propertyIds);
  const { data: allUtilities, isLoading: utilLoading } = useUtilityOverview(propertyIds);
  const { data: portalSettings, isLoading: portalLoading } = usePortalSettingsOverview(propertyIds);

  const isLoading = propsLoading || fieldsLoading || keysLoading || utilLoading || portalLoading;

  const reports = useMemo<PropertyHealthReport[]>(() => {
    if (isLoading || !healthFields) return [];

    const fieldsMap = new Map(healthFields.map(f => [f.id, f]));
    const keysMap = new Map<string, typeof allKeys>();
    (allKeys || []).forEach(k => {
      const arr = keysMap.get(k.property_id) || [];
      arr.push(k);
      keysMap.set(k.property_id, arr);
    });
    const utilMap = new Map<string, typeof allUtilities>();
    (allUtilities || []).forEach(u => {
      const arr = utilMap.get(u.property_id) || [];
      arr.push(u);
      utilMap.set(u.property_id, arr);
    });
    const portalSet = new Set((portalSettings || []).map(p => p.property_id));

    return allProperties.map(prop => {
      const fields = fieldsMap.get(prop.property_id);
      const keys = keysMap.get(prop.property_id) || [];
      const utils = utilMap.get(prop.property_id) || [];
      const basePath = `/mc/properties/${prop.property_id}/manage`;

      const checks: HealthCheck[] = [];

      // 1. Management Contract
      const hasContract = !!fields?.management_document_url;
      checks.push({
        id: 'contract',
        category: 'contract',
        labelEn: 'Management Contract',
        labelRu: 'Договор управления',
        status: hasContract ? 'ok' : 'missing',
        detail: hasContract ? 'Uploaded' : 'Not uploaded',
        detailRu: hasContract ? 'Загружен' : 'Не загружен',
        actionPath: `${basePath}?tab=documents`,
        icon: '📄',
      });

      // 2. Electricity
      const elecUtils = utils.filter(u => u.utility_type === 'electricity');
      const elecOverdue = elecUtils.filter(u => isDueThisMonth(u.due_day, u.last_paid_date) === 'overdue');
      const elecStatus: HealthStatus = elecUtils.length === 0 ? 'missing' : elecOverdue.length > 0 ? 'warning' : 'ok';
      checks.push({
        id: 'electricity',
        category: 'electricity',
        labelEn: 'Electricity',
        labelRu: 'Электричество',
        status: elecStatus,
        detail: elecUtils.length === 0 ? 'Not configured' : elecOverdue.length > 0 ? `${elecOverdue.length} overdue` : 'Paid',
        detailRu: elecUtils.length === 0 ? 'Не настроено' : elecOverdue.length > 0 ? `${elecOverdue.length} просрочено` : 'Оплачено',
        actionPath: `${basePath}?tab=utilities`,
        icon: '⚡',
      });

      // 3. CAM / Juristic
      const camUtils = utils.filter(u => u.utility_type === 'cam');
      const camOverdue = camUtils.filter(u => isDueThisMonth(u.due_day, u.last_paid_date) === 'overdue');
      const camStatus: HealthStatus = camUtils.length === 0 ? 'missing' : camOverdue.length > 0 ? 'warning' : 'ok';
      checks.push({
        id: 'cam',
        category: 'cam',
        labelEn: 'CAM / Juristic',
        labelRu: 'CAM / Юридический',
        status: camStatus,
        detail: camUtils.length === 0 ? 'Not configured' : camOverdue.length > 0 ? `${camOverdue.length} overdue` : 'Paid',
        detailRu: camUtils.length === 0 ? 'Не настроено' : camOverdue.length > 0 ? `${camOverdue.length} просрочено` : 'Оплачено',
        actionPath: `${basePath}?tab=utilities`,
        icon: '🏢',
      });

      // 4. Keys
      const hasKeys = keys.length > 0;
      const keyHolder = hasKeys ? keys[0].assigned_to_name : null;
      checks.push({
        id: 'keys',
        category: 'keys',
        labelEn: 'Key Management',
        labelRu: 'Ключи',
        status: hasKeys ? 'ok' : 'missing',
        detail: hasKeys ? `With ${keyHolder}${keys.length > 1 ? ` +${keys.length - 1}` : ''}` : 'Not assigned',
        detailRu: hasKeys ? `У ${keyHolder}${keys.length > 1 ? ` +${keys.length - 1}` : ''}` : 'Не назначены',
        actionPath: `${basePath}?tab=keys`,
        icon: '🔑',
      });

      // 5. Professional Photos
      const photoCount = fields?.images?.length || 0;
      const hasPhotos = photoCount >= 5;
      checks.push({
        id: 'photos',
        category: 'photos',
        labelEn: 'Professional Photos',
        labelRu: 'Профессиональные фото',
        status: hasPhotos ? 'ok' : photoCount > 0 ? 'warning' : 'missing',
        detail: hasPhotos ? `${photoCount} photos` : photoCount > 0 ? `${photoCount}/5 photos` : 'No photos',
        detailRu: hasPhotos ? `${photoCount} фото` : photoCount > 0 ? `${photoCount}/5 фото` : 'Нет фото',
        actionPath: `${basePath}?tab=photos`,
        icon: '📸',
      });

      // 6. House Rules
      const hasRules = !!(fields?.house_rules || fields?.house_rules_ru);
      checks.push({
        id: 'house_rules',
        category: 'house_rules',
        labelEn: 'House Rules',
        labelRu: 'Правила дома',
        status: hasRules ? 'ok' : 'missing',
        detail: hasRules ? 'Configured' : 'Not set',
        detailRu: hasRules ? 'Настроены' : 'Не заполнены',
        actionPath: `${basePath}?tab=rules`,
        icon: '📋',
      });

      // 7. Owner Reports
      const hasReports = !!fields?.auto_report_enabled && (fields?.report_recipients?.length || 0) > 0;
      checks.push({
        id: 'reports',
        category: 'reports',
        labelEn: 'Owner Reports',
        labelRu: 'Отчёты собственнику',
        status: hasReports ? 'ok' : 'missing',
        detail: hasReports ? 'Enabled' : 'Not configured',
        detailRu: hasReports ? 'Настроены' : 'Не настроены',
        actionPath: `${basePath}?tab=reports`,
        icon: '📊',
      });

      // 8. Owner Portal
      const hasPortal = portalSet.has(prop.property_id);
      checks.push({
        id: 'portal',
        category: 'portal',
        labelEn: 'Owner Portal',
        labelRu: 'Портал собственника',
        status: hasPortal ? 'ok' : 'missing',
        detail: hasPortal ? 'Active' : 'Not set up',
        detailRu: hasPortal ? 'Активирован' : 'Не настроен',
        actionPath: `${basePath}?tab=owner-portal`,
        icon: '🌐',
      });

      const okCount = checks.filter(c => c.status === 'ok').length;
      const score = Math.round((okCount / checks.length) * 100);
      const issueCount = checks.filter(c => c.status !== 'ok').length;

      return {
        propertyId: prop.property_id,
        title: prop.title,
        titleRu: prop.title_ru,
        coverImage: prop.cover_image,
        score,
        checks,
        issueCount,
      };
    }).sort((a, b) => a.score - b.score); // worst first
  }, [isLoading, allProperties, healthFields, allKeys, allUtilities, portalSettings]);

  const portfolioScore = useMemo(() => {
    if (reports.length === 0) return 100;
    return Math.round(reports.reduce((sum, r) => sum + r.score, 0) / reports.length);
  }, [reports]);

  const problemCount = useMemo(() => reports.filter(r => r.score < 100).length, [reports]);

  return { reports, portfolioScore, problemCount, isLoading, totalProperties: allProperties.length };
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

function scoreProgressColor(score: number) {
  if (score >= 80) return '[&>div]:bg-success';
  if (score >= 50) return '[&>div]:bg-warning';
  return '[&>div]:bg-destructive';
}

function statusIcon(status: HealthStatus) {
  if (status === 'ok') return <Check className="h-3.5 w-3.5 text-success" />;
  if (status === 'warning') return <AlertTriangle className="h-3.5 w-3.5 text-warning" />;
  return <X className="h-3.5 w-3.5 text-destructive" />;
}

function PropertyHealthCard({ report, isRu }: { report: PropertyHealthReport; isRu: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const title = isRu ? report.titleRu : report.title;

  return (
    <Card variant="interactive" className="overflow-hidden">
      <CardContent className="p-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-3 flex items-center gap-3 text-left"
        >
          {/* Cover thumbnail */}
          {report.coverImage ? (
            <img
              src={report.coverImage}
              alt={title}
              className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <HeartPulse className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium truncate">{title}</p>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={cn("text-sm font-bold tabular-nums", scoreColor(report.score))}>
                  {report.score}%
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  expanded && "rotate-180"
                )} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Progress
                value={report.score}
                className={cn("h-1.5 flex-1", scoreProgressColor(report.score))}
              />
              {report.issueCount > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                  {report.issueCount} {isRu ? 'нужно' : 'to fix'}
                </Badge>
              )}
            </div>
          </div>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-1 border-t border-border/50 pt-2">
                {report.checks.map(check => (
                  <div
                    key={check.id}
                    className={cn(
                      "flex items-center gap-2 py-1.5 px-2 rounded-md text-xs",
                      check.status !== 'ok' && "bg-muted/50"
                    )}
                  >
                    <span className="flex-shrink-0">{check.icon}</span>
                    {statusIcon(check.status)}
                    <span className="flex-1 truncate">
                      {isRu ? check.labelRu : check.labelEn}
                    </span>
                    <span className="text-muted-foreground text-[11px] truncate max-w-[100px]">
                      {isRu ? check.detailRu : check.detail}
                    </span>
                    {check.status !== 'ok' && check.actionPath && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-[10px] text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(check.actionPath!);
                        }}
                      >
                        Fix
                        <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export function PortfolioHealthWidget() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [showOnlyProblems, setShowOnlyProblems] = useState(false);
  const { reports, portfolioScore, problemCount, isLoading, totalProperties } = usePortfolioHealth();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (totalProperties === 0) return null;

  const filtered = showOnlyProblems ? reports.filter(r => r.score < 100) : reports;

  return (
    <div>
      {/* Summary header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <HeartPulse className={cn("h-5 w-5", scoreColor(portfolioScore))} />
          <div>
            <h3 className="font-semibold text-[15px] flex items-center gap-2">
              {isRu ? 'Здоровье портфеля' : 'Portfolio Health'}
              <span className={cn("text-lg font-bold tabular-nums", scoreColor(portfolioScore))}>
                {portfolioScore}%
              </span>
            </h3>
            {problemCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {problemCount} {isRu ? 'из' : 'of'} {totalProperties} {isRu ? 'требуют внимания' : 'need attention'}
              </p>
            )}
          </div>
        </div>

        {reports.some(r => r.score === 100) && (
          <Button
            variant={showOnlyProblems ? 'secondary' : 'ghost'}
            size="sm"
            className="text-xs h-7 gap-1"
            onClick={() => setShowOnlyProblems(!showOnlyProblems)}
          >
            <Filter className="h-3 w-3" />
            {isRu ? 'Проблемные' : 'Issues only'}
          </Button>
        )}
      </div>

      {/* Portfolio-level progress */}
      <Progress
        value={portfolioScore}
        className={cn("h-2 mb-3", scoreProgressColor(portfolioScore))}
      />

      {/* Property cards */}
      <div className="space-y-2">
        {filtered.slice(0, 20).map(report => (
          <PropertyHealthCard key={report.propertyId} report={report} isRu={isRu} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <Check className="h-8 w-8 mx-auto mb-2 text-success" />
            {isRu ? 'Все объекты в порядке!' : 'All properties are in good shape!'}
          </div>
        )}
      </div>
    </div>
  );
}
