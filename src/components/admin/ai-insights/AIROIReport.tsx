import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Download,
  TrendingUp,
  Clock,
  Target
} from 'lucide-react';
import { useROIReport } from '@/hooks/useAIInsights';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const recommendationConfig = {
  KEEP: {
    color: 'bg-info',
    textColor: 'text-info',
    bgColor: 'bg-info/10',
    icon: Clock,
    labelEn: 'Keep monitoring',
    labelRu: 'Продолжать мониторинг',
  },
  ADJUST: {
    color: 'bg-warning',
    textColor: 'text-warning',
    bgColor: 'bg-warning/10',
    icon: AlertCircle,
    labelEn: 'Needs adjustment',
    labelRu: 'Требует настройки',
  },
  SCALE: {
    color: 'bg-success',
    textColor: 'text-success',
    bgColor: 'bg-success/10',
    icon: TrendingUp,
    labelEn: 'Consider expansion',
    labelRu: 'Рассмотреть расширение',
  },
};

export function AIROIReport() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { data: report, isLoading, isError, refetch } = useROIReport();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (isError) return <Card><CardContent className="space-y-3 p-4" role="alert">
    <p>{isRussian ? 'Не удалось загрузить отчёт качества AI.' : 'Could not load the AI quality report.'}</p>
    <Button variant="outline" className="min-h-11" onClick={() => refetch()}>{isRussian ? 'Повторить' : 'Retry'}</Button>
  </CardContent></Card>;
  if (!report) return null;
  
  const config = recommendationConfig[report.recommendation];
  const RecommendationIcon = config.icon;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5" />
            {isRussian ? 'Качество AI-анализа за 14 дней' : 'AI analysis quality over 14 days'}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {report.period}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {/* Summary */}
        <div className="p-4 rounded-none bg-muted/50">
          <p className="text-sm leading-relaxed">{report.summary}</p>
          <p className="mt-2 text-xs text-muted-foreground">{isRussian ? 'Показатели относятся к загруженным записям анализа; объявления могут повторяться. Доля подтверждений рассчитана по решениям администраторов.' : 'Metrics describe loaded analysis records; listings may repeat. The acknowledgement share uses recorded admin decisions.'}</p>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-none bg-muted/30">
            <div className="text-2xl font-bold">{report.metrics.listingsAnalyzed}</div>
            <div className="text-xs text-muted-foreground">
              {isRussian ? 'Записей анализа' : 'Analysis records'}
            </div>
          </div>
          <div className="text-center p-3 rounded-none bg-muted/30">
            <div className="text-2xl font-bold">
              {report.metrics.avgQualityScore ?? '—'}
            </div>
            <div className="text-xs text-muted-foreground">
              {isRussian ? 'Ср. балл' : 'Avg Score'}
            </div>
          </div>
          <div className="text-center p-3 rounded-none bg-muted/30">
            <div className="text-2xl font-bold">{report.metrics.suspiciousDetected}</div>
            <div className="text-xs text-muted-foreground">
              {isRussian ? 'Отмечено анализов' : 'Flagged analyses'}
            </div>
          </div>
          <div className="text-center p-3 rounded-none bg-muted/30">
            <div className="text-2xl font-bold">
              {report.metrics.aiAccuracyProxy == null ? '—' : `${report.metrics.aiAccuracyProxy}%`}
            </div>
            <div className="text-xs text-muted-foreground">
              {isRussian ? 'Доля подтверждений' : 'Acknowledgement share'}
            </div>
          </div>
        </div>
        
        {/* Strengths & Weaknesses */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              {isRussian ? 'Сильные стороны' : 'Strengths'}
            </h4>
            <ul className="space-y-1">
              {report.strengths.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-success mt-1">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warning" />
              {isRussian ? 'Слабые стороны' : 'Weaknesses'}
            </h4>
            <ul className="space-y-1">
              {report.weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-warning mt-1">•</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Recommendation */}
        <div className={cn("p-4 rounded-none", config.bgColor)}>
          <div className="flex items-center gap-3 mb-3">
            <div className={cn("p-2 rounded-none", config.color)}>
              <RecommendationIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                {isRussian ? 'Рекомендация' : 'Recommendation'}
              </div>
              <div className={cn("font-bold", config.textColor)}>
                {isRussian ? config.labelRu : config.labelEn}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              {isRussian ? 'Следующие шаги:' : 'Next Steps:'}
            </h4>
            <ul className="space-y-1">
              {report.nextSteps.map((step, i) => (
                <li key={i} className="text-sm flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" size="sm" className="min-h-11 flex-1 basis-48" onClick={() => window.print()}>
            <Download className="w-4 h-4 mr-2" />
            {isRussian ? 'Печать страницы' : 'Print page'}
          </Button>
          <Button asChild variant="outline" size="sm" className="min-h-11 flex-1 basis-48"><Link to="/admin/catalog">
            <Target className="w-4 h-4 mr-2" />
            {isRussian ? 'Открыть каталог' : 'Open catalogue'}
          </Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}
