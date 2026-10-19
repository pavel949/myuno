/**
 * HeroGreeting — насыщенный hero-блок главной.
 *
 * Полноценный навигационный экран:
 *  - TopBar поверх navy-фона
 *  - Большое приветствие (font-display = Source Serif 4) + контекст персоны
 *  - AI search bar — единая точка входа
 *
 * DS 2.1: каноническая палитра navy + orange + cream, без glass/glow.
 */
import React from 'react';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { HomeTopBar } from './HomeTopBar';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';

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

const PERSONA_LABEL: Record<UserPersona, LangValues> = {
  tourist:                { ru: 'Турист',          en: 'Tourist', th: 'ท่องเที่ยวภูเก็ต' },
  resident:               { ru: 'Резидент',        en: 'Resident', th: 'อาศัยในภูเก็ต' },
  family:                 { ru: 'Семья',           en: 'Family', th: 'ครอบครัว' },
  nomad:                  { ru: 'Цифровой кочевник', en: 'Digital nomad', th: 'ทำงานพร้อมเดินทาง' },
  investor:               { ru: 'Инвестор',        en: 'Investor', th: 'นักลงทุน' },
  property_owner:         { ru: 'Владелец',        en: 'Property owner', th: 'เจ้าของอสังหาริมทรัพย์' },
  business:               { ru: 'Бизнес',          en: 'Business', th: 'ธุรกิจ' },
  pet_owner:              { ru: 'Питомцы',         en: 'Pets', th: 'สัตว์เลี้ยง' },
  relocation:             { ru: 'Релокация',       en: 'Relocating', th: 'ย้ายถิ่นฐาน' },
  couple:                 { ru: 'Пара',            en: 'Couple', th: 'คู่รัก' },
  active:                 { ru: 'Активный',        en: 'Active', th: 'กีฬาและกิจกรรม' },
  nightlife:              { ru: 'Ночная жизнь',    en: 'Nightlife', th: 'เที่ยวกลางคืน' },
  real_estate_developer:  { ru: 'Девелопер',       en: 'Developer', th: 'ผู้พัฒนาอสังหาริมทรัพย์' },
  local_services_provider:{ ru: 'Поставщик услуг', en: 'Service provider', th: 'ผู้ให้บริการท้องถิ่น' },
};

export function HeroGreeting({ personas, onRoleSheetOpen, onAppDrawerOpen }: HeroGreetingProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

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
            {getGreeting(language)}
            {firstName && (
              <span className="block break-words text-primary-foreground/85">
                {firstName}
              </span>
            )}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            {personaLabel && (
              <p className="min-w-0 text-xs leading-relaxed text-primary-foreground/80">
                {pickLang(language, { ru: 'В приоритете: ', en: 'Priority: ', th: 'ให้ความสำคัญกับ: ' })}
                <span className="font-medium text-primary-foreground">
                  {pickLang(language, personaLabel)}
                </span>
              </p>
            )}
            <button
              type="button"
              onClick={onRoleSheetOpen}
              aria-haspopup="dialog"
              className="-ml-2 inline-flex min-h-11 items-center gap-1.5 px-2 text-xs font-medium text-primary-foreground/90 underline decoration-primary-foreground/35 underline-offset-4 transition-colors hover:text-primary-foreground hover:decoration-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {pickLang(language, { ru: 'Настроить главную', en: 'Customize home', th: 'ปรับแต่งหน้าหลัก' })}
            </button>
          </div>
        </div>

        {/* Primary search entry */}
        <button
          type="button"
          onClick={() => navigate(APP_ROUTES.SEARCH)}
          className="group w-full flex items-center gap-3 rounded-none border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-3.5 mb-5 text-left transition-all hover:bg-primary-foreground/15 hover:border-primary-foreground/30 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
          aria-label={pickLang(language, { ru: 'Открыть поиск', en: 'Open search', th: 'เปิดการค้นหา' })}
        >
          <span
            className="grid w-9 h-9 place-items-center rounded-none flex-shrink-0"
            style={{
              backgroundColor: 'hsl(var(--brand-orange) / 0.95)',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            <Sparkles className="w-[18px] h-[18px]" strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-semibold leading-snug text-primary-foreground">
              {pickLang(language, { ru: 'Спросите — подскажем', en: 'Ask us anything', th: 'ถามเราได้ทุกเรื่อง' })}
            </span>
            <span className="block mt-1 text-xs leading-relaxed text-primary-foreground/80">
              {pickLang(language, { ru: 'Жильё, услуги, документы — своими словами', en: 'Homes, services, documents — in your own words', th: 'ค้นหาที่พัก บริการ และเอกสาร ด้วยคำพูดของคุณเอง' })}
            </span>
          </span>
          <Search className="w-4 h-4 text-primary-foreground/60 flex-shrink-0" strokeWidth={2} aria-hidden="true" />
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
