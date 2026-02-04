import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategories, Category } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';

// Top Super-App categories (all verticals, not just home services)
const TOP_CATEGORY_SLUGS = [
  'yachts',       // 🛥️ Яхты
  'tours',        // ✈️ Туры  
  'restaurants',  // 🍽️ Рестораны
  'transport',    // 🚗 Транспорт
  'beauty-spa',   // 💅 Красота
  'cleaning',     // 🧹 Уборка
  'medical',      // 🏥 Медицина
  'flowers',      // 💐 Цветы
];

// Fallback categories with proper icons
const FALLBACK_CATEGORIES = [
  { slug: 'yachts', nameEn: 'Yachts', nameRu: 'Яхты', path: '/yachts', emoji: '🛥️' },
  { slug: 'tours', nameEn: 'Tours', nameRu: 'Экскурсии', path: '/tours', emoji: '✈️' },
  { slug: 'restaurants', nameEn: 'Restaurants', nameRu: 'Рестораны', path: '/restaurants', emoji: '🍽️' },
  { slug: 'transport', nameEn: 'Transport', nameRu: 'Транспорт', path: '/transport', emoji: '🚗' },
  { slug: 'beauty-spa', nameEn: 'Beauty & SPA', nameRu: 'Красота', path: '/beauty', emoji: '💅' },
  { slug: 'cleaning', nameEn: 'Cleaning', nameRu: 'Уборка', path: '/cleaning', emoji: '🧹' },
  { slug: 'medical', nameEn: 'Medical', nameRu: 'Медицина', path: '/medical', emoji: '🏥' },
  { slug: 'flowers', nameEn: 'Flowers', nameRu: 'Цветы', path: '/flowers', emoji: '💐' },
];

export function QuickServiceIcons() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { flatCategories, getName } = useCategories();

  // Get top categories from DB, preserving order from TOP_CATEGORY_SLUGS
  const topCategories = TOP_CATEGORY_SLUGS
    .map(slug => flatCategories.find(cat => cat.slug === slug))
    .filter((cat): cat is Category => !!cat);

  // Use DB categories if available, otherwise fallback
  const displayCategories = topCategories.length >= 4 ? topCategories : FALLBACK_CATEGORIES;

  return (
    <div className="px-4 py-3">
      <div className="grid grid-cols-4 gap-2">
        {displayCategories.slice(0, 8).map((cat) => {
          const isFromDB = 'icon' in cat && typeof cat.icon === 'function';
          const Icon = isFromDB ? (cat as Category).icon : null;
          const emoji = !isFromDB ? (cat as typeof FALLBACK_CATEGORIES[0]).emoji : null;
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
