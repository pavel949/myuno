import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { CalmClusterHero } from '@/components/uno/CalmClusterHero';
import { APP_ROUTES } from '@/lib/config/routes';
import { Plane, Smartphone, ArrowLeftRight, Car, Landmark, Zap, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClusterBreadcrumb } from '@/components/navigation/ClusterBreadcrumb';
import { ExploreMoreRail } from '@/components/navigation/ExploreMoreRail';

interface ClusterApp {
  icon: React.ElementType | string;
  label: string;
  labelRu: string;
  desc: string;
  descRu: string;
  path: string;
  ready: boolean;
  emoji?: boolean;
}

const PRE_ARRIVAL: ClusterApp[] = [
  { icon: '🏠', label: 'Accommodation', labelRu: 'Жильё', desc: 'Short-term rentals & villas', descRu: 'Аренда вилл и апартаментов', path: APP_ROUTES.PROPERTY_RENT_SHORT, ready: true, emoji: true },
  { icon: '🚗', label: 'Car Rental', labelRu: 'Аренда авто', desc: 'Cars, scooters & SUVs', descRu: 'Авто, скутеры и внедорожники', path: APP_ROUTES.TRANSPORT, ready: true, emoji: true },
  { icon: '🛥️', label: 'Yacht Charter', labelRu: 'Яхты', desc: 'Island-hopping & private charters', descRu: 'Острова и приватный чартер', path: APP_ROUTES.YACHTS, ready: true, emoji: true },
  { icon: '🎫', label: 'Experiences & Tours', labelRu: 'Экскурсии и туры', desc: 'Day trips, island tours & activities', descRu: 'Однодневные туры и активности', path: APP_ROUTES.EXPERIENCES, ready: true, emoji: true },
  { icon: '🎭', label: 'Events & Tickets', labelRu: 'События', desc: 'Concerts, shows & festivals', descRu: 'Концерты, шоу и фестивали', path: APP_ROUTES.EVENTS, ready: true, emoji: true },
  { icon: '🍽️', label: 'Restaurants', labelRu: 'Рестораны', desc: 'Reserve a table in advance', descRu: 'Заброньируйте столик заранее', path: APP_ROUTES.RESTAURANTS, ready: true, emoji: true },
];

const DAY_ONE: ClusterApp[] = [
  { icon: Plane, label: 'Airport Transfers', labelRu: 'Трансферы', desc: 'Private car to your hotel', descRu: 'Личный авто до отеля', path: APP_ROUTES.AIRPORT_TRANSFER, ready: true },
  { icon: Zap, label: 'Airport Fast Track', labelRu: 'Fast Track', desc: 'Skip the immigration queue', descRu: 'Без очереди на паспортном контроле', path: APP_ROUTES.FAST_TRACK, ready: true },
  { icon: Smartphone, label: 'SIM Cards', labelRu: 'SIM-карты', desc: 'Tourist SIM plans comparison', descRu: 'Сравнение тарифов', path: APP_ROUTES.SIM_START, ready: true },
  { icon: ArrowLeftRight, label: 'Exchange Rates', labelRu: 'Курсы валют', desc: 'Live rates & exchangers map', descRu: 'Актуальные курсы и карта обменников', path: APP_ROUTES.EXCHANGE, ready: true },
  { icon: Landmark, label: 'Bank Account', labelRu: 'Банковский счёт', desc: 'Open a Thai bank account', descRu: 'Открыть счёт в тайском банке', path: APP_ROUTES.BANKING, ready: true },
  { icon: Globe, label: 'Relocation Guide', labelRu: 'Гид по переезду', desc: 'Full relocation roadmap', descRu: 'Полная дорожная карта переезда', path: APP_ROUTES.RELOCATE, ready: true },
];

function AppItem({ app, t }: { app: ClusterApp; t: boolean }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(app.path)}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-none border border-border bg-card text-left',
        'transition-all hover:border-cluster-arrive/40 hover:[box-shadow:var(--shadow-elevation-2)] ',
        !app.ready && 'opacity-50 pointer-events-none'
      )}
    >
      <div className="w-11 h-11 rounded-none bg-cluster-arrive/10 flex items-center justify-center flex-shrink-0">
        {app.emoji
          ? <span className="text-xl">{app.icon as string}</span>
          : (() => { const Icon = app.icon as React.ElementType; return <Icon className="w-5 h-5 text-cluster-arrive" />; })()
        }
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
}

export default function ArriveClusterPage() {
  const { language } = useLanguage();
  const t = language === 'ru';

  return (
    <AppLayout>
      <div className="pb-24">
        <CalmClusterHero
          clusterId="arrive"
          icon={Plane}
          title={t ? 'Прибытие' : 'Arrive'}
          subtitle={t ? 'Планирование поездки и сервисы первого дня' : 'Trip planning and day-one services'}
          fallbackPath="/"
        />

        <div className="px-4 py-3">
          <ClusterBreadcrumb clusterId="arrive" serviceLabelRu="Все сервисы" serviceLabelEn="All services" />
        </div>

        <div className="px-4 space-y-6">
          {/* Pre-arrival section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">✈️</span>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {t ? 'До отъезда' : 'Before You Come'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t ? 'Бронируйте за 1–2 недели в высокий сезон' : 'Book 1–2 weeks ahead in high season'}
                </p>
              </div>
            </div>
            <div className="space-y-2.5">
              {PRE_ARRIVAL.map(app => (
                <AppItem key={app.path} app={app} t={t} />
              ))}
            </div>
          </div>

          {/* Day-one section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🛬</span>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {t ? 'День прилёта' : 'Day of Arrival'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t ? 'Всё что нужно в первые часы' : 'Everything you need right away'}
                </p>
              </div>
            </div>
            <div className="space-y-2.5">
              {DAY_ONE.map(app => (
                <AppItem key={app.path} app={app} t={t} />
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 mt-6">
          <ExploreMoreRail clusterId="arrive" />
        </div>
      </div>
    </AppLayout>
  );
}
