/**
 * LifeOS Health Monitoring Tab
 * Read-only computed metrics view per Life Situation (3-level model)
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeOSHealth, useGovernanceConfig, type HealthMetrics } from '@/hooks/useLifeOSGovernance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Activity,
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  ShieldCheck,
  Clock,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function LifeOSHealthTab() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  
  const { data: healthData, isLoading } = useLifeOSHealth();
  const { data: config } = useGovernanceConfig();

  const overallStats = healthData ? {
    totalSituations: healthData.length,
    activeSituations: healthData.filter(h => h.is_active).length,
    healthySituations: healthData.filter(h => h.health_score >= 70).length,
    criticalSituations: healthData.filter(h => h.flag_no_scenarios || h.flag_no_tasks).length,
    avgHealthScore: Math.round(healthData.reduce((sum, h) => sum + h.health_score, 0) / Math.max(1, healthData.length)),
    entityOveruse: healthData[0]?.entity_overuse_count || 0,
    orphanScenarios: healthData[0]?.orphan_scenario_count || 0,
    orphanTasks: healthData[0]?.orphan_task_count || 0,
  } : null;

  const getHealthBadge = (score: number) => {
    if (score >= 80) return { color: 'bg-green-500/10 text-green-700 border-green-200', label: isRussian ? 'Отлично' : 'Excellent' };
    if (score >= 60) return { color: 'bg-blue-500/10 text-blue-700 border-blue-200', label: isRussian ? 'Хорошо' : 'Good' };
    if (score >= 40) return { color: 'bg-amber-500/10 text-amber-700 border-amber-200', label: isRussian ? 'Внимание' : 'Warning' };
    return { color: 'bg-red-500/10 text-red-700 border-red-200', label: isRussian ? 'Критично' : 'Critical' };
  };

  const getFlagIcon = (metrics: HealthMetrics) => {
    const flags = [];
    if (metrics.flag_no_scenarios) flags.push({ icon: AlertOctagon, color: 'text-red-500', tip: isRussian ? 'Нет сценариев' : 'No scenarios' });
    if (metrics.flag_no_tasks) flags.push({ icon: TrendingDown, color: 'text-amber-500', tip: isRussian ? 'Нет задач' : 'No tasks' });
    if (metrics.flag_no_entities) flags.push({ icon: AlertTriangle, color: 'text-amber-500', tip: isRussian ? 'Нет привязок' : 'No entity bindings' });
    return flags;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Overall Health Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xl font-bold">{overallStats?.activeSituations || 0}</p>
                  <p className="text-xs text-muted-foreground">{isRussian ? 'Активных' : 'Active'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xl font-bold">{overallStats?.healthySituations || 0}</p>
                  <p className="text-xs text-muted-foreground">{isRussian ? 'Здоровых' : 'Healthy'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className={cn("w-5 h-5", (overallStats?.criticalSituations || 0) > 0 ? "text-red-500" : "text-muted-foreground")} />
                <div>
                  <p className="text-xl font-bold">{overallStats?.criticalSituations || 0}</p>
                  <p className="text-xs text-muted-foreground">{isRussian ? 'Критичных' : 'Critical'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xl font-bold">{overallStats?.avgHealthScore || 0}%</p>
                  <p className="text-xs text-muted-foreground">{isRussian ? 'Ср. здоровье' : 'Avg Health'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Layers className={cn("w-5 h-5", (overallStats?.entityOveruse || 0) > 0 ? "text-amber-500" : "text-muted-foreground")} />
                <div>
                  <p className="text-xl font-bold">{overallStats?.entityOveruse || 0}</p>
                  <p className="text-xs text-muted-foreground">{isRussian ? 'Перегрузка' : 'Overuse'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{config?.LIFEOS_MODE || 'MANUAL'}</p>
                  <p className="text-xs text-muted-foreground">{isRussian ? 'Режим' : 'Mode'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Health Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {isRussian ? 'Здоровье ситуаций' : 'Situation Health'}
            </CardTitle>
            <CardDescription>
              {isRussian 
                ? '3-уровневая модель: Ситуации → Сценарии → Задачи → Сущности'
                : '3-level model: Situations → Scenarios → Tasks → Entities'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRussian ? 'Ситуация' : 'Situation'}</TableHead>
                  <TableHead className="text-center">{isRussian ? 'Сценарии' : 'Scenarios'}</TableHead>
                  <TableHead className="text-center">{isRussian ? 'Задачи' : 'Tasks'}</TableHead>
                  <TableHead className="text-center">{isRussian ? 'Сущн. (новые)' : 'Entities (new)'}</TableHead>
                  <TableHead className="text-center">{isRussian ? 'Сущн. (legacy)' : 'Entities (legacy)'}</TableHead>
                  <TableHead>{isRussian ? 'Здоровье' : 'Health'}</TableHead>
                  <TableHead>{isRussian ? 'Флаги' : 'Flags'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : !healthData?.length ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {isRussian ? 'Нет данных' : 'No data'}
                    </TableCell>
                  </TableRow>
                ) : (
                  healthData.map((metrics) => {
                    const healthBadge = getHealthBadge(metrics.health_score);
                    const flags = getFlagIcon(metrics);
                    
                    return (
                      <TableRow key={metrics.situation_id} className={!metrics.is_active ? 'opacity-50' : ''}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{isRussian ? metrics.title_ru : metrics.title_en}</p>
                            <code className="text-xs text-muted-foreground">{metrics.situation_code}</code>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{metrics.scenario_count}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-primary/10">{metrics.task_count}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{metrics.new_entity_count}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-muted-foreground">{metrics.legacy_entity_count}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={metrics.health_score} className="w-16 h-2" />
                            <Badge variant="outline" className={healthBadge.color}>
                              {metrics.health_score}%
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {flags.length === 0 ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              flags.map((flag, idx) => (
                                <Tooltip key={idx}>
                                  <TooltipTrigger>
                                    <flag.icon className={cn("w-4 h-4", flag.color)} />
                                  </TooltipTrigger>
                                  <TooltipContent>{flag.tip}</TooltipContent>
                                </Tooltip>
                              ))
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Governance Rules Reference */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm">{isRussian ? 'Правила управления' : 'Governance Rules'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">{isRussian ? 'Макс. сценариев/сущность' : 'Max scenarios/entity'}</p>
                <p className="font-medium">{config?.MAX_SCENARIOS_PER_ENTITY || 3}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{isRussian ? 'Диапазон осн. веса' : 'Primary weight range'}</p>
                <p className="font-medium">{config?.PRIMARY_WEIGHT_MIN || 70}–{config?.PRIMARY_WEIGHT_MAX || 85}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{isRussian ? 'Мин. сущностей/сценарий' : 'Min entities/scenario'}</p>
                <p className="font-medium">{config?.MIN_ENTITIES_PER_SCENARIO || 3}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{isRussian ? 'Режим AI' : 'AI Mode'}</p>
                <p className="font-medium">{config?.AI_MODE || 'OFF'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
