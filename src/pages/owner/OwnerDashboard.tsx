import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useOwnerOrders } from '@/hooks/useOwnerOrders';
import { useOwnerChats } from '@/hooks/usePropertyChat';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, MessageCircle
} from 'lucide-react';
import { OwnershipInviteBanner } from '@/components/owner/OwnershipInviteBanner';
import { 
  TodayBlock, 
  MoneyBlock, 
  PropertiesBlock, 
  RisksBlock, 
  ActivityBlock 
} from '@/components/owner/dashboard';
import { BookingsSection } from '@/components/owner/dashboard/BookingsSection';

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
    <PageContainer className="space-y-4">
      <PageHeader 
        title={isRu ? 'Управление' : 'Dashboard'}
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

      {/* Stripe-like Dashboard Grid */}
      <div className="space-y-3">
        {/* Row 1: Priority - Today + Risks (side by side on larger screens) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TodayBlock />
          <RisksBlock />
        </div>

        {/* Row 2: Money (full width - key metric) */}
        <MoneyBlock />

        {/* Row 3: Properties (full width portfolio view) */}
        <PropertiesBlock />

        {/* Row 4: Activity (secondary info) */}
        <ActivityBlock />
      </div>

      {/* Bookings Section */}
      {(activeOrders.length > 0 || upcomingOrders.length > 0) && (
        <BookingsSection 
          activeOrders={activeOrders} 
          upcomingOrders={upcomingOrders} 
        />
      )}

      {/* Floating Help Button */}
      <Button 
        className="fixed bottom-20 right-4 h-12 w-12 rounded-full shadow-lg z-50"
        size="icon"
        onClick={() => navigate('/owner/support-chat')}
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
    </PageContainer>
  );
}
