import { useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { TrendingUp, Users, CreditCard, ShieldCheck, Zap, Star, ArrowRight, MessageCircle, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { getVendorCategory, pickLocale, type ValueProp } from '@/lib/landings/vendorCategories';
import { getWhatsAppUrl } from '@/lib/config/contacts';
import type { Language } from '@/i18n';

const ICONS = { TrendingUp, Users, CreditCard, ShieldCheck, Zap, Star } as const;

const UI = {
  registerNow: { ru: 'Зарегистрироваться', en: 'Register now', th: 'สมัครเลย' },
  askOnWa: { ru: 'Спросить в WhatsApp', en: 'Ask on WhatsApp', th: 'สอบถามทาง WhatsApp' },
  forLabel: { ru: 'Подходит для: ', en: 'For: ', th: 'เหมาะสำหรับ: ' },
  commission: { ru: 'Комиссия myUNO', en: 'myUNO commission', th: 'ค่าคอมมิชชั่น myUNO' },
  onActualOnly: { ru: 'только с фактических продаж', en: 'on actual sales only', th: 'คิดเฉพาะยอดขายจริงเท่านั้น' },
  freeListing: {
    ru: 'Регистрация и размещение бесплатно. Никаких ежемесячных взносов.',
    en: 'Free registration and listing. Zero monthly fees.',
    th: 'สมัครและลงประกาศฟรี ไม่มีค่าธรรมเนียมรายเดือน',
  },
  whyPartners: { ru: 'Почему партнёры выбирают myUNO', en: 'Why partners choose myUNO', th: 'ทำไมพาร์ทเนอร์ถึงเลือก myUNO' },
  howToStart: { ru: 'Как начать', en: 'How to start', th: 'เริ่มต้นอย่างไร' },
  becomePartner: { ru: 'Стать партнёром', en: 'Become a partner', th: 'เป็นพาร์ทเนอร์' },
  waMsg: {
    ru: (c: string) => `Здравствуйте! Хочу присоединиться к myUNO как партнёр (${c})`,
    en: (c: string) => `Hi! I want to join myUNO as a partner (${c})`,
    th: (c: string) => `สวัสดีครับ/ค่ะ ต้องการเข้าร่วม myUNO ในฐานะพาร์ทเนอร์ (${c})`,
  },
  pageTitleSuffix: { ru: ' — myUNO для партнёров', en: ', myUNO for partners', th: ', myUNO สำหรับพาร์ทเนอร์' },
  steps: [
    {
      ru: 'Регистрация: имя, категория, телефон — 2 минуты.',
      en: 'Register: name, category, phone, 2 minutes.',
      th: 'สมัคร: ชื่อ หมวดหมู่ เบอร์โทร, ใช้เวลา 2 นาที',
    },
    {
      ru: 'Верификация: загрузите документы и фото. Проверим за 24 часа.',
      en: 'Verification: upload documents and photos. We approve within 24 hours.',
      th: 'ยืนยันตัวตน: อัปโหลดเอกสารและรูปภาพ เราตรวจสอบภายใน 24 ชั่วโมง',
    },
    {
      ru: 'Опубликуйте услуги — и принимайте брони.',
      en: 'Publish services, and start taking bookings.',
      th: 'เผยแพร่บริการ, แล้วเริ่มรับการจองได้เลย',
    },
  ],
};

function pick<T>(lang: Language, dict: Record<Language, T>): T {
  return dict[lang] ?? dict.en ?? dict.ru;
}

function ValuePropCard({ vp, lang }: { vp: ValueProp; lang: Language }) {
  const Icon = ICONS[vp.iconName] ?? Star;
  const text = pickLocale(lang, vp.text);
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
  const lang = language as Language;

  const cfg = useMemo(() => getVendorCategory(category), [category]);
  if (!cfg) return <Navigate to="/vendor/join" replace />;

  const hero = pickLocale(lang, cfg.hero);
  const audience = pickLocale(lang, cfg.audience);

  const joinUrl = `/vendor/join?category=${cfg.id}`;
  const waUrl = getWhatsAppUrl(pick(lang, UI.waMsg)(cfg.id));

  const canonicalPath = `/for/vendor/${cfg.id}`;
  const pageTitle = `${hero.title}${pick(lang, UI.pageTitleSuffix)}`;
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
        <html lang={lang} />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={`https://www.myuno.app${canonicalPath}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={`https://www.myuno.app${canonicalPath}`} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={lang === 'ru' ? 'ru_RU' : lang === 'th' ? 'th_TH' : 'en_US'} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="px-4 pt-10 pb-12 max-w-3xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 tracking-wider text-xs">{hero.eyebrow}</Badge>
          <div className="text-5xl mb-3" aria-hidden>{cfg.emoji}</div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 text-foreground">{hero.title}</h1>
          <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">{hero.subtitle}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate(joinUrl)} className="gap-2">
              {pick(lang, UI.registerNow)}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.open(waUrl, '_blank')} className="gap-2">
              <MessageCircle className="w-4 h-4" />
              {pick(lang, UI.askOnWa)}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            {pick(lang, UI.forLabel)}
            <span className="text-foreground">{audience}</span>
          </p>
        </section>

        {/* Commission */}
        <section className="px-4 pb-10 max-w-3xl mx-auto">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{pick(lang, UI.commission)}</div>
                <div className="text-3xl font-bold text-foreground">{cfg.commissionPct}%</div>
                <div className="text-sm text-muted-foreground">{pick(lang, UI.onActualOnly)}</div>
              </div>
              <div className="text-sm text-muted-foreground max-w-xs">{pick(lang, UI.freeListing)}</div>
            </CardContent>
          </Card>
        </section>

        {/* Value props */}
        <section className="px-4 pb-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6 text-center">{pick(lang, UI.whyPartners)}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {cfg.valueProps.map((vp, i) => (<ValuePropCard key={i} vp={vp} lang={lang} />))}
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 pb-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6 text-center">{pick(lang, UI.howToStart)}</h2>
          <div className="space-y-3">
            {UI.steps.map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">{i + 1}</div>
                <p className="pt-1 text-foreground">{pick(lang, step)}</p>
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
                    <h3 className="font-semibold text-foreground">{pickLocale(lang, item.q)}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6 leading-relaxed">{pickLocale(lang, item.a)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Sticky CTA */}
        <div className="sticky bottom-0 inset-x-0 bg-background border-t border-border p-3 z-30 md:hidden">
          <Button className="w-full gap-2" onClick={() => navigate(joinUrl)}>
            {pick(lang, UI.becomePartner)}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
