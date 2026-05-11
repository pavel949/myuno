import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { CalmClusterHero } from '@/components/uno/CalmClusterHero';
import { APP_ROUTES } from '@/lib/config/routes';
import { Plane, Smartphone, ArrowLeftRight, Car, Landmark, Zap, Globe, BookOpen, GraduationCap, Stethoscope, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClusterBreadcrumb } from '@/components/navigation/ClusterBreadcrumb';
import { ExploreMoreRail } from '@/components/navigation/ExploreMoreRail';
import { SEOHead } from '@/components/seo';

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

/** Short trips & holidays (1–4 weeks). */
const VISITING_PRE_ARRIVAL: ClusterApp[] = [
  { icon: '🏠', label: 'Accommodation', labelRu: 'Жильё', desc: 'Short-term rentals & villas', descRu: 'Аренда вилл и апартаментов', path: APP_ROUTES.PROPERTY_RENT_SHORT, ready: true, emoji: true },
  { icon: '🚗', label: 'Car Rental', labelRu: 'Аренда авто', desc: 'Cars, scooters & SUVs', descRu: 'Авто, скутеры и внедорожники', path: APP_ROUTES.TRANSPORT, ready: true, emoji: true },
  { icon: '🛥️', label: 'Yacht Charter', labelRu: 'Яхты', desc: 'Island-hopping & private charters', descRu: 'Острова и приватный чартер', path: APP_ROUTES.YACHTS, ready: true, emoji: true },
  { icon: '🎫', label: 'Experiences & Tours', labelRu: 'Экскурсии и туры', desc: 'Day trips, island tours & activities', descRu: 'Однодневные туры и активности', path: APP_ROUTES.EXPERIENCES, ready: true, emoji: true },
  { icon: '🎭', label: 'Events & Tickets', labelRu: 'События', desc: 'Concerts, shows & festivals', descRu: 'Концерты, шоу и фестивали', path: APP_ROUTES.EVENTS, ready: true, emoji: true },
  { icon: '🍽️', label: 'Restaurants', labelRu: 'Рестораны', desc: 'Reserve a table in advance', descRu: 'Заброньируйте столик заранее', path: APP_ROUTES.RESTAURANTS, ready: true, emoji: true },
];

const VISITING_DAY_ONE: ClusterApp[] = [
  { icon: Plane, label: 'Airport Transfers', labelRu: 'Трансферы', desc: 'Private car to your hotel', descRu: 'Личный авто до отеля', path: APP_ROUTES.AIRPORT_TRANSFER, ready: true },
  { icon: Zap, label: 'Airport Fast Track', labelRu: 'Fast Track', desc: 'Skip the immigration queue', descRu: 'Без очереди на паспортном контроле', path: APP_ROUTES.FAST_TRACK, ready: true },
  { icon: Smartphone, label: 'SIM Cards', labelRu: 'SIM-карты', desc: 'Tourist SIM plans comparison', descRu: 'Сравнение тарифов', path: APP_ROUTES.SIM_START, ready: true },
  { icon: ArrowLeftRight, label: 'Exchange Rates', labelRu: 'Курсы валют', desc: 'Live rates & exchangers map', descRu: 'Актуальные курсы и карта обменников', path: APP_ROUTES.EXCHANGE, ready: true },
];

/** Moving for 6+ months — relocation stack. */
const MOVING_PRE: ClusterApp[] = [
  { icon: FileText, label: 'Visa comparison', labelRu: 'Сравнение виз', desc: 'DTV, ED, Non-B — quick decision tree', descRu: 'DTV, ED, Non-B — дерево решений', path: APP_ROUTES.VISA_COMPARE, ready: true },
  { icon: BookOpen, label: 'Relocation guides', labelRu: 'Гайды по переезду', desc: 'TM30, housing, schools, banking', descRu: 'TM30, жильё, школы, банки', path: APP_ROUTES.RELOCATION_GUIDES, ready: true },
  { icon: Globe, label: 'Relocation hub', labelRu: 'Хаб переезда', desc: 'Quiz, roadmap & coordinator', descRu: 'Квиз, дорожная карта и координатор', path: APP_ROUTES.RELOCATE, ready: true },
  { icon: '🏠', label: 'Long-term rent', labelRu: 'Долгосрочная аренда', desc: 'Condos & villas for 6+ months', descRu: 'Кондо и виллы от 6 месяцев', path: `${APP_ROUTES.PROPERTY_BROWSE}?mode=rent&tenancy=long`, ready: true, emoji: true },
  { icon: GraduationCap, label: 'Schools', labelRu: 'Школы', desc: 'International & language schools', descRu: 'Международные и языковые школы', path: APP_ROUTES.EDUCATION, ready: true },
  { icon: Stethoscope, label: 'Medical & insurance', labelRu: 'Медицина', desc: 'Clinics & expat health cover', descRu: 'Клиники и страховка', path: APP_ROUTES.MEDICAL, ready: true },
];

