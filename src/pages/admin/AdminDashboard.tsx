import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck, useAdminProviders, useAdminServices } from '@/hooks/useAdmin';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  Package, 
  Users, 
  FileCheck,
  Plus,
  ArrowRight,
  Shield,
  Settings,
  BarChart3,
  Map,
  Palmtree,
  Ship,
  Home,
  Presentation
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { providers } = useAdminProviders();
  const { services } = useAdminServices();

  const isRussian = language === 'ru';

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  React.useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, user, navigate]);

  if (authLoading || adminLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (!isAdmin) return null;

  const stats = [
    {
      label: isRussian ? 'Провайдеры' : 'Providers',
      value: providers.length.toString(),
      icon: Building2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: isRussian ? 'Услуги' : 'Services',
      value: services.length.toString(),
      icon: Package,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: isRussian ? 'Активные' : 'Active',
      value: providers.filter(p => p.is_active).length.toString(),
      icon: Shield,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: isRussian ? 'На модерации' : 'Pending',
      value: providers.filter(p => !p.is_verified).length.toString(),
      icon: FileCheck,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  const quickActions = [
    {
      label: isRussian ? 'Инвестор Дек' : 'Investor Deck',
      description: isRussian ? 'Питч презентация' : 'Pitch presentation',
      icon: Presentation,
      path: '/admin/pitch-deck',
      color: 'bg-amber-500',
    },
    {
      label: isRussian ? 'Аналитика' : 'Analytics',
      description: isRussian ? 'Метрики платформы' : 'Platform metrics',
      icon: BarChart3,
      path: '/admin/analytics',
      color: 'bg-indigo-500',
    },
    {
      label: isRussian ? 'Провайдеры' : 'Providers',
      description: isRussian ? 'Добавить поставщика' : 'Add provider',
      icon: Building2,
      path: '/admin/providers',
      color: 'bg-blue-500',
    },
    {
      label: isRussian ? 'Услуги' : 'Services',
      description: isRussian ? 'Добавить услугу' : 'Add service',
      icon: Package,
      path: '/admin/services',
      color: 'bg-purple-500',
    },
    {
      label: isRussian ? 'Туры' : 'Tours',
      description: isRussian ? 'Управление турами' : 'Manage tours',
      icon: Palmtree,
      path: '/admin/tours',
      color: 'bg-green-500',
    },
    {
      label: isRussian ? 'Активности' : 'Activities',
      description: isRussian ? 'Водные развлечения' : 'Water activities',
      icon: Ship,
      path: '/admin/activities',
      color: 'bg-cyan-500',
    },
    {
      label: isRussian ? 'Недвижимость' : 'Properties',
      description: isRussian ? 'Объекты' : 'Properties',
      icon: Home,
      path: '/admin/properties',
      color: 'bg-orange-500',
    },
    {
      label: isRussian ? 'Заявки' : 'Applications',
      description: isRussian ? 'Заявки партнёров' : 'Partner applications',
      icon: Users,
      path: '/admin/partner-applications',
      color: 'bg-rose-500',
    },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRussian ? 'Админ-панель' : 'Admin Panel'}
          showBack
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {isRussian ? 'Управление контентом' : 'Content Management'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start h-auto py-3"
                onClick={() => navigate(action.path)}
              >
                <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Quick Add Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="h-auto py-4 flex-col gap-2"
            onClick={() => navigate('/admin/providers?action=new')}
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm">{isRussian ? 'Новый провайдер' : 'New Provider'}</span>
          </Button>
          <Button 
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => navigate('/admin/services?action=new')}
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm">{isRussian ? 'Новая услуга' : 'New Service'}</span>
          </Button>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
