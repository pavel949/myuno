/**
 * Developer Onboarding Wizard — 4-step flow after first sign-in.
 *
 * Step 1: Company details (legal name, registration, country, website)
 * Step 2: Logo upload + description EN/RU
 * Step 3: Stripe Connect Express redirect
 * Step 4: Review + submit
 *
 * Authenticated users: if no developers row yet, step 1 creates it (user_id).
 * Draft rows use devmod_status = suspended and is_active = false until final submit
 * (then devmod_status = pending and devmod-apply runs). After submit → /developer-portal/pending.
 */
import { useState, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDeveloperProfile } from '@/hooks/useDeveloperPortal';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { APP_ROUTES } from '@/lib/config/routes';
import { Building2, ChevronRight, ChevronLeft, Upload, ExternalLink, CheckCircle } from 'lucide-react';

// ── Schemas ─────────────────────────────────────────────────────────────

const step1Schema = z.object({
  legal_name: z.string().min(2, 'Введите юридическое название'),
  registration_number: z.string().optional(),
  country: z.string().min(2),
  website: z.string().url('Введите корректный URL').optional().or(z.literal('')),
});

const step2Schema = z.object({
  description_en: z.string().min(20, 'Минимум 20 символов').max(1000),
  description_ru: z.string().min(20, 'Минимум 20 символов').max(1000),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

const TOTAL_STEPS = 4;

const COUNTRIES = [
  { code: 'TH', label: 'Thailand' },
  { code: 'SG', label: 'Singapore' },
  { code: 'HK', label: 'Hong Kong' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'RU', label: 'Russia' },
  { code: 'AE', label: 'UAE' },
  { code: 'OTHER', label: 'Other' },
];

// ── Main component ───────────────────────────────────────────────────────

export default function DeveloperOnboarding() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: developer, isLoading: profileLoading } = useDeveloperProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();

  /** Set after INSERT on step 1 when React Query has not refetched yet */
  const [pendingDeveloperId, setPendingDeveloperId] = useState<string | null>(null);
  const [creatingDeveloperRow, setCreatingDeveloperRow] = useState(false);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [stripeStarted, setStripeStarted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Accumulated form data across steps
  const [step1Data, setStep1Data] = useState<Step1Data>({
    legal_name: '',
    registration_number: '',
    country: 'TH',
    website: '',
  });
  const [step2Data, setStep2Data] = useState<Step2Data>({
    description_en: '',
    description_ru: '',
  });

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: step1Data,
  });

  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: step2Data,
  });

  const developerId = developer?.id ?? pendingDeveloperId;

  if (authLoading || profileLoading) {
    return <NewbuildsLayout hideNav><LoadingState /></NewbuildsLayout>;
  }
  if (!user) {
    return (
      <Navigate
        to={`${APP_ROUTES.AUTH}?redirect=${encodeURIComponent(APP_ROUTES.DEVELOPER_PORTAL_ONBOARDING)}`}
        replace
      />
    );
  }
  if (developer?.devmod_status === 'active') {
    return <Navigate to={APP_ROUTES.DEVELOPER_PORTAL} replace />;
  }
  if (developer?.devmod_status === 'pending') {
    return <Navigate to={APP_ROUTES.DEVELOPER_PORTAL_PENDING} replace />;
  }

  // ── Logo upload ──────────────────────────────────────────────────────

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс 5 МБ)');
      return;
    }
    if (!developerId) {
      toast.error('Сначала заполните шаг 1');
      return;
    }
    setLogoUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `logos/${developerId}.${ext}`;
      const { error } = await supabase.storage
        .from('developer-assets')
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('developer-assets')
        .getPublicUrl(path);
      setLogoUrl(publicUrl);
      toast.success('Логотип загружен');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLogoUploading(false);
    }
  }

  // ── Stripe Connect ───────────────────────────────────────────────────

  async function startStripeConnect() {
    if (!developerId) {
      toast.error('Профиль не найден');
      return;
    }
    setStripeStarted(true);
    try {
      const res = await supabase.functions.invoke('devmod-stripe-onboard', {
        body: {
          developer_id: developerId,
          return_url: `${window.location.origin}${APP_ROUTES.DEVELOPER_PORTAL_STRIPE_RETURN}`,
          refresh_url: `${window.location.origin}${APP_ROUTES.DEVELOPER_PORTAL_ONBOARDING_STEP(3)}`,
        },
      });
      if (res.error) throw new Error(res.error.message);
      const { url } = res.data as { url: string };
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка Stripe Connect');
      setStripeStarted(false);
    }
  }

  // ── Final submit ─────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!developerId) {
      toast.error('Профиль не найден');
      return;
    }
    setSubmitting(true);
    try {
      // 1. Update developers row with onboarding data; move to pending review queue.
      const { error: updateErr } = await supabase
        .from('developers')
        .update({
          legal_name: step1Data.legal_name,
          registration_number: step1Data.registration_number || null,
          country: step1Data.country,
          website: step1Data.website || null,
          description_en: step2Data.description_en,
          description_ru: step2Data.description_ru,
          logo_url: logoUrl || developer?.logo_url || null,
          devmod_status: 'pending',
        } as Record<string, unknown>)
        .eq('id', developerId);
      if (updateErr) throw updateErr;

      // 2. Edge function: developer_users owner row, notifies admin (Telegram + email).
      await supabase.functions.invoke('devmod-apply', {
        body: { developer_id: developerId },
      });

      qc.invalidateQueries({ queryKey: ['developer-profile'] });
      navigate(APP_ROUTES.DEVELOPER_PORTAL_PENDING);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Step handlers ────────────────────────────────────────────────────

  async function goNext1(data: Step1Data) {
    setStep1Data(data);
    if (!user) return;

    let id = developerId;
    if (!id) {
      setCreatingDeveloperRow(true);
      try {
        const slugBase =
          data.legal_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') || 'developer';
        const slug = `${slugBase}-${user.id.slice(0, 8)}`;
        const { data: row, error } = await supabase
          .from('developers')
          .insert({
            user_id: user.id,
            name_en: data.legal_name,
            name_ru: data.legal_name,
            legal_name: data.legal_name,
            registration_number: data.registration_number || null,
            country: data.country,
            website: data.website || null,
            slug,
            is_active: false,
            is_verified: false,
            is_featured: false,
            devmod_status: 'suspended',
          })
          .select('id')
          .single();
        if (error) throw error;
        if (row?.id) {
          setPendingDeveloperId(row.id);
          id = row.id;
        }
        await qc.invalidateQueries({ queryKey: ['developer-profile'] });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Не удалось создать профиль застройщика');
        return;
      } finally {
        setCreatingDeveloperRow(false);
      }
    }
    if (!id) {
      toast.error('Не удалось создать профиль');
      return;
    }
    setStep(2);
  }

  function goNext2(data: Step2Data) {
    setStep2Data(data);
    setStep(3);
  }

  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  const STEP_LABELS = [
    { n: 1, label: 'Компания' },
    { n: 2, label: 'Медиа' },
    { n: 3, label: 'Stripe' },
    { n: 4, label: 'Проверка' },
  ];

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <NewbuildsLayout hideNav>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 md:py-16">
        <div className="w-full max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="w-11 h-11 rounded-xl bg-[hsl(var(--nb-gold)/0.15)] border border-[hsl(var(--nb-gold)/0.25)] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-[hsl(var(--nb-gold))]" />
            </div>
            <div className="min-w-0">
              <h1 className="nb-display text-xl md:text-2xl text-[hsl(var(--nb-text))] leading-tight">Настройка профиля застройщика</h1>
              <p className="text-sm text-[hsl(var(--nb-text-secondary))]">Шаг {step} из {TOTAL_STEPS} · {STEP_LABELS[step - 1]?.label}</p>
            </div>
          </div>

          {/* Step indicator dots */}
          <div className="flex items-center gap-2 mb-4">
            {STEP_LABELS.map(({ n, label }) => {
              const isDone = n < step;
              const isCurrent = n === step;
              return (
                <div key={n} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                  <div
                    className={`h-1 w-full rounded-full transition-colors ${
                      isDone || isCurrent
                        ? 'bg-[hsl(var(--nb-gold))]'
                        : 'bg-[hsl(var(--nb-text)/0.1)]'
                    }`}
                  />
                  <span
                    className={`text-[10px] uppercase tracking-wider truncate w-full text-center ${
                      isCurrent
                        ? 'text-[hsl(var(--nb-gold))] font-medium'
                        : isDone
                        ? 'text-[hsl(var(--nb-text-secondary))]'
                        : 'text-[hsl(var(--nb-muted))]'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="nb-glass p-6 md:p-8 rounded-2xl mt-4">

            {/* ── Step 1: Company details ── */}
            {step === 1 && (
              <form onSubmit={form1.handleSubmit(goNext1)} className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-[hsl(var(--nb-text))] mb-1">Данные компании</h2>
                  <p className="text-sm text-[hsl(var(--nb-text-secondary))]">Юридическая информация для MOU и счетов</p>
                </div>

                <div>
                  <label className="text-xs text-[hsl(var(--nb-muted))] mb-1.5 block">Юридическое название *</label>
                  <Input
                    placeholder="Peylaa Development Co., Ltd."
                    {...form1.register('legal_name')}
                    className="nb-input"
                  />
                  {form1.formState.errors.legal_name && (
                    <p className="text-xs text-red-400 mt-1">{form1.formState.errors.legal_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-[hsl(var(--nb-muted))] mb-1.5 block">Регистрационный номер</label>
                  <Input
                    placeholder="0105563xxxxx"
                    {...form1.register('registration_number')}
                    className="nb-input"
                  />
                </div>

                <div>
                  <label className="text-xs text-[hsl(var(--nb-muted))] mb-1.5 block">Страна регистрации *</label>
                  <Select
                    defaultValue="TH"
                    onValueChange={(v) => form1.setValue('country', v)}
                  >
                    <SelectTrigger className="nb-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-[hsl(var(--nb-muted))] mb-1.5 block">Сайт компании</label>
                  <Input
                    placeholder="https://peylaa.com"
                    type="url"
                    {...form1.register('website')}
                    className="nb-input"
                  />
                  {form1.formState.errors.website && (
                    <p className="text-xs text-red-400 mt-1">{form1.formState.errors.website.message}</p>
                  )}
                </div>

                <Button type="submit" className="nb-btn-gold w-full mt-2" disabled={creatingDeveloperRow}>
                  {creatingDeveloperRow ? 'Создание профиля…' : (
                    <>Далее <ChevronRight className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
              </form>
            )}

            {/* ── Step 2: Logo + description ── */}
            {step === 2 && (
              <form onSubmit={form2.handleSubmit(goNext2)} className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-[hsl(var(--nb-text))] mb-1">Медиа и описание</h2>
                  <p className="text-sm text-[hsl(var(--nb-text-secondary))]">Покупатели увидят эту информацию на странице вашей компании</p>
                </div>

                {/* Logo upload */}
                <div>
                  <label className="text-xs text-[hsl(var(--nb-muted))] mb-1.5 block">Логотип компании</label>
                  <div
                    className="border-2 border-dashed border-[hsl(var(--nb-glass-border))] rounded-xl p-6 text-center cursor-pointer hover:border-[hsl(var(--nb-gold)/0.5)] transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={logoUrl} alt="Logo" className="h-16 object-contain rounded" />
                        <span className="text-xs text-[hsl(var(--nb-muted))]">Нажмите для замены</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-[hsl(var(--nb-muted))]" />
                        <span className="text-sm text-[hsl(var(--nb-text-secondary))]">
                          {logoUploading ? 'Загрузка...' : 'PNG / JPG, до 5 МБ'}
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>

                <div>
                  <label className="text-xs text-[hsl(var(--nb-muted))] mb-1.5 block">Описание (English) *</label>
                  <Textarea
                    placeholder="Award-winning Phuket developer specializing in luxury condominiums..."
                    rows={4}
                    {...form2.register('description_en')}
                    className="nb-input resize-none"
                  />
                  {form2.formState.errors.description_en && (
                    <p className="text-xs text-red-400 mt-1">{form2.formState.errors.description_en.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-[hsl(var(--nb-muted))] mb-1.5 block">Описание (Русский) *</label>
                  <Textarea
                    placeholder="Застройщик премиум-жилья на Пхукете с 10-летней историей..."
                    rows={4}
                    {...form2.register('description_ru')}
                    className="nb-input resize-none"
                  />
                  {form2.formState.errors.description_ru && (
                    <p className="text-xs text-red-400 mt-1">{form2.formState.errors.description_ru.message}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Назад
                  </Button>
                  <Button type="submit" className="nb-btn-gold flex-1">
                    Далее <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </form>
            )}

            {/* ── Step 3: Stripe Connect ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-[hsl(var(--nb-text))] mb-1">Stripe Connect</h2>
                  <p className="text-sm text-[hsl(var(--nb-text-secondary))]">
                    Для получения комиссионных выплат подключите аккаунт Stripe.
                    Это займёт 5–10 минут.
                  </p>
                </div>

                <div className="bg-[hsl(var(--nb-gold)/0.08)] border border-[hsl(var(--nb-gold)/0.2)] rounded-xl p-4 text-sm text-[hsl(var(--nb-text-secondary))]">
                  <p className="font-medium text-[hsl(var(--nb-text))] mb-2">Что вы получаете:</p>
                  <ul className="space-y-1">
                    <li>• Автоматические выплаты при закрытии сделок</li>
                    <li>• Комиссия удерживается автоматически через escrow</li>
                    <li>• Поддержка THB, USD, EUR</li>
                  </ul>
                </div>

                <div className="bg-[hsl(var(--nb-surface))] border border-[hsl(var(--nb-glass-border))] rounded-xl p-4 text-sm">
                  <p className="text-[hsl(var(--nb-muted))]">
                    Можно пропустить сейчас и подключить позже в разделе «Компания».
                    До подключения Stripe вы не сможете публиковать проекты.
                  </p>
                </div>

                <Button
                  className="nb-btn-gold w-full"
                  onClick={startStripeConnect}
                  disabled={stripeStarted}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {stripeStarted ? 'Переход в Stripe...' : 'Подключить Stripe Connect'}
                </Button>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Назад
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(4)}
                    className="flex-1 text-[hsl(var(--nb-muted))]"
                  >
                    Пропустить →
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 4: Review + submit ── */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-[hsl(var(--nb-text))] mb-1">Проверьте данные</h2>
                  <p className="text-sm text-[hsl(var(--nb-text-secondary))]">После отправки заявка уйдёт на проверку (1–2 рабочих дня)</p>
                </div>

                <div className="space-y-3">
                  <ReviewRow label="Юридическое название" value={step1Data.legal_name} />
                  <ReviewRow label="Страна" value={COUNTRIES.find(c => c.code === step1Data.country)?.label ?? step1Data.country} />
                  {step1Data.registration_number && <ReviewRow label="Рег. номер" value={step1Data.registration_number} />}
                  {step1Data.website && <ReviewRow label="Сайт" value={step1Data.website} />}
                  <ReviewRow label="Описание EN" value={step2Data.description_en.substring(0, 80) + '...'} />
                  <ReviewRow label="Логотип" value={logoUrl ? '✓ Загружен' : '— Не загружен'} />
                  <ReviewRow label="Stripe Connect" value={stripeStarted ? '✓ Настроен' : '— Пропущен (настроить позже)'} />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(3)} className="flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Назад
                  </Button>
                  <Button
                    className="nb-btn-gold flex-1"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {submitting ? 'Отправка...' : 'Отправить заявку'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </NewbuildsLayout>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-[hsl(var(--nb-glass-border))] last:border-0">
      <span className="text-xs text-[hsl(var(--nb-muted))] uppercase tracking-wide w-32 shrink-0">{label}</span>
      <span className="text-sm text-[hsl(var(--nb-text))] text-right">{value}</span>
    </div>
  );
}
