/**
 * Developer Pending — shown after onboarding submit while application is under review.
 * Polls developer profile every 30s; redirects to portal when devmod_status = 'active'.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useDeveloperProfile } from '@/hooks/useDeveloperPortal';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { APP_ROUTES } from '@/lib/config/routes';
import { Clock, CheckCircle, Mail } from 'lucide-react';

export default function DeveloperPending() {
  const { data: developer, isLoading } = useDeveloperProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(() => {
      qc.invalidateQueries({ queryKey: ['developer-profile'] });
    }, 30_000);
    return () => clearInterval(id);
  }, [qc]);

  // Redirect when approved
  useEffect(() => {
    const status = (developer as unknown as Record<string, unknown> | null)?.devmod_status as string | undefined;
    if (status === 'active') {
      navigate(APP_ROUTES.DEVELOPER_PORTAL, { replace: true });
    }
  }, [developer, navigate]);

  if (isLoading) return null;

  return (
    <NewbuildsLayout hideNav>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="nb-glass p-10 rounded-none space-y-6">
            <div className="w-16 h-16 rounded-none bg-[hsl(var(--nb-gold)/0.15)] flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-[hsl(var(--nb-gold))]" />
            </div>

            <div>
              <h1 className="nb-display text-2xl text-[hsl(var(--nb-text))] mb-2">
                Заявка на проверке
              </h1>
              <p className="text-[hsl(var(--nb-text-secondary))]">
                Мы получили вашу заявку и проверяем данные. Обычно это занимает 1–2 рабочих дня.
              </p>
            </div>

            <div className="space-y-3 text-left">
              <StatusItem
                icon={<CheckCircle className="w-4 h-4 text-success" />}
                label="Заявка отправлена"
                done
              />
              <StatusItem
                icon={<Clock className="w-4 h-4 text-[hsl(var(--nb-gold))]" />}
                label="Проверка командой myUNO"
                done={false}
              />
              <StatusItem
                icon={<Mail className="w-4 h-4 text-[hsl(var(--nb-muted))]" />}
                label="Получение письма с доступом"
                done={false}
              />
            </div>

            <p className="text-xs text-[hsl(var(--nb-muted))]">
              Вы получите email на адрес{' '}
              <span className="text-[hsl(var(--nb-text))]">
                {(developer as unknown as Record<string, unknown> | null)?.email as string ?? ''}
              </span>{' '}
              когда аккаунт будет активирован.
            </p>

            <p className="text-xs text-[hsl(var(--nb-muted))]">
              Страница обновляется автоматически
            </p>
          </div>
        </div>
      </div>
    </NewbuildsLayout>
  );
}

function StatusItem({ icon, label, done }: { icon: React.ReactNode; label: string; done: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-none ${done ? 'bg-success/10' : 'bg-[hsl(var(--nb-glass-bg))]'}`}>
      {icon}
      <span className={`text-sm ${done ? 'text-success' : 'text-[hsl(var(--nb-text-secondary))]'}`}>{label}</span>
    </div>
  );
}
