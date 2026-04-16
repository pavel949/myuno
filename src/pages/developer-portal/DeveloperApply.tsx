/**
 * Developer Apply — standalone registration page for new developers.
 * Accessible without a developer profile (unlike the portal layout).
 */
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDeveloperProfile, useApplyAsDeveloper } from '@/hooks/useDeveloperPortal';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { APP_ROUTES } from '@/lib/config/routes';
import { Building2, ArrowLeft } from 'lucide-react';

export default function DeveloperApply() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: developer, isLoading: devLoading } = useDeveloperProfile();
  const navigate = useNavigate();
  const apply = useApplyAsDeveloper();

  const [form, setForm] = useState({ name_en: '', name_ru: '', email: '', phone: '' });

  if (authLoading || devLoading) return <NewbuildsLayout hideNav><LoadingState /></NewbuildsLayout>;

  if (!user) return <Navigate to={`${APP_ROUTES.AUTH}?redirect=${encodeURIComponent(APP_ROUTES.DEVELOPER_PORTAL_APPLY)}`} replace />;

  // Already a developer — go to portal
  if (developer) return <Navigate to={APP_ROUTES.DEVELOPER_PORTAL} replace />;

  return (
    <NewbuildsLayout hideNav>
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <button
            onClick={() => navigate(APP_ROUTES.FOR_REAL_ESTATE_DEVELOPERS)}
            className="flex items-center gap-2 text-sm text-[hsl(var(--nb-muted))] hover:text-[hsl(var(--nb-gold))] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Для застройщиков
          </button>

          <div className="nb-glass p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--nb-gold)/0.15)] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[hsl(var(--nb-gold))]" />
              </div>
              <div>
                <h1 className="nb-display text-2xl text-[hsl(var(--nb-text))]">Стать девелопером</h1>
                <p className="text-sm text-[hsl(var(--nb-text-secondary))]">Регистрация на платформе myUNO</p>
              </div>
            </div>

            <p className="text-[hsl(var(--nb-text-secondary))] mb-8 text-sm leading-relaxed">
              Разместите свои проекты на лучшей платформе Пхукета. Получайте лиды от инвесторов и релокантов напрямую.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-[hsl(var(--nb-muted))] mb-1.5 block">Company name (EN) *</label>
                <Input
                  placeholder="e.g. Sansiri, Origin PCL"
                  value={form.name_en}
                  onChange={e => setForm(p => ({ ...p, name_en: e.target.value }))}
                  className="bg-[hsl(var(--nb-surface))] border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-text))]"
                />
              </div>
              <div>
                <label className="text-xs text-[hsl(var(--nb-muted))] mb-1.5 block">Название компании (RU) *</label>
                <Input
                  placeholder="например, Санасири, Ориджин"
                  value={form.name_ru}
                  onChange={e => setForm(p => ({ ...p, name_ru: e.target.value }))}
                  className="bg-[hsl(var(--nb-surface))] border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-text))]"
                />
              </div>
              <div>
                <label className="text-xs text-[hsl(var(--nb-muted))] mb-1.5 block">Email</label>
                <Input
                  type="email"
                  placeholder="contact@company.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="bg-[hsl(var(--nb-surface))] border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-text))]"
                />
              </div>
              <div>
                <label className="text-xs text-[hsl(var(--nb-muted))] mb-1.5 block">Телефон / WhatsApp</label>
                <Input
                  placeholder="+66 8X XXX XXXX"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="bg-[hsl(var(--nb-surface))] border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-text))]"
                />
              </div>

              <button
                className="nb-btn-gold w-full mt-2"
                disabled={!form.name_en || !form.name_ru || apply.isPending}
                onClick={() => apply.mutate(form)}
              >
                {apply.isPending ? 'Отправка...' : 'Отправить заявку'}
              </button>
            </div>

            <p className="text-xs text-[hsl(var(--nb-muted))] mt-6 text-center">
              Заявка проверяется в течение 1-2 рабочих дней. После подтверждения откроется доступ в личный кабинет.
            </p>
          </div>
        </div>
      </div>
    </NewbuildsLayout>
  );
}
