import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  UserPlus, 
  Package, 
  BarChart3, 
  FileText, 
  Settings,
  Ship,
  Home,
  Utensils,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  icon: React.ElementType;
  title: string;
  titleRu: string;
  href: string;
  variant?: 'default' | 'primary';
}

const quickActions: QuickAction[] = [
  {
    id: 'add-provider',
    icon: UserPlus,
    title: 'Add Provider',
    titleRu: 'Добавить провайдера',
    href: '/admin/providers?action=new',
    variant: 'primary',
  },
  {
    id: 'add-service',
    icon: Package,
    title: 'Add Service',
    titleRu: 'Добавить услугу',
    href: '/admin/services?action=new',
    variant: 'primary',
  },
  {
    id: 'add-yacht',
    icon: Ship,
    title: 'Add Yacht',
    titleRu: 'Добавить яхту',
    href: '/admin/yachts?action=new',
  },
  {
    id: 'add-property',
    icon: Home,
    title: 'Add Property',
    titleRu: 'Добавить объект',
    href: '/admin/properties?action=new',
  },
  {
    id: 'add-restaurant',
    icon: Utensils,
    title: 'Add Restaurant',
    titleRu: 'Добавить ресторан',
    href: '/admin/restaurants?action=new',
  },
  {
    id: 'add-event',
    icon: Calendar,
    title: 'Add Event',
    titleRu: 'Добавить событие',
    href: '/admin/events?action=new',
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'View Analytics',
    titleRu: 'Аналитика',
    href: '/admin/analytics',
  },
  {
    id: 'reports',
    icon: FileText,
    title: 'Reports',
    titleRu: 'Отчёты',
    href: '/admin/finance',
  },
];

interface AdminQuickActionsProps {
  className?: string;
}

export function AdminQuickActions({ className }: AdminQuickActionsProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const navigate = useNavigate();

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {isRussian ? 'Быстрые действия' : 'Quick Actions'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant === 'primary' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "h-auto py-2.5 px-3 flex flex-col items-center gap-1.5 text-center",
                action.variant === 'primary' && "bg-primary hover:bg-primary/90"
              )}
              onClick={() => navigate(action.href)}
            >
              <action.icon className="h-4 w-4" />
              <span className="text-xs font-medium leading-tight">
                {isRussian ? action.titleRu : action.title}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
