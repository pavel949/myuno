import { useMemo } from 'react';
import { useMyProperties } from '@/hooks/useMyProperties';
import { usePropertyKeysOverview } from '@/hooks/usePropertyKeys';
import { useUtilityOverview } from '@/hooks/useUtilitySchedules';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type HealthStatus = 'ok' | 'warning' | 'missing';

export interface HealthCheck {
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

export interface PropertyHealthReport {
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
      const { data, error } = await (supabase as any)
        .from('owner_portal_settings')
        .select('property_id')
        .in('property_id', propertyIds);
      if (error) throw error;
      return (data || []) as { property_id: string }[];
    },
    enabled: propertyIds.length > 0 && !!user,
    staleTime: 60000,
  });
}

export function usePortfolioHealth() {
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
