import { Compass, ArrowRight } from 'lucide-react';
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
  const cards = (items: ExperienceCategory[]) => <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {items.map(category => { const Icon = emojiToIconMap[category.icon] ?? Compass; return <button key={category.id} type="button" aria-pressed={selected === category.slug} onClick={() => onSelect(category.slug)}
      className="group flex min-h-28 items-start gap-3 border border-border bg-card p-4 text-left transition-colors hover:border-primary aria-pressed:border-primary aria-pressed:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
      <span className="min-w-0 flex-1"><span className="block font-display text-lg text-foreground">{language === 'ru' ? category.name_ru || category.name_en : category.name_en || category.name_ru}</span>
        <span className="mt-2 block text-sm text-muted-foreground">{category.experience_type === 'tour' ? t('Экскурсии и маршруты', 'Tours and routes', 'ทัวร์และเส้นทาง') : category.experience_type === 'activity' ? t('Отдых и активности', 'Activities and leisure', 'กิจกรรมและการพักผ่อน') : t('Посмотреть предложения', 'Explore offers', 'ดูข้อเสนอ')}</span></span>
      <ArrowRight className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
    </button>; })}
  </div>;
  return <section aria-labelledby="experience-category-title" className="space-y-4">
    <header><h2 id="experience-category-title" className="font-display text-h3">{t('Что вам интересно?', 'What would you like to explore?', 'คุณสนใจอะไร?')}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t('Выберите тему, чтобы увидеть подходящие предложения.', 'Choose a category to see matching offers.', 'เลือกหมวดหมู่เพื่อดูข้อเสนอที่ตรงกัน')}</p></header>
    {cards(categories.slice(0, 8))}
    {categories.length > 8 && <details className="border-t border-border pt-3"><summary className="flex min-h-11 cursor-pointer items-center font-medium text-primary">{t('Все темы', 'All categories', 'หมวดหมู่ทั้งหมด')} · {categories.length}</summary><div className="pt-3">{cards(categories.slice(8))}</div></details>}
  </section>;
}
