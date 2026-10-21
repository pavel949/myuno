/** Compact account header. Interests are preferences, not the user's identity. */
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { HomeTopBar } from './HomeTopBar';
import { pickLang } from '@/lib/i18n/pickLang';

interface HeroGreetingProps {
  personas: UserPersona[];
  onRoleSheetOpen: () => void;
  onAppDrawerOpen: () => void;
}

function getGreeting(language: Language): string {
  const hour = new Date().getHours();
  if (hour < 5) return pickLang(language, { ru: 'Доброй ночи', en: 'Good night', th: 'สวัสดียามดึก' });
  if (hour < 12) return pickLang(language, { ru: 'Доброе утро', en: 'Good morning', th: 'สวัสดีตอนเช้า' });
  if (hour < 18) return pickLang(language, { ru: 'Добрый день', en: 'Good afternoon', th: 'สวัสดีตอนบ่าย' });
  return pickLang(language, { ru: 'Добрый вечер', en: 'Good evening', th: 'สวัสดีตอนเย็น' });
}

export function HeroGreeting({ personas, onRoleSheetOpen, onAppDrawerOpen }: HeroGreetingProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const name = user?.user_metadata?.full_name;
  const firstName = (typeof name === 'string' ? name.trim().split(/\s+/)[0] : '') || user?.email?.split('@')[0];

  return (
    <header className="px-4 pb-2">
      <HomeTopBar personas={personas} onRoleSheetOpen={onRoleSheetOpen} onAppDrawerOpen={onAppDrawerOpen} />
      <h1 className="break-words font-display text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
        {getGreeting(language)}{firstName ? `, ${firstName}` : ''}
      </h1>
    </header>
  );
}
