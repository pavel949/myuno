/**
 * Guest Profile — Unified profile with order history
 * 
 * Shows complete guest journey across the platform.
 * Increases switching costs by making history valuable.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { 
  User, MapPin, Calendar, Star, ShoppingBag, Heart,
  ChevronRight, Clock, TrendingUp, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoyaltyWidget } from '@/components/loyalty/LoyaltyWidget';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// ── Order history query ──
function useGuestHistory() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['guest-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return { orders: [], stats: { totalOrders: 0, totalSpent: 0, categories: [] } };
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, status, total_amount, currency, created_at, vertical')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20) as { data: any[] | null; error: any };
      
      if (error) throw error;
      
      const totalOrders = orders?.length || 0;
      const totalSpent = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      
      // Get unique verticals
      const verticalSet = new Set(orders?.map(o => o.vertical).filter(Boolean));
      
      return {
        orders: orders || [],
        stats: {
          totalOrders,
          totalSpent,
          categories: Array.from(verticalSet),
        },
      };
    },
    enabled: !!user?.id,
  });
}

// ── Stat Card ──
const StatCard: React.FC<{
  icon: React.ElementType;
  value: string;
  label: string;
  color: string;
}> = ({ icon: Icon, value, label, color }) => (
  <div className="bg-card border border-border rounded-xl p-4 text-center">
    <Icon className={cn('w-5 h-5 mx-auto mb-2', color)} />
    <p className="text-lg font-bold text-foreground">{value}</p>
    <p className="text-[11px] text-muted-foreground">{label}</p>
  </div>
);

// ── Order Item ──
const OrderItem: React.FC<{
  order: any;
  isRu: boolean;
  onNavigate: (id: string) => void;
}> = ({ order, isRu, onNavigate }) => {
  const statusColors: Record<string, string> = {
    completed: 'text-green-600 bg-green-50 dark:bg-green-950/30',
    confirmed: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    pending: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
    cancelled: 'text-red-600 bg-red-50 dark:bg-red-950/30',
  };
  
  return (
    <button
      onClick={() => onNavigate(order.id)}
      className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:shadow-sm transition-all w-full text-left group"
    >
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <ShoppingBag className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {order.vertical || (isRu ? 'Заказ' : 'Order')}
          </span>
          <span className={cn(
            'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
            statusColors[order.status] || 'text-muted-foreground bg-muted'
          )}>
            {order.status}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {format(new Date(order.created_at), isRu ? 'd MMM yyyy' : 'MMM d, yyyy', { locale: isRu ? ru : undefined })}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-foreground">
          {order.total_amount?.toLocaleString()} {order.currency || '฿'}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
    </button>
  );
};

export default function GuestProfile() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const { data, isLoading } = useGuestHistory();
  
  const memberSince = user?.created_at 
    ? format(new Date(user.created_at), isRu ? 'MMMM yyyy' : 'MMMM yyyy', { locale: isRu ? ru : undefined })
    : '';

  return (
    <PageContainer>
      <PageHeader 
        title={isRu ? 'Мой профиль' : 'My Profile'} 
        showBack 
      />
      
      <div className="px-4 pb-32 max-w-lg mx-auto space-y-6">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-4"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Guest'}
          </h2>
          {memberSince && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {isRu ? `С нами с ${memberSince}` : `Member since ${memberSince}`}
            </p>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <StatCard 
            icon={ShoppingBag} 
            value={String(data?.stats.totalOrders || 0)} 
            label={isRu ? 'Заказы' : 'Orders'}
            color="text-primary"
          />
          <StatCard 
            icon={TrendingUp} 
            value={`${((data?.stats.totalSpent || 0) / 1000).toFixed(0)}k`} 
            label={isRu ? 'Потрачено ฿' : 'Spent ฿'}
            color="text-emerald-500"
          />
          <StatCard 
            icon={Heart} 
            value={String(data?.stats.categories.length || 0)} 
            label={isRu ? 'Категории' : 'Categories'}
            color="text-rose-500"
          />
        </motion.div>

        {/* Loyalty widget */}
        <LoyaltyWidget variant="full" />

        {/* Order history */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {isRu ? 'История заказов' : 'Order history'}
          </h3>
          
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : data?.orders.length ? (
            <div className="space-y-2">
              {data.orders.map((order) => (
                <OrderItem 
                  key={order.id} 
                  order={order} 
                  isRu={isRu}
                  onNavigate={(id) => navigate(`/orders/${id}/tracking`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-2xl">
              <ShoppingBag className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Заказов пока нет' : 'No orders yet'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 rounded-full"
                onClick={() => navigate('/discover')}
              >
                {isRu ? 'Исследовать' : 'Explore'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
