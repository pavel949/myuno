/**
 * OwnerReferralCard — civic-style invite block for property owners and MC members.
 *
 * Reuses the existing `useReferral` hook (RPC `generate_referral_code`).
 * Sharp corners, mono code, single primary CTA — fits the GOV-grade tone.
 */
import React, { useState } from 'react';
import { Copy, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useReferral } from '@/hooks/useReferral';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface OwnerReferralCardProps {
  /** Optional override for the headline copy (e.g. when used inside /owner). */
  variant?: 'default' | 'compact';
  className?: string;
}

export function OwnerReferralCard({ variant = 'default', className }: OwnerReferralCardProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const { referralCode, isLoading, getShareLink, copyReferralCode, copyShareLink } = useReferral();
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  // Unauthenticated → CTA to sign up
  if (!user) {
    return (
      <div className={`border border-border bg-card p-6 ${className ?? ''}`}>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
          {isRu ? 'Программа приглашений' : 'Invite programme'}
        </p>
        <h3 className="text-[20px] font-serif font-semibold text-foreground leading-tight">
          {isRu ? 'Пригласите соседа — получите месяц PMS' : 'Invite a neighbour — get one month of PMS'}
        </h3>
        <p className="mt-2 text-[13.5px] text-muted-foreground leading-relaxed">
          {isRu
            ? 'Зарегистрируйтесь, чтобы получить личную ссылку-приглашение и начислять бонус за каждого приведённого собственника.'
            : 'Sign up to get a personal invite link and earn credit for every owner you bring in.'}
        </p>
        <Link
          to="/auth?redirect=/for-owners"
          className="mt-4 inline-flex items-center justify-center px-4 py-2.5 text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity min-h-[44px]"
        >
          {isRu ? 'Создать аккаунт' : 'Create account'}
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`border border-border bg-card p-6 space-y-3 ${className ?? ''}`}>
        <Skeleton className="h-4 w-32 rounded-none" />
        <Skeleton className="h-12 w-full rounded-none" />
        <Skeleton className="h-10 w-full rounded-none" />
      </div>
    );
  }

  const link = getShareLink();

  const handleCopyCode = async () => {
    const ok = await copyReferralCode();
    if (ok) {
      setCopied('code');
      toast.success(isRu ? 'Код скопирован' : 'Code copied');
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleShare = async () => {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: isRu ? 'myUNO — управление недвижимостью' : 'myUNO — property management',
          text: isRu
            ? `Регистрируйтесь по моей ссылке и получите месяц PMS: ${link}`
            : `Sign up with my link and get one month of PMS: ${link}`,
          url: link,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      const ok = await copyShareLink();
      if (ok) {
        setCopied('link');
        toast.success(isRu ? 'Ссылка скопирована' : 'Link copied');
        setTimeout(() => setCopied(null), 2000);
      }
    }
  };

  return (
    <div className={`border border-border bg-card p-6 ${className ?? ''}`}>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
        {isRu ? 'Ваша ссылка-приглашение' : 'Your invite link'}
      </p>
      {variant === 'default' && (
        <h3 className="text-[20px] font-serif font-semibold text-foreground leading-tight mb-4">
          {isRu ? 'Пригласите соседа — получите месяц PMS бесплатно' : 'Invite a neighbour — get one month of PMS free'}
        </h3>
      )}

      {referralCode && (
        <div className="flex items-stretch gap-0 mb-3">
          <div className="flex-1 px-4 py-3 border border-border bg-background font-mono text-[15px] tracking-[0.12em] text-foreground truncate">
            {link || referralCode}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-auto w-12 rounded-none border-l-0 shrink-0"
            onClick={handleCopyCode}
            aria-label={isRu ? 'Скопировать код' : 'Copy code'}
          >
            {copied === 'code' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      )}

      <Button
        type="button"
        onClick={handleShare}
        className="w-full rounded-none h-11 bg-primary hover:opacity-90"
      >
        <Share2 className="w-4 h-4 mr-2" strokeWidth={1.75} />
        {copied === 'link'
          ? (isRu ? 'Ссылка скопирована' : 'Link copied')
          : (isRu ? 'Поделиться ссылкой' : 'Share invite link')}
      </Button>

      <p className="mt-3 text-[11.5px] text-muted-foreground leading-relaxed">
        {isRu
          ? 'Бонус начисляется после оплаты первой подписки приглашённого. Подробнее — в личном кабинете программы рефералов.'
          : 'Credit applied after your invitee’s first paid subscription. See full terms in your referral dashboard.'}
      </p>
    </div>
  );
}
