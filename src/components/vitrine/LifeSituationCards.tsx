import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Palmtree, Home, Briefcase, Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const situations = [
  {
    id: 'tourist',
    icon: Palmtree,
    titleEn: 'TOURIST',
    titleRu: 'ТУРИСТ',
    subtitleEn: 'Arriving in Phuket? We handle everything — from airport to adventure',
    subtitleRu: 'Прилетаете на Пхукет? Мы позаботимся обо всём — от аэропорта до приключений',
    tagsEn: ['Transfer', 'Tours', 'Villas', 'Restaurants', 'Diving'],
    tagsRu: ['Трансфер', 'Туры', 'Виллы', 'Рестораны', 'Дайвинг'],
    path: '/life/tourist',
    premium: false,
  },
  {
    id: 'resident',
    icon: Home,
    titleEn: 'RESIDENT',
    titleRu: 'РЕЗИДЕНТ',
    subtitleEn: 'Living on the island? We make it easy',
    subtitleRu: 'Живёте на острове? Мы упрощаем быт',
    tagsEn: ['Cleaning', 'Legal', 'Medical', 'Insurance', 'Gyms'],
    tagsRu: ['Клининг', 'Юрист', 'Медицина', 'Страховка', 'Фитнес'],
    path: '/life/resident',
    premium: false,
  },
  {
    id: 'investor',
    icon: Briefcase,
    titleEn: 'INVESTOR',
    titleRu: 'ИНВЕСТОР',
    subtitleEn: 'Buying property? We protect your investment',
    subtitleRu: 'Покупаете недвижимость? Мы защитим ваши инвестиции',
    tagsEn: ['Due Diligence', 'Legal', 'Property Search', 'Market Data'],
    tagsRu: ['Проверка', 'Юрист', 'Поиск объектов', 'Аналитика'],
    path: '/life/investor',
    premium: false,
  },
  {
    id: 'owner',
    icon: Building2,
    titleEn: 'OWNER',
    titleRu: 'СОБСТВЕННИК',
    subtitleEn: 'Managing property remotely? We run it for you',
    subtitleRu: 'Управляете удалённо? Мы возьмём это на себя',
    tagsEn: ['Management', 'Cleaning', 'Reports', 'Maintenance'],
    tagsRu: ['Управление', 'Клининг', 'Отчёты', 'Обслуживание'],
    path: '/life/owner',
    premium: true,
  },
];

export function LifeSituationCards() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <section className="max-w-[1280px] mx-auto px-4 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {situations.map(s => {
          const Icon = s.icon;
          const tags = isRu ? s.tagsRu : s.tagsEn;

          return (
            <Link
              key={s.id}
              to={s.path}
              className={cn(
                "group relative bg-card rounded-xl p-5 border border-border/40",
                "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
                s.premium && "border-l-4 border-l-trust-gold"
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  s.premium ? "bg-trust-gold/10" : "bg-primary/8"
                )}>
                  <Icon className={cn(
                    "w-5 h-5",
                    s.premium ? "text-trust-gold" : "text-primary"
                  )} />
                </div>
                <h3 className="text-sm font-bold tracking-wide text-foreground">
                  {isRu ? s.titleRu : s.titleEn}
                </h3>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {isRu ? s.subtitleRu : s.subtitleEn}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[11px] text-muted-foreground bg-muted/60 rounded-full px-2.5 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                {isRu ? 'Подробнее' : 'Explore'}
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
