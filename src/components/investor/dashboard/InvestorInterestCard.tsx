import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, ArrowRight, Building2, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { InvestmentInterestWithProject } from '@/hooks/useInvestmentInterest';

interface InvestorInterestCardProps {
  interest: InvestmentInterestWithProject;
}

// Status configuration
const STATUS_CONFIG: Record<string, { labelRu: string; labelEn: string; color: string; bgColor: string }> = {
  new: { labelRu: 'Новая', labelEn: 'New', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  contacted: { labelRu: 'Связались', labelEn: 'Contacted', color: 'text-green-700', bgColor: 'bg-green-100' },
  in_progress: { labelRu: 'В работе', labelEn: 'In Progress', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  documents_sent: { labelRu: 'Документы', labelEn: 'Documents', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  completed: { labelRu: 'Завершено', labelEn: 'Completed', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  cancelled: { labelRu: 'Отменено', labelEn: 'Cancelled', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

const INTEREST_TYPE_LABELS: Record<string, { ru: string; en: string }> = {
  invest: { ru: 'Инвестиция', en: 'Investment' },
  learn_more: { ru: 'Узнать больше', en: 'Learn More' },
  call_request: { ru: 'Звонок', en: 'Call Request' },
};

export function InvestorInterestCard({ interest }: InvestorInterestCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const status = STATUS_CONFIG[interest.status] || STATUS_CONFIG.new;
  const typeLabel = INTEREST_TYPE_LABELS[interest.interest_type] || INTEREST_TYPE_LABELS.invest;
  const project = interest.project;
  
  // Format date
  const timeAgo = formatDistanceToNow(new Date(interest.created_at), {
    addSuffix: true,
    locale: isRu ? ru : enUS,
  });

  // Determine icon based on project type
  const isRealEstate = project?.project_type?.startsWith('real_estate');

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex">
          {/* Project Image */}
          <div className="w-24 h-24 flex-shrink-0 bg-muted relative overflow-hidden">
            {project?.cover_image ? (
              <img 
                src={project.cover_image} 
                alt={isRu ? project.title_ru : project.title_en}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                {isRealEstate ? (
                  <Building2 className="h-8 w-8 text-primary/60" />
                ) : (
                  <Briefcase className="h-8 w-8 text-primary/60" />
                )}
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 p-3 min-w-0">
            {/* Title and Status */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-semibold text-sm truncate">
                {project 
                  ? (isRu ? project.title_ru : project.title_en)
                  : (isRu ? 'Проект' : 'Project')
                }
              </h3>
              <Badge className={cn('text-xs flex-shrink-0', status.bgColor, status.color, 'border-0')}>
                {isRu ? status.labelRu : status.labelEn}
              </Badge>
            </div>
            
            {/* Location */}
            {project?.district && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{project.district}</span>
              </div>
            )}
            
            {/* Interest Type and Amount */}
            <div className="flex items-center gap-2 text-xs mb-2">
              <span className="text-muted-foreground">
                {isRu ? typeLabel.ru : typeLabel.en}
              </span>
              {interest.preferred_amount && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-medium text-primary">
                    ${interest.preferred_amount.toLocaleString()} {interest.preferred_currency}
                  </span>
                </>
              )}
            </div>
            
            {/* Footer: Date and Action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{timeAgo}</span>
              </div>
              
              {project && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/invest/${project.id}`)}
                  className="h-7 px-2 text-xs"
                >
                  {isRu ? 'Подробнее' : 'Details'}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
