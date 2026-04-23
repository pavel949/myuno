/**
 * Stripe Connect return URL handler.
 * After devmod-stripe-onboard creates an account link, Stripe redirects user back here.
 * We poll status once, then send them to the portal overview.
 */
import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useDeveloperProfile } from '@/hooks/useDeveloperPortal';
import { useStripeConnectStatus } from '@/hooks/useDeveloperOnboarding';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { APP_ROUTES } from '@/lib/config/routes';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DeveloperStripeReturn() {
  const navigate = useNavigate();
  const { data: developer, isLoading: devLoading } = useDeveloperProfile();
  const { data: status, isLoading: statusLoading, refetch } = useStripeConnectStatus(developer?.id);

  useEffect(() => {
    // Refresh once on mount in case Stripe just finished
    if (developer?.id) refetch();
  }, [developer?.id, refetch]);

  if (devLoading || statusLoading) {
    return <NewbuildsLayout><LoadingState /></NewbuildsLayout>;
  }

  if (!developer) return <Navigate to={APP_ROUTES.DEVELOPER_PORTAL_APPLY} replace />;

  const ok = !!status?.charges_enabled && !!status?.payouts_enabled;

  return (
    <NewbuildsLayout>
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="nb-glass max-w-md w-full p-8 rounded-none text-center">
          {ok ? (
            <>
              <CheckCircle2 className="w-14 h-14 mx-auto text-success mb-4" />
              <h1 className="nb-display text-2xl text-[hsl(var(--nb-text))] mb-2">Stripe подключён</h1>
              <p className="text-sm text-[hsl(var(--nb-text-secondary))] mb-6">
                Платёжный аккаунт активен — вы готовы принимать бронирования.
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="w-14 h-14 mx-auto text-accent mb-4" />
              <h1 className="nb-display text-2xl text-[hsl(var(--nb-text))] mb-2">Почти готово</h1>
              <p className="text-sm text-[hsl(var(--nb-text-secondary))] mb-6">
                Stripe ещё проверяет ваши данные. Это может занять несколько минут — статус обновится автоматически.
              </p>
            </>
          )}
          <Button className="nb-btn-gold w-full" onClick={() => navigate(APP_ROUTES.DEVELOPER_PORTAL)}>
            Перейти в кабинет
          </Button>
        </div>
      </div>
    </NewbuildsLayout>
  );
}
