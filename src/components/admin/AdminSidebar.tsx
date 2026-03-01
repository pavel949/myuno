import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Cog,
  Layers,
  LogOut,
  ChevronRight,
  ChevronDown,
  Bot,
  Brain,
  Inbox,
  Megaphone,
  Building2,
  Target,
  FileText,
  Building,
  FolderTree,
  TrendingUp,
  HardHat,
  Sparkles,
  Home,
  Anchor,
  Car,
  Flower2,
  Scissors,
  Stethoscope,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface NavItem {
  title: string;
  titleRu: string;
  path: string;
  icon: React.ElementType;
}

interface NavGroup {
  id: string;
  title: string;
  titleRu: string;
  items: NavItem[];
}

// Storage key for group states
const SIDEBAR_GROUPS_KEY = 'myuno_admin_sidebar_groups';

// Grouped navigation items
const navigationGroups: NavGroup[] = [
  {
    id: 'main',
    title: 'Main',
    titleRu: 'Главное',
    items: [
      { title: 'Dashboard', titleRu: 'Дашборд', path: '/admin', icon: LayoutDashboard },
      { title: 'Catalog', titleRu: 'Каталог', path: '/admin/catalog', icon: Package },
      { title: 'Operations', titleRu: 'Операции', path: '/admin/operations', icon: Layers },
      { title: 'Intake', titleRu: 'Приём', path: '/admin/intake', icon: Inbox },
    ],
  },
  {
    id: 'verticals',
    title: 'Verticals',
    titleRu: 'Вертикали',
    items: [
      { title: 'Properties', titleRu: 'Недвижимость', path: '/admin/properties', icon: Home },
      { title: 'Yachts', titleRu: 'Яхты', path: '/admin/yachts', icon: Anchor },
      { title: 'Transport', titleRu: 'Транспорт', path: '/admin/transport', icon: Car },
      { title: 'Flowers', titleRu: 'Цветы', path: '/admin/flowers', icon: Flower2 },
      { title: 'Beauty', titleRu: 'Красота', path: '/admin/beauty', icon: Scissors },
      { title: 'Medical', titleRu: 'Медицина', path: '/admin/medical', icon: Stethoscope },
      { title: 'Projects', titleRu: 'Проекты / ЖК', path: '/admin/projects', icon: Building2 },
      { title: 'Investments', titleRu: 'Инвестиции', path: '/admin/investments', icon: TrendingUp },
      { title: 'Developers', titleRu: 'Застройщики', path: '/admin/developers', icon: HardHat },
      { title: 'PM Companies', titleRu: 'УК (справочник)', path: '/admin/pm-companies', icon: Building },
      { title: 'MC Dashboard', titleRu: 'УК — Обзор', path: '/admin/mc-dashboard', icon: Building2 },
    ],
  },
  {
    id: 'operations',
    title: 'Operations',
    titleRu: 'Операции',
    items: [
      { title: 'AI Command Center', titleRu: 'AI Центр', path: '/admin/ai-ops', icon: Brain },
      { title: 'AI Agents', titleRu: 'AI Агенты', path: '/admin/ai-agents', icon: Bot },
      { title: 'Acquisition', titleRu: 'Привлечение', path: '/admin/vendor-prospects', icon: Target },
      { title: 'Marketing', titleRu: 'Маркетинг', path: '/admin/marketing', icon: Megaphone },
      { title: 'Contracts', titleRu: 'Контракты', path: '/admin/contracts', icon: FileText },
    ],
  },
  {
    id: 'system',
    title: 'System',
    titleRu: 'Система',
    items: [
      { title: 'Taxonomy', titleRu: 'Таксономии', path: '/admin/taxonomy', icon: FolderTree },
      { title: 'LifeOS', titleRu: 'LifeOS', path: '/admin/life-situations', icon: Sparkles },
      { title: 'Control', titleRu: 'Управление', path: '/admin/control', icon: Cog },
    ],
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { user, signOut } = useAuth();
  const { state, isMobile, setOpenMobile } = useSidebar();
  
  // Load group states from localStorage
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_GROUPS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    // Default: all groups open
    return { main: true, verticals: false, operations: true, system: true };
  });

  // Save group states to localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_GROUPS_KEY, JSON.stringify(openGroups));
  }, [openGroups]);

  // On mobile, always show full content when sidebar is open
  // On desktop, respect the collapsed state
  const isCollapsed = isMobile ? false : state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  // Find which group contains the active route and ensure it's open
  useEffect(() => {
    const activeGroup = navigationGroups.find(group =>
      group.items.some(item => isActive(item.path))
    );
    if (activeGroup && !openGroups[activeGroup.id]) {
      setOpenGroups(prev => ({ ...prev, [activeGroup.id]: true }));
    }
  }, [location.pathname]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-lg shadow-sm">
            m
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground text-lg">myUNO</span>
              <span className="text-xs text-sidebar-foreground/60">Command Center</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation - Collapsible Groups */}
      <SidebarContent className="px-3 py-4">
        {navigationGroups.map((group) => (
          <Collapsible
            key={group.id}
            open={isCollapsed ? false : openGroups[group.id]}
            onOpenChange={() => !isCollapsed && toggleGroup(group.id)}
          >
            {/* Group Header */}
            {!isCollapsed && (
              <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider hover:text-sidebar-foreground transition-colors">
                <span>{isRussian ? group.titleRu : group.title}</span>
                {openGroups[group.id] ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </CollapsibleTrigger>
            )}

            <CollapsibleContent className="space-y-1">
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => handleNavigate(item.path)}
                      isActive={isActive(item.path)}
                      tooltip={isRussian ? item.titleRu : item.title}
                      className={cn(
                        "transition-all duration-200",
                        isActive(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{isRussian ? item.titleRu : item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </CollapsibleContent>

            {/* In collapsed mode, show items without group headers */}
            {isCollapsed && (
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => handleNavigate(item.path)}
                      isActive={isActive(item.path)}
                      tooltip={isRussian ? item.titleRu : item.title}
                      className={cn(
                        "transition-all duration-200",
                        isActive(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}

            {/* Divider between groups */}
            {!isCollapsed && group.id !== 'system' && (
              <div className="my-3 mx-3 h-px bg-sidebar-border/50" />
            )}
          </Collapsible>
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.user_metadata?.name || 'Admin'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email}
              </p>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={() => signOut()}
              className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
              title={isRussian ? 'Выйти' : 'Sign out'}
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
