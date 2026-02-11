/**
 * LifecycleSmartTip — shows contextual, lifecycle-aware tips based on user's
 * life situation, time since registration, and activity patterns.
 * 
 * Examples:
 * - New user (< 7 days): "Set up your documents for quick visa tracking"
 * - Active tourist: "Don't miss the Sunday Walking Street market"
 * - Resident: "Your 90-day report is due soon"
 * - Owner: "3 new booking requests this week"
 */
import React, { useMemo } from 'react';
import { Lightbulb, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { useUserContext } from '@/hooks/useUserContext';
import { useState, useCallback } from 'react';

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
    { id: 'living-gym', titleRu: 'Абонемент в зал', titleEn: 'Gym membership', descRu: 'Сравните лучшие залы рядом', descEn: 'Compare the best gyms nearby', path: '/gyms', icon: '💪' },
    { id: 'living-market', titleRu: 'Рынки и доставка', titleEn: 'Markets & delivery', descRu: 'Фрукты и продукты с доставкой', descEn: 'Fresh fruits & groceries delivered', path: '/discover', icon: '🛒' },
  ],
  property: [
    { id: 'prop-listings', titleRu: 'Ваши объекты', titleEn: 'Your properties', descRu: 'Проверьте статус бронирований', descEn: 'Check your booking status', path: '/owner', icon: '🏠' },
    { id: 'prop-income', titleRu: 'Доход за месяц', titleEn: 'Monthly income', descRu: 'Отслеживайте доходность', descEn: 'Track your rental yield', path: '/owner', icon: '📊' },
  ],
  default: [
    { id: 'def-explore', titleRu: 'Исследуйте остров', titleEn: 'Explore the island', descRu: '100+ проверенных мест и сервисов', descEn: '100+ verified places & services', path: '/explore', icon: '🌴' },
    { id: 'def-referral', titleRu: 'Пригласите друга', titleEn: 'Invite a friend', descRu: 'Получите бонус за каждое приглашение', descEn: 'Earn a bonus for each invite', path: '/profile/referral', icon: '🎁' },
  ],
};

export function LifecycleSmartTip() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { activeCode } = useLifeSituationContext();
  const { activeRole } = useUserContext();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const [dismissedTips, setDismissedTips] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('myuno-dismissed-tips');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const dismiss = useCallback((tipId: string) => {
    setDismissedTips(prev => {
      const next = new Set(prev);
      next.add(tipId);
      localStorage.setItem('myuno-dismissed-tips', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const situationKey = useMemo(() => {
    if (activeCode) return activeCode;
    if (activeRole === 'owner') return 'property';
    return 'default';
  }, [activeCode, activeRole]);

  const tip = useMemo(() => {
    const tips = TIPS_BY_SITUATION[situationKey] || TIPS_BY_SITUATION.default;
    const available = tips.filter(t => !dismissedTips.has(t.id));
    if (available.length === 0) return null;
    // Rotate by day of month
    return available[new Date().getDate() % available.length];
  }, [situationKey, dismissedTips]);

  if (!tip) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/10 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0">
          {tip.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {isRu ? tip.titleRu : tip.titleEn}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRu ? tip.descRu : tip.descEn}
              </p>
            </div>
            <button
              onClick={() => dismiss(tip.id)}
              className="p-1 rounded-full hover:bg-muted transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <button
            onClick={() => navigate(tip.path)}
            className="flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:underline"
          >
            {isRu ? 'Подробнее' : 'Learn more'}
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
