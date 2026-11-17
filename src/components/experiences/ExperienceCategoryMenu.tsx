import { Compass } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { emojiToIconMap } from '@/lib/iconMap';
import type { ExperienceCategory } from '@/hooks/useExperienceCategories';

/** Navigation over returned active category records; no inferred offers or stock. */
export function ExperienceCategoryMenu({ categories, selected, onSelect }: {
  categories: ExperienceCategory[];
  selected: string;
  onSelect: (slug: string) => void;
}) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  if (!categories.length) return null;
  return <section aria-label={t('Темы впечатлений', 'Experience categories', 'หมวดหมู่ประสบการณ์')}>
    <div className="flex gap-2 overflow-x-auto pb-2" role="group">
      {categories.map(category => {
        const Icon = emojiToIconMap[category.icon] ?? Compass;
        return <button key={category.id} type="button" aria-pressed={selected === category.slug} onClick={() => onSelect(category.slug)}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary aria-pressed:border-primary aria-pressed:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{language === 'ru' ? category.name_ru || category.name_en : category.name_en || category.name_ru}</span>
        </button>;
      })}
    </div>
  </section>;
}
