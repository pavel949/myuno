import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Building2, Calendar, BarChart3, Sparkles, ArrowRight, MessageCircle, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWhatsAppUrl } from '@/lib/config/contacts';
import type { Language } from '@/i18n';

type L<T> = Record<Language, T>;
const pick = <T,>(lang: Language, dict: L<T>): T => dict[lang] ?? dict.en ?? dict.ru;

const FEATURES: Array<{ icon: typeof Calendar; text: L<{ t: string; d: string }> }> = [
  {
    icon: Calendar,
    text: {
      ru: { t: 'Единый календарь', d: 'Airbnb, Booking, прямые брони — в одной таймлайне. iCal-синхронизация.' },
      en: { t: 'Unified calendar', d: 'Airbnb, Booking, direct bookings — one timeline. iCal sync.' },
      th: { t: 'ปฏิทินรวม', d: 'Airbnb, Booking และจองตรง — ในไทม์ไลน์เดียว ซิงค์ iCal' },
    },
  },
  {
    icon: Building2,
    text: {
      ru: { t: 'Управление объектами', d: 'Виллы и кондо: гайдбук, документы, инвентарь, ключи.' },
      en: { t: 'Property ops', d: 'Villas and condos: guidebook, docs, inventory, keys.' },
      th: { t: 'จัดการทรัพย์สิน', d: 'วิลล่าและคอนโด: คู่มือ เอกสาร สินค้าคงคลัง กุญแจ' },
    },
  },
  {
    icon: BarChart3,
    text: {
      ru: { t: 'Финансы и отчёты', d: 'P&L по каждому объекту, owner statements, выплаты собственникам.' },
      en: { t: 'Finance & reports', d: 'Per-property P&L, owner statements, owner payouts.' },
      th: { t: 'การเงินและรายงาน', d: 'งบกำไรขาดทุนรายทรัพย์สิน รายงานเจ้าของ และโอนเงินให้เจ้าของ' },
    },
  },
  {
    icon: Sparkles,
    text: {
      ru: { t: 'AI-помощник', d: 'Ответы гостям, автозадачи уборки, рекомендации цены.' },
      en: { t: 'AI helper', d: 'Guest replies, cleaning auto-tasks, price recommendations.' },
      th: { t: 'ผู้ช่วย AI', d: 'ตอบแขก สั่งงานทำความสะอาดอัตโนมัติ และแนะนำราคา' },
    },
  },
];

const UI = {
  title: {
    ru: 'STAYS — PMS для управляющих компаний за $25 в месяц',
    en: 'STAYS — PMS for management companies at $25/month',
    th: 'STAYS — ระบบ PMS สำหรับบริษัทบริหารทรัพย์สิน เพียง $25/เดือน',
  },
  desc: {
    ru: 'Полноценная система управления арендой по цене кофе. $25 за объект в месяц. Никаких сетапов и долгосрочных контрактов.',
    en: 'A full property-management system at the price of a coffee. $25 per property per month. No setup, no lock-in.',
    th: 'ระบบบริหารทรัพย์สินครบวงจรในราคาเท่ากาแฟ $25 ต่อทรัพย์สินต่อเดือน ไม่มีค่าติดตั้ง ไม่มีสัญญาผูกมัด',
  },
  h1: {
    ru: 'PMS для управляющих компаний',
    en: 'PMS for management companies',
    th: 'PMS สำหรับบริษัทบริหารทรัพย์สิน',
  },
  sub: {
    ru: 'Управляйте 5, 50 или 500 объектами в одной системе. Календарь, финансы, гости, команда — без Excel.',
    en: 'Run 5, 50 or 500 properties in one system. Calendar, finance, guests, team — no Excel.',
    th: 'บริหาร 5, 50 หรือ 500 ทรัพย์สินในระบบเดียว ปฏิทิน การเงิน แขก ทีมงาน — ไม่ต้องใช้ Excel',
  },
  pricing: {
    ru: 'за объект в месяц · отмена в любой момент',
    en: 'per property per month · cancel anytime',
    th: 'ต่อทรัพย์สินต่อเดือน · ยกเลิกได้ทุกเมื่อ',
  },
  startBtn: { ru: 'Начать подписку', en: 'Start subscription', th: 'เริ่มต้นสมัครสมาชิก' },
  askWa: { ru: 'Спросить в WhatsApp', en: 'Ask on WhatsApp', th: 'สอบถามทาง WhatsApp' },
  waMsg: {
    ru: 'Здравствуйте! Интересует подписка STAYS для управляющей компании',
    en: 'Hi! Interested in the STAYS subscription for my management company',
    th: 'สวัสดีครับ/ค่ะ สนใจสมัครสมาชิก STAYS สำหรับบริษัทบริหารทรัพย์สิน',
  },
  bullets: {
    ru: ['Без сетапа: создаёте аккаунт — и работаете.', 'Без долгосрочных контрактов — оплата помесячно.', 'Бесплатная миграция данных при подключении от 10 объектов.'],
    en: ['No setup fee — sign up and start.', 'Month-to-month, no long-term contracts.', 'Free data migration for portfolios of 10+ properties.'],
    th: ['ไม่มีค่าติดตั้ง — สมัครและเริ่มใช้ได้เลย', 'ชำระรายเดือน ไม่มีสัญญาระยะยาว', 'ย้ายข้อมูลฟรีสำหรับพอร์ตโฟลิโอ 10+ ทรัพย์สิน'],
  },
};

export default function StaysSubscriptionLanding() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const lang = language as Language;

  const waUrl = getWhatsAppUrl(pick(lang, UI.waMsg));
  const title = pick(lang, UI.title);
  const desc = pick(lang, UI.desc);

  return (
    <AppLayout>
      <Helmet>
        <html lang={lang} />
        <title>{title}</title>
        <meta name="description" content={desc.slice(0, 155)} />
        <link rel="canonical" href="https://www.myuno.app/stays" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc.slice(0, 155)} />
        <meta property="og:url" content="https://www.myuno.app/stays" />
        <meta property="og:locale" content={lang === 'ru' ? 'ru_RU' : lang === 'th' ? 'th_TH' : 'en_US'} />
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
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 text-foreground">{pick(lang, UI.h1)}</h1>
          <p className="text-base md:text-lg text-muted-foreground mb-2 leading-relaxed">{pick(lang, UI.sub)}</p>
          <div className="text-5xl font-bold text-foreground mb-1 mt-6">$25</div>
          <div className="text-sm text-muted-foreground mb-6">{pick(lang, UI.pricing)}</div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate('/owner/subscription')} className="gap-2">
              {pick(lang, UI.startBtn)}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.open(waUrl, '_blank')} className="gap-2">
              <MessageCircle className="w-4 h-4" />
              {pick(lang, UI.askWa)}
            </Button>
          </div>
        </section>

        <section className="px-4 pb-12 max-w-3xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              const text = pick(lang, f.text);
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
              {pick(lang, UI.bullets).map((b, i) => (
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