const MOVING_FIRST_WEEKS: ClusterApp[] = [
  { icon: Plane, label: 'Airport transfer', labelRu: 'Трансфер', desc: 'Meet & greet to new home', descRu: 'Встреча и доставка до жилья', path: APP_ROUTES.AIRPORT_TRANSFER, ready: true },
  { icon: Smartphone, label: 'SIM & internet', labelRu: 'SIM и интернет', desc: 'Long-stay mobile & fibre', descRu: 'Мобильная связь и интернет', path: APP_ROUTES.SIM_START, ready: true },
  { icon: Landmark, label: 'Bank account', labelRu: 'Банковский счёт', desc: 'Open with your visa package', descRu: 'Открытие по пакету документов', path: APP_ROUTES.BANKING, ready: true },
  { icon: Globe, label: 'My relocation plan', labelRu: 'Мой план переезда', desc: 'Checklist from the quiz', descRu: 'Чеклист из квиза', path: APP_ROUTES.RELOCATION_MY_PLAN, ready: true },
  { icon: Car, label: 'Areas to live', labelRu: 'Где жить', desc: 'Filter neighbourhoods', descRu: 'Фильтр по районам', path: APP_ROUTES.RELOCATION_AREAS, ready: true },
];

function AppItem({ app, t }: { app: ClusterApp; t: boolean }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(app.path)}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-none border border-border bg-card text-left',
        'transition-all hover:border-cluster-arrive/40 hover:[box-shadow:var(--shadow-elevation-2)] ',
        !app.ready && 'opacity-50 pointer-events-none',
      )}
    >
      <div className="w-11 h-11 rounded-none bg-cluster-arrive/10 flex items-center justify-center flex-shrink-0">
        {app.emoji ? (
          <span className="text-xl">{app.icon as string}</span>
        ) : (
          (() => {
            const Icon = app.icon as React.ElementType;
            return <Icon className="w-5 h-5 text-cluster-arrive" />;
          })()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-sm text-foreground">{t ? app.labelRu : app.label}</h3>
        <p className="text-xs text-muted-foreground truncate">{t ? app.descRu : app.desc}</p>
      </div>
      {!app.ready && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Soon</span>}
    </button>
  );
}

export default function ArriveClusterPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const [audience, setAudience] = useState<'visit' | 'move'>('visit');

  const seoTitle = t ? 'Прибытие на Пхукет — туризм и переезд' : 'Arrive in Phuket — visit or relocate';
  const seoDescription = t
    ? 'Трансферы, SIM, туры и отдых — или визы, жильё, школы и чеклист для долгого переезда.'
    : 'Transfers, SIM, tours for short stays — or visas, housing, schools and checklist for long-term relocation.';

  return (
    <AppLayout>
      <SEOHead title={seoTitle} description={seoDescription} url="https://myuno.app/arrive" />
      <div className="pb-24">
        <CalmClusterHero
          clusterId="arrive"
          icon={Plane}
          title={t ? 'Прибытие' : 'Arrive'}
          subtitle={
            t
              ? 'Выберите сценарий: отпуск или переезд на 6+ месяцев'
              : 'Pick your scenario: holiday vs moving for 6+ months'
          }
          fallbackPath={APP_ROUTES.HOME}
        />

        <div className="px-4 py-3">
          <ClusterBreadcrumb clusterId="arrive" serviceLabelRu="Все сервисы" serviceLabelEn="All services" />
        </div>

        <div className="px-4 mb-6">
          <div className="flex rounded-none border border-border overflow-hidden max-w-md">
            <button
              type="button"
              onClick={() => setAudience('visit')}
              className={cn(
                'flex-1 py-3 text-xs font-semibold transition-colors',
                audience === 'visit' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground',
              )}
            >
              {t ? 'В гости (1–4 нед)' : 'Visiting (1–4 wk)'}
            </button>
            <button
              type="button"
              onClick={() => setAudience('move')}
              className={cn(
                'flex-1 py-3 text-xs font-semibold transition-colors border-l border-border',
                audience === 'move' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground',
              )}
            >
              {t ? 'Переезд (6+ мес)' : 'Moving (6+ mo)'}
            </button>
          </div>
        </div>

        <div className="px-4 space-y-6">
          {audience === 'visit' ? (
            <>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">✈️</span>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">{t ? 'До отъезда' : 'Before You Come'}</h2>
                    <p className="text-xs text-muted-foreground">
                      {t ? 'Бронируйте за 1–2 недели в высокий сезон' : 'Book 1–2 weeks ahead in high season'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {VISITING_PRE_ARRIVAL.map((app) => (
                    <AppItem key={app.path} app={app} t={t} />
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🛬</span>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">{t ? 'День прилёта' : 'Day of Arrival'}</h2>
                    <p className="text-xs text-muted-foreground">{t ? 'Первые часы на острове' : 'Your first hours on the island'}</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {VISITING_DAY_ONE.map((app) => (
                    <AppItem key={app.path} app={app} t={t} />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">📋</span>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">{t ? 'До переезда' : 'Before the move'}</h2>
                    <p className="text-xs text-muted-foreground">
                      {t ? 'Визы, жильё, школы и документы' : 'Visas, housing, schools & paperwork'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {MOVING_PRE.map((app) => (
                    <AppItem key={app.path} app={app} t={t} />
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🧭</span>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">{t ? 'Первые недели' : 'First weeks'}</h2>
                    <p className="text-xs text-muted-foreground">
                      {t ? 'Быт, банк и ориентация по районам' : 'Banking, SIM, and finding your base'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {MOVING_FIRST_WEEKS.map((app) => (
                    <AppItem key={app.path} app={app} t={t} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-4 mt-6">
          <ExploreMoreRail clusterId="arrive" />
        </div>
      </div>
    </AppLayout>
  );
}
