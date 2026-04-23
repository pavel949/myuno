import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { ROLE_META } from '@/lib/roleBlend';
import { SectionHead } from './SectionHead';

/**
 * PrimaryActions — the rule of three.
 * Three nominal-phrase entries that cover ~80% of intents.
 *
 * Each card carries a small role-color tag dot in the top-right corner
 * (per design package v5 · `S04_Home`) — visual proof that the entry was
 * surfaced for one of the user's active roles.
 */
const ACTIONS = [
  {
    id: 'housing',
    route: '/property',
    accentVar: '--cluster-arrive',
    titleRu: 'Поиск жилья',
    titleEn: 'Housing',
    subRu: 'Аренда, покупка, новостройки',
    subEn: 'Rent, buy, new developments',
  },
  {
    id: 'services',
    route: '/discover',
    accentVar: '--cluster-live',
    titleRu: 'Заказ услуги',
    titleEn: 'Order a service',
    subRu: 'Трансфер, клининг, доставка',
    subEn: 'Transfer, cleaning, delivery',
  },
  {
    id: 'documents',
    route: '/legal',
    accentVar: '--cluster-legal',
    titleRu: 'Документы и визы',
    titleEn: 'Documents & visas',
    subRu: 'TM30, разрешение на работу, LTR',
    subEn: 'TM30, work permit, LTR',
  },
] as const;

export function PrimaryActions() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { personas } = useUserPersonas();
  const isRu = language === 'ru';

  // Role tag dot color — primary persona drives accent across the row.
  const primary = personas[0];
  const dotColor = primary && ROLE_META[primary]?.color
    ? ROLE_META[primary].color
    : 'hsl(var(--primary))';

  return (
    <section className="px-4 pb-5">
      <SectionHead
        title={isRu ? 'Что вам нужно' : 'What you need'}
        meta={isRu ? 'Базовые сценарии' : 'Core scenarios'}
      />
      <div className="flex flex-col gap-2">
        {ACTIONS.map(a => (
          <button
            key={a.id}
            onClick={() => navigate(a.route)}
            className="relative text-left rounded-[14px] bg-card border border-border px-4 py-3.5 active:scale-[0.99] transition-transform overflow-hidden flex items-center gap-3 min-h-[44px]"
          >
            <div
              className="absolute top-3 bottom-3 left-0 w-0.5 rounded-none"
              style={{ background: `hsl(var(${a.accentVar}))` }}
            />
            {/* Role tag dot — top-right (S04 reference) */}
            <span
              className="absolute top-2 right-2 w-[5px] h-[5px] rounded-full"
              style={{ background: dotColor }}
              aria-hidden
            />
            <div className="flex-1 min-w-0">
              <div className="font-display text-[16px] font-semibold text-foreground tracking-[-0.01em]">
                {isRu ? a.titleRu : a.titleEn}
              </div>
              <div className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
                {isRu ? a.subRu : a.subEn}
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-40 shrink-0">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}
      </div>
    </section>
  );
}
