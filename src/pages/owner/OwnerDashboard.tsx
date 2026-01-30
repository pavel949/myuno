import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { OwnershipInviteBanner } from '@/components/owner/OwnershipInviteBanner';
import { 
  QuickActionsBar,
  PortfolioSection,
  OperationsSection,
  FinancesSummary,
  CommunicationsSection,
  OwnerPerformanceCard,
  BookingSearchBar,
} from '@/components/owner/dashboard';

export default function OwnerDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Home className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {isRu ? 'UNO Property Care' : 'UNO Property Care'}
        </h2>
        <p className="text-muted-foreground mb-8 max-w-sm">
          {isRu 
            ? 'Управляйте своей недвижимостью на Пхукете профессионально' 
            : 'Manage your Phuket property professionally'}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button onClick={() => navigate('/auth')} size="lg" className="h-12">
            {isRu ? 'Войти' : 'Sign In'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/auth?mode=signup')} size="lg" className="h-12">
            {isRu ? 'Создать аккаунт' : 'Create Account'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Ownership Invites Banner */}
      <OwnershipInviteBanner />

      {/* Global Booking Search */}
      <BookingSearchBar />

      {/* Quick Actions - horizontal scroll */}
      <QuickActionsBar />

      {/* Portfolio Section - Hero with properties */}
      <PortfolioSection />

      {/* Performance Metrics - Airbnb style */}
      <OwnerPerformanceCard />

      {/* Operations Section - Today's tasks */}
      <OperationsSection />

      {/* Finances Summary */}
      <FinancesSummary />

      {/* Communications Section */}
      <CommunicationsSection />
    </div>
  );
}
