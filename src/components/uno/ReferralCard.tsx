import React from 'react';
import { Copy, Share2, Users, Gift, CheckCircle, Clock } from 'lucide-react';
import { useReferral } from '@/hooks/useReferral';
import { useLanguage } from '@/contexts/LanguageContext';
import { SectionCard } from './SectionCard';
import { PremiumButton } from './PremiumButton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReferralCardProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export const ReferralCard: React.FC<ReferralCardProps> = ({
  variant = 'full',
  className,
}) => {
  const { language } = useLanguage();
  const {
    referralCode,
    settings,
    stats,
    isLoading,
    copyReferralCode,
    copyShareLink,
  } = useReferral();

  const handleCopyCode = async () => {
    const success = await copyReferralCode();
    if (success) {
      toast.success(language === 'ru' ? 'Код скопирован!' : 'Code copied!');
    }
  };

  const handleShare = async () => {
    const success = await copyShareLink();
    if (success) {
      toast.success(language === 'ru' ? 'Ссылка скопирована!' : 'Link copied!');
    }
  };

  if (isLoading) {
    return (
      <SectionCard className={cn('animate-pulse', className)}>
        <div className="h-32 bg-muted rounded-lg" />
      </SectionCard>
    );
  }

  if (variant === 'compact') {
    return (
      <SectionCard className={cn('', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Gift className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-medium">
                {language === 'ru' ? 'Пригласи друга' : 'Invite a friend'}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' 
                  ? `Получи ${settings?.referrer_bonus || 100} ₽` 
                  : `Get ${settings?.referrer_bonus || 100} ₽`}
              </p>
            </div>
          </div>
          <PremiumButton size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-1" />
            {language === 'ru' ? 'Поделиться' : 'Share'}
          </PremiumButton>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <Gift className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">
            {language === 'ru' ? 'Реферальная программа' : 'Referral Program'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === 'ru' 
              ? 'Приглашай друзей и получай бонусы' 
              : 'Invite friends and earn bonuses'}
          </p>
        </div>
      </div>

      {/* Bonus info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-primary">
            {settings?.referrer_bonus || 100} ₽
          </p>
          <p className="text-xs text-muted-foreground">
            {language === 'ru' ? 'Вам за друга' : 'You get'}
          </p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-primary">
            {settings?.referred_bonus || 50} ₽
          </p>
          <p className="text-xs text-muted-foreground">
            {language === 'ru' ? 'Другу на счёт' : 'Friend gets'}
          </p>
        </div>
      </div>

      {/* Referral code */}
      {referralCode && (
        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-2 text-center">
            {language === 'ru' ? 'Ваш реферальный код' : 'Your referral code'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-mono font-bold tracking-widest">
              {referralCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <Copy className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <PremiumButton className="flex-1" onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-2" />
          {language === 'ru' ? 'Поделиться ссылкой' : 'Share link'}
        </PremiumButton>
      </div>

      {/* Stats */}
      {stats.totalReferrals > 0 && (
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-medium mb-3">
            {language === 'ru' ? 'Ваша статистика' : 'Your stats'}
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
              </div>
              <p className="text-lg font-semibold">{stats.totalReferrals}</p>
              <p className="text-xs text-muted-foreground">
                {language === 'ru' ? 'Приглашено' : 'Invited'}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <CheckCircle className="w-4 h-4" />
              </div>
              <p className="text-lg font-semibold">{stats.completedReferrals}</p>
              <p className="text-xs text-muted-foreground">
                {language === 'ru' ? 'Активировано' : 'Activated'}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Gift className="w-4 h-4" />
              </div>
              <p className="text-lg font-semibold">{stats.totalEarned} ₽</p>
              <p className="text-xs text-muted-foreground">
                {language === 'ru' ? 'Заработано' : 'Earned'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-medium mb-3">
          {language === 'ru' ? 'Как это работает' : 'How it works'}
        </h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0">1</span>
            <span>
              {language === 'ru' 
                ? 'Поделитесь своим кодом или ссылкой с другом' 
                : 'Share your code or link with a friend'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0">2</span>
            <span>
              {language === 'ru' 
                ? 'Друг регистрируется и вводит код' 
                : 'Friend signs up and enters the code'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0">3</span>
            <span>
              {language === 'ru' 
                ? `После первого бронирования от ${settings?.min_booking_amount || 500} ₽ — оба получаете бонусы!` 
                : `After first booking from ${settings?.min_booking_amount || 500} ₽ — you both get bonuses!`}
            </span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

// Referral list for showing invited friends
export const ReferralList: React.FC<{ className?: string }> = ({ className }) => {
  const { language } = useLanguage();
  const { referrals, isLoading } = useReferral();

  if (isLoading) {
    return (
      <SectionCard className={cn('animate-pulse', className)}>
        <div className="h-24 bg-muted rounded-lg" />
      </SectionCard>
    );
  }

  if (referrals.length === 0) {
    return null;
  }

  return (
    <SectionCard className={className}>
      <h4 className="font-medium mb-3">
        {language === 'ru' ? 'Приглашённые друзья' : 'Invited friends'}
      </h4>
      <div className="space-y-2">
        {referrals.map((referral) => (
          <div 
            key={referral.id}
            className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {language === 'ru' ? 'Друг' : 'Friend'} #{referral.id.slice(0, 6)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(referral.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {referral.status === 'completed' ? (
                <>
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">
                    +{referral.referrer_bonus} ₽
                  </span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-warning" />
                  <span className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'Ожидание' : 'Pending'}
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};
