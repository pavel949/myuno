/**
 * /thai-business — public B2B acquisition landing for Thai business owners.
 *
 * Standalone microsite (no app shell), modelled on ThaiBusinessLanding. Pitches
 * myUNO's services (multilingual menus, websites, promotion, automation,
 * payments) to Thai SMB owners and captures a lead. Trilingual TH/EN/RU via a
 * local on-page toggle (the global LanguageContext is RU/EN only).
 *
 * Lead flow: anonymous insert into `thai_partner_leads` (RLS allows public
 * INSERT) → best-effort `thai-notify` (kind: 'partner_lead') WhatsApps the admin.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowRight, Check, Globe, Languages, Megaphone, CalendarClock,
  CreditCard, MessageCircle, CheckCircle2, type LucideIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { thaiTable, supabase } from '@/hooks/thaiServices/db';
import {
  PARTNER_COPY, PARTNER_LANGS, type PartnerLang,
} from './partnerLandingCopy';

const OFFER_ICONS: Record<string, LucideIcon> = {
  menu: Languages,
  website: Globe,
  promotion: Megaphone,
  automation: CalendarClock,
  payments: CreditCard,
  translation: MessageCircle,
};

const schema = z.object({
  name: z.string().min(2),
  business: z.string().optional(),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal('')),
  category: z.string().optional(),
  message: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function ThaiBusinessPartner() {
  const [lang, setLang] = useState<PartnerLang>('th');
  const [interests, setInterests] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const t = PARTNER_COPY[lang];

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const toggleInterest = (key: string) =>
    setInterests((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));

  const onSubmit = async (values: FormValues) => {
    setStatus('submitting');
    try {
      const { data, error } = await thaiTable('thai_partner_leads')
        .insert({
          contact_name: values.name,
          business_name: values.business || null,
          phone: values.phone,
          email: values.email || null,
          category: values.category || null,
          interests,
          message: values.message || null,
          preferred_lang: lang,
          source: 'thai_business_landing',
        })
        .select('id')
        .single();
      if (error) throw error;
      // Best-effort admin alert; never block the success state on it.
      supabase.functions
        .invoke('thai-notify', { body: { kind: 'partner_lead', leadId: (data as { id: string }).id } })
        .catch(() => undefined);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{t.metaTitle}</title>
        <meta name="description" content={t.metaDescription} />
        <meta property="og:title" content={t.metaTitle} />
        <meta property="og:description" content={t.metaDescription} />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight">myUNO</Link>
          <div className="flex items-center gap-1">
            {PARTNER_LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                aria-pressed={lang === l.code}
                className={`min-w-11 h-9 px-3 text-sm transition-colors ${
                  lang === l.code
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
          <p className="text-accent text-sm font-medium uppercase tracking-widest mb-4">{t.hero.eyebrow}</p>
          <h1 className="font-serif text-4xl md:text-6xl font-semibold leading-[1.05] max-w-3xl">
            {t.hero.title}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-primary-foreground/80 max-w-2xl leading-relaxed">
            {t.hero.subtitle}
          </p>
          <a
            href="#apply"
            className="mt-8 inline-flex items-center gap-2 bg-accent text-accent-foreground font-medium px-7 py-3.5 hover:opacity-90 transition-opacity"
          >
            {t.hero.cta}
            <ArrowRight className="w-4 h-4" />
          </a>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-foreground/70">
            {t.hero.chips.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-accent" />{c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pains ── */}
      <section className="max-w-5xl mx-auto px-4 py-16 md:py-20">
        <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-10">{t.painsTitle}</h2>
        <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
          {t.pains.map((p) => (
            <div key={p.title} className="bg-background p-6">
              <h3 className="font-medium text-lg">{p.title}</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Offer ── */}
      <section className="bg-card border-y border-border">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-20">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold">{t.offerTitle}</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">{t.offerSubtitle}</p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.offers.map((o) => {
              const Icon = OFFER_ICONS[o.key] ?? Globe;
              return (
                <div key={o.key} className="bg-background border border-border p-6">
                  <div className="w-11 h-11 flex items-center justify-center bg-primary/5 text-primary mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-medium text-lg">{o.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{o.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Steps ── */}
      <section className="max-w-5xl mx-auto px-4 py-16 md:py-20">
        <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-10">{t.stepsTitle}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {t.steps.map((s, i) => (
            <div key={s.title}>
              <div className="font-mono text-accent text-4xl font-semibold tabular-nums">{i + 1}</div>
              <h3 className="mt-3 font-medium text-lg">{s.title}</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Apply form ── */}
      <section id="apply" className="bg-primary text-primary-foreground scroll-mt-16">
        <div className="max-w-2xl mx-auto px-4 py-16 md:py-24">
          {status === 'success' ? (
            <div className="text-center">
              <CheckCircle2 className="w-14 h-14 text-accent mx-auto" />
              <h2 className="font-serif text-3xl font-semibold mt-5">{t.form.successTitle}</h2>
              <p className="mt-3 text-primary-foreground/80">{t.form.successBody}</p>
              <Link
                to="/"
                className="mt-8 inline-flex items-center gap-2 border border-primary-foreground/30 px-6 py-3 hover:bg-primary-foreground/10 transition-colors"
              >
                myUNO <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold">{t.form.title}</h2>
              <p className="mt-3 text-primary-foreground/80">{t.form.subtitle}</p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label={`${t.form.name} *`} error={errors.name && t.form.requiredNote}>
                    <Input {...register('name')} className="bg-background text-foreground" />
                  </Field>
                  <Field label={t.form.business}>
                    <Input {...register('business')} className="bg-background text-foreground" />
                  </Field>
                  <Field label={`${t.form.phone} *`} error={errors.phone && t.form.requiredNote}>
                    <Input {...register('phone')} inputMode="tel" className="bg-background text-foreground" />
                  </Field>
                  <Field label={t.form.email} error={errors.email && t.form.errorMsg}>
                    <Input {...register('email')} type="email" className="bg-background text-foreground" />
                  </Field>
                </div>

                <Field label={t.form.category}>
                  <select
                    {...register('category')}
                    className="w-full h-10 px-3 bg-background text-foreground border border-input text-sm"
                    defaultValue=""
                  >
                    <option value="" disabled>{t.form.categoryPlaceholder}</option>
                    {t.categories.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </Field>

                <div>
                  <label className="block text-sm text-primary-foreground/80 mb-2">{t.form.interests}</label>
                  <div className="flex flex-wrap gap-2">
                    {t.offers.map((o) => {
                      const active = interests.includes(o.key);
                      return (
                        <button
                          key={o.key}
                          type="button"
                          onClick={() => toggleInterest(o.key)}
                          aria-pressed={active}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm border transition-colors ${
                            active
                              ? 'bg-accent text-accent-foreground border-accent'
                              : 'border-primary-foreground/30 text-primary-foreground/90 hover:bg-primary-foreground/10'
                          }`}
                        >
                          {active && <Check className="w-3.5 h-3.5" />}
                          {o.title}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Field label={t.form.message}>
                  <Textarea {...register('message')} rows={3} className="bg-background text-foreground" />
                </Field>

                {status === 'error' && (
                  <p className="text-sm text-accent">{t.form.errorMsg}</p>
                )}

                <Button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base font-medium"
                >
                  {status === 'submitting' ? t.form.submitting : t.form.submit}
                </Button>
                <p className="text-xs text-primary-foreground/60">{t.form.requiredNote}</p>
              </form>
            </>
          )}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {t.footer}
      </footer>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string | false; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-primary-foreground/80 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-accent">{error}</p>}
    </div>
  );
}
