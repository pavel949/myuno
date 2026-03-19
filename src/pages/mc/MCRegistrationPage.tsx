/**
 * @page MCRegistrationPage
 * @description Self-service Management Company registration.
 * Public-facing page for property managers to register without admin.
 */
import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, ArrowRight, CheckCircle, Shield, BarChart3, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

const BENEFITS = [
  { icon: BarChart3, en: 'Full property analytics & P&L reports', ru: 'Полная аналитика и отчёты P&L' },
  { icon: Users, en: 'Team management with role-based access', ru: 'Управление командой с ролевым доступом' },
  { icon: Shield, en: 'RLS-secured multi-tenant data isolation', ru: 'Безопасная изоляция данных' },
  { icon: Building2, en: 'Manage unlimited properties', ru: 'Управление неограниченным количеством объектов' },
];

export default function MCRegistrationPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialName = useMemo(() => searchParams.get('name')?.trim() || '', [searchParams]);
  const redirectTo = searchParams.get('redirect') || '/mc';
  const [nameEn, setNameEn] = useState(initialName);
  const [nameRu, setNameRu] = useState(initialName);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => navigate(redirectTo), 2000);
    return () => clearTimeout(t);
  }, [success, navigate, redirectTo]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error(isRu ? 'Необходимо войти в систему' : 'Please sign in first');
      navigate('/auth');
      return;
    }

    if (!nameEn.trim()) {
      toast.error(isRu ? 'Введите название компании' : 'Company name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('register-mc', {
        body: {
          name_en: nameEn.trim(),
          name_ru: nameRu.trim() || nameEn.trim(),
          email: email.trim() || user.email || null,
          phone: phone.trim() || null,
          description_en: description.trim() || null,
          description_ru: description.trim() || null,
        },
      });

      if (error) throw error;

      setSuccess(true);
      toast.success(isRu ? 'Компания зарегистрирована!' : 'Company registered!');
    } catch (err: unknown) {
      logger.error('MC registration error:', err);
      toast.error((err instanceof Error ? err.message : '') || (isRu ? 'Ошибка регистрации' : 'Registration failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <AppLayout title={isRu ? 'Регистрация УК' : 'MC Registration'}>
        <PageContainer className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full border-success/30 bg-success/5">
            <CardContent className="pt-8 text-center">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {isRu ? 'Добро пожаловать!' : 'Welcome!'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {isRu
                  ? 'Ваша управляющая компания зарегистрирована. Перенаправляем в рабочее пространство...'
                  : 'Your management company has been registered. Redirecting to workspace...'}
              </p>
            </CardContent>
          </Card>
        </PageContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={isRu ? 'Регистрация УК' : 'Register MC'}>
      <PageContainer>
        {/* Hero */}
        <div className="text-center mb-8 pt-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {isRu ? 'Зарегистрировать управляющую компанию' : 'Register Your Management Company'}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {isRu
              ? 'Начните управлять объектами на платформе myUNO. Бесплатный старт, оплата только за активные слоты.'
              : 'Start managing properties on myUNO. Free to start, pay only for active property slots.'}
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {BENEFITS.map(({ icon: Icon, en, ru: ruText }, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-muted/50">
              <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm">{isRu ? ruText : en}</span>
            </div>
          ))}
        </div>

        {/* Registration Form */}
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>{isRu ? 'Данные компании' : 'Company Details'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="mc-name-en" className="text-sm font-medium mb-1.5 block">
                {isRu ? 'Название (EN) *' : 'Company Name (EN) *'}
              </label>
              <Input
                id="mc-name-en"
                placeholder="Ignatev Estate"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="mc-name-ru" className="text-sm font-medium mb-1.5 block">
                {isRu ? 'Название (RU)' : 'Company Name (RU)'}
              </label>
              <Input
                id="mc-name-ru"
                placeholder="Игнатьев Эстейт"
                value={nameRu}
                onChange={(e) => setNameRu(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="mc-email" className="text-sm font-medium mb-1.5 block">Email</label>
                <Input
                  id="mc-email"
                  type="email"
                  placeholder="info@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="mc-phone" className="text-sm font-medium mb-1.5 block">
                  {isRu ? 'Телефон' : 'Phone'}
                </label>
                <Input
                  id="mc-phone"
                  type="tel"
                  placeholder="+66..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="mc-description" className="text-sm font-medium mb-1.5 block">
                {isRu ? 'Описание (необязательно)' : 'Description (optional)'}
              </label>
              <Textarea
                id="mc-description"
                placeholder={isRu ? 'Расскажите о вашей компании...' : 'Tell us about your company...'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {!user && !authLoading && (
              <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 text-sm">
                {isRu
                  ? '⚠️ Для регистрации необходимо войти в аккаунт'
                  : '⚠️ You need to sign in to register a company'}
              </div>
            )}

            <Button
              onClick={user ? handleSubmit : () => navigate('/auth')}
              disabled={isSubmitting || (!nameEn.trim())}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                isRu ? 'Регистрация...' : 'Registering...'
              ) : !user ? (
                <>{isRu ? 'Войти для регистрации' : 'Sign In to Register'}</>
              ) : (
                <>
                  {isRu ? 'Зарегистрировать компанию' : 'Register Company'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    </AppLayout>
  );
}
