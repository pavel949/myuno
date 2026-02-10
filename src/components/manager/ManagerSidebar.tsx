/**
 * @module ManagerSidebar
 * @description Sidebar navigation for Property Manager
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  Building2, 
  Calendar, 
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const menuItems = [
  {
    group: 'main',
    groupLabelEn: 'Management',
    groupLabelRu: 'Управление',
    items: [
      { 
        id: 'dashboard', 
        icon: LayoutDashboard, 
        labelEn: 'Dashboard', 
        labelRu: 'Обзор',
        path: '/manager',
      },
      { 
        id: 'properties', 
        icon: Building2, 
        labelEn: 'Properties', 
        labelRu: 'Объекты',
        path: '/manager/properties',
      },
      { 
        id: 'calendar', 
        icon: Calendar, 
        labelEn: 'Calendar', 
        labelRu: 'Календарь',
        path: '/manager/calendar',
      },
    ],
  },
  {
    group: 'support',
    groupLabelEn: 'Support',
    groupLabelRu: 'Поддержка',
    items: [
      { 
        id: 'settings', 
        icon: Settings, 
        labelEn: 'Settings', 
        labelRu: 'Настройки',
        path: '/manager/settings',
      },
    ],
  },
];

export function ManagerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const isActive = (path: string) => {
    if (path === '/manager') {
      return location.pathname === '/manager';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold">
            PM
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="font-semibold text-sm">
              {isRu ? 'Управляющий' : 'Property Manager'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Панель управления' : 'Control Panel'}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>
              {isRu ? group.groupLabelRu : group.groupLabelEn}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => navigate(item.path)}
                        className={cn(
                          active && 'bg-primary/10 text-primary'
                        )}
                        tooltip={isRu ? item.labelRu : item.labelEn}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{isRu ? item.labelRu : item.labelEn}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t group-data-[collapsible=icon]:hidden">
        <Badge variant="secondary" className="gap-1 bg-accent text-accent-foreground justify-center">
          {isRu ? 'Управляющий' : 'Property Manager'}
        </Badge>
      </SidebarFooter>
    </Sidebar>
  );
}
