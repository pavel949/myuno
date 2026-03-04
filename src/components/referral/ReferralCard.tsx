import React, { useState } from 'react';
import { Gift, Copy, Share2, Check, Users, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReferral } from '@/hooks/useReferral';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export function ReferralCard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { referralCode, stats, settings, isLoading, copyReferralCode, copyShareLink, getShareLink } = useReferral();
  const isRu = language === 'ru';
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  if (!user) return null;

  const handleCopyCode = async () => {
    const ok = await copyReferralCode();
    if (ok) {
      setCopied('code');
      toast.success(isRu ? 'Код скопирован!' : 'Code copied!');
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleShare = async () => {
    const link = getShareLink();
    if (!link) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: isRu ? 'Присоединяйтесь к myUNO' : 'Join myUNO',
          text: isRu 
            ? `Используйте мой код ${referralCode} и получите бонус!` 
            : `Use my code ${referralCode} and get a bonus!`,
          url: link,
        });
      } catch {
        // User cancelled share
      }
    } else {
      const ok = await copyShareLink();
      if (ok) {
        setCopied('link');
        toast.success(isRu ? 'Ссылка скопирована!' : 'Link copied!');
        setTimeout(() => setCopied(null), 2000);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const bonus = settings?.referrer_bonus || 50;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-card to-primary/10 border border-primary/20 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">
            {isRu ? 'Пригласите друзей' : 'Invite Friends'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isRu 
              ? `Получите ฿${bonus} за каждого друга` 
              : `Earn ฿${bonus} for each friend`}
          </p>
        </div>
      </div>

      {/* Referral Code */}
      {referralCode && (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-background rounded-xl px-4 py-3 border border-border font-mono text-lg font-bold tracking-widest text-center text-foreground">
            {referralCode}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-xl shrink-0"
            onClick={handleCopyCode}
          >
            {copied === 'code' ? (
              <Check className="w-5 h-5 text-success" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </Button>
        </div>
      )}

      {/* Share Button */}
      <Button
        className="w-full rounded-xl h-11"
        onClick={handleShare}
      >
        <Share2 className="w-4 h-4 mr-2" />
        {copied === 'link' 
          ? (isRu ? 'Ссылка скопирована!' : 'Link copied!') 
          : (isRu ? 'Поделиться ссылкой' : 'Share invite link')}
      </Button>

      {/* Stats */}
      {stats.totalReferrals > 0 && (
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{isRu ? 'Приглашено:' : 'Invited:'}</span>
            <span className="font-semibold text-foreground">{stats.totalReferrals}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Coins className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{isRu ? 'Заработано:' : 'Earned:'}</span>
            <span className="font-semibold text-primary">฿{stats.totalEarned}</span>
          </div>
        </div>
      )}
    </div>
  );
}
