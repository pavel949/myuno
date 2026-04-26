/**
 * HomeContextChips — contextual quick-action chips shown under HomeTopBar.
 *
 * Phase 2 of nav refactor. Surfaces 4-6 persona-aware shortcuts so users
 * reach their most-likely next destination in one tap, without scrolling.
 *
 * Examples by persona stack:
 *   tourist     → Find a service · Restaurants · SIM card · Transfer
 *   resident    → Cleaning · Medical · Schools · My bookings
 *   owner       → My property · Bookings · Finance · Tasks
 *   investor    → New developments · Resale · Invest hub
 */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass, ShoppingBag, Plane, Sparkles, Stethoscope,
  Building2, CalendarDays, Wallet, ClipboardList, TrendingUp,
  Smartphone, Utensils, GraduationCap, Home as HomeIcon,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { NavChips, type NavChipItem } from '@/components/nav/NavChips';
import { APP_ROUTES } from '@/lib/config/routes';
import type { UserPersona } from '@/hooks/useUserPersonas';

interface ContextChip extends NavChipItem {
  path: string;
}

interface HomeContextChipsProps {
  personas: UserPersona[];
  /** Background tone — pass `onNavy` when the strip sits on the brand band. */
  variant?: 'default' | 'onNavy';
}

function buildChips(personas: UserPersona[], isRu: boolean): ContextChip[] {
  const has = (p: UserPersona) => personas.includes(p);
  const chips: ContextChip[] = [];

  // Persona-specific entries (high intent, ordered by signal strength)
  if (has('property_owner' as UserPersona)) {
    chips.push(
      { id: 'my-prop', icon: Building2, label: isRu ? 'Мой объект' : 'My property', path: '/my-property' },
      { id: 'bookings', icon: CalendarDays, label: isRu ? 'Брони' : 'Bookings', path: APP_ROUTES.MC_BOOKINGS_LIST ?? '/mc/bookings' },
      { id: 'finance', icon: Wallet, label: isRu ? 'Финансы' : 'Finance', path: APP_ROUTES.MC_FINANCE },
      { id: 'tasks', icon: ClipboardList, label: isRu ? 'Задачи' : 'Tasks', path: APP_ROUTES.MC_TASKS },
    );
  }

  if (has('investor' as UserPersona)) {
    chips.push(
      { id: 'newbuilds', icon: TrendingUp, label: isRu ? 'Новостройки' : 'New builds', path: '/newbuilds' },
      { id: 'invest', icon: Wallet, label: isRu ? 'Инвестиции' : 'Invest', path: APP_ROUTES.INVEST_DASHBOARD },
    );
  }

  if (has('tourist' as UserPersona)) {
    chips.push(
      { id: 'transfer', icon: Plane, label: isRu ? 'Трансфер' : 'Transfer', path: APP_ROUTES.AIRPORT_TRANSFER },
      { id: 'sim', icon: Smartphone, label: isRu ? 'SIM' : 'SIM', path: APP_ROUTES.SIM_START },
      { id: 'restaurants', icon: Utensils, label: isRu ? 'Рестораны' : 'Restaurants', path: APP_ROUTES.RESTAURANTS },
    );
  }

  if (has('resident' as UserPersona)) {
    chips.push(
      { id: 'cleaning', icon: Sparkles, label: isRu ? 'Уборка' : 'Cleaning', path: APP_ROUTES.CLEANING },
      { id: 'medical', icon: Stethoscope, label: isRu ? 'Медицина' : 'Medical', path: APP_ROUTES.MEDICAL },
    );
  }

  if (has('family' as UserPersona)) {
    chips.push(
      { id: 'schools', icon: GraduationCap, label: isRu ? 'Школы' : 'Schools', path: '/school-finder' },
    );
  }

  // Always-on baseline (deduped, capped to 6)
  const baseline: ContextChip[] = [
    { id: 'discover', icon: Compass, label: isRu ? 'Найти услугу' : 'Find a service', path: APP_ROUTES.DISCOVER },
    { id: 'market', icon: ShoppingBag, label: isRu ? 'Маркет' : 'Market', path: APP_ROUTES.MARKET },
    { id: 'mybookings', icon: HomeIcon, label: isRu ? 'Мои брони' : 'My bookings', path: '/bookings' },
  ];

  for (const c of baseline) {
    if (!chips.some((x) => x.id === c.id)) chips.push(c);
    if (chips.length >= 6) break;
  }

  return chips.slice(0, 6);
}

export function HomeContextChips({ personas, variant = 'default' }: HomeContextChipsProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const chips = useMemo(() => buildChips(personas, isRu), [personas, isRu]);

  return (
    <div className="px-4 pb-2">
      <NavChips
        items={chips}
        onChange={(id) => {
          const chip = chips.find((c) => c.id === id);
          if (chip) navigate(chip.path);
        }}
        ariaLabel={isRu ? 'Быстрые действия' : 'Quick actions'}
        tone={variant === 'onNavy' ? 'onNavy' : 'default'}
      />
    </div>
  );
}
