/**
 * HeroGreeting — насыщенный hero-блок главной.
 *
 * Заменяет плоский HomeTopBar на полноценный навигационный экран:
 *  - Glass TopBar поверх navy-градиента
 *  - Большое приветствие (Playfair) + контекст персоны
 *  - AI search bar (glass) — единая точка входа
 *  - Декоративный radial-gradient для «глубины»
 *
 * Соблюдает каноническую палитру: только navy + orange + cream.
 * Цвет здесь — не пёстрый «kid-tech», а контраст крупных surface'ов.
 */
import React from 'react';
import { Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPersonas, type UserPersona } from '@/hooks/useUserPersonas';
import { HomeTopBar } from './HomeTopBar';
import { APP_ROUTES } from '@/lib/config/routes';

interface HeroGreetingProps {
  personas: UserPersona[];
  onRoleSheetOpen: () => void;
  onAppDrawerOpen: () => void;
}

function getGreeting(isRu: boolean): string {
  const hour = new Date().getHours();
  if (hour < 5) return isRu ? 'Доброй ночи' : 'Good night';
  if (hour < 12) return isRu ? 'Доброе утро' : 'Good morning';
  if (hour < 18) return isRu ? 'Добрый день' : 'Good afternoon';
  return isRu ? 'Добрый вечер' : 'Good evening';
}

const PERSONA_LABEL: Record<string, { ru: string; en: string }> = {
  tourist:                { ru: 'Турист',          en: 'Tourist' },
  resident:               { ru: 'Резидент',        en: 'Resident' },
  family:                 { ru: 'Семья',           en: 'Family' },
  nomad:                  { ru: 'Цифровой кочевник', en: 'Digital nomad' },
  investor:               { ru: 'Инвестор',        en: 'Investor' },
  property_owner:         { ru: 'Владелец',        en: 'Property owner' },
  business:               { ru: 'Бизнес',          en: 'Business' },
  pet_owner:              { ru: 'С питомцем',      en: 'With pet' },
  relocation:             { ru: 'Релокация',       en: 'Relocating' },
  couple:                 { ru: 'Пара',            en: 'Couple' },
  active:                 { ru: 'Активный',        en: 'Active' },
  nightlife:              { ru: 'Nightlife',       en: 'Nightlife' },
  real_estate_developer:  { ru: 'Девелопер',       en: 'Developer' },
  local_services_provider:{ ru: 'Поставщик услуг', en: 'Service provider' },
};

export function HeroGreeting({ personas, onRoleSheetOpen, onAppDrawerOpen }: HeroGreetingProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ??
    (user?.email?.split('@')[0]) ??
    null;

  const persona = personas[0];
  const personaLabel = persona ? PERSONA_LABEL[persona] : null;

  return (
    <div className="relative overflow-hidden bg-primary text-primary-foreground">
      {/* Decorative radial — adds depth without breaking the canonical palette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 100% 0%, hsl(var(--brand-orange-400) / 0.18) 0%, transparent 55%), radial-gradient(80% 60% at 0% 100%, hsl(var(--brand-navy-700) / 0.45) 0%, transparent 60%)',
        }}
      />
      {/* Subtle grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-foreground)) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative px-4">
        <HomeTopBar
          personas={personas}
          onRoleSheetOpen={onRoleSheetOpen}
          onAppDrawerOpen={onAppDrawerOpen}
          variant="onNavy"
        />

        {/* Greeting block */}
        <div className="pt-2 pb-6">
          <h1 className="font-display text-[34px] leading-[1.05] font-semibold tracking-tight text-primary-foreground">
            {getGreeting(isRu)}
            {firstName && (
              <span className="block text-primary-foreground/85">
                {firstName}
              </span>
            )}
          </h1>

          {personaLabel && (
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 backdrop-blur-sm px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-primary-foreground/90">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: 'hsl(var(--brand-orange-400))' }}
                  aria-hidden
                />
                {isRu ? personaLabel.ru : personaLabel.en}
              </span>
            </div>
          )}
        </div>

        {/* Glass AI search */}
        <button
          type="button"
          onClick={() => navigate(APP_ROUTES.SEARCH)}
          className="group w-full flex items-center gap-3 rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 backdrop-blur-md px-4 py-3.5 mb-5 text-left transition-all hover:bg-primary-foreground/15 hover:border-primary-foreground/30 active:scale-[0.99]"
          aria-label={isRu ? 'Открыть поиск' : 'Open search'}
        >
          <span
            className="grid w-9 h-9 place-items-center rounded-xl flex-shrink-0"
            style={{
              backgroundColor: 'hsl(var(--brand-orange) / 0.95)',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            <Sparkles className="w-[18px] h-[18px]" strokeWidth={2} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-semibold text-primary-foreground truncate">
              {isRu ? 'Спросите AI-консьержа' : 'Ask the AI concierge'}
            </span>
            <span className="block text-[11px] text-primary-foreground/65 truncate">
              {isRu ? 'Жильё · услуги · документы — одной строкой' : 'Stay · services · docs — in one line'}
            </span>
          </span>
          <Search className="w-4 h-4 text-primary-foreground/60 flex-shrink-0" strokeWidth={2} />
        </button>
      </div>

      {/* Soft fade into page bg */}
      <div
        aria-hidden
        className="absolute left-0 right-0 -bottom-px h-6 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, transparent, hsl(var(--background)) 100%)',
        }}
      />
    </div>
  );
}
