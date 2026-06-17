import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Compass,
  Home,
  Building2,
  Briefcase,
  ShieldCheck,
  CreditCard,
  MessageCircle,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { COMPANY_CONTACTS, getTelLink } from '@/lib/config/contacts';

export default function AboutPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const t = (ru: string, en: string) => (isRu ? ru : en);

  const audience = [
    {
      icon: Compass,
      title: t('Гости и туристы', 'Visitors & tourists'),
      body: t(
        'Жильё, трансфер, рестораны, активности — всё в одном аккаунте, оплата картой или переводом.',
        'Stays, transfers, restaurants, experiences — one account, card or bank payments.',
      ),
    },
    {
      icon: Home,
      title: t('Резиденты и релоканты', 'Residents & relocators'),
      body: t(
        'Школы, клиники, визы, аренда, юристы — проверенные локальные сервисы на русском и английском.',
        'Schools, clinics, visas, rentals, lawyers — vetted local services in English and Russian.',
      ),
    },
    {
      icon: Building2,
      title: t('Владельцы недвижимости', 'Property owners'),
      body: t(
        'Управление арендой, отчётность, уборки, ремонты и выплаты собственнику в одном кабинете.',
        'Rental management, statements, cleaning, maintenance and owner payouts in one dashboard.',
      ),
    },
    {
      icon: Briefcase,
      title: t('Инвесторы и предприниматели', 'Investors & operators'),
      body: t(
        'Каталог проектов off-plan, рейтинг ClearView™, юридическое сопровождение сделок.',
        'Off-plan catalogue, ClearView™ ratings, legal support for transactions.',
      ),
    },
  ];

  const principles = [
    {
      icon: ShieldCheck,
      title: t('Проверенные партнёры', 'Vetted partners'),
      body: t(
        'Каждый сервис проходит верификацию: документы, лицензии, отзывы. Без анонимных контактов в чатах.',
        'Every service is verified: documents, licences, reviews. No anonymous chat contacts.',
      ),
    },
    {
      icon: CreditCard,
      title: t('Прозрачные платежи', 'Transparent payments'),
      body: t(
        'Цены в батах, комиссии видны заранее. Возврат при неоказании услуги — по правилам Stripe и нашей политики.',
        'Prices in THB, fees shown upfront. Refunds on failed services follow Stripe rules and our policy.',
      ),
    },
    {
      icon: MessageCircle,
      title: t('Поддержка на вашем языке', 'Support in your language'),
      body: t(
        'Чат, email и WhatsApp на русском и английском. Отвечаем по будням, срочные вопросы — круглосуточно.',
        'Chat, email and WhatsApp in English and Russian. Weekday hours, urgent issues 24/7.',
      ),
    },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title={t('О myUNO', 'About myUNO')}
          subtitle={t(
            'Цифровая инфраструктура для жизни на Пхукете.',
            'Digital infrastructure for life on Phuket.',
          )}
        />

        <SectionCard className="mb-6">
          <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
            <p>
              {t(
                'myUNO — единый аккаунт для всего, что нужно иностранцу на Пхукете: жильё и бронирования, медицина и образование, юристы и визы, управление недвижимостью и инвестиции.',
                'myUNO is a single account for everything a foreigner needs on Phuket: stays and bookings, healthcare and education, lawyers and visas, property management and investments.',
              )}
            </p>
            <p className="text-muted-foreground">
              {t(
                'Мы не оказываем услуги сами — мы соединяем вас с локальными командами и контролируем качество, оплаты и документы.',
                'We don\'t deliver the services ourselves — we connect you with local teams and oversee quality, payments and paperwork.',
              )}
            </p>
          </div>
        </SectionCard>

        <h2 className="mb-3 text-base font-semibold">
          {t('Для кого мы работаем', 'Who we serve')}
        </h2>
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {audience.map((item) => (
            <SectionCard key={item.title}>
              <div className="flex items-start gap-3">
                <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>

        <h2 className="mb-3 text-base font-semibold">
          {t('Как мы работаем', 'How we work')}
        </h2>
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {principles.map((item) => (
            <SectionCard key={item.title}>
              <item.icon className="mb-2 h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </SectionCard>
          ))}
        </div>

        <SectionCard className="mb-6">
          <h2 className="mb-2 text-base font-semibold">
            {t('Где мы', 'Where we operate')}
          </h2>
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              {t(
                'Главный офис и операционная команда — Пхукет, Таиланд. Постепенно расширяемся на соседние регионы Юго-Восточной Азии.',
                'HQ and operations team on Phuket, Thailand. Gradually expanding to neighbouring Southeast Asian regions.',
              )}
            </p>
          </div>
        </SectionCard>

        <SectionCard>
          <h2 className="mb-2 text-base font-semibold">
            {t('Связаться с нами', 'Get in touch')}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {t(
              'Вопросы по сервису, партнёрству или сделке — пишите, мы ответим.',
              'Questions about the service, partnerships or a deal — drop us a line.',
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate('/info/contact')}>
              {t('Контакты', 'Contacts')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {COMPANY_CONTACTS.supportEmail && (
              <Button variant="outline" asChild>
                <a href={`mailto:${COMPANY_CONTACTS.supportEmail}`}>
                  {COMPANY_CONTACTS.supportEmail}
                </a>
              </Button>
            )}
            {COMPANY_CONTACTS.phone && (
              <Button variant="outline" asChild>
                <a href={getTelLink(COMPANY_CONTACTS.phone)}>{COMPANY_CONTACTS.phone}</a>
              </Button>
            )}
          </div>
        </SectionCard>
      </PageContainer>
    </AppLayout>
  );
}
