import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import {
  Plane, Home, Building2, TrendingUp, Baby, Heart, Music,
  Dumbbell, Briefcase, Laptop, PawPrint, Globe, HardHat, Store,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type UserPersona =
  | 'tourist' | 'resident' | 'property_owner' | 'investor'
  | 'family' | 'couple' | 'nightlife' | 'active' | 'business' | 'nomad' | 'pet_owner' | 'relocation'
  | 'real_estate_developer' | 'local_services_provider';

/** All DB-stored persona values (matches user_persona enum) */
export type DbPersona = UserPersona;

const GUEST_PERSONAS_KEY = 'myuno-guest-personas';
const GUEST_PERSONAS_CHANGED_EVENT = 'myuno-guest-personas-changed';

const PERSONA_ORDER_PREFIX = 'myuno-persona-order:';
const PERSONA_ORDER_CHANGED_EVENT = 'myuno-persona-order-changed';

/** Storage is a display preference, never a membership or access source. */
export function normalizePersonas(value: unknown): UserPersona[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((p): p is UserPersona => PERSONA_OPTIONS.includes(p)))];
}

function readPersonas(key: string): UserPersona[] {
  try {
    return normalizePersonas(JSON.parse(localStorage.getItem(key) ?? '[]'));
  } catch {
    return [];
  }
}

function persistGuestPersonas(next: UserPersona[], language: Language) {
  try {
    localStorage.setItem(GUEST_PERSONAS_KEY, JSON.stringify(next));
  } catch {
    toast.error(pickLang(language, { ru: 'Не удалось сохранить настройки на этом устройстве.', en: 'Preferences could not be saved on this device.', th: 'ไม่สามารถบันทึกการตั้งค่าบนอุปกรณ์นี้ได้' }));
  }
  window.dispatchEvent(new CustomEvent(GUEST_PERSONAS_CHANGED_EVENT, { detail: next }));
}

/** Saved order can only rearrange personas returned by the current account. */
export function applyPersonaOrder(membership: UserPersona[], order: UserPersona[]): UserPersona[] {
  const active = normalizePersonas(membership);
  return [
    ...normalizePersonas(order).filter(p => active.includes(p)),
    ...sortPersonasStable(active).filter(p => !order.includes(p)),
  ];
}

/** Deterministic fallback for memberships without a saved display priority. */
export function sortPersonasStable(list: UserPersona[]): UserPersona[] {
  return [...list].sort((a, b) => {
    const ia = PERSONA_OPTIONS.indexOf(a);
    const ib = PERSONA_OPTIONS.indexOf(b);
    const sa = ia === -1 ? 999 : ia;
    const sb = ib === -1 ? 999 : ib;
    return sa - sb;
  });
}

// Guest personas hook (localStorage-based)
function useGuestPersonas(language: Language) {
  const [personas, setPersonas] = useState<UserPersona[]>(() =>
    readPersonas(GUEST_PERSONAS_KEY),
  );

  useEffect(() => {
    const syncFromStorage = () => setPersonas(readPersonas(GUEST_PERSONAS_KEY));

    const handleStorage = (event: StorageEvent) => {
      if (event.key === GUEST_PERSONAS_KEY) syncFromStorage();
    };

    const handlePersonasChanged = (event: Event) => {
      setPersonas(normalizePersonas((event as CustomEvent).detail));
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(GUEST_PERSONAS_CHANGED_EVENT, handlePersonasChanged);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(GUEST_PERSONAS_CHANGED_EVENT, handlePersonasChanged);
    };
  }, []);

  const togglePersona = useCallback((persona: UserPersona) => {
    setPersonas(prev => {
      const newPersonas = normalizePersonas(
        prev.includes(persona) ? prev.filter(p => p !== persona) : [...prev, persona],
      );
      persistGuestPersonas(newPersonas, language);
      return newPersonas;
    });
  }, [language]);

  const setPersonasAll = useCallback((newPersonas: UserPersona[]) => {
    const sorted = normalizePersonas(newPersonas);
    setPersonas(sorted);
    persistGuestPersonas(sorted, language);
  }, [language]);

  return {
    personas,
    togglePersona,
    setPersonas: setPersonasAll,
    isLoading: false,
    isToggling: false,
  };
}

