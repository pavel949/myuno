/**
 * LifecycleSmartTip — contextual, lifecycle-aware tips.
 * No marketing/referral content — only genuinely useful advice.
 */
import React, { useMemo, useState, useCallback } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { useUserContext } from '@/hooks/useUserContext';
import { useUserPersonas } from '@/hooks/useUserPersonas';

interface Tip {
  id: string;
  titleRu: string;
  titleEn: string;
  descRu: string;
  descEn: string;
  path: string;
  icon: string;
}

const TIPS_BY_SITUATION: Record<string, Tip[]> = {
  arrival: [
    { id: 'arrival-docs', titleRu: 'Загрузите документы', titleEn: 'Upload your documents', descRu: 'Получайте напоминания об истечении визы и паспорта', descEn: 'Get reminders for visa & passport expiry', path: '/profile/documents', icon: '📋' },
    { id: 'arrival-transfer', titleRu: 'Закажите трансфер', titleEn: 'Book your transfer', descRu: 'Из аэропорта до отеля без стресса', descEn: 'Airport to hotel, stress-free', path: '/airport-transfer', icon: '🚐' },
    { id: 'arrival-sim', titleRu: 'SIM-карта и интернет', titleEn: 'SIM card & internet', descRu: 'Оставайтесь на связи с первого дня', descEn: 'Stay connected from day one', path: '/discover', icon: '📱' },
  ],
  living: [
    { id: 'living-90day', titleRu: '90-дневный отчёт', titleEn: '90-day report', descRu: 'Отслеживайте сроки иммиграционных отчётов', descEn: 'Track your immigration report deadlines', path: '/profile/documents', icon: '📄' },
    { id: 'living-gym', titleRu: 'Абонемент в зал', titleEn: 'Gym membership', descRu: 'Сравните проверенные залы рядом', descEn: 'Compare verified gyms nearby', path: '/gyms', icon: '💪' },
    { id: 'living-market', titleRu: 'Рынки и доставка', titleEn: 'Markets & delivery', descRu: 'Фрукты и продукты с доставкой', descEn: 'Fresh fruits & groceries delivered', path: '/market', icon: '🛒' },
  ],
  property: [
    { id: 'prop-listings', titleRu: 'Ваши объекты', titleEn: 'Your properties', descRu: 'Проверьте статус бронирований', descEn: 'Check your booking status', path: '/owner', icon: '🏠' },
    { id: 'prop-income', titleRu: 'Доход за месяц', titleEn: 'Monthly income', descRu: 'Отслеживайте доходность', descEn: 'Track your rental yield', path: '/owner', icon: '📊' },
  ],
  leisure: [
    { id: 'leisure-sunset', titleRu: 'Закат на яхте', titleEn: 'Sunset cruise', descRu: 'Закатные прогулки по Андаманскому морю', descEn: 'Sunset tours on the Andaman Sea', path: '/yachts', icon: '🌅' },
    { id: 'leisure-food', titleRu: 'Рестораны на вечер', titleEn: 'Dinner spots', descRu: 'Подборка проверенных мест для ужина', descEn: 'Curated dining spots', path: '/restaurants', icon: '🍽️' },
  ],
  default_tourist: [
    { id: 'tourist-explore', titleRu: 'Чем заняться сегодня?', titleEn: 'What to do today?', descRu: 'Экскурсии, яхты и активности рядом', descEn: 'Tours, yachts & activities nearby', path: '/experiences', icon: '🧭' },
    { id: 'tourist-transport', titleRu: 'Аренда транспорта', titleEn: 'Rent transport', descRu: 'Байки и авто — сравните цены', descEn: 'Bikes & cars — compare prices', path: '/transport', icon: '🛵' },
    { id: 'tourist-beauty', titleRu: 'SPA и массаж', titleEn: 'SPA & massage', descRu: 'Расслабьтесь — проверенные салоны острова', descEn: 'Relax — verified island salons', path: '/beauty', icon: '💆' },
  ],
  default_resident: [
    { id: 'res-visa', titleRu: 'Визовые вопросы', titleEn: 'Visa matters', descRu: 'Проверенные юристы для продления визы', descEn: 'Verified lawyers for visa extension', path: '/legal', icon: '📑' },
    { id: 'res-school', titleRu: 'Школы и курсы', titleEn: 'Schools & courses', descRu: 'Образование для детей и взрослых', descEn: 'Education for kids & adults', path: '/education', icon: '📚' },
    { id: 'res-clinic', titleRu: 'Клиники рядом', titleEn: 'Clinics nearby', descRu: 'Проверенные врачи с отзывами', descEn: 'Verified doctors with reviews', path: '/medical', icon: '🏥' },
  ],
  family: [
    { id: 'fam-school', titleRu: 'Школы и детсады', titleEn: 'Schools & kindergartens', descRu: 'Международные школы с английской программой', descEn: 'International schools with English programs', path: '/education', icon: '🎒' },
    { id: 'fam-pediatr', titleRu: 'Детский врач', titleEn: 'Pediatrician', descRu: 'Проверенные педиатры с отзывами', descEn: 'Verified pediatricians with reviews', path: '/medical', icon: '👶' },
    { id: 'fam-restaurant', titleRu: 'Семейные рестораны', titleEn: 'Family restaurants', descRu: 'Места с детскими меню и площадками', descEn: 'Places with kids menus & play areas', path: '/restaurants', icon: '🍕' },
  ],
  digital_nomad: [
    { id: 'dn-cowork', titleRu: 'Коворкинги', titleEn: 'Coworking spaces', descRu: 'Лучшие рабочие пространства с быстрым Wi-Fi', descEn: 'Top workspaces with fast Wi-Fi', path: '/discover', icon: '💻' },
    { id: 'dn-internet', titleRu: 'Быстрый интернет', titleEn: 'Fast internet spots', descRu: 'Кафе и залы с интернетом от 100 Мбит', descEn: 'Cafés & lounges with 100+ Mbps', path: '/discover', icon: '📶' },
    { id: 'dn-visa', titleRu: 'Визаран и продление', titleEn: 'Visa run & extension', descRu: 'Проверенные агенты для виз и border-run', descEn: 'Verified agents for visas & border runs', path: '/legal', icon: '🛂' },
  ],
  default: [
    { id: 'def-explore', titleRu: 'Исследуйте остров', titleEn: 'Explore the island', descRu: '100+ проверенных мест и сервисов', descEn: '100+ verified places & services', path: '/discover', icon: '🌴' },
    { id: 'def-flowers', titleRu: 'Доставка цветов', titleEn: 'Flower delivery', descRu: 'Свежие букеты с доставкой в тот же день', descEn: 'Fresh bouquets, same-day delivery', path: '/flowers', icon: '💐' },
  ],
};

