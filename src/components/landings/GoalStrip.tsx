/**
 * GoalStrip — "One Phuket. One app." goal-first entry row for the home page.
 * Links to the four goal entry pages (Stay · Live · Buy · Services).
 */
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { GOAL_ENTRIES, GOAL_ORDER } from '@/lib/nav/goalEntries';

export function GoalStrip() {
  const { language } = useLanguage();
  return (
    <div>
      <h2 className="mb-1 font-serif text-2xl text-foreground sm:text-3xl">
        {pickLang(language, { en: 'One Phuket. One app.', ru: 'Один Пхукет. Одно приложение.', th: 'ภูเก็ตเดียว แอปเดียว' })}
      </h2>
      <p className="mb-5 text-sm text-muted-foreground">
        {pickLang(language, {
          en: 'Start with what you need today.',
          ru: 'Начните с того, что нужно сегодня.',
          th: 'เริ่มจากสิ่งที่คุณต้องการวันนี้',
        })}
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {GOAL_ORDER.map((id) => {
          const g = GOAL_ENTRIES[id];
          const Icon = g.icon;
          return (
            <Link
              key={id}
              to={g.path}
              className="group flex min-h-24 flex-col justify-between border border-border bg-card p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="size-5 text-primary" aria-hidden />
              <span className="mt-3 flex items-center justify-between font-medium text-foreground">
                {pickLang(language, { en: g.en, ru: g.ru, th: g.th })}
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