export function useUserPersonas() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const guestHook = useGuestPersonas(language);
  const actorIdRef = useRef(user?.id);
  actorIdRef.current = user?.id;

  const orderKey = `${PERSONA_ORDER_PREFIX}${user?.id ?? 'guest'}`;
  const [orderState, setOrderState] = useState(() => ({ key: orderKey, order: readPersonas(orderKey) }));
  // Never expose the previous account's order during the render before effects.
  const displayOrder = orderState.key === orderKey ? orderState.order : readPersonas(orderKey);

  useEffect(() => {
    setOrderState({ key: orderKey, order: readPersonas(orderKey) });
    const sync = (event: Event) => {
      if (event instanceof StorageEvent) {
        if (event.key === orderKey || event.key === null) {
          setOrderState({ key: orderKey, order: readPersonas(orderKey) });
        }
      } else {
        const detail = (event as CustomEvent<{ key: string; order: UserPersona[] }>).detail;
        if (detail?.key === orderKey) setOrderState({ key: orderKey, order: normalizePersonas(detail.order) });
      }
    };
    window.addEventListener('storage', sync);
    window.addEventListener(PERSONA_ORDER_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(PERSONA_ORDER_CHANGED_EVENT, sync);
    };
  }, [orderKey]);

  const saveDisplayOrder = (order: UserPersona[], actorId: string) => {
    const key = `${PERSONA_ORDER_PREFIX}${actorId}`;
    if (actorIdRef.current === actorId) setOrderState({ key, order });
    try {
      localStorage.setItem(key, JSON.stringify(order));
    } catch {
      if (actorIdRef.current === actorId) toast.error(pickLang(language, { ru: 'Порядок изменён на время сеанса. Не удалось сохранить его на устройстве.', en: 'Order changed for this session. It could not be saved on this device.', th: 'เปลี่ยนลำดับสำหรับครั้งนี้แล้ว แต่ไม่สามารถบันทึกไว้บนอุปกรณ์นี้ได้' }));
    }
    window.dispatchEvent(new CustomEvent(PERSONA_ORDER_CHANGED_EVENT, { detail: { key, order } }));
  };

  const queryKey = ['user-personas', user?.id];

  const { data: dbPersonas = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async (): Promise<UserPersona[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_personas')
        .select('persona')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (error) throw error;
      const raw = (data || []).map(r => r.persona as UserPersona);
      return sortPersonasStable(raw);
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  const togglePersonaMutation = useMutation({
    mutationFn: async ({ persona, userId, isActive }: { persona: UserPersona; userId: string; isActive: boolean }) => {
      const { data: live, error: liveError } = await supabase.auth.getUser();
      if (liveError || live.user?.id !== userId || actorIdRef.current !== userId) {
        throw new Error(pickLang(language, { ru: 'Сессия изменилась. Откройте настройки снова.', en: 'Your session changed. Open preferences again.', th: 'เซสชันของคุณเปลี่ยนไป โปรดเปิดการตั้งค่าอีกครั้ง' }));
      }
      if (isActive) {
        const { error } = await supabase.from('user_personas').delete()
          .eq('user_id', userId).eq('persona', persona as DbPersona);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_personas').upsert(
          { user_id: userId, persona: persona as DbPersona, is_active: true },
          { onConflict: 'user_id,persona' },
        );
        if (error) throw error;
      }
      return { persona, userId };
    },
    onMutate: async ({ persona, userId }) => {
      const key = ['user-personas', userId];
      if (actorIdRef.current !== userId) throw new Error('Session changed');
      await queryClient.cancelQueries({ queryKey: key });
      if (actorIdRef.current !== userId) throw new Error('Session changed');
      const previousPersonas = queryClient.getQueryData<UserPersona[]>(key);
      const previousOrder = [...displayOrder];
      const ordered = applyPersonaOrder(previousPersonas ?? [], previousOrder);
      const next = ordered.includes(persona) ? ordered.filter(p => p !== persona) : [...ordered, persona];
      saveDisplayOrder(next, userId);
      queryClient.setQueryData<UserPersona[]>(key, next);
      return { previousPersonas, previousOrder, key, userId };
    },
    onError: (err, { persona, userId }, context) => {
      if (context) {
        if (context.previousPersonas) queryClient.setQueryData(context.key, context.previousPersonas);
        saveDisplayOrder(context.previousOrder, context.userId);
      }
      if (actorIdRef.current !== userId) return;
      const pgError = err as { message?: string; code?: string; details?: string };
      const code = pgError.code ? ` [${pgError.code}]` : '';
      console.error('togglePersona', { persona, err });
      toast.error(`${pickLang(language, { ru: 'Не удалось обновить настройки', en: 'Preferences could not be updated', th: 'ไม่สามารถอัปเดตการตั้งค่าได้' })}${code}: ${pgError.message ?? pickLang(language, { ru: 'Неизвестная ошибка', en: 'Unknown error', th: 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ' })}`);
    },
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-personas', userId] });
    },
  });

  const { mutate: migrateGuest, isPending: isMigrating, isError: migrationFailed, variables: migrationVariables } = useMutation({
    mutationFn: async ({ personas, userId }: { personas: UserPersona[]; userId: string }) => {
      const { data: live, error: liveError } = await supabase.auth.getUser();
      if (liveError || live.user?.id !== userId || actorIdRef.current !== userId) throw new Error('Session changed');
      const { error } = await supabase.from('user_personas').upsert(
        personas.map(persona => ({ user_id: userId, persona: persona as DbPersona, is_active: true })),
        { onConflict: 'user_id,persona' },
      );
      if (error) throw error;
      return { personas, userId };
    },
    onSuccess: ({ personas, userId }) => {
      // Mutation callbacks may run after another account has signed in.
      saveDisplayOrder(personas, userId);
      if (JSON.stringify(readPersonas(GUEST_PERSONAS_KEY)) === JSON.stringify(personas)) {
        try { localStorage.removeItem(GUEST_PERSONAS_KEY); } catch { /* Storage may be blocked. */ }
      }
      queryClient.invalidateQueries({ queryKey: ['user-personas', userId] });
    },
    onError: (_error, { userId }) => {
      if (actorIdRef.current === userId) toast.error(pickLang(language, { ru: 'Не удалось перенести настройки. Попробуйте позже.', en: 'Preferences could not be transferred. Try again later.', th: 'ไม่สามารถย้ายการตั้งค่าได้ โปรดลองอีกครั้งภายหลัง' }));
    },
  });

  // Wait for the authoritative membership query before migrating guest choices.
  // Additive upsert cannot erase existing preferences during a login race.
  useEffect(() => {
    if (!user?.id || isLoading || error || isMigrating || (migrationFailed && migrationVariables?.userId === user.id)) return;
    if (dbPersonas.length > 0) {
      try { localStorage.removeItem(GUEST_PERSONAS_KEY); } catch { /* Storage may be blocked. */ }
      return;
    }
    const guestPersonas = readPersonas(GUEST_PERSONAS_KEY);
    if (guestPersonas.length > 0) migrateGuest({ personas: guestPersonas, userId: user.id });
  }, [user?.id, isLoading, error, dbPersonas.length, isMigrating, migrationFailed, migrationVariables?.userId, migrateGuest]);

  const orderedPersonas = applyPersonaOrder(dbPersonas, displayOrder);
  const reorderPersonas = (requested: UserPersona[]) => {
    if (user?.id && actorIdRef.current === user.id) saveDisplayOrder(applyPersonaOrder(dbPersonas, requested), user.id);
  };

  if (!user) {
    return {
      personas: guestHook.personas,
      effectivePersonas: effective(guestHook.personas),
      isLoading: false,
      error: null,
      isAuthenticated: false,
      togglePersona: guestHook.togglePersona,
      setPersonas: guestHook.setPersonas,
      isToggling: false,
      isSetting: false,
    };
  }

  return {
    personas: orderedPersonas,
    effectivePersonas: effective(orderedPersonas),
    isLoading,
    error,
    isAuthenticated: true,
    togglePersona: (persona: UserPersona) => togglePersonaMutation.mutate({ persona, userId: user.id, isActive: dbPersonas.includes(persona) }),
    setPersonas: reorderPersonas,
    isToggling: togglePersonaMutation.isPending,
    isSetting: isMigrating,
  };
}

