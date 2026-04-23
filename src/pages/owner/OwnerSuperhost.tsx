import { useLanguage } from '@/contexts/LanguageContext';
import { useSuperhostStatus, SUPERHOST_BENEFITS, SUPERHOST_REQUIREMENTS } from '@/hooks/useSuperhostStatus';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SuperhostBadge, SuperhostIcon } from '@/components/owner/SuperhostBadge';
import { 
  Award, 
  Star, 
  CheckCircle2, 
  Circle,
  CalendarCheck,
  XCircle,
  MessageSquare,
  Trophy,
  Percent,
  Headphones,
  Gift,
  BadgeCheck,
  TrendingUp,
  Target,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const benefitIcons: Record<string, React.ReactNode> = {
  trophy: <Trophy className="h-5 w-5" />,
  badge: <BadgeCheck className="h-5 w-5" />,
  percent: <Percent className="h-5 w-5" />,
  headphones: <Headphones className="h-5 w-5" />,
  gift: <Gift className="h-5 w-5" />,
};

export default function OwnerSuperhost() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const { metrics, progress, isSuperhost, superhostSince, isLoading } = useSuperhostStatus();
  const benefits = SUPERHOST_BENEFITS[isRu ? 'ru' : 'en'];

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Суперхозяин' : 'Superhost'} 
          showBack 
          fallbackPath="/owner" 
        />
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-none" />
          <Skeleton className="h-64 w-full rounded-none" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title={isRu ? 'Программа Суперхозяин' : 'Superhost Program'} 
        showBack 
        fallbackPath="/owner" 
      />

      {/* Hero Section */}
      <Card className={cn(
        'overflow-hidden mb-4',
        isSuperhost 
          ? 'border-accent-amber/30 bg-gradient-to-br from-accent-amber/5 to-warning/5'
          : ''
      )}>
        <CardContent className="pt-6 pb-4">
          <div className="text-center">
            {isSuperhost ? (
              <>
                <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-accent-amber to-warning shadow-xl shadow-accent-amber/30 mb-4">
                  <Award className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-1">
                  {isRu ? 'Вы Суперхозяин!' : "You're a Superhost!"}
                </h2>
                {superhostSince && (
                  <p className="text-muted-foreground">
                    {isRu ? 'С ' : 'Since '}
                    {format(new Date(superhostSince), 'MMMM yyyy', { locale: isRu ? ru : undefined })}
                  </p>
                )}
                <div className="flex justify-center gap-2 mt-3">
                  <SuperhostBadge size="lg" />
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex p-4 rounded-full bg-muted mb-4">
                  <Target className="h-12 w-12 text-accent-amber" />
                </div>
                <h2 className="text-2xl font-bold mb-1">
                  {isRu ? 'Станьте Суперхозяином' : 'Become a Superhost'}
                </h2>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  {isRu 
                    ? 'Получите эксклюзивные преимущества, улучшив свои показатели' 
                    : 'Unlock exclusive benefits by improving your metrics'}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {isRu ? 'Ваши показатели' : 'Your Performance'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <MetricCard
              icon={<Star className="h-5 w-5 text-accent-amber" />}
              value={(Number(metrics?.avg_rating) || 0).toFixed(2)}
              label={isRu ? 'Средний рейтинг' : 'Average Rating'}
              target={`≥ ${SUPERHOST_REQUIREMENTS.minRating}`}
              met={progress?.rating.met}
            />
            <MetricCard
              icon={<CalendarCheck className="h-5 w-5 text-success" />}
              value={String(metrics?.completed_bookings || 0)}
              label={isRu ? 'Завершённых броней' : 'Completed Bookings'}
              target={`≥ ${SUPERHOST_REQUIREMENTS.minBookings}`}
              met={progress?.bookings.met}
            />
            <MetricCard
              icon={<MessageSquare className="h-5 w-5 text-info" />}
              value={`${(Number(metrics?.response_rate) || 0).toFixed(0)}%`}
              label={isRu ? 'Скорость ответа' : 'Response Rate'}
              target={`≥ ${SUPERHOST_REQUIREMENTS.minResponseRate}%`}
              met={progress?.responseRate.met}
            />
            <MetricCard
              icon={<XCircle className="h-5 w-5 text-destructive" />}
              value={`${(Number(metrics?.cancellation_rate) || 0).toFixed(1)}%`}
              label={isRu ? 'Процент отмен' : 'Cancellation Rate'}
              target={`≤ ${SUPERHOST_REQUIREMENTS.maxCancellationRate}%`}
              met={progress?.cancellationRate.met}
            />
          </div>

          {/* Progress Section */}
          {progress && !isSuperhost && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {isRu ? 'Прогресс' : 'Progress'}
                </span>
                <Badge variant="outline">
                  {progress.requirementsMet}/{progress.totalRequirements} {isRu ? 'выполнено' : 'complete'}
                </Badge>
              </div>
              
              {/* Rating */}
              <ProgressRow
                label={isRu ? 'Рейтинг' : 'Rating'}
                current={progress.rating.current.toFixed(1)}
                required={String(progress.rating.required)}
                percent={progress.rating.percent}
                met={progress.rating.met}
              />
              
              {/* Bookings */}
              <ProgressRow
                label={isRu ? 'Бронирований' : 'Bookings'}
                current={String(progress.bookings.current)}
                required={String(progress.bookings.required)}
                percent={progress.bookings.percent}
                met={progress.bookings.met}
              />
              
              {/* Response Rate */}
              <ProgressRow
                label={isRu ? 'Ответы' : 'Response'}
                current={`${progress.responseRate.current.toFixed(0)}%`}
                required={`${progress.responseRate.required}%`}
                percent={progress.responseRate.percent}
                met={progress.responseRate.met}
              />
              
              {/* Cancellation */}
              <ProgressRow
                label={isRu ? 'Отмены' : 'Cancellations'}
                current={`${progress.cancellationRate.current.toFixed(1)}%`}
                required={`≤${progress.cancellationRate.required}%`}
                percent={progress.cancellationRate.percent}
                met={progress.cancellationRate.met}
                inverse
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-amber" />
            {isSuperhost 
              ? (isRu ? 'Ваши преимущества' : 'Your Benefits')
              : (isRu ? 'Преимущества Суперхозяина' : 'Superhost Benefits')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {benefits.map((benefit, idx) => (
              <div 
                key={idx}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-none',
                  isSuperhost 
                    ? 'bg-accent-amber/10 border border-accent-amber/20' 
                    : 'bg-muted/50'
                )}
              >
                <div className={cn(
                  'p-2 rounded-full',
                  isSuperhost 
                    ? 'bg-accent-amber/20 text-accent-amber' 
                    : 'bg-muted text-muted-foreground'
                )}>
                  {benefitIcons[benefit.icon]}
                </div>
                <div>
                  <p className="font-medium text-sm">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </div>
                {isSuperhost && (
                  <CheckCircle2 className="h-5 w-5 text-success ml-auto flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      {!isSuperhost && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {isRu ? 'Как стать Суперхозяином' : 'How to Become a Superhost'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                  1
                </div>
                <p>
                  {isRu 
                    ? 'Поддерживайте рейтинг 4.8 и выше на основе отзывов гостей'
                    : 'Maintain a 4.8+ rating based on guest reviews'}
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                  2
                </div>
                <p>
                  {isRu 
                    ? 'Выполните минимум 10 бронирований'
                    : 'Complete at least 10 bookings'}
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                  3
                </div>
                <p>
                  {isRu 
                    ? 'Отвечайте на сообщения в течение 24 часов (90%+ ответов)'
                    : 'Respond to messages within 24 hours (90%+ response rate)'}
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                  4
                </div>
                <p>
                  {isRu 
                    ? 'Держите уровень отмен ниже 1%'
                    : 'Keep your cancellation rate below 1%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  target: string;
  met?: boolean;
}

function MetricCard({ icon, value, label, target, met }: MetricCardProps) {
  return (
    <div className={cn(
      'p-3 rounded-none border',
      met ? 'bg-success/5 border-success/20' : 'bg-muted/30'
    )}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        {met !== undefined && (
          met 
            ? <CheckCircle2 className="h-4 w-4 text-success ml-auto" />
            : <Circle className="h-4 w-4 text-muted-foreground ml-auto" />
        )}
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">{target}</p>
    </div>
  );
}

interface ProgressRowProps {
  label: string;
  current: string;
  required: string;
  percent: number;
  met: boolean;
  inverse?: boolean;
}

function ProgressRow({ label, current, required, percent, met, inverse }: ProgressRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {met ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
          <span>{label}</span>
        </div>
        <span className={cn(
          'text-xs',
          met ? 'text-success font-medium' : 'text-muted-foreground'
        )}>
          {current} / {required}
        </span>
      </div>
      <Progress 
        value={percent} 
        className={cn('h-2', met ? '[&>div]:bg-success' : '')} 
      />
    </div>
  );
}
