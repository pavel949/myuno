/**
 * ActivityPulse — compact "your platform at a glance" stats ribbon.
 * Shows total orders, saved, points earned, and days on platform.
 */
import React from 'react';
import { ShoppingBag, Heart, Coins, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function ActivityPulse() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const { data: stats } = useQuery({
    queryKey: ['activity-pulse', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const [ordersRes, favoritesRes, profileRes] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('customer_user_id', user.id),
        supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('profiles').select('referral_balance, created_at').eq('id', user.id).maybeSingle(),
      ]);

      const daysOnPlatform = profileRes.data?.created_at
        ? Math.floor((Date.now() - new Date(profileRes.data.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        orders: ordersRes.count || 0,
        favorites: favoritesRes.count || 0,
        balance: profileRes.data?.referral_balance || 0,
        days: daysOnPlatform,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  if (!user || !stats) return null;

  const items = [
    { icon: ShoppingBag, value: stats.orders, labelRu: 'Заказов', labelEn: 'Orders' },
    { icon: Heart, value: stats.favorites, labelRu: 'В избранном', labelEn: 'Saved' },
    { icon: Coins, value: `฿${stats.balance}`, labelRu: 'Бонусы', labelEn: 'Bonuses' },
    { icon: Calendar, value: stats.days, labelRu: 'Дней', labelEn: 'Days' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card border border-border">
            <Icon className="w-4 h-4 text-muted-foreground" />
            <span className="text-lg font-bold text-foreground">{item.value}</span>
            <span className="text-[10px] text-muted-foreground">
              {isRu ? item.labelRu : item.labelEn}
            </span>
          </div>
        );
      })}
    </div>
  );
}
