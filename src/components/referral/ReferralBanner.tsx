/**
 * Compact referral banner for the home page — shows only when user is logged in.
 */
import React from 'react';
import { Gift, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useReferral } from '@/hooks/useReferral';

export function ReferralBanner() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { referralCode, settings } = useReferral();
  const isRu = language === 'ru';

  if (!user || !referralCode) return null;

  const bonus = settings?.referrer_bonus || 50;

  return (
    <button
      onClick={() => navigate('/profile/referral')}
      className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all group"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Gift className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold text-foreground">
          {isRu ? `Пригласите друга — получите ฿${bonus}` : `Invite a friend — earn ฿${bonus}`}
        </p>
        <p className="text-xs text-muted-foreground">
          {isRu ? `Ваш код: ${referralCode}` : `Your code: ${referralCode}`}
        </p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
    </button>
  );
}
