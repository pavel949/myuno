import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { CalmClusterHero } from '@/components/uno/CalmClusterHero';
import { GroupedServiceDestinations, type ServiceDestination } from '@/components/services/GroupedServiceDestinations';
import { APP_ROUTES } from '@/lib/config/routes';
import {
  Plane,
  PlaneLanding,
  ClipboardList,
  Compass,
  BookOpen,
  FileText,
  Globe,
  GraduationCap,
  Stethoscope,
  Landmark,
  Car,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClusterBreadcrumb } from '@/components/navigation/ClusterBreadcrumb';
import { ExploreMoreRail } from '@/components/navigation/ExploreMoreRail';
import { SEOHead } from '@/components/seo';

type ClusterApp = ServiceDestination;

/** Short trips & holidays (1–4 weeks). */
const VISITING_PRE_ARRIVAL: ClusterApp[] = [
  {
    serviceId: 'rent-short',
    label: 'Accommodation',
    labelRu: 'Жильё',
    desc: 'Short-term rentals & villas',
    descRu: 'Аренда вилл и апартаментов',
    path: APP_ROUTES.PROPERTY_RENT_SHORT,
    fallbackIcon: Building2,
  },
  {
    serviceId: 'vehicle',
    label: 'Car Rental',
    labelRu: 'Аренда авто',
    desc: 'Cars, scooters & SUVs',
    descRu: 'Авто, скутеры и внедорожники',
    path: APP_ROUTES.TRANSPORT,
    fallbackIcon: Car,
  },
  {
    serviceId: 'yacht',
    label: 'Yacht Charter',
    labelRu: 'Яхты',
    desc: 'Island-hopping & private charters',
    descRu: 'Острова и приватный чартер',
    path: APP_ROUTES.YACHTS,
    fallbackIcon: Car,
  },
  {
    serviceId: 'experience',
    label: 'Experiences & Tours',
    labelRu: 'Экскурсии и туры',
    desc: 'Day trips, island tours & activities',
    descRu: 'Однодневные туры и активности',
    path: APP_ROUTES.EXPERIENCES,
    fallbackIcon: Compass,
  },
  {
    serviceId: 'event',
    label: 'Events & Tickets',
    labelRu: 'События',
    desc: 'Concerts, shows & festivals',
    descRu: 'Концерты, шоу и фестивали',
    path: APP_ROUTES.EVENTS,
    fallbackIcon: Compass,
  },
  {
    serviceId: 'restaurant',
    label: 'Restaurants',
    labelRu: 'Рестораны',
    desc: 'Reserve a table in advance',
    descRu: 'Заброньируйте столик заранее',
    path: APP_ROUTES.RESTAURANTS,
    fallbackIcon: Compass,
  },
];

const VISITING_DAY_ONE: ClusterApp[] = [
  {
    serviceId: 'transfer',
    label: 'Airport Transfers',
    labelRu: 'Трансферы',
    desc: 'Private car to your hotel',
    descRu: 'Личный авто до отеля',
    path: APP_ROUTES.AIRPORT_TRANSFER,
    fallbackIcon: Plane,
  },
  {
    serviceId: 'fast-track',
    label: 'Airport Fast Track',
    labelRu: 'Fast Track',
    desc: 'Skip the immigration queue',
    descRu: 'Без очереди на паспортном контроле',
    path: APP_ROUTES.FAST_TRACK,
    fallbackIcon: Plane,
  },
  {
    serviceId: 'sim',
    label: 'SIM Cards',
    labelRu: 'SIM-карты',
    desc: 'Tourist SIM plans comparison',
    descRu: 'Сравнение тарифов',
    path: APP_ROUTES.SIM_START,
    fallbackIcon: Plane,
  },
  {
    serviceId: 'exchange',
    label: 'Exchange Rates',
    labelRu: 'Курсы валют',
    desc: 'Live rates & exchangers map',
    descRu: 'Актуальные курсы и карта обменников',
    path: APP_ROUTES.EXCHANGE,
    fallbackIcon: Plane,
  },
];

/** Moving for 6+ months — relocation stack. */
const MOVING_PRE: ClusterApp[] = [
  {
    serviceId: 'visa-compare',
    label: 'Visa comparison',
    labelRu: 'Сравнение виз',
    desc: 'DTV, ED, Non-B — quick decision tree',
    descRu: 'DTV, ED, Non-B — дерево решений',
    path: APP_ROUTES.VISA_COMPARE,
    fallbackIcon: FileText,
  },
  {
    serviceId: 'relocation-guides',
    label: 'Relocation guides',
    labelRu: 'Гайды по переезду',
    desc: 'TM30, housing, schools, banking',
    descRu: 'TM30, жильё, школы, банки',
    path: APP_ROUTES.RELOCATION_GUIDES,
    fallbackIcon: BookOpen,
  },
  {
    serviceId: 'relocate',
    label: 'Relocation hub',
    labelRu: 'Хаб переезда',
    desc: 'Quiz, roadmap & coordinator',
    descRu: 'Квиз, дорожная карта и координатор',
    path: APP_ROUTES.RELOCATE,
    fallbackIcon: Globe,
  },
  {
    serviceId: 'rent-long',
    label: 'Long-term rent',
    labelRu: 'Долгосрочная аренда',
    desc: 'Condos & villas for 6+ months',
    descRu: 'Кондо и виллы от 6 месяцев',
    path: `${APP_ROUTES.PROPERTY_BROWSE}?mode=rent&tenancy=long`,
    fallbackIcon: Building2,
  },
  {
    serviceId: 'education',
    label: 'Schools',
    labelRu: 'Школы',
    desc: 'International & language schools',
    descRu: 'Международные и языковые школы',
    path: APP_ROUTES.EDUCATION,
    fallbackIcon: GraduationCap,
  },
  {
    serviceId: 'medical',
    label: 'Medical & insurance',
    labelRu: 'Медицина',
    desc: 'Clinics & expat health cover',
    descRu: 'Клиники и страховка',
    path: APP_ROUTES.MEDICAL,
    fallbackIcon: Stethoscope,
  },
];

