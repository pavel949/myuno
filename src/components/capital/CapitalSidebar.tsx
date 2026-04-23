import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  Building2,
  Megaphone,
  MessageCircle,
  KanbanSquare,
  FileText,
  Briefcase,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/capital', label: 'Дашборд', icon: LayoutDashboard, end: true },
  { path: '/capital/contacts', label: 'Контакты', icon: Users },
  { path: '/capital/investment-deals', label: 'Investment Deals', icon: Briefcase },
  { path: '/capital/deals/newbuilds', label: 'Newbuilds Deals', icon: Building2 },
  { path: '/capital/projects', label: 'Проекты', icon: Building2 },
  { path: '/capital/campaigns', label: 'Кампании', icon: Megaphone },
  { path: '/capital/outreach', label: 'Касания', icon: MessageCircle },
  { path: '/capital/pipeline', label: 'Воронка', icon: KanbanSquare },
  { path: '/capital/templates', label: 'Шаблоны', icon: FileText },
];

export function CapitalSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="p-4 border-b border-border/50">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/capital')}
        >
          <div className="w-8 h-8 rounded-none bg-success/20 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-success" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Ignatev Capital</h2>
            <p className="text-xs text-muted-foreground">CRM</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    isActive={isActive(item.path, item.end)}
                    className="data-[active=true]:bg-success/10 data-[active=true]:text-success"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
