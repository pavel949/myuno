import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Building2, Calendar, BarChart3, Sparkles, ArrowRight, MessageCircle, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWhatsAppUrl } from '@/lib/config/contacts';

const FEATURES = [
  { icon: Calendar, ru: { t: 'Единый календарь', d: 'Airbnb, Booking, прямые брони — в одной таймлайне. iCal-синхронизация.' }, en: { t: 'Unified calendar', d: 'Airbnb, Booking, direct bookings — one timeline. iCal sync.' } },
  { icon: Building2, ru: { t: 'Управление объектами', d: 'Виллы и кондо: гайдбук, документы, инвентарь, ключи.' }, en: { t: 'Property ops', d: 'Villas and condos: guidebook, docs, inventory, keys.' } },
  { icon: BarChart3, ru: { t: 'Финансы и отчёты', d: 'P&L по каждому объекту, owner statements, выплаты собственникам.' }, en: { t: 'Finance & reports', d: 'Per-property P&L, owner statements, owner payouts.' } },
  { icon: Sparkles, ru: { t: 'AI-помощник', d: 'Ответы гостям, автозадачи уборки, рекомендации цены.' }, en: { t: 'AI helper', d: 'Guest replies, cleaning auto-tasks, price recommendations.' } },
];

export default function StaysSubscriptionLanding() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const waUrl = getWhatsAppUrl(
    isRu ? 'Здравствуйте! Интересует подписка STAYS для управляющей компании' : 'Hi! Interested in the STAYS subscription for my management company'
  );

  const title = isRu ? 'STAYS — PMS для управляющих компаний за $25 в месяц' : 'STAYS — PMS for management companies at $25/month';
  const desc = isRu
    ? 'Полноценная система управления арендой по цене кофе. $25 за объект в месяц. Никаких сетапов и долгосрочных контрактов.'
    : 'A full property-management system at the price of a coffee. $25 per property per month. No setup, no lock-in.';

  return (
    <AppLayout>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc.slice(0, 155)} />
        <link rel="canonical" href="https://www.myuno.app/stays" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc.slice(0, 155)} />
        <meta property="og:url" content="https://www.myuno.app/stays" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'myUNO STAYS',
          description: desc,
          brand: { '@type': 'Brand', name: 'myUNO' },
          offers: { '@type': 'Offer', price: '25', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <section className="px-4 pt-10 pb-10 max-w-3xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 tracking-wider text-xs">STAYS · PHUKET</Badge>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 text-foreground">
            {isRu ? 'PMS для управляющих компаний' : 'PMS for management companies'}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-2 leading-relaxed">
            {isRu
              ? 'Управляйте 5, 50 или 500 объектами в одной системе. Календарь, финансы, гости, команда — без Excel.'
              : 'Run 5, 50 or 500 properties in one system. Calendar, finance, guests, team — no Excel.'}
          </p>
          <div className="text-5xl font-bold text-foreground mb-1 mt-6">$25</div>
          <div className="text-sm text-muted-foreground mb-6">
            {isRu ? 'за объект в месяц · отмена в любой момент' : 'per property per month · cancel anytime'}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate('/owner/subscription')} className="gap-2">
              {isRu ? 'Начать подписку' : 'Start subscription'}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.open(waUrl, '_blank')} className="gap-2">
              <MessageCircle className="w-4 h-4" />
              {isRu ? 'Спросить в WhatsApp' : 'Ask on WhatsApp'}
            </Button>
          </div>
        </section>

        <section className="px-4 pb-12 max-w-3xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              const text = isRu ? f.ru : f.en;
              return (
                <Card key={i}>
                  <CardContent className="p-5 space-y-2">
                    <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{text.t}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{text.d}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="px-4 pb-16 max-w-3xl mx-auto">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 space-y-3">
              {(isRu
                ? ['Без сетапа: создаёте аккаунт — и работаете.', 'Без долгосрочных контрактов — оплата помесячно.', 'Бесплатная миграция данных при подключении от 10 объектов.']
                : ['No setup fee — sign up and start.', 'Month-to-month, no long-term contracts.', 'Free data migration for portfolios of 10+ properties.']
              ).map((b, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-foreground">{b}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
