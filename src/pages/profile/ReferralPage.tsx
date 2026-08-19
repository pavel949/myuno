import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ReferralCard } from '@/components/referral/ReferralCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReferral } from '@/hooks/useReferral';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { CheckCircle, Clock, User } from 'lucide-react';

export default function ReferralPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { referrals, isLoading } = useReferral();
  const isRu = language === 'ru';

  return (
    <AppLayout title={isRu ? 'Приглашайте друзей' : 'Invite your friends'}>
      <div className="px-4 py-6 pb-24 max-w-lg mx-auto space-y-6">
        <ReferralCard />

        {/* How it works */}
        <div className="rounded-none bg-card border border-border p-5 space-y-4">
          <h3 className="font-semibold text-foreground">
            {isRu ? 'Как это работает' : 'How it works'}
          </h3>
          <div className="space-y-3">
            {[
              { step: '1', textRu: 'Отправьте свой код другу', textEn: 'Send your code to a friend' },
              { step: '2', textRu: 'Друг регистрируется с этим кодом', textEn: 'They sign up using that code' },
              { step: '3', textRu: 'После его первого заказа бонус получаете оба', textEn: 'After their first order, you both get a bonus' },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{item.step}</span>
                </div>
                <p className="text-sm text-foreground pt-1">
                  {isRu ? item.textRu : item.textEn}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral history */}
        {referrals.length > 0 && (
          <div className="rounded-none bg-card border border-border p-5 space-y-3">
            <h3 className="font-semibold text-foreground">
              {isRu ? 'Кого вы уже пригласили' : 'Friends you invited'}
            </h3>
            <div className="space-y-2">
              {referrals.map(ref => (
                <div key={ref.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      {isRu ? 'Приглашённый друг' : 'Invited friend'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ref.created_at), 'dd.MM.yyyy')}
                    </p>
                  </div>
                  {ref.status === 'completed' ? (
                    <div className="flex items-center gap-1 text-success">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">+฿{ref.referrer_bonus}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs">{isRu ? 'Ждём первый заказ' : 'Waiting for first order'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
