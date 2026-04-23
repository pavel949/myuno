import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTeamMember } from '@/hooks/useTeamMember';
import { useMyGamification } from '@/hooks/useTeamGamification';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Inbox,
  FileEdit,
  MessageCircle,
  Trophy,
  Users,
  Settings,
  ShieldCheck,
  TrendingUp,
  Headphones,
  Sparkles,
} from 'lucide-react';

interface SidebarLink {
  path: string;
  icon: typeof LayoutDashboard;
  labelEn: string;
  labelRu: string;
  badge?: number;
  requiredSpec?: string[];
}

const SIDEBAR_LINKS: SidebarLink[] = [
  { path: '/team', icon: LayoutDashboard, labelEn: 'Dashboard', labelRu: 'Главная' },
  { path: '/team/inbox', icon: Inbox, labelEn: 'Inbox', labelRu: 'Входящие' },
  { path: '/team/content', icon: FileEdit, labelEn: 'Content', labelRu: 'Контент', requiredSpec: ['content_manager', 'team_lead'] },
  { path: '/team/support', icon: Headphones, labelEn: 'Support', labelRu: 'Поддержка', requiredSpec: ['support_operator', 'team_lead'] },
  { path: '/team/leads', icon: TrendingUp, labelEn: 'Leads', labelRu: 'Лиды', requiredSpec: ['sales_manager', 'team_lead'] },
  { path: '/team/moderation', icon: ShieldCheck, labelEn: 'Moderation', labelRu: 'Модерация', requiredSpec: ['moderation_officer', 'team_lead'] },
  { path: '/team/chat', icon: MessageCircle, labelEn: 'Team Chat', labelRu: 'Чат команды' },
  { path: '/team/leaderboard', icon: Trophy, labelEn: 'Leaderboard', labelRu: 'Рейтинг' },
];

interface TeamSidebarProps {
  className?: string;
}

export function TeamSidebar({ className }: TeamSidebarProps) {
  const { language } = useLanguage();
  const location = useLocation();
  const { member, hasSpecialization, isTeamLead } = useTeamMember();
  const { stats, level, progress } = useMyGamification();
  const isRu = language === 'ru';

  const filteredLinks = SIDEBAR_LINKS.filter(link => {
    if (!link.requiredSpec) return true;
    if (isTeamLead) return true;
    return link.requiredSpec.some(spec => hasSpecialization(spec as any));
  });

  return (
    <aside className={cn(
      "w-64 bg-card border-r flex flex-col h-full",
      className
    )}>
      {/* Profile Section */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={member?.avatar_url || undefined} />
            <AvatarFallback>
              {member?.display_name?.charAt(0) || 'T'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {member?.display_name || (isRu ? 'Команда' : 'Team')}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={cn("text-xs", level.color)}>
                Lv.{stats?.level || 1}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {stats?.total_points || 0} pts
              </span>
            </div>
          </div>
        </div>
        
        {/* Level Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">
              {isRu ? level.name_ru : level.name_en}
            </span>
            <span className="text-muted-foreground">{progress.progress}%</span>
          </div>
          <Progress value={progress.progress} className="h-1.5" />
        </div>

        {/* Streak */}
        {(stats?.streak_days || 0) > 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-accent">
            <Sparkles className="h-3 w-3" />
            <span>{stats?.streak_days} {isRu ? 'дней подряд' : 'day streak'}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="px-2 space-y-1">
          {filteredLinks.map(link => {
            const Icon = link.icon;
            const active = location.pathname === link.path;
            
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-none transition-all duration-200",
                  "hover:bg-sidebar-accent/50",
                  active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                )}
              >
                <Icon className="size-5 shrink-0" />
                <span className="flex-1 text-sm">
                  {isRu ? link.labelRu : link.labelEn}
                </span>
                {link.badge && link.badge > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-xs">
                    {link.badge}
                  </Badge>
                )}
              </NavLink>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <NavLink
          to="/team/my-profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-none transition-colors",
            "hover:bg-muted/50 text-sm text-muted-foreground"
          )}
        >
          <Settings className="size-5" />
          {isRu ? 'Настройки' : 'Settings'}
        </NavLink>
      </div>
    </aside>
  );
}
