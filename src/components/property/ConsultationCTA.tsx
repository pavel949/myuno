import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight, MessageCircle } from 'lucide-react';

interface ConsultationCTAProps {
  variant?: 'banner' | 'compact';
}

export function ConsultationCTA({ variant = 'banner' }: ConsultationCTAProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  if (variant === 'compact') {
    return (
      <Button 
        variant="outline" 
        onClick={() => navigate('/property/consultation')}
        className="w-full"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        {isRu ? 'Запросить подбор' : 'Request Consultation'}
      </Button>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/20 flex-shrink-0">
            <Search className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-0.5">
              {isRu ? 'Не нашли подходящий?' : "Can't find the right one?"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isRu 
                ? 'Оставьте заявку и мы подберём для вас' 
                : 'Leave a request and we will find it for you'}
            </p>
          </div>
          
          <Button 
            size="sm"
            onClick={() => navigate('/property/consultation')}
            className="flex-shrink-0"
          >
            {isRu ? 'Заявка' : 'Request'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
