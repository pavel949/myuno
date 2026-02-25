import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useSuperhostStatus, SUPERHOST_BENEFITS } from '@/hooks/useSuperhostStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SuperhostBadge, SuperhostIcon } from './SuperhostBadge';
import { 
  Award, 
  Star, 
  CheckCircle2, 
  Circle,
  TrendingUp,
  MessageSquare,
  CalendarCheck,
  XCircle,
  ChevronRight,
  Trophy,
  Percent,
  Headphones,
  Gift,
  BadgeCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const benefitIcons: Record<string, React.ReactNode> = {
  trophy: <Trophy className="h-4 w-4" />,
  badge: <BadgeCheck className="h-4 w-4" />,
  percent: <Percent className="h-4 w-4" />,
  headphones: <Headphones className="h-4 w-4" />,
  gift: <Gift className="h-4 w-4" />,
};

export function SuperhostStatusCard() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const { metrics, progress, isSuperhost, superhostSince, isLoading } = useSuperhostStatus();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  const benefits = SUPERHOST_BENEFITS[isRu ? 'ru' : 'en'];

  // Superhost achieved view
  if (isSuperhost) {
    return (
      <Card className="overflow-hidden border-accent-amber/30 bg-gradient-to-br from-accent-amber/5 to-warning/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SuperhostIcon size="lg" />
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {isRu ? 'Суперхозяин' : 'Superhost'}
                  <Badge variant="secondary" className="bg-accent-amber/20 text-accent-amber">
                    ★ {(Number(metrics?.avg_rating) || 0).toFixed(1)}
                  </Badge>
                </CardTitle>
                {superhostSince && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isRu ? 'С ' : 'Since '}
                    {format(new Date(superhostSince), 'MMMM yyyy', { locale: isRu ? ru : undefined })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <StatItem
              icon={<Star className="h-4 w-4 text-accent-amber" />}
              value={(Number(metrics?.avg_rating) || 0).toFixed(1)}
              label={isRu ? 'Рейтинг' : 'Rating'}
            />
            <StatItem
              icon={<CalendarCheck className="h-4 w-4 text-success" />}
              value={String(metrics?.completed_bookings || 0)}
              label={isRu ? 'Брони' : 'Bookings'}
            />
            <StatItem
              icon={<MessageSquare className="h-4 w-4 text-info" />}
              value={`${Number(metrics?.response_rate || 0).toFixed(0)}%`}
              label={isRu ? 'Ответы' : 'Response'}
            />
            <StatItem
              icon={<XCircle className="h-4 w-4 text-destructive" />}
              value={`${Number(metrics?.cancellation_rate || 0).toFixed(1)}%`}
              label={isRu ? 'Отмены' : 'Cancel'}
            />
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {isRu ? 'Ваши преимущества' : 'Your Benefits'}
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {benefits.slice(0, 3).map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="p-1 rounded-full bg-accent-amber/20 text-accent-amber">
                    {benefitIcons[benefit.icon]}
                  </div>
                  <span className="text-muted-foreground">{benefit.title}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Progress view for non-Superhosts
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-accent-amber" />
            {isRu ? 'Путь к Суперхозяину' : 'Path to Superhost'}
          </CardTitle>
          {progress && (
            <Badge variant="outline" className="text-xs">
              {progress.requirementsMet}/{progress.totalRequirements}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {progress ? (
          <>
            {/* Overall Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">
                  {isRu ? 'Общий прогресс' : 'Overall Progress'}
                </span>
                <span className="font-medium">{progress.overallProgress.toFixed(0)}%</span>
              </div>
              <Progress value={progress.overallProgress} className="h-2" />
            </div>

            {/* Requirements */}
            <div className="space-y-3">
              <RequirementItem
                label={isRu ? 'Рейтинг' : 'Rating'}
                current={progress.rating.current.toFixed(1)}
                required={`≥ ${progress.rating.required}`}
                percent={progress.rating.percent}
                met={progress.rating.met}
                icon={<Star className="h-4 w-4" />}
              />
              <RequirementItem
                label={isRu ? 'Бронирований' : 'Bookings'}
                current={String(progress.bookings.current)}
                required={`≥ ${progress.bookings.required}`}
                percent={progress.bookings.percent}
                met={progress.bookings.met}
                icon={<CalendarCheck className="h-4 w-4" />}
              />
              <RequirementItem
                label={isRu ? 'Отмены' : 'Cancellations'}
                current={`${progress.cancellationRate.current.toFixed(1)}%`}
                required={`≤ ${progress.cancellationRate.required}%`}
                percent={progress.cancellationRate.percent}
                met={progress.cancellationRate.met}
                icon={<XCircle className="h-4 w-4" />}
              />
              <RequirementItem
                label={isRu ? 'Ответы' : 'Response Rate'}
                current={`${progress.responseRate.current.toFixed(0)}%`}
                required={`≥ ${progress.responseRate.required}%`}
                percent={progress.responseRate.percent}
                met={progress.responseRate.met}
                icon={<MessageSquare className="h-4 w-4" />}
              />
            </div>

            {/* Benefits Preview */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                {isRu ? 'Преимущества Суперхозяина' : 'Superhost Benefits'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {benefits.slice(0, 3).map((benefit, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs gap-1">
                    {benefitIcons[benefit.icon]}
                    {benefit.title}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-1">
              {isRu ? 'Начните принимать гостей' : 'Start hosting guests'}
            </p>
            <p className="text-xs">
              {isRu 
                ? 'Ваш прогресс появится после первых бронирований' 
                : 'Your progress will appear after first bookings'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

function StatItem({ icon, value, label }: StatItemProps) {
  return (
    <div className="text-center p-2 rounded-lg bg-background/50">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="font-semibold text-sm">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

interface RequirementItemProps {
  label: string;
  current: string;
  required: string;
  percent: number;
  met: boolean;
  icon: React.ReactNode;
}

function RequirementItem({ label, current, required, percent, met, icon }: RequirementItemProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {met ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={cn(met ? 'text-success font-medium' : 'text-muted-foreground')}>
            {current}
          </span>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-muted-foreground">{required}</span>
        </div>
      </div>
      <Progress 
        value={percent} 
        className={cn('h-1.5', met ? '[&>div]:bg-success' : '')} 
      />
    </div>
  );
}

// Compact version for dashboard
export function SuperhostStatusCompact() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const { progress, isSuperhost, isLoading } = useSuperhostStatus();

  if (isLoading) {
    return <Skeleton className="h-12 w-full rounded-xl" />;
  }

  if (isSuperhost) {
    return (
      <div
        onClick={() => navigate('/owner/superhost')}
        className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-accent-amber/10 to-warning/10 border border-accent-amber/20 cursor-pointer hover:bg-accent-amber/20 transition-colors"
      >
        <SuperhostIcon size="sm" />
        <div className="flex-1">
          <p className="font-medium text-sm">
            {isRu ? 'Вы Суперхозяин!' : "You're a Superhost!"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isRu ? 'Посмотреть преимущества' : 'View your benefits'}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate('/owner/superhost')}
      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border cursor-pointer hover:bg-muted transition-colors"
    >
      <div className="p-2 rounded-full bg-accent-amber/20">
        <Award className="h-4 w-4 text-accent-amber" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm">
          {isRu ? 'Станьте Суперхозяином' : 'Become a Superhost'}
        </p>
        <p className="text-xs text-muted-foreground">
          {progress 
            ? `${progress.requirementsMet}/${progress.totalRequirements} ${isRu ? 'требований' : 'requirements'}`
            : isRu ? 'Начните принимать гостей' : 'Start hosting'}
        </p>
      </div>
      {progress && (
        <div className="w-10 h-10 relative">
          <svg className="w-10 h-10 -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-muted"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={100}
              strokeDashoffset={100 - progress.overallProgress}
              strokeLinecap="round"
              className="text-accent-amber"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
            {progress.overallProgress.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}
