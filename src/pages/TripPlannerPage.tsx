import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { TripChecklist } from '@/components/trip-planner/TripChecklist';
import { HomeDiscoverySearch } from '@/components/home/HomeDiscoverySearch';
import { WhatsAppConciergeBlock } from '@/components/life-flow/WhatsAppConciergeBlock';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { SEOHead } from '@/components/seo/SEOHead';
import '@/styles/cinematic-home.css';

export default function TripPlannerPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = (ru: string, en: string) => isRu ? ru : en;
  const title = t('Отдых начинается здесь.', 'Your holiday starts here.');
  return (
    <AppLayout usePageContainer={false}>
      <SEOHead title={t('Отдых на Пхукете — жильё и подготовка к поездке', 'Phuket holiday — homes and trip planning')} description={t('Найдите жильё и подготовьтесь к поездке: личный список дел, трансфер и впечатления на Пхукете.', 'Find a home and prepare for your trip with a personal checklist, transfers and experiences in Phuket.')} />
      <div className="journey-page">
        <Link to={R.HOME} className="journey-back"><ArrowLeft size={16} aria-hidden="true" />{t('На главную', 'Back to home')}</Link>
        <header className="journey-intro">
          <p className="journey-eyebrow">myUNO · {t('Ваш отдых на Пхукете', 'Your Phuket holiday')}</p>
          <h1>{title}</h1>
          <p>{t('Выберите, где остановиться. Затем спокойно подготовьтесь к поездке — шаг за шагом.', 'Find your place to stay. Then get ready for your trip, one step at a time.')}</p>
        </header>
        <div className="journey-grid">
          <div>
            <section className="journey-primary" aria-labelledby="holiday-home-title">
              <h2 id="holiday-home-title">{t('Где будем жить?', 'Where will you stay?')}</h2>
              <p>{t('Укажите район и даты, чтобы перейти к поиску жилья.', 'Choose an area and dates to search for a home.')}</p>
              <HomeDiscoverySearch rentalOnly />
            </section>
            <TripChecklist />
          </div>
          <aside className="journey-aside" aria-label={t('Для вашего отдыха', 'For your holiday')}>
            <h2>{t('Дальше — приятное.', 'Make it your holiday.')}</h2>
            <p>{t('Добавьте к поездке то, что нужно именно вам.', 'Explore what you would like to add to your trip.')}</p>
            {[
              { to: '/transport/airport-transfer', label: t('Встреча в аэропорту', 'Airport transfer') },
              { to: R.EXPERIENCES, label: t('Впечатления на острове', 'Island experiences') },
              { to: R.GOAL_SERVICES, label: t('Услуги во время отдыха', 'Services during your stay') },
            ].map(l => <Link key={l.to} to={l.to}>{l.label}<ArrowUpRight size={17} aria-hidden="true" /></Link>)}
            <div className="journey-help"><WhatsAppConciergeBlock context="trip" /></div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
