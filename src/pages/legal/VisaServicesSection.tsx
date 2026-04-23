import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVisaServices } from '@/hooks/useVisaServices';
import { Badge } from '@/components/ui/badge';
import { Clock, FileCheck, ChevronRight } from 'lucide-react';

interface VisaServicesSectionProps {
  limit?: number;
  showTitle?: boolean;
}

export function VisaServicesSection({ limit = 6, showTitle = true }: VisaServicesSectionProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { services, isLoading } = useVisaServices();

  const visaServices = services.slice(0, limit);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-none" />
        ))}
      </div>
    );
  }

  if (visaServices.length === 0) return null;

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-primary">🛂</span>
            {language === 'ru' ? 'Визовые услуги' : 'Visa Services'}
          </h2>
          <button
            onClick={() => navigate('/legal?category=visa')}
            className="text-sm text-primary flex items-center gap-1"
          >
            {language === 'ru' ? 'Все' : 'All'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {visaServices.map((visa) => (
          <div
            key={visa.id}
            onClick={() => navigate(`/legal/visa/${visa.id}`)}
            className="bg-card border border-border rounded-none p-4 cursor-pointer hover:border-primary/50 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      visa.visa_type === 'elite' 
                        ? 'border-accent/40 text-accent bg-accent/10 dark:bg-accent/10' 
                        : visa.visa_type === 'retirement'
                        ? 'border-success/40 text-success bg-success/10 dark:bg-success/10'
                        : ''
                    }`}
                  >
                    {visa.visa_type?.replace('_', ' ').toUpperCase()}
                  </Badge>
                  {visa.is_popular && (
                    <Badge variant="secondary" className="text-xs">
                      ⭐ {language === 'ru' ? 'Популярно' : 'Popular'}
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {language === 'ru' ? visa.name_ru : visa.name_en}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {language === 'ru' ? visa.description_ru : visa.description_en}
                </p>
                
                <div className="flex items-center gap-4 mt-2">
                  {visa.processing_time && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {visa.processing_time}
                    </div>
                  )}
                  {visa.validity_period && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FileCheck className="w-3 h-3" />
                      {visa.validity_period}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right ml-4">
                <p className="font-bold text-primary">
                  ฿{(visa.price || 0).toLocaleString()}
                </p>
                {visa.government_fee && (
                  <p className="text-xs text-muted-foreground">
                    +฿{visa.government_fee.toLocaleString()} {language === 'ru' ? 'гос.сбор' : 'gov fee'}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
