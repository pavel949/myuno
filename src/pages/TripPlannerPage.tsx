import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageShell, PageHeader } from '@/components/page';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TripChecklist } from '@/components/trip-planner/TripChecklist';
import { HomeDiscoverySearch } from '@/components/home/HomeDiscoverySearch';
import { APP_ROUTES as R } from '@/lib/config/routes';
import { SEOHead } from '@/components/seo/SEOHead';
import '@/styles/cinematic-home.css';

export default function TripPlannerPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = (ru: string, en: string) => isRu ? ru : en;
  return (
    <AppLayout usePageContainer={false}>
      <SEOHead title={t('Отдых на Пхукете — жильё и подготовка к поездке', 'Phuket holiday — homes and trip planning')} description={t('Найдите жильё и подготовьтесь к поездке: личный список дел, трансфер и впечатления на Пхукете.', 'Find a home and prepare for your trip with a personal checklist, transfers and experiences in Phuket.')} />
      <PageShell width="wide">
        <PageHeader title={t('Отдых начинается здесь.', 'Your holiday starts here.')}
          subtitle={t('Выберите, где остановиться. Затем подготовьтесь к поездке — шаг за шагом.', 'Find your place to stay. Then get ready for your trip, one step at a time.')} />
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
          <div className="min-w-0 space-y-6">
            <Card>
              <CardHeader>
                <h2 className="font-display text-2xl">{t('Где будем жить?', 'Where will you stay?')}</h2>
                <p className="text-sm text-muted-foreground">{t('Укажите район и даты, чтобы найти жильё.', 'Choose an area and dates to find a home.')}</p>
              </CardHeader>
              <CardContent className="journey-primary !mb-0 !border-0"><HomeDiscoverySearch rentalOnly /></CardContent>
            </Card>
            <TripChecklist />
          </div>
          <Card>
            <CardHeader><h2 className="font-display text-xl">{t('Для вашей поездки', 'For your trip')}</h2></CardHeader>
            <CardContent className="space-y-2">
              {[
                { to: R.AIRPORT_TRANSFER, label: t('Встреча в аэропорту', 'Airport transfer') },
                { to: R.EXPERIENCES, label: t('Впечатления на острове', 'Island experiences') },
                { to: R.GOAL_SERVICES, label: t('Услуги во время отдыха', 'Services during your stay') },
              ].map(l => <Button key={l.to} asChild variant="ghost" className="h-auto min-h-11 w-full justify-between whitespace-normal px-2 text-left"><Link to={l.to}><span>{l.label}</span><ArrowUpRight aria-hidden="true" /></Link></Button>)}
              <Button asChild variant="outline" className="mt-4 w-full"><Link to={R.SUPPORT}>{t('Нужна помощь', 'Get help')}</Link></Button>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    </AppLayout>
  );
}
