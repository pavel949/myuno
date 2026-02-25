import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, CheckCircle, Shield, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: BarChart3,
    titleEn: 'Real-time Dashboard',
    titleRu: 'Панель в реальном времени',
    descEn: 'See your property data anywhere — bookings, revenue, occupancy',
    descRu: 'Бронирования, доход, загрузка — всё в одном месте',
  },
  {
    icon: CheckCircle,
    titleEn: 'Verified Managers',
    titleRu: 'Проверенные управляющие',
    descEn: 'Only G-Trust certified management companies',
    descRu: 'Только сертифицированные управляющие компании',
  },
  {
    icon: Shield,
    titleEn: 'Ombudsman Protected',
    titleRu: 'Защита омбудсмена',
    descEn: 'Disputes resolved fairly — your interests always represented',
    descRu: 'Споры решаются справедливо — ваши интересы всегда защищены',
  },
];

export function PropertySpotlight() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <section className="max-w-[1280px] mx-auto px-4 lg:px-8 py-12 lg:py-16">
      <div className="rounded-2xl bg-trust-gold/5 border border-trust-gold/15 p-6 lg:p-10">
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-trust-gold mb-3">
            {isRu ? 'Для владельцев недвижимости' : 'For Property Owners'}
          </p>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-3 font-display">
            {isRu ? 'Ваша недвижимость на Пхукете?' : 'Own Property in Phuket?'}
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            {isRu
              ? 'Хватит управлять через WhatsApp. myUNO даёт полную прозрачность и контроль — удалённо.'
              : 'Stop managing via WhatsApp. myUNO gives you full visibility and control — remotely.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {features.map(f => {
            const Icon = f.icon;
            return (
              <div
                key={f.titleEn}
                className="bg-card rounded-xl p-5 border border-border/30"
              >
                <div className="w-10 h-10 rounded-xl bg-trust-gold/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-trust-gold" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {isRu ? f.titleRu : f.titleEn}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRu ? f.descRu : f.descEn}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/life/owner">
            <Button variant="outline" className="rounded-lg px-6 border-trust-gold/30 text-trust-gold hover:bg-trust-gold/10">
              {isRu ? 'Узнать больше' : 'Learn More'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/owner">
            <Button className="rounded-lg px-6 bg-trust-gold hover:bg-trust-gold/90 text-white">
              {isRu ? 'Я владелец недвижимости' : "I'm a Property Owner"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
