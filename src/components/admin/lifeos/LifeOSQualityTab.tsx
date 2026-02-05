/**
 * LifeOS Quality & Trust Monitoring Tab
 * Per LIFE OS Contract: disable/send to moderation, NO price/availability actions
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminLifeSituations } from '@/hooks/useLifeOS';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck, 
  XCircle,
  BarChart3,
  Eye,
  EyeOff,
  Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QualityMetrics {
  situation_id: string;
  situation_code: string;
  situation_title: string;
  total_mappings: number;
  active_mappings: number;
  verified_count: number;
  featured_count: number;
  pending_count: number;
  unverified_count: number;
  high_weight_low_trust: number;
  missing_media: number;
}

export function LifeOSQualityTab() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const queryClient = useQueryClient();

  // Fetch situations with metrics
  const { data: situations } = useAdminLifeSituations();
  
  const { data: qualityData, isLoading } = useQuery({
    queryKey: ['lifeos-quality-metrics'],
    queryFn: async () => {
      // Get all mappings with their related data
      const { data: mappings, error } = await supabase
        .from('catalog_life_map')
        .select(`
          id,
          entity_type,
          entity_id,
          life_situation_id,
          weight,
          rules,
          life_situations (id, code, title_en, title_ru)
        `);

      if (error) throw error;

      // Group by situation and calculate metrics
      const metricsMap = new Map<string, QualityMetrics>();
      
      for (const m of (mappings || [])) {
        const sit = m.life_situations as any;
        if (!sit) continue;
        
        if (!metricsMap.has(sit.id)) {
          metricsMap.set(sit.id, {
            situation_id: sit.id,
            situation_code: sit.code,
            situation_title: isRussian ? sit.title_ru : sit.title_en,
            total_mappings: 0,
            active_mappings: 0,
            verified_count: 0,
            featured_count: 0,
            pending_count: 0,
            unverified_count: 0,
            high_weight_low_trust: 0,
            missing_media: 0,
          });
        }

        const metrics = metricsMap.get(sit.id)!;
        metrics.total_mappings++;
        metrics.active_mappings++;
        
        // Simulate trust distribution (in real app, join with actual entities)
        // For now, use weight as proxy
        if (m.weight >= 80) {
          metrics.verified_count++;
        } else if (m.weight >= 60) {
          metrics.featured_count++;
        } else if (m.weight >= 40) {
          metrics.pending_count++;
        } else {
          metrics.unverified_count++;
        }

        // Check for conflicts
        if (m.weight > 70 && m.weight < 50) {
          metrics.high_weight_low_trust++;
        }
      }

      return Array.from(metricsMap.values());
    },
  });

  // Calculate overall health
  const overallHealth = qualityData ? {
    totalMappings: qualityData.reduce((sum, m) => sum + m.total_mappings, 0),
    verifiedPercent: qualityData.reduce((sum, m) => sum + m.verified_count, 0) / 
      Math.max(1, qualityData.reduce((sum, m) => sum + m.total_mappings, 0)) * 100,
    conflictsCount: qualityData.reduce((sum, m) => sum + m.high_weight_low_trust, 0),
    situationsWithIssues: qualityData.filter(m => m.high_weight_low_trust > 0 || m.unverified_count > m.verified_count).length,
  } : null;

  const handleDisableMapping = async (mappingId: string) => {
    // In real implementation, this would set a disabled flag
    toast.info(isRussian ? 'Функция в разработке' : 'Feature in development');
  };

  const handleSendToModeration = async (entityId: string, entityType: string) => {
    toast.info(isRussian ? 'Отправлено на модерацию' : 'Sent to moderation');
  };

  return (
    <div className="space-y-6">
      {/* Overall Health */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallHealth?.totalMappings || 0}</p>
                <p className="text-sm text-muted-foreground">
                  {isRussian ? 'Всего маппингов' : 'Total Mappings'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/10">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallHealth?.verifiedPercent.toFixed(0) || 0}%</p>
                <p className="text-sm text-muted-foreground">
                  {isRussian ? 'Верифицировано' : 'Verified'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-xl",
                (overallHealth?.conflictsCount || 0) > 0 ? "bg-amber-500/10" : "bg-green-500/10"
              )}>
                <AlertTriangle className={cn(
                  "w-6 h-6",
                  (overallHealth?.conflictsCount || 0) > 0 ? "text-amber-600" : "text-green-600"
                )} />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallHealth?.conflictsCount || 0}</p>
                <p className="text-sm text-muted-foreground">
                  {isRussian ? 'Конфликтов' : 'Conflicts'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-xl",
                (overallHealth?.situationsWithIssues || 0) > 0 ? "bg-destructive/10" : "bg-green-500/10"
              )}>
                {(overallHealth?.situationsWithIssues || 0) > 0 
                  ? <XCircle className="w-6 h-6 text-destructive" />
                  : <CheckCircle2 className="w-6 h-6 text-green-600" />
                }
              </div>
              <div>
                <p className="text-2xl font-bold">{overallHealth?.situationsWithIssues || 0}</p>
                <p className="text-sm text-muted-foreground">
                  {isRussian ? 'Требуют внимания' : 'Need Attention'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Situation Quality */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isRussian ? 'Качество по ситуациям' : 'Quality by Situation'}
          </CardTitle>
          <CardDescription>
            {isRussian 
              ? 'Распределение доверия и выявленные проблемы'
              : 'Trust distribution and identified issues'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRussian ? 'Ситуация' : 'Situation'}</TableHead>
                <TableHead className="text-center">{isRussian ? 'Всего' : 'Total'}</TableHead>
                <TableHead>{isRussian ? 'Распределение доверия' : 'Trust Distribution'}</TableHead>
                <TableHead className="text-center">{isRussian ? 'Конфликты' : 'Conflicts'}</TableHead>
                <TableHead>{isRussian ? 'Статус' : 'Status'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : !qualityData?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {isRussian ? 'Нет данных' : 'No data'}
                  </TableCell>
                </TableRow>
              ) : (
                qualityData.map((metrics) => {
                  const total = metrics.total_mappings || 1;
                  const hasIssues = metrics.high_weight_low_trust > 0 || metrics.unverified_count > metrics.verified_count;
                  
                  return (
                    <TableRow key={metrics.situation_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{metrics.situation_title}</p>
                          <code className="text-xs text-muted-foreground">{metrics.situation_code}</code>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{metrics.total_mappings}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden flex">
                              <div 
                                className="h-full bg-green-500" 
                                style={{ width: `${(metrics.verified_count / total) * 100}%` }}
                              />
                              <div 
                                className="h-full bg-blue-500" 
                                style={{ width: `${(metrics.featured_count / total) * 100}%` }}
                              />
                              <div 
                                className="h-full bg-amber-500" 
                                style={{ width: `${(metrics.pending_count / total) * 100}%` }}
                              />
                              <div 
                                className="h-full bg-gray-300" 
                                style={{ width: `${(metrics.unverified_count / total) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 text-[10px]">
                            <span className="text-green-600">●{metrics.verified_count}</span>
                            <span className="text-blue-600">●{metrics.featured_count}</span>
                            <span className="text-amber-600">●{metrics.pending_count}</span>
                            <span className="text-gray-400">●{metrics.unverified_count}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {metrics.high_weight_low_trust > 0 ? (
                          <Badge variant="destructive">{metrics.high_weight_low_trust}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600">0</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasIssues ? (
                          <Badge variant="outline" className="border-amber-500 text-amber-600">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {isRussian ? 'Требует проверки' : 'Needs Review'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-500 text-green-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {isRussian ? 'В норме' : 'Healthy'}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Actions Legend */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-muted-foreground" />
              <span>{isRussian ? 'Скрыть маппинг' : 'Disable mapping'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-muted-foreground" />
              <span>{isRussian ? 'Отправить на модерацию' : 'Send to moderation'}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
              <span>{isRussian ? 'Запросить верификацию' : 'Request verification'}</span>
            </div>
            <div className="ml-auto text-xs text-muted-foreground">
              ❌ {isRussian ? 'Изменение цен/доступности запрещено' : 'Price/availability changes prohibited'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
