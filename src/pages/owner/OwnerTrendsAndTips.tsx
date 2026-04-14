import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  ChevronRight, Zap, PawPrint, KeyRound, Tv, Wifi,
  ShowerHead, UtensilsCrossed, Car, AirVent, WashingMachine,
  Lightbulb,
} from 'lucide-react';
import { useOwnerPerformance } from '@/hooks/useOwnerPerformance';

interface TipDetail {
  icon: React.ElementType;
  titleEn: string;
  titleRu: string;
  descriptionEn: string;
  descriptionRu: string;
  activeCount: number;
  totalCount: number;
}

export default function OwnerTrendsAndTips() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const { data, isLoading } = useOwnerPerformance('30d');
  const totalProperties = data?.tips?.[0]?.totalCount ?? 5;

  // Extended list of tips/suggestions
  const allTips: TipDetail[] = [
    {
      icon: Zap,
      titleEn: 'Allow guests to book instantly',
      titleRu: 'Разрешите гостям бронировать жилье сразу',
      descriptionEn: 'Simplify the booking process and earn on last-minute reservations.',
      descriptionRu: 'Упростите процедуру оформления и заработайте на бронированиях последней минуты.',
      activeCount: data?.tips?.[0]?.activeCount ?? Math.ceil(totalProperties * 0.6),
      totalCount: totalProperties,
    },
    {
      icon: PawPrint,
      titleEn: 'Allow pets',
      titleRu: 'Разрешите проживание с питомцами',
      descriptionEn: 'If you are open to hosting pets, mark this in your listing.',
      descriptionRu: 'Если вы не против размещения с домашними животными, отметьте это в объявлении.',
      activeCount: data?.tips?.[1]?.activeCount ?? 0,
      totalCount: totalProperties,
    },
    {
      icon: KeyRound,
      titleEn: 'Offer self check-in',
      titleRu: 'Предложите самостоятельное заселение',
      descriptionEn: 'Key safes are affordable, save time, and ensure easy guest arrival.',
      descriptionRu: 'Мини-сейфы стоят недорого, экономят время и гарантируют гостям простое прибытие.',
      activeCount: data?.tips?.[2]?.activeCount ?? Math.ceil(totalProperties * 0.4),
      totalCount: totalProperties,
    },
    {
      icon: Tv,
      titleEn: 'Add a TV',
      titleRu: 'Добавьте телевизор',
      descriptionEn: 'Give guests the option to relax watching their favorite shows.',
      descriptionRu: 'Дайте гостям возможность отдохнуть за просмотром любимых передач.',
      activeCount: data?.tips?.[3]?.activeCount ?? Math.ceil(totalProperties * 0.8),
      totalCount: totalProperties,
    },
    {
      icon: Wifi,
      titleEn: 'Provide fast Wi-Fi',
      titleRu: 'Обеспечьте быстрый Wi-Fi',
      descriptionEn: 'Fast internet is one of the top amenities guests look for.',
      descriptionRu: 'Быстрый интернет — одно из главных удобств, которые ищут гости.',
      activeCount: Math.min(Math.ceil(totalProperties * 0.9), totalProperties),
      totalCount: totalProperties,
    },
    {
      icon: ShowerHead,
      titleEn: 'Add hot water details',
      titleRu: 'Укажите информацию о горячей воде',
      descriptionEn: 'Guests appreciate knowing about water heating type and reliability.',
      descriptionRu: 'Гости ценят информацию о типе нагрева воды и его надежности.',
      activeCount: Math.ceil(totalProperties * 0.5),
      totalCount: totalProperties,
    },
    {
      icon: UtensilsCrossed,
      titleEn: 'Equip your kitchen',
      titleRu: 'Оборудуйте кухню',
      descriptionEn: 'A well-equipped kitchen can increase your booking rate significantly.',
      descriptionRu: 'Хорошо оборудованная кухня может значительно увеличить количество бронирований.',
      activeCount: Math.ceil(totalProperties * 0.7),
      totalCount: totalProperties,
    },
    {
      icon: Car,
      titleEn: 'Offer parking',
      titleRu: 'Предложите парковку',
      descriptionEn: 'Free parking is a significant perk, especially for road travelers.',
      descriptionRu: 'Бесплатная парковка — значительный плюс, особенно для автопутешественников.',
      activeCount: Math.ceil(totalProperties * 0.3),
      totalCount: totalProperties,
    },
    {
      icon: AirVent,
      titleEn: 'Add air conditioning info',
      titleRu: 'Добавьте информацию о кондиционере',
      descriptionEn: 'Mention AC availability — it is essential in tropical destinations.',
      descriptionRu: 'Укажите наличие кондиционера — это важно в тропических местах.',
      activeCount: Math.min(Math.ceil(totalProperties * 0.85), totalProperties),
      totalCount: totalProperties,
    },
    {
      icon: WashingMachine,
      titleEn: 'Add washing machine',
      titleRu: 'Добавьте стиральную машину',
      descriptionEn: 'Long-term guests especially value access to a washing machine.',
      descriptionRu: 'Гости на длительный срок особенно ценят наличие стиральной машины.',
      activeCount: Math.ceil(totalProperties * 0.6),
      totalCount: totalProperties,
    },
  ];

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title={isRu ? 'Тренды и советы' : 'Trends & Tips'} showBack fallbackPath="/mc/performance" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Тренды и советы' : 'Trends & Tips'}
        showBack
        fallbackPath="/mc/performance"
      />

      {/* Intro message */}
      <div className="mb-6 text-muted-foreground text-sm leading-relaxed">
        {isRu
          ? 'Отличная новость: люди снова хотят путешествовать! Обновите настройки, чтобы привлечь больше бронирований. Тогда объявление сможет участвовать в будущих промоакциях.'
          : 'Great news: people want to travel again! Update your settings to attract more bookings. Your listing will then be eligible for future promotions.'
        }
      </div>

      {/* Tips List */}
      <div className="space-y-4">
        {allTips.map((tip, index) => {
          const progressPercent = tip.totalCount > 0 ? (tip.activeCount / tip.totalCount) * 100 : 0;
          const isComplete = tip.activeCount === tip.totalCount;

          return (
            <div
              key={index}
              className={cn(
                'border-b border-border pb-5 last:border-b-0',
                'cursor-pointer group'
              )}
              onClick={() => navigate('/mc/properties')}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-base leading-tight pr-4">
                  {isRu ? tip.titleRu : tip.titleEn}
                </h3>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-foreground transition-colors" />
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                {isRu ? tip.descriptionRu : tip.descriptionEn}
              </p>

              <div className="space-y-1.5">
                <Progress
                  value={progressPercent}
                  className={cn('h-2', isComplete && '[&>[data-state=complete]]:bg-primary')}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{isRu ? 'Число активных объявлений' : 'Active listings'}</span>
                  <span>{tip.activeCount}/{tip.totalCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
