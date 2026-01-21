import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

export function FullManagementCard() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 overflow-hidden">
      <CardContent className="pt-5 relative">
        {/* Decorative element */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
        
        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/20">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-base">UNO Full Management</h3>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Полное управление' : 'Complete property care'}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
              {isRu ? '70/30' : '70/30'}
            </Badge>
          </div>

          <div className="space-y-1.5 mb-4">
            {[
              isRu ? 'Поиск и проверка гостей' : 'Guest sourcing & vetting',
              isRu ? 'Check-in / Check-out' : 'Check-in / Check-out',
              isRu ? 'Уборка и обслуживание' : 'Cleaning & maintenance',
              isRu ? 'Финансовая отчётность' : 'Financial reporting',
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <Button 
            onClick={() => navigate('/owner/full-management')}
            className="w-full"
            size="sm"
          >
            {isRu ? 'Узнать подробнее' : 'Learn More'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
