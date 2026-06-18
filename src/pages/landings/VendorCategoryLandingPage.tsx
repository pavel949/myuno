import { useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { TrendingUp, Users, CreditCard, ShieldCheck, Zap, Star, ArrowRight, MessageCircle, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { getVendorCategory, type ValueProp } from '@/lib/landings/vendorCategories';
import { getWhatsAppUrl } from '@/lib/config/contacts';

const ICONS = { TrendingUp, Users, CreditCard, ShieldCheck, Zap, Star } as const;

function ValuePropCard({ vp, isRu }: { vp: ValueProp; isRu: boolean }) {
  const Icon = ICONS[vp.iconName] ?? Star;
  const text = isRu ? vp.ru : vp.en;
  return (
    <Card>
      <CardContent className="p-5 space-y-2">
        <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">{text.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{text.desc}</p>
      </CardContent>
    </Card>
  );
}

export default function VendorCategoryLandingPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const cfg = useMemo(() => getVendorCategory(category), [category]);
  if (!cfg) return <Navigate to="/vendor/join" replace />;

  const hero = isRu ? cfg.hero.ru : cfg.hero.en;
  const audience = isRu ? cfg.audience.ru : cfg.audience.en;

  const joinUrl = `/vendor/join?category=${cfg.id}`;
  const waUrl = getWhatsAppUrl(
    isRu
      ? `Здравствуйте! Хочу присоединиться к myUNO как партнёр (${cfg.id})`
      : `Hi! I want to join myUNO as a partner (${cfg.id})`
  );

  const canonicalPath = `/for/vendor/${cfg.id}`;
  const pageTitle = isRu
    ? `${hero.title} — myUNO для партнёров`
    : `${hero.title} — myUNO for partners`;
  const pageDesc = hero.subtitle.slice(0, 155);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: cfg.id,
    provider: { '@type': 'Organization', name: 'myUNO', url: 'https://www.myuno.app' },
    areaServed: { '@type': 'Place', name: 'Phuket, Thailand' },
    audience: { '@type': 'BusinessAudience', name: audience },
  };

  return (
    <AppLayout>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={`https://www.myuno.app${canonicalPath}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={`https://www.myuno.app${canonicalPath}`} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="px-4 pt-10 pb-12 max-w-3xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 tracking-wider text-xs">
            {hero.eyebrow}
          </Badge>
          <div className="text-5xl mb-3" aria-hidden>{cfg.emoji}</div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 text-foreground">
            {hero.title}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
            {hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate(joinUrl)} className="gap-2">
              {isRu ? 'Зарегистрироваться' : 'Register now'}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.open(waUrl, '_blank')} className="gap-2">
              <MessageCircle className="w-4 h-4" />
              {isRu ? 'Спросить в WhatsApp' : 'Ask on WhatsApp'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            {isRu ? 'Подходит для: ' : 'For: '}
            <span className="text-foreground">{audience}</span>
          </p>
        </section>

        {/* Commission */}
        <section className="px-4 pb-10 max-w-3xl mx-auto">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {isRu ? 'Комиссия myUNO' : 'myUNO commission'}
                </div>
                <div className="text-3xl font-bold text-foreground">{cfg.commissionPct}%</div>
                <div className="text-sm text-muted-foreground">
                  {isRu ? 'только с фактических продаж' : 'on actual sales only'}
                </div>
              </div>
              <div className="text-sm text-muted-foreground max-w-xs">
                {isRu
                  ? 'Регистрация и размещение бесплатно. Никаких ежемесячных взносов.'
                  : 'Free registration and listing. Zero monthly fees.'}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Value props */}
        <section className="px-4 pb-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6 text-center">
            {isRu ? 'Почему партнёры выбирают myUNO' : 'Why partners choose myUNO'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {cfg.valueProps.map((vp, i) => (
              <ValuePropCard key={i} vp={vp} isRu={isRu} />
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 pb-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6 text-center">
            {isRu ? 'Как начать' : 'How to start'}
          </h2>
          <div className="space-y-3">
            {[
              { ru: 'Регистрация: имя, категория, телефон — 2 минуты.', en: 'Register: name, category, phone — 2 minutes.' },
              { ru: 'Верификация: загрузите документы и фото. Проверим за 24 часа.', en: 'Verification: upload documents and photos. We approve within 24 hours.' },
              { ru: 'Опубликуйте услуги — и принимайте брони.', en: 'Publish services — and start taking bookings.' },
            ].map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                  {i + 1}
                </div>
                <p className="pt-1 text-foreground">{isRu ? step.ru : step.en}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 pb-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6 text-center">FAQ</h2>
          <div className="space-y-3">
            {cfg.faq.map((item, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="flex gap-2 items-start mb-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <h3 className="font-semibold text-foreground">{isRu ? item.q_ru : item.q_en}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6 leading-relaxed">
                    {isRu ? item.a_ru : item.a_en}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Sticky CTA */}
        <div className="sticky bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border p-3 z-30 md:hidden">
          <Button className="w-full gap-2" onClick={() => navigate(joinUrl)}>
            {isRu ? 'Стать партнёром' : 'Become a partner'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