const MOVING_FIRST_WEEKS: ClusterApp[] = [
  {
    serviceId: 'transfer',
    label: 'Airport transfer',
    labelRu: 'Трансфер',
    desc: 'Meet & greet to new home',
    descRu: 'Встреча и доставка до жилья',
    path: APP_ROUTES.AIRPORT_TRANSFER,
    fallbackIcon: Plane,
  },
  {
    serviceId: 'sim',
    label: 'SIM & internet',
    labelRu: 'SIM и интернет',
    desc: 'Long-stay mobile & fibre',
    descRu: 'Мобильная связь и интернет',
    path: APP_ROUTES.SIM_START,
    fallbackIcon: Plane,
  },
  {
    serviceId: 'banking',
    label: 'Bank account',
    labelRu: 'Банковский счёт',
    desc: 'Open with your visa package',
    descRu: 'Открытие по пакету документов',
    path: APP_ROUTES.BANKING,
    fallbackIcon: Landmark,
  },
  {
    serviceId: 'relocation-my-plan',
    label: 'My relocation plan',
    labelRu: 'Мой план переезда',
    desc: 'Checklist from the quiz',
    descRu: 'Чеклист из квиза',
    path: APP_ROUTES.RELOCATION_MY_PLAN,
    fallbackIcon: Globe,
  },
  {
    serviceId: 'relocation-areas',
    label: 'Areas to live',
    labelRu: 'Где жить',
    desc: 'Filter neighbourhoods',
    descRu: 'Фильтр по районам',
    path: APP_ROUTES.RELOCATION_AREAS,
    fallbackIcon: Car,
  },
];

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-5 w-5 shrink-0 text-cluster-arrive" aria-hidden />
      <div>
        <h2 className="font-display text-h3 font-medium tracking-tight text-foreground">{title}</h2>
        <p className="font-sans text-body-sm text-muted-foreground">{description}</p>
      </div>
    </div>
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
      <SEOHead title={seoTitle} description={seoDescription} url="https://www.myuno.app/arrive" />
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

        <div className="mb-6 px-4">
          <div className="flex max-w-md overflow-hidden rounded-none border border-border">
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
                'flex-1 border-l border-border py-3 text-xs font-semibold transition-colors',
                audience === 'move' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground',
              )}
            >
              {t ? 'Переезд (6+ мес)' : 'Moving (6+ mo)'}
            </button>
          </div>
        </div>

        <div className="space-y-6 px-4">
          {audience === 'visit' ? (
            <>
              <div>
                <SectionHeader
                  icon={Plane}
                  title={t ? 'До отъезда' : 'Before You Come'}
                  description={t ? 'Бронируйте за 1–2 недели в высокий сезон' : 'Book 1–2 weeks ahead in high season'}
                />
                <GroupedServiceDestinations apps={VISITING_PRE_ARRIVAL} clusterId="arrive" idPrefix="visit-before" />
              </div>
              <div>
                <SectionHeader
                  icon={PlaneLanding}
                  title={t ? 'День прилёта' : 'Day of Arrival'}
                  description={t ? 'Первые часы на острове' : 'Your first hours on the island'}
                />
                <GroupedServiceDestinations apps={VISITING_DAY_ONE} clusterId="arrive" idPrefix="visit-arrival" />
              </div>
            </>
          ) : (
            <>
              <div>
                <SectionHeader
                  icon={ClipboardList}
                  title={t ? 'До переезда' : 'Before the move'}
                  description={t ? 'Визы, жильё, школы и документы' : 'Visas, housing, schools & paperwork'}
                />
                <GroupedServiceDestinations apps={MOVING_PRE} clusterId="arrive" idPrefix="move-before" />
              </div>
              <div>
                <SectionHeader
                  icon={Compass}
                  title={t ? 'Первые недели' : 'First weeks'}
                  description={t ? 'Быт, банк и ориентация по районам' : 'Banking, SIM, and finding your base'}
                />
                <GroupedServiceDestinations apps={MOVING_FIRST_WEEKS} clusterId="arrive" idPrefix="move-weeks" />
              </div>
            </>
          )}
        </div>

        <div className="mt-6 px-4">
          <ExploreMoreRail clusterId="arrive" />
        </div>
      </div>
    </AppLayout>
  );
}