/**
 * Resolve a role stack for content filtering / role-aware ranking.
 * - Role editors should keep using `personas` (raw, may be empty).
 * - Anywhere that asks "what does this user see?" uses `effectivePersonas`
 *   so a fresh-auth user with no persona row still gets the tourist feed
 *   instead of a blank page.
 */
function effective(personas: UserPersona[]): UserPersona[] {
  return personas.length > 0 ? personas : (['tourist'] as UserPersona[]);
}

export function hasPersona(personas: UserPersona[], persona: UserPersona): boolean {
  return personas.includes(persona);
}

/** Core roles + B2B — shown first in hero (less scroll, clearer mental model) */
export const PERSONA_OPTIONS_PRIMARY: UserPersona[] = [
  'tourist', 'resident', 'relocation', 'property_owner', 'investor',
  'real_estate_developer', 'local_services_provider',
];

/** Lifestyle / trip style — stacked below primary in hero */
export const PERSONA_OPTIONS_LIFESTYLE: UserPersona[] = [
  'pet_owner', 'family', 'couple', 'nightlife', 'active', 'business', 'nomad',
];

/** Full persona order (settings, analytics, migrations) */
export const PERSONA_OPTIONS: UserPersona[] = [
  ...PERSONA_OPTIONS_PRIMARY,
  ...PERSONA_OPTIONS_LIFESTYLE,
];

