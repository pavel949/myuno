/**
 * @component ListingHealthScore
 * @description Visual representation of listing quality score with breakdown
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Image, FileText, DollarSign, Sparkles, 
  MessageSquare, Star, AlertCircle, CheckCircle2,
  TrendingUp
} from 'lucide-react';
import type { PropertyListingScore } from '@/hooks/usePropertyMarketing';

interface ListingHealthScoreProps {
  score: PropertyListingScore;
  className?: string;
}

export function ListingHealthScore({ score, className }: ListingHealthScoreProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-success';
    if (value >= 60) return 'text-warning';
    return 'text-destructive';
  };
  
  const getScoreLabel = (value: number) => {
    if (value >= 80) return isRu ? 'Отлично' : 'Excellent';
    if (value >= 60) return isRu ? 'Хорошо' : 'Good';
    if (value >= 40) return isRu ? 'Средне' : 'Fair';
    return isRu ? 'Требует внимания' : 'Needs Work';
  };
  
  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-success';
    if (value >= 60) return 'bg-warning';
    return 'bg-destructive';
  };
  
  const categories = [
    { 
      key: 'photos', 
      label: isRu ? 'Фотографии' : 'Photos', 
      score: score.photos_score,
      icon: Image,
    },
    { 
      key: 'description', 
      label: isRu ? 'Описание' : 'Description', 
      score: score.description_score,
      icon: FileText,
    },
    { 
      key: 'pricing', 
      label: isRu ? 'Цены' : 'Pricing', 
      score: score.pricing_score,
      icon: DollarSign,
    },
    { 
      key: 'amenities', 
      label: isRu ? 'Удобства' : 'Amenities', 
      score: score.amenities_score,
      icon: Sparkles,
    },
    { 
      key: 'response', 
      label: isRu ? 'Отзывчивость' : 'Response', 
      score: score.response_score,
      icon: MessageSquare,
    },
    { 
      key: 'reviews', 
      label: isRu ? 'Отзывы' : 'Reviews', 
      score: score.reviews_score,
      icon: Star,
    },
  ];
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {isRu ? 'Качество листинга' : 'Listing Health'}
          </CardTitle>
          <Badge 
            variant={score.overall_score >= 60 ? 'default' : 'destructive'}
            className="text-lg px-3 py-1"
          >
            {score.overall_score}%
          </Badge>
        </div>
        <p className={cn("text-sm font-medium", getScoreColor(score.overall_score))}>
          {getScoreLabel(score.overall_score)}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="relative h-3 rounded-full bg-muted overflow-hidden">
          <div 
            className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-500", getProgressColor(score.overall_score))}
            style={{ width: `${score.overall_score}%` }}
          />
        </div>
        
        {/* Category Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => (
            <div key={cat.key} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                cat.score >= 80 ? "bg-success/10 text-success" :
                cat.score >= 60 ? "bg-warning/10 text-warning" :
                "bg-destructive/10 text-destructive"
              )}>
                <cat.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{cat.label}</p>
                <div className="flex items-center gap-1">
                  <Progress 
                    value={cat.score} 
                    className="h-1.5 flex-1"
                  />
                  <span className="text-xs font-medium w-8">{cat.score}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Missing Fields Warning */}
        {score.missing_fields.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">
                {isRu ? 'Заполните обязательные поля' : 'Complete required fields'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {score.missing_fields.slice(0, 3).join(', ')}
                {score.missing_fields.length > 3 && ` +${score.missing_fields.length - 3}`}
              </p>
            </div>
          </div>
        )}
        
        {/* Top Improvement Tips */}
        {score.improvement_tips.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {isRu ? 'Рекомендации' : 'Recommendations'}
            </p>
            {score.improvement_tips.slice(0, 2).map((tip, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex items-start gap-2 p-2 rounded-lg text-sm",
                  tip.priority === 'high' ? "bg-warning/5" :
                  tip.priority === 'medium' ? "bg-warning/5" :
                  "bg-muted"
                )}
              >
                <CheckCircle2 className={cn(
                  "h-4 w-4 shrink-0 mt-0.5",
                  tip.priority === 'high' ? "text-warning" :
                  tip.priority === 'medium' ? "text-warning" :
                  "text-muted-foreground"
                )} />
                <span className="text-muted-foreground">
                  {isRu ? tip.tip_ru : tip.tip_en}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
