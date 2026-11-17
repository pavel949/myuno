import { Compass, Ship } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { emojiToIconMap } from '@/lib/iconMap';
import { APP_ROUTES } from '@/lib/config/routes';
import type { ExperienceCategory } from '@/hooks/useExperienceCategories';
import { MarketplaceDiscoveryMenu, type MarketplaceCategoryItem } from '@/components/services/MarketplaceDiscoveryMenu';
import yachtImage from '@/assets/solutions/yacht.webp';

/** Only returned active categories supply filter IDs; photos come from their recorded offers. */
export function ExperienceCategoryMenu({ categories, onSelect, images = {} }: {
  categories: ExperienceCategory[];
  selected: string;
  onSelect: (slug: string) => void;
  images?: Record<string, string>;
}) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  if (!categories.length) return null;
  const items: MarketplaceCategoryItem[] = categories.map(category => ({
    id: category.slug,
    label: language === 'ru' ? category.name_ru || category.name_en : category.name_en || category.name_ru,
    icon: emojiToIconMap[category.icon] ?? Compass,
    image: images[category.slug],
  }));
  if (!categories.some(category => ['yacht', 'yachts'].includes(category.slug))) items.splice(Math.min(5, items.length), 0, {
    id: 'dedicated-yacht-catalogue', label: t('Яхты', 'Yachts', 'เรือยอชต์'), icon: Ship, image: yachtImage, href: APP_ROUTES.YACHTS,
  });
  return <MarketplaceDiscoveryMenu title={t('Что вам интересно?', 'What would you like to explore?', 'คุณสนใจอะไร?')} items={items} onSelect={onSelect} testId="experience-category-menu" />;
}