export function LifecycleSmartTip() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { activeCode } = useLifeSituationContext();
  const { activeRole } = useUserContext();
  const { personas } = useUserPersonas();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const TTL_MS = 14 * 24 * 60 * 60 * 1000;

  const [dismissedTips, setDismissedTips] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('myuno-dismissed-tips-v2');
      if (!saved) return new Set();
      const parsed: Record<string, number> = JSON.parse(saved);
      const now = Date.now();
      const valid = Object.entries(parsed)
        .filter(([, exp]) => exp > now)
        .map(([id]) => id);
      return new Set(valid);
    } catch { return new Set(); }
  });

  const dismiss = useCallback((tipId: string) => {
    setDismissedTips(prev => {
      const next = new Set(prev);
      next.add(tipId);
      try {
        const existing: Record<string, number> = (() => {
          const s = localStorage.getItem('myuno-dismissed-tips-v2');
          return s ? JSON.parse(s) : {};
        })();
        existing[tipId] = Date.now() + TTL_MS;
        const now = Date.now();
        const pruned = Object.fromEntries(
          Object.entries(existing).filter(([, exp]) => exp > now)
        );
        localStorage.setItem('myuno-dismissed-tips-v2', JSON.stringify(pruned));
      } catch { /* ignore */ }
      return next;
    });
  }, [TTL_MS]);

  const situationKey = useMemo(() => {
    if (activeCode) return activeCode;
    if (activeRole === 'owner') return 'property';
    if (personas.includes('tourist')) return 'default_tourist';
    if (personas.includes('resident')) return 'default_resident';
    return 'default';
  }, [activeCode, activeRole, personas]);

  const tip = useMemo(() => {
    const tips = TIPS_BY_SITUATION[situationKey] || TIPS_BY_SITUATION.default;
    const available = tips.filter(t => !dismissedTips.has(t.id));
    if (available.length === 0) return null;
    return available[new Date().getDate() % available.length];
  }, [situationKey, dismissedTips]);

  if (!tip) return null;

  return (
    <div className="rounded-2xl bg-card border border-primary/15 shadow-[var(--shadow-card)] overflow-hidden">
      {/* Subtle gradient accent bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
      
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/8 border border-primary/10 flex items-center justify-center text-lg shrink-0">
            {tip.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {isRu ? tip.titleRu : tip.titleEn}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {isRu ? tip.descRu : tip.descEn}
                </p>
              </div>
              <button
                onClick={() => dismiss(tip.id)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0 -mt-0.5"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            <button
              onClick={() => navigate(tip.path)}
              className="inline-flex items-center gap-1 mt-2.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              {isRu ? 'Подробнее' : 'Learn more'}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
