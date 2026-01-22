import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useOwnerOrders } from '@/hooks/useOwnerOrders';
import { useOwnerChats } from '@/hooks/usePropertyChat';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, Calendar, Users, CalendarDays, Link2, MessageCircle
} from 'lucide-react';
import { OwnershipInviteBanner } from '@/components/owner/OwnershipInviteBanner';
import { TodayBlock } from '@/components/owner/dashboard/TodayBlock';
import { MoneyBlock } from '@/components/owner/dashboard/MoneyBlock';
import { PropertiesBlock } from '@/components/owner/dashboard/PropertiesBlock';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function OwnerDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const { 
    activeOrders, 
    upcomingOrders, 
  } = useOwnerOrders();
  const { totalUnread: totalUnreadMessages } = useOwnerChats();

  if (!user) {
    return (
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Управление недвижимостью' : 'Property Care'}
          showBack
          fallbackPath="/"
        />
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <Home className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">
            {isRu ? 'Добро пожаловать в UNO Property Care' : 'Welcome to UNO Property Care'}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {isRu 
              ? 'Войдите или зарегистрируйтесь, чтобы управлять своей недвижимостью на Пхукете' 
              : 'Sign in or register to manage your property in Phuket'}
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button onClick={() => navigate('/auth')} size="lg">
              {isRu ? 'Войти' : 'Sign In'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/auth?mode=signup')} size="lg">
              {isRu ? 'Зарегистрироваться как собственник' : 'Register as Owner'}
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title={isRu ? 'Управление' : 'Dashboard'}
        subtitle={isRu ? 'Ваши объекты на Пхукете' : 'Manage your property'}
        showBack
        fallbackPath="/"
        actions={
          totalUnreadMessages > 0 ? (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate('/owner/messages')}
            >
              <MessageCircle className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
              >
                {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
              </Badge>
            </Button>
          ) : undefined
        }
      />

      {/* Ownership Invites Banner */}
      <OwnershipInviteBanner />

      {/* 3 Main Stripe-like Blocks */}
      <div className="space-y-4 mb-4">
        <TodayBlock />
        <MoneyBlock />
        <PropertiesBlock />
      </div>

      {/* Bookings (compact version) */}
      {(activeOrders.length > 0 || upcomingOrders.length > 0) && (
        <Card className="mb-4">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              {isRu ? 'Бронирования' : 'Bookings'}
            </CardTitle>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/owner/channels')}
              >
                <Link2 className="h-4 w-4 mr-1" />
                {isRu ? 'Каналы' : 'Channels'}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/owner/calendar')}
              >
                <CalendarDays className="h-4 w-4 mr-1" />
                {isRu ? 'Календарь' : 'Calendar'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Active (current guests) */}
            {activeOrders.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {isRu ? 'Сейчас проживают' : 'Currently staying'}
                </p>
                <div className="space-y-2">
                  {activeOrders.slice(0, 2).map((order) => {
                    const guestName = (order.metadata as any)?.guest_name || (isRu ? 'Гость' : 'Guest');
                    return (
                      <div 
                        key={order.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20"
                      >
                        <div className="p-2 rounded-full bg-success/20">
                          <Users className="h-4 w-4 text-success" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{guestName}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.items?.[0]?.product_name || order.order_number} • 
                            {isRu ? ' до ' : ' until '}
                            {order.end_at && format(new Date(order.end_at), 'd MMM', { locale: isRu ? ru : undefined })}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-success/20 text-success">
                          {isRu ? 'Активно' : 'Active'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming */}
            {upcomingOrders.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {isRu ? 'Предстоящие' : 'Upcoming'}
                </p>
                <div className="space-y-2">
                  {upcomingOrders.slice(0, 3).map((order) => {
                    const checkIn = order.start_at ? new Date(order.start_at) : new Date();
                    const daysUntil = differenceInDays(checkIn, new Date());
                    const guestName = (order.metadata as any)?.guest_name || (isRu ? 'Гость' : 'Guest');
                    
                    return (
                      <div 
                        key={order.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                      >
                        <div className="p-2 rounded-full bg-primary/20">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{guestName}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.items?.[0]?.product_name || order.order_number} • 
                            {format(checkIn, 'd MMM', { locale: isRu ? ru : undefined })}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {isToday(checkIn) ? (isRu ? 'Сегодня' : 'Today') :
                           isTomorrow(checkIn) ? (isRu ? 'Завтра' : 'Tomorrow') :
                           `${daysUntil} ${isRu ? 'дн' : 'd'}`}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Floating Help Button */}
      <Button 
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
        onClick={() => navigate('/owner/support-chat')}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </PageContainer>
  );
}
