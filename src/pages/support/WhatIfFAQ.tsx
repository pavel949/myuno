import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo/SEOHead';
import { WHAT_IF_FAQ, type WhatIfLang } from '@/data/whatIfFaq';
import { trackEvent } from '@/lib/analytics/track';
import { Phone } from 'lucide-react';

const PAGE_META: Record<WhatIfLang, { title: string; subtitle: string; emergency: string }> = {
  ru: {
    title: 'Что делать, если…',
    subtitle: 'Краткие инструкции по типовым ситуациям на Пхукете — медицина, дорога, документы, безопасность.',
    emergency: 'Экстренные номера',
  },
  en: {
    title: 'What to do if…',
    subtitle: 'Quick guides for common situations in Phuket — medical, road, documents, safety.',
    emergency: 'Emergency numbers',
  },
  th: {
    title: 'ต้องทำอย่างไรหาก…',
    subtitle: 'คู่มือฉบับย่อสำหรับสถานการณ์ทั่วไปในภูเก็ต — การแพทย์ การเดินทาง เอกสาร ความปลอดภัย',
    emergency: 'เบอร์ฉุกเฉิน',
  },
};

const EMERGENCY_NUMBERS = [
  { number: '1669', labelKey: 'ambulance' },
  { number: '191', labelKey: 'police' },
  { number: '199', labelKey: 'fire' },
  { number: '1155', labelKey: 'tourist' },
] as const;

const EMERGENCY_LABELS: Record<WhatIfLang, Record<string, string>> = {
  ru: { ambulance: 'Скорая', police: 'Полиция', fire: 'Пожарная', tourist: 'Туристическая' },
  en: { ambulance: 'Ambulance', police: 'Police', fire: 'Fire', tourist: 'Tourist police' },
  th: { ambulance: 'รถพยาบาล', police: 'ตำรวจ', fire: 'ดับเพลิง', tourist: 'ตำรวจท่องเที่ยว' },
};

/** Renders an answer with `\n` → paragraphs and `– ` lines → list items. */
function WhatIfAnswer({ text }: { text: string }) {
  const blocks = useMemo(() => {
    const lines = text.split('\n');
    const out: Array<{ type: 'p' | 'ul'; items: string[] }> = [];
    let currentList: string[] | null = null;
    for (const raw of lines) {
      const line = raw.trim();
      if (line.startsWith('– ') || line.startsWith('- ')) {
        if (!currentList) {
          currentList = [];
          out.push({ type: 'ul', items: currentList });
        }
        currentList.push(line.replace(/^[–-]\s*/, ''));
      } else if (line.length > 0) {
        currentList = null;
        out.push({ type: 'p', items: [line] });
      }
    }
    return out;
  }, [text]);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
      {blocks.map((b, i) =>
        b.type === 'p' ? (
          <p key={i}>{b.items[0]}</p>
        ) : (
          <ul key={i} className="list-disc space-y-1 pl-5">
            {b.items.map((it, j) => (
              <li key={j}>{it}</li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}

export default function WhatIfFAQ() {
  const { language } = useLanguage();
  const lang: WhatIfLang = (['ru', 'en', 'th'] as const).includes(language as WhatIfLang)
    ? (language as WhatIfLang)
    : 'en';
  const meta = PAGE_META[lang];

  const [activeCategory, setActiveCategory] = useState<string>(WHAT_IF_FAQ[0].id);

  const handleCategoryClick = (id: string) => {
    setActiveCategory(id);
    trackEvent('faq_category_open', { category: id, language: lang });
    // Scroll the section into view
    const el = document.getElementById(`cat-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleQuestionOpen = (categoryId: string, itemId: string) => {
    trackEvent('faq_question_open', { id: itemId, category: categoryId, language: lang });
  };

  const handleEmergencyClick = (number: string) => {
    trackEvent('faq_emergency_click', { number });
  };

  return (
    <AppLayout>
      <SEOHead
        title={meta.title}
        description={meta.subtitle}
      />
      <PageContainer>
        <PageHeader title={meta.title} subtitle={meta.subtitle} />

        {/* Emergency strip */}
        <section
          aria-label={meta.emergency}
          className="mb-6 rounded-none border border-border bg-card p-4"
        >
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {meta.emergency}
          </div>
          <div className="flex flex-wrap gap-2">
            {EMERGENCY_NUMBERS.map((e) => (
              <a
                key={e.number}
                href={`tel:${e.number}`}
                onClick={() => handleEmergencyClick(e.number)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-sm border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Phone className="h-4 w-4 text-accent" aria-hidden />
                <span className="font-mono font-semibold">{e.number}</span>
                <span className="text-muted-foreground">
                  {EMERGENCY_LABELS[lang][e.labelKey]}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Category nav */}
        <nav
          aria-label="Categories"
          className="sticky top-0 z-10 -mx-4 mb-6 overflow-x-auto border-b border-border bg-background px-4 py-2"
        >
          <div className="flex gap-1">
            {WHAT_IF_FAQ.map((cat) => {
              const Icon = cat.icon;
              const isActive = cat.id === activeCategory;
              return (
                <Button
                  key={cat.id}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleCategoryClick(cat.id)}
                  className="min-h-[44px] shrink-0 gap-2"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  <span>{cat.title[lang]}</span>
                </Button>
              );
            })}
          </div>
        </nav>

        {/* Categories with accordions */}
        <div className="space-y-10">
          {WHAT_IF_FAQ.map((cat) => {
            const Icon = cat.icon;
            return (
              <section key={cat.id} id={`cat-${cat.id}`} aria-labelledby={`cat-${cat.id}-title`}>
                <h2
                  id={`cat-${cat.id}-title`}
                  className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground"
                >
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                  {cat.title[lang]}
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {cat.items.map((item) => (
                    <AccordionItem
                      key={item.id}
                      value={item.id}
                      id={`q-${item.id}`}
                      className="border-border"
                    >
                      <AccordionTrigger
                        onClick={() => handleQuestionOpen(cat.id, item.id)}
                        className="text-left text-sm font-medium hover:no-underline"
                      >
                        <span className="flex gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {item.id}
                          </span>
                          <span>{item.q[lang]}</span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <WhatIfAnswer text={item.a[lang]} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            );
          })}
        </div>
      </PageContainer>
    </AppLayout>
  );
}
