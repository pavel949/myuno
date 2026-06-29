import { useMemo } from 'react';
import { useParams, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, MessageCircle, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLegalService } from '@/lib/landings/legalServices';
import { pickLocale } from '@/lib/landings/vendorCategories';
import { getWhatsAppUrl } from '@/lib/config/contacts';
import type { Language } from '@/i18n';

const WA_MSG: Record<Language, (id: string) => string> = {
  ru: (id) => `Здравствуйте! Нужна юридическая консультация: ${id}`,
  en: (id) => `Hi! Need legal consultation: ${id}`,
  th: (id) => `สวัสดีครับ/ค่ะ ต้องการปรึกษาด้านกฎหมาย: ${id}`,
};

export default function LegalServiceLanding() {
  const params = useParams<{ service?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const lang = language as Language;

  const serviceId = params.service ?? location.pathname.split('/').filter(Boolean)[1];
  const cfg = useMemo(() => getLegalService(serviceId), [serviceId]);
  if (!cfg) return <Navigate to="/legal" replace />;

  const hero = pickLocale(lang, cfg.hero);
  const bullets = pickLocale(lang, cfg.bullets);
  const ctaLabel = pickLocale(lang, cfg.ctaPrimary.label);

  const waUrl = getWhatsAppUrl((WA_MSG[lang] ?? WA_MSG.en)(cfg.id));

  const canonicalPath = `/legal/${cfg.id}`;
  const pageTitle = `${hero.title}, myUNO Legal`;
  const pageDesc = hero.subtitle.slice(0, 155);

  return (
    <AppLayout>
      <Helmet>
        <html lang={lang} />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={`https://www.myuno.app${canonicalPath}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={`https://www.myuno.app${canonicalPath}`} />
        <meta property="og:locale" content={lang === 'ru' ? 'ru_RU' : lang === 'th' ? 'th_TH' : 'en_US'} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <section className="px-4 pt-10 pb-10 max-w-3xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 tracking-wider text-xs">{hero.eyebrow}</Badge>
          <div className="text-5xl mb-3" aria-hidden>{cfg.emoji}</div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 text-foreground">{hero.title}</h1>
          <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">{hero.subtitle}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate(cfg.ctaPrimary.href)} className="gap-2">
              {ctaLabel}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.open(waUrl, '_blank')} className="gap-2">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
          </div>
        </section>

        <section className="px-4 pb-12 max-w-3xl mx-auto">
          <Card>
            <CardContent className="p-6 space-y-3">
              {bullets.map((b, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-foreground leading-relaxed">{b}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="px-4 pb-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6 text-center">FAQ</h2>
          <div className="space-y-3">
            {cfg.faq.map((item, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-2">{pickLocale(lang, item.q)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{pickLocale(lang, item.a)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
