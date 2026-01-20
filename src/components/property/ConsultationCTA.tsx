import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConsultationCTAProps {
  variant?: 'banner' | 'compact' | 'sticky';
  className?: string;
}

export function ConsultationCTA({ variant = 'banner', className }: ConsultationCTAProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  if (variant === 'compact') {
    return (
      <Button 
        variant="outline" 
        onClick={() => navigate('/property/consultation')}
        className={cn("w-full", className)}
        aria-label={isRu ? 'Запросить консультацию по подбору недвижимости' : 'Request property consultation'}
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        {isRu ? 'Запросить подбор' : 'Request Consultation'}
      </Button>
    );
  }

  const content = (
    <Card className={cn(
      "border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 overflow-hidden",
      variant === 'sticky' && "shadow-lg shadow-primary/10",
      className
    )}>
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          {/* Consultant Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center border-2 border-primary/30">
              <User className="w-7 h-7 text-primary" />
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-success rounded-full border-2 border-background flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-0.5">
              {isRu ? 'Не нашли подходящий?' : "Can't find the right one?"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isRu 
                ? 'Наш эксперт подберёт идеальный вариант для вас' 
                : 'Our expert will find the perfect option for you'}
            </p>
          </div>
          
          <Button 
            size="sm"
            onClick={() => navigate('/property/consultation')}
            className="flex-shrink-0 relative overflow-hidden group"
            aria-label={isRu ? 'Оставить заявку на подбор недвижимости' : 'Submit property search request'}
          >
            {/* Pulse animation ring */}
            <span className="absolute inset-0 rounded-md animate-ping bg-primary/30 opacity-75" style={{ animationDuration: '2s' }} />
            <span className="relative flex items-center">
              {isRu ? 'Заявка' : 'Request'}
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (variant === 'sticky') {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-40 animate-fade-in-up">
        {content}
      </div>
    );
  }

  return content;
}
