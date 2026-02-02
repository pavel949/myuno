import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWallet } from '@/hooks/useWallet';
import { useFavorites } from '@/hooks/useFavorites';
import { useOrders } from '@/hooks/useOrders';
import { Calendar, Wallet, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  onClick: () => void;
  color: string;
  isLoading?: boolean;
}

function StatItem({ icon, label, value, onClick, color, isLoading }: StatItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted/50 transition-colors active:scale-95"
    >
      <div className={cn("p-2 rounded-xl", color)}>
        {icon}
      </div>
      {isLoading ? (
        <Skeleton className="h-6 w-10" />
      ) : (
        <span className="text-lg font-bold">{value}</span>
      )}
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
    </button>
  );
}

export function DashboardStatsBar() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { orders, isLoading: ordersLoading } = useOrders();
  const { balance, isLoading: walletLoading } = useWallet();
  const { favorites, loading: favoritesLoading } = useFavorites();

  // Count active bookings (pending, confirmed, in_progress)
  const activeBookingsCount = orders.filter(
    o => ['pending', 'confirmed', 'in_progress'].includes(o.status)
  ).length;

  // Format wallet balance
  const formattedBalance = balance >= 1000 
    ? `฿${(balance / 1000).toFixed(1)}k` 
    : `฿${balance.toLocaleString()}`;

  return (
    <Card className="p-2">
      <div className="flex items-center justify-around">
        <StatItem
          icon={<Calendar className="h-4 w-4 text-blue-600" />}
          label={isRu ? 'Заказы' : 'Bookings'}
          value={activeBookingsCount}
          onClick={() => navigate('/bookings')}
          color="bg-blue-100 dark:bg-blue-900/30"
          isLoading={ordersLoading}
        />
        <div className="w-px h-10 bg-border" />
        <StatItem
          icon={<Wallet className="h-4 w-4 text-green-600" />}
          label={isRu ? 'Кошелёк' : 'Wallet'}
          value={formattedBalance}
          onClick={() => navigate('/wallet')}
          color="bg-green-100 dark:bg-green-900/30"
          isLoading={walletLoading}
        />
        <div className="w-px h-10 bg-border" />
        <StatItem
          icon={<Heart className="h-4 w-4 text-pink-600" />}
          label={isRu ? 'Избранное' : 'Favorites'}
          value={favorites.length}
          onClick={() => navigate('/favorites')}
          color="bg-pink-100 dark:bg-pink-900/30"
          isLoading={favoritesLoading}
        />
      </div>
    </Card>
  );
}
