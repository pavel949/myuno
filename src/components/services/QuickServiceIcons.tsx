import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategories, Category } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';

// Service-focused category slugs for quick icons
const SERVICE_SLUGS = [
  'cleaning', 'plumbing', 'electrical', 'ac-repair',
  'gardening', 'pest-control', 'handyman', 'pool',
];

export function QuickServiceIcons() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { flatCategories, getName } = useCategories();

  // Get service categories for quick access (filter to home services domain)
  const quickCategories = flatCategories
    .filter(cat => SERVICE_SLUGS.includes(cat.slug) || cat.miniAppType === 'services')
    .slice(0, 8);

  // Fallback if no categories from DB
  const defaultCategories = [
    { slug: 'cleaning', nameEn: 'Cleaning', nameRu: 'Уборка', path: '/cleaning', emoji: '🧹' },
    { slug: 'plumbing', nameEn: 'Plumbing', nameRu: 'Сантехник', path: '/services?category=plumbing', emoji: '🚿' },
    { slug: 'electrical', nameEn: 'Electrical', nameRu: 'Электрик', path: '/services?category=electrical', emoji: '⚡' },
    { slug: 'ac-repair', nameEn: 'AC Repair', nameRu: 'Кондиционер', path: '/services?category=ac-repair', emoji: '❄️' },
    { slug: 'gardening', nameEn: 'Gardening', nameRu: 'Сад', path: '/services?category=gardening', emoji: '🌱' },
    { slug: 'pest-control', nameEn: 'Pest Control', nameRu: 'Дезинсекция', path: '/services?category=pest-control', emoji: '🐜' },
    { slug: 'handyman', nameEn: 'Handyman', nameRu: 'Мастер', path: '/services?category=handyman', emoji: '🔧' },
    { slug: 'pool', nameEn: 'Pool', nameRu: 'Бассейн', path: '/services?category=pool', emoji: '🏊' },
  ];

  const displayCategories = quickCategories.length >= 4 ? quickCategories : defaultCategories;

  return (
    <div className="px-4 py-3">
      <div className="grid grid-cols-4 gap-2">
        {displayCategories.slice(0, 8).map((cat) => {
          const isFromDB = 'icon' in cat;
          const Icon = isFromDB ? (cat as Category).icon : null;
          const emoji = !isFromDB ? (cat as typeof defaultCategories[0]).emoji : null;
          const label = isFromDB ? getName(cat as Category) : (language === 'ru' ? cat.nameRu : cat.nameEn);
          const path = isFromDB ? (cat as Category).path : cat.path;

          return (
            <button
              key={cat.slug}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-xl",
                "hover:bg-muted/50 active:bg-muted transition-colors",
                "touch-manipulation"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-amber-500/10 flex items-center justify-center">
                {Icon ? (
                  <Icon className="w-6 h-6 text-primary" />
                ) : (
                  <span className="text-2xl">{emoji}</span>
                )}
              </div>
              <span className="text-[10px] font-medium text-center text-muted-foreground leading-tight line-clamp-2">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