/** Maps the icon string from PERSONA_INFO to the actual Lucide component */
export const PERSONA_ICONS: Record<string, LucideIcon> = {
  Plane, Home, Building2, TrendingUp, Baby, Heart, Music,
  Dumbbell, Briefcase, Laptop, PawPrint, Globe, HardHat, Store,
};

export const PERSONA_INFO: Record<UserPersona, {
  labelEn: string;
  labelRu: string;
  descEn: string;
  descRu: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  tourist: {
    labelEn: 'Tourist', labelRu: 'Турист',
    descEn: 'Trips, tours, transfers', descRu: 'Поездки, туры, трансферы',
    icon: 'Plane', color: 'text-primary', bgColor: 'bg-primary/10',
  },
  resident: {
    labelEn: 'Resident', labelRu: 'Резидент',
    descEn: 'Already living here: home, health, routine', descRu: 'Уже живу: быт, здоровье, регулярные сервисы',
    icon: 'Home', color: 'text-success', bgColor: 'bg-success/10',
  },
  property_owner: {
    labelEn: 'Owner', labelRu: 'Собственник',
    descEn: 'My property & services', descRu: 'Мой объект и сервисы',
    icon: 'Building2', color: 'text-accent', bgColor: 'bg-accent/10',
  },
  investor: {
    labelEn: 'Investor', labelRu: 'Инвестор',
    descEn: 'Capital, off-plan, buy-side plus legal, banking, and diligence tools',
    descRu: 'Капитал, новостройки, покупка и сервисы сделки: право, банки, аналитика',
    icon: 'TrendingUp', color: 'text-primary', bgColor: 'bg-primary/10',
  },
  family: {
    labelEn: 'Family', labelRu: 'Семья',
    descEn: 'Schools, doctors, kids', descRu: 'Школы, врачи, дети',
    icon: 'Baby', color: 'text-accent', bgColor: 'bg-accent/10',
  },
  couple: {
    labelEn: 'Couple', labelRu: 'Пара',
    descEn: 'Romance, spa, dining', descRu: 'Романтика, спа, рестораны',
    icon: 'Heart', color: 'text-accent', bgColor: 'bg-accent/10',
  },
  nightlife: {
    labelEn: 'Nightlife', labelRu: 'Тусовщик',
    descEn: 'Clubs, parties, VIP', descRu: 'Клубы, вечеринки, VIP',
    icon: 'Music', color: 'text-primary', bgColor: 'bg-primary/10',
  },
  active: {
    labelEn: 'Active', labelRu: 'Спортсмен',
    descEn: 'Fitness, surf, MMA', descRu: 'Фитнес, серфинг, MMA',
    icon: 'Dumbbell', color: 'text-accent', bgColor: 'bg-accent/10',
  },
  business: {
    labelEn: 'Business', labelRu: 'Бизнес',
    descEn: 'Incorporation, workspace, insurance, and day-to-day ops for your company',
    descRu: 'Компания, офис и коворкинг, страховка и сервисы для эксплуатации бизнеса',
    icon: 'Briefcase', color: 'text-muted-foreground', bgColor: 'bg-muted',
  },
  nomad: {
    labelEn: 'Nomad', labelRu: 'Номад',
    descEn: 'Connectivity, long stay, work-friendly cafés', descRu: 'Связь, долгий визит, кафе для работы',
    icon: 'Laptop', color: 'text-success', bgColor: 'bg-success/10',
  },
  pet_owner: {
    labelEn: 'Pet Owner', labelRu: 'С питомцем',
    descEn: 'Vet, grooming, hotels', descRu: 'Ветеринар, груминг, отели',
    icon: 'PawPrint', color: 'text-accent', bgColor: 'bg-accent/10',
  },
  relocation: {
    labelEn: 'Relocating', labelRu: 'Переезд',
    descEn: 'Moving checklist: visa, home, schools from day one', descRu: 'Переезд с нуля: виза, жильё, школы, дорожная карта',
    icon: 'Globe', color: 'text-primary', bgColor: 'bg-primary/10',
  },
  real_estate_developer: {
    labelEn: 'Developer', labelRu: 'Застройщик',
    descEn: 'Projects, leads, newbuilds', descRu: 'Проекты, лиды, новостройки',
    icon: 'HardHat', color: 'text-primary', bgColor: 'bg-primary/10',
  },
  local_services_provider: {
    labelEn: 'Service provider', labelRu: 'Поставщик услуг',
    descEn: 'Join marketplace & payouts', descRu: 'Маркетплейс и выплаты',
    icon: 'Store', color: 'text-success', bgColor: 'bg-success/10',
  },
};
