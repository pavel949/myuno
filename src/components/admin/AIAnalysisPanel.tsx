import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, ChevronUp, CheckCircle, XCircle, AlertTriangle, 
  Info, ThumbsUp, ThumbsDown, Sparkles, Clock
} from 'lucide-react';
import type { QualityArtifact, QualityIssue, QualityRecommendation } from '@/hooks/useListingQualityAnalysis';
import { format } from 'date-fns';

interface AIAnalysisPanelProps {
  artifact: QualityArtifact;
  isRu?: boolean;
  onAcknowledge?: () => void;
  onDismiss?: () => void;
  onFeedback?: (rating: 'positive' | 'negative', comment?: string) => void;
  isLoading?: boolean;
}

export function AIAnalysisPanel({
  artifact,
  isRu = false,
  onAcknowledge,
  onDismiss,
  onFeedback,
  isLoading = false,
}: AIAnalysisPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const { data: report, verdict, primary_score, is_reviewed, admin_action, created_at } = artifact;

  const getSeverityIcon = (severity: QualityIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getImpactBadge = (impact: QualityRecommendation['impact']) => {
    const colors = {
      high: 'bg-red-500/10 text-red-600 border-red-500/30',
      medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
      low: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    };
    return (
      <Badge variant="outline" className={cn('text-xs', colors[impact])}>
        {impact}
      </Badge>
    );
  };

  const getVerdictBadge = () => {
    const configs = {
      approve: { 
        color: 'bg-green-500/10 text-green-600 border-green-500/30', 
        label: isRu ? 'Одобрить' : 'Approve' 
      },
      review: { 
        color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', 
        label: isRu ? 'Проверить' : 'Review' 
      },
      suspicious: { 
        color: 'bg-orange-500/10 text-orange-600 border-orange-500/30', 
        label: isRu ? 'Подозрительно' : 'Suspicious' 
      },
      reject_recommend: { 
        color: 'bg-red-500/10 text-red-600 border-red-500/30', 
        label: isRu ? 'Отклонить' : 'Reject' 
      },
    };
    const config = configs[verdict] || configs.review;
    return (
      <Badge variant="outline" className={cn('text-sm', config.color)}>
        {config.label}
      </Badge>
    );
  };

  const handleFeedback = (rating: 'positive' | 'negative') => {
    onFeedback?.(rating, feedbackComment || undefined);
    setShowFeedback(false);
    setFeedbackComment('');
  };

  return (
    <Card className="border-l-4 border-l-primary/50">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">
                  {isRu ? 'AI Анализ качества' : 'AI Quality Analysis'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-lg font-bold">
                    {Math.round(primary_score)}/100
                  </Badge>
                  {getVerdictBadge()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {is_reviewed && (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {admin_action || (isRu ? 'Проверено' : 'Reviewed')}
                  </Badge>
                )}
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* Completeness Grid */}
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(report.completeness).filter(([key]) => key !== 'image_count').map(([key, value]) => (
                <div 
                  key={key} 
                  className={cn(
                    'flex items-center gap-1 text-xs p-1.5 rounded',
                    value ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                  )}
                >
                  {value ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span className="truncate">
                    {key.replace('has_', '').replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>

            {/* Issues */}
            {report.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">
                  {isRu ? 'Проблемы' : 'Issues'} ({report.issues.length})
                </h4>
                <div className="space-y-1.5">
                  {report.issues.map((issue, idx) => (
                    <div 
                      key={idx}
                      className="flex items-start gap-2 text-sm bg-muted/50 p-2 rounded"
                    >
                      {getSeverityIcon(issue.severity)}
                      <span>{isRu ? issue.message_ru : issue.message_en}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">
                  {isRu ? 'Рекомендации' : 'Recommendations'}
                </h4>
                <div className="space-y-1.5">
                  {report.recommendations.map((rec, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded"
                    >
                      <span>{rec.action}</span>
                      {getImpactBadge(rec.impact)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Explanation */}
            {report.ai_explanation && (
              <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded italic">
                <Sparkles className="w-3 h-3 inline mr-1" />
                {report.ai_explanation}
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(created_at), 'dd.MM.yyyy HH:mm')}
              </span>
              <span>
                {isRu ? 'Уверенность' : 'Confidence'}: {Math.round((report.ai_confidence || 0) * 100)}%
              </span>
              {artifact.correlation_id && (
                <span className="font-mono text-[10px] opacity-50">
                  {artifact.correlation_id}
                </span>
              )}
            </div>

            {/* Actions */}
            {!is_reviewed && (onAcknowledge || onDismiss) && (
              <div className="flex items-center gap-2 pt-2 border-t">
                {onAcknowledge && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={onAcknowledge}
                    disabled={isLoading}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {isRu ? 'Принять' : 'Acknowledge'}
                  </Button>
                )}
                {onDismiss && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={onDismiss}
                    disabled={isLoading}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    {isRu ? 'Отклонить' : 'Dismiss'}
                  </Button>
                )}
                
                {onFeedback && (
                  <div className="ml-auto flex items-center gap-1">
                    <span className="text-xs text-muted-foreground mr-1">
                      {isRu ? 'Полезно?' : 'Helpful?'}
                    </span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 w-7 p-0"
                      onClick={() => handleFeedback('positive')}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 w-7 p-0"
                      onClick={() => setShowFeedback(!showFeedback)}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Feedback input */}
            {showFeedback && (
              <div className="space-y-2 pt-2">
                <Textarea
                  placeholder={isRu ? 'Почему анализ неверен?' : 'Why is this analysis incorrect?'}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  className="text-sm"
                  rows={2}
                />
                <Button 
                  size="sm" 
                  onClick={() => handleFeedback('negative')}
                >
                  {isRu ? 'Отправить отзыв' : 'Submit Feedback'}
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
