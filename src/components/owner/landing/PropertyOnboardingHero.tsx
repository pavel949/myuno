import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, TrendingUp, Shield, Clock } from 'lucide-react';

export function PropertyOnboardingHero() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const benefits = [
    {
      icon: TrendingUp,
      textEn: 'Track income & expenses',
      textRu: 'Отслеживайте доходы и расходы',
    },
    {
      icon: Shield,
      textEn: 'Manage bookings & guests',
      textRu: 'Управляйте бронями и гостями',
    },
    {
      icon: Clock,
      textEn: 'Order services in one tap',
      textRu: 'Заказывайте услуги в один тап',
    },
  ];

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-6 text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Building2 className="h-8 w-8 text-primary" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold mb-2">
          {isRu ? 'Добавьте первый объект' : 'Add Your First Property'}
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground mb-6">
          {isRu 
            ? 'Начните управлять недвижимостью профессионально' 
            : 'Start managing your property professionally'}
        </p>

        {/* Benefits */}
        <div className="space-y-3 mb-6 text-left">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <benefit.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">
                {isRu ? benefit.textRu : benefit.textEn}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button 
          size="lg" 
          className="w-full"
          onClick={() => navigate('/owner/properties/new')}
        >
          <Plus className="h-5 w-5 mr-2" />
          {isRu ? 'Добавить объект' : 'Add Property'}
        </Button>

        {/* Secondary CTA */}
        <Button 
          variant="ghost" 
          size="sm"
          className="mt-3 text-muted-foreground"
          onClick={() => navigate('/owner/full-management')}
        >
          {isRu ? 'Или передайте нам в управление →' : 'Or let us manage it →'}
        </Button>
      </CardContent>
    </Card>
  );
}
