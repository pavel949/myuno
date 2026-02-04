import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMember, SPECIALIZATION_LABELS, type TeamSpecialization } from '@/hooks/useTeamMember';
import { useMyGamification } from '@/hooks/useTeamGamification';
import { useTeamLeads } from '@/hooks/useTeamLeads';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import { TeamLayout } from '@/components/team/TeamLayout';
import { PointsDisplay } from '@/components/team/gamification/PointsDisplay';
import { Leaderboard } from '@/components/team/gamification/Leaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LayoutDashboard, ChevronRight, Plus, FileText, Headphones, TrendingUp,
  ShieldCheck, Inbox, AlertTriangle, CheckCircle2, Clock, Trophy,
  MessageCircle, Building, Ship, MapPin, Utensils
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Quick actions based on specialization
const QUICK_ACTIONS = [
  { id: 'inbox', icon: Inbox, labelEn: 'Inbox', labelRu: 'Входящие', href: '/team/inbox', spec: null },
  { id: 'content', icon: Plus, labelEn: 'Add Content', labelRu: 'Добавить', href: '/team/content', spec: 'content_manager' },
  { id: 'support', icon: Headphones, labelEn: 'Support', labelRu: 'Поддержка', href: '/team/support', spec: 'support_operator' },
  { id: 'leads', icon: TrendingUp, labelEn: 'Leads', labelRu: 'Лиды', href: '/team/leads', spec: 'sales_manager' },
  { id: 'moderation', icon: ShieldCheck, labelEn: 'Moderation', labelRu: 'Модерация', href: '/team/moderation', spec: 'moderation_officer' },
  { id: 'chat', icon: MessageCircle, labelEn: 'Team Chat', labelRu: 'Чат', href: '/team/chat', spec: null },
];

// Platform verticals for stats
const PLATFORM_VERTICALS = [
  { key: 'properties', icon: Building, labelEn: 'Properties', labelRu: 'Недвижимость' },
  { key: 'yachts', icon: Ship, labelEn: 'Yachts', labelRu: 'Яхты' },
  { key: 'tours', icon: MapPin, labelEn: 'Tours', labelRu: 'Туры' },
  { key: 'restaurants', icon: Utensils, labelEn: 'Restaurants', labelRu: 'Рестораны' },
];

export default function TeamDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const { member, hasSpecialization, isTeamLead, isLoading: memberLoading } = useTeamMember();
  const { stats: gamificationStats } = useMyGamification();
  const { stats: leadStats } = useTeamLeads({});
  const { data: platformStats, isLoading: platformLoading } = useAdminDashboardStats();

  // Filter quick actions based on user specialization
  const filteredActions = QUICK_ACTIONS.filter(action => {
    if (!action.spec) return true;
    if (isTeamLead) return true;
    return hasSpecialization(action.spec as TeamSpecialization);
  });

  const getVerticalCount = (key: string): number => {
    if (!platformStats) return 0;
    return (platformStats as any)[key] || 0;
  };

  if (memberLoading) {
    return (
      <TeamLayout title={isRu ? 'Главная' : 'Dashboard'}>
        <div className="py-6 px-4 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </TeamLayout>
    );
  }

  return (
    <TeamLayout title={isRu ? 'Главная' : 'Dashboard'}>
      <div className="py-6 px-4 space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            {isRu ? 'Привет' : 'Welcome'}, {member?.display_name || (isRu ? 'команда' : 'team')}! 👋
          </h1>
          <p className="text-muted-foreground">
            {isRu 
              ? 'Ваш центр управления командой myUNO' 
              : 'Your myUNO team command center'}
          </p>
        </div>

        {/* Gamification Points */}
        <PointsDisplay />

        {/* Quick Actions Grid */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{isRu ? 'Быстрые действия' : 'Quick Actions'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {filteredActions.map(action => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.id}
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-1.5"
                    onClick={() => navigate(action.href)}
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs font-medium">
                      {isRu ? action.labelRu : action.labelEn}
                    </span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200">
            <div className="flex items-center gap-3">
              <Inbox className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{leadStats.pending}</p>
                <p className="text-xs text-muted-foreground">{isRu ? 'Новые лиды' : 'New Leads'}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-red-50 dark:bg-red-950/30 border-red-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{leadStats.overdue}</p>
                <p className="text-xs text-muted-foreground">{isRu ? 'Просрочено' : 'Overdue'}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{leadStats.inProgress}</p>
                <p className="text-xs text-muted-foreground">{isRu ? 'В работе' : 'In Progress'}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-green-50 dark:bg-green-950/30 border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{leadStats.completed}</p>
                <p className="text-xs text-muted-foreground">{isRu ? 'Завершено' : 'Completed'}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leaderboard (Compact) */}
          <Leaderboard compact maxItems={5} />

          {/* Platform Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{isRu ? 'Платформа' : 'Platform Stats'}</span>
                <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
                  {isRu ? 'Подробнее' : 'Details'}
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {PLATFORM_VERTICALS.map(vertical => {
                  const Icon = vertical.icon;
                  const count = getVerticalCount(vertical.key);
                  return (
                    <div key={vertical.key} className="text-center p-3 rounded-lg bg-muted/50">
                      <Icon className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-lg font-bold">{platformLoading ? '-' : count}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {isRu ? vertical.labelRu : vertical.labelEn}
                      </p>
                    </div>
                  );
                })}
              </div>
              {platformStats && (
                <div className="mt-4 pt-3 border-t grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div className="text-center">
                    <p className="font-medium text-foreground">{platformStats.totalUsers}</p>
                    <p>{isRu ? 'Пользователей' : 'Users'}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">{platformStats.providers}</p>
                    <p>{isRu ? 'Провайдеров' : 'Providers'}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">{platformStats.pendingContent}</p>
                    <p>{isRu ? 'На модерации' : 'Pending'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Specializations */}
        {member?.specializations && member.specializations.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-2">{isRu ? 'Ваши специализации' : 'Your Specializations'}</p>
                <div className="flex flex-wrap gap-2">
                  {member.specializations.map(spec => {
                    const label = SPECIALIZATION_LABELS[spec as TeamSpecialization];
                    return (
                      <Badge 
                        key={spec} 
                        className={cn("text-white", label?.color)}
                      >
                        {isRu ? label?.ru : label?.en}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/team/my-profile')}>
                {isRu ? 'Профиль' : 'Profile'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </TeamLayout>
  );
}
