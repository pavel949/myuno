import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, UserPlus, ArrowLeft, Lock, Sparkles, Shield, CreditCard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';

interface LoginRequiredPageProps {
  /** What the user was trying to access */
  feature?: string;
  featureRu?: string;
  /** Custom explanation */
  explanation?: string;
  explanationRu?: string;
}

const benefits = [
  { icon: Shield, en: 'Secure payment processing', ru: 'Безопасная обработка платежей' },
  { icon: Sparkles, en: 'Earn cashback on every purchase', ru: 'Кэшбэк с каждой покупки' },
  { icon: CreditCard, en: 'Track all your bookings in one place', ru: 'Все бронирования в одном месте' },
];

/**
 * Full-page login required state.
 * Used when guest tries to access a protected route directly.
 */
export function LoginRequiredPage({
  feature = 'this feature',
  featureRu = 'эту функцию',
  explanation,
  explanationRu,
}: LoginRequiredPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleLogin = () => {
    navigate('/auth', { state: { from: location.pathname } });
  };

  const handleSignup = () => {
    navigate('/auth?mode=signup', { state: { from: location.pathname } });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleBrowse = () => {
    navigate('/');
  };

  return (
    <AppLayout>
      <PageContainer className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-2xl font-display font-bold mb-2">
          {isRu ? 'Требуется авторизация' : 'Login Required'}
        </h1>

        <p className="text-muted-foreground max-w-sm mb-6">
          {explanation 
            ? (isRu ? explanationRu : explanation)
            : isRu 
              ? `Для доступа к ${featureRu}, пожалуйста, войдите или создайте аккаунт.`
              : `To access ${feature}, please sign in or create an account.`
          }
        </p>

        {/* Benefits */}
        <div className="w-full max-w-xs space-y-2 mb-8">
          {benefits.map((benefit, idx) => (
            <div 
              key={idx}
              className="flex items-center gap-3 text-sm text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <benefit.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-muted-foreground">
                {isRu ? benefit.ru : benefit.en}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="w-full max-w-xs space-y-2">
          <Button onClick={handleLogin} className="w-full gap-2" size="lg">
            <LogIn className="w-4 h-4" />
            {isRu ? 'Войти' : 'Sign in'}
          </Button>
          
          <Button onClick={handleSignup} variant="outline" className="w-full gap-2" size="lg">
            <UserPlus className="w-4 h-4" />
            {isRu ? 'Создать аккаунт' : 'Create account'}
          </Button>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleBack} variant="ghost" size="sm" className="flex-1 gap-1">
              <ArrowLeft className="w-3 h-3" />
              {isRu ? 'Назад' : 'Back'}
            </Button>
            <Button onClick={handleBrowse} variant="ghost" size="sm" className="flex-1">
              {isRu ? 'На главную' : 'Browse'}
            </Button>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
