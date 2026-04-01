import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { Plane, Smartphone, ArrowLeftRight, Car, Landmark, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClusterBreadcrumb } from '@/components/navigation/ClusterBreadcrumb';
import { ExploreMoreRail } from '@/components/navigation/ExploreMoreRail';

interface ClusterApp {
  icon: React.ElementType;
  label: string;
  labelRu: string;
  desc: string;
  descRu: string;
  path: string;
  ready: boolean;
}

const APPS: ClusterApp[] = [
  { icon: Plane, label: 'Airport Transfers', labelRu: 'Трансферы', desc: 'Private car to your hotel', descRu: 'Личный авто до отеля', path: APP_ROUTES.AIRPORT_TRANSFER, ready: true },
  { icon: Smartphone, label: 'SIM Cards', labelRu: 'SIM-карты', desc: 'Tourist SIM plans comparison', descRu: 'Сравнение тарифов', path: APP_ROUTES.SIM_START, ready: true },
  { icon: ArrowLeftRight, label: 'Exchange Rates', labelRu: 'Курсы валют', desc: 'Best rates & exchangers map', descRu: 'Лучшие курсы и карта обменников', path: APP_ROUTES.EXCHANGE, ready: true },
  { icon: Car, label: 'Car & Scooter Rental', labelRu: 'Аренда авто', desc: 'Daily & weekly rentals', descRu: 'Посуточная и понедельная аренда', path: APP_ROUTES.TRANSPORT, ready: true },
  { icon: Landmark, label: 'Bank Account', labelRu: 'Банковский счёт', desc: 'Open a Thai bank account', descRu: 'Открыть счёт в тайском банке', path: APP_ROUTES.BANKING, ready: true },
  { icon: Zap, label: 'Airport Fast Track', labelRu: 'Fast Track', desc: 'Skip the immigration queue', descRu: 'Без очереди на паспортном контроле', path: APP_ROUTES.FAST_TRACK, ready: true },
];

export default function ArriveClusterPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="pb-24">
        <div className="relative bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-600 p-6 pt-16 pb-10">
          <BackButton fallbackPath="/" variant="overlay" className="absolute top-4 left-4" />
          <div className="text-white text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Plane className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold mb-1">{t ? 'ПРИЕХАТЬ' : 'ARRIVE'}</h1>
            <p className="text-white/80 text-sm">{t ? 'Первый день на острове — всё что нужно' : 'First day on the island — everything you need'}</p>
          </div>
        </div>

        <div className="px-4 py-3">
          <ClusterBreadcrumb clusterId="arrive" serviceLabelRu="Все сервисы" serviceLabelEn="All services" />
        </div>
        <div className="px-4 space-y-3">
          {APPS.map(app => {
            const Icon = app.icon;
            return (
              <button
                key={app.path}
                onClick={() => navigate(app.path)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card text-left',
                  'transition-all hover:border-cluster-arrive/40 hover:[box-shadow:var(--shadow-elevation-2)] active:scale-[0.98]',
                  !app.ready && 'opacity-50 pointer-events-none'
                )}
              >
                <div className="w-11 h-11 rounded-xl bg-cluster-arrive/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-cluster-arrive" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm text-foreground">{t ? app.labelRu : app.label}</h3>
                  <p className="text-xs text-muted-foreground truncate">{t ? app.descRu : app.desc}</p>
                </div>
                {!app.ready && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Soon</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="px-4 mt-6">
          <ExploreMoreRail clusterId="arrive" />
        </div>
      </div>
    </AppLayout>
  );
}
