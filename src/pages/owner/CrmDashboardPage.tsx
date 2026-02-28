import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useCrmPipelines } from '@/hooks/useCrmPipelines';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, BarChart3, CheckCircle } from 'lucide-react';

export default function CrmDashboardPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;
  const { data: pipelines = [] } = useCrmPipelines(companyId);

  const activePipelines = pipelines.length;
  const totalStages = pipelines.reduce((sum, p) => sum + p.stages.length, 0);

  const stats = [
    { labelEn: 'Active Pipelines', labelRu: 'Активных воронок', value: activePipelines, icon: BarChart3, color: 'text-primary' },
    { labelEn: 'Total Stages', labelRu: 'Всего стадий', value: totalStages, icon: Target, color: 'text-success' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">{isRu ? 'CRM Дашборд' : 'CRM Dashboard'}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isRu ? 'Обзор продаж и воронки' : 'Sales and pipeline overview'}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{isRu ? stat.labelRu : stat.labelEn}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isRu ? 'Воронки продаж' : 'Sales Pipelines'}</CardTitle>
        </CardHeader>
        <CardContent>
          {pipelines.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {isRu ? 'Нет активных воронок' : 'No active pipelines'}
            </p>
          ) : (
            <div className="space-y-4">
              {pipelines.map(pipeline => (
                <div key={pipeline.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">{isRu ? pipeline.name_ru : pipeline.name_en}</h4>
                    <Badge variant="outline" className="text-[10px]">{pipeline.pipeline_type}</Badge>
                    {pipeline.is_default && <Badge className="text-[10px]">Default</Badge>}
                  </div>
                  <div className="flex gap-1">
                    {pipeline.stages.map(stage => (
                      <div key={stage.id} className="flex-1 text-center py-1.5 px-1 rounded text-[10px] bg-muted border">
                        <span className="font-medium">{isRu ? stage.name_ru : stage.name_en}</span>
                        <span className="block text-muted-foreground">{stage.probability}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
