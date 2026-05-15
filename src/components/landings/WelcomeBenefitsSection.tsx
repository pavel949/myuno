/**
 * WelcomeBenefitsSection — “Why one account is easier” block on WelcomeLanding.
 */
import React from 'react';
import { LayoutGrid, History, Bot } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingContainer, LandingSection } from './LandingPrimitives';

const BENEFIT_ICONS = [LayoutGrid, History, Bot] as const;

export function WelcomeBenefitsSection() {
  const { t } = useLanguage();

  const items = [
    {
      title: t('welcome.benefits.oneAccount.title'),
      body: t('welcome.benefits.oneAccount.body'),
      Icon: BENEFIT_ICONS[0],
    },
    {
      title: t('welcome.benefits.history.title'),
      body: t('welcome.benefits.history.body'),
      Icon: BENEFIT_ICONS[1],
    },
    {
      title: t('welcome.benefits.ai.title'),
      body: t('welcome.benefits.ai.body'),
      Icon: BENEFIT_ICONS[2],
    },
  ];

  return (
    <LandingSection>
      <LandingContainer className="py-14 sm:py-20">
        <div className="mb-8 space-y-2">
          <h2 className="font-display text-h2 font-normal tracking-tight text-foreground">
            {t('welcome.benefits.title')}
          </h2>
          <p className="max-w-2xl font-sans text-body-sm font-normal leading-relaxed text-muted-foreground">
            {t('welcome.benefits.lead')}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-none border border-border bg-border/50 md:grid-cols-3">
          {items.map(({ title, body, Icon }) => (
            <div key={title} className="bg-background p-6 sm:p-7">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-none border border-border bg-card">
                <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden />
              </div>
              <h3 className="font-sans text-h4 font-medium tracking-tight text-foreground">{title}</h3>
              <p className="mt-2 font-sans text-body-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </LandingContainer>
    </LandingSection>
  );
}
