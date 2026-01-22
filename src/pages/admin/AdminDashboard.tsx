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
  Palmtree,
  Ship,
  Home,
  Presentation,
  Sailboat,
  Waves,
  UtensilsCrossed,
  Sparkles,
  Stethoscope,
  Dumbbell,
  Car,
  Calendar,
  GraduationCap,
  Scale,
  PawPrint,
  Shirt,
  Baby,
  Flower2,
  Pill,
  ShoppingBag,
  ClipboardCheck,
  Wallet,
  Globe,
  Handshake
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

  // Categories grouped by vertical
  const categoryGroups = [
    {
      title: isRussian ? 'Travel & Leisure' : 'Travel & Leisure',
      items: [
        { label: isRussian ? 'Яхты' : 'Yachts', icon: Sailboat, path: '/admin/yachts', color: 'bg-sky-500' },
        { label: isRussian ? 'Туры' : 'Tours', icon: Palmtree, path: '/admin/tours', color: 'bg-green-500' },
        { label: isRussian ? 'Активности' : 'Activities', icon: Waves, path: '/admin/activities', color: 'bg-cyan-500' },
        { label: isRussian ? 'Водные' : 'Water', icon: Ship, path: '/admin/water-activities', color: 'bg-blue-500' },
        { label: isRussian ? 'Мероприятия' : 'Events', icon: Calendar, path: '/admin/events', color: 'bg-pink-500' },
      ]
    },
    {
      title: isRussian ? 'Lifestyle' : 'Lifestyle',
      items: [
        { label: isRussian ? 'Рестораны' : 'Restaurants', icon: UtensilsCrossed, path: '/admin/restaurants', color: 'bg-orange-500' },
        { label: isRussian ? 'Салоны' : 'Salons', icon: Sparkles, path: '/admin/salons', color: 'bg-pink-500' },
        { label: isRussian ? 'Фитнес' : 'Fitness', icon: Dumbbell, path: '/admin/gyms', color: 'bg-red-500' },
        { label: isRussian ? 'Цветы' : 'Flowers', icon: Flower2, path: '/admin/flowers', color: 'bg-rose-500' },
      ]
    },
    {
      title: isRussian ? 'Services' : 'Services',
      items: [
        { label: isRussian ? 'Уборка' : 'Cleaning', icon: Shirt, path: '/admin/cleaning', color: 'bg-emerald-500' },
        { label: isRussian ? 'Няни' : 'Babysitters', icon: Baby, path: '/admin/babysitters', color: 'bg-violet-500' },
        { label: isRussian ? 'Юристы' : 'Legal', icon: Scale, path: '/admin/legal', color: 'bg-slate-500' },
        { label: isRussian ? 'Образование' : 'Education', icon: GraduationCap, path: '/admin/education', color: 'bg-blue-500' },
        { label: isRussian ? 'Питомцы' : 'Pets', icon: PawPrint, path: '/admin/pets', color: 'bg-amber-500' },
      ]
    },
    {
      title: isRussian ? 'Infrastructure' : 'Infrastructure',
      items: [
        { label: isRussian ? 'Недвижимость' : 'Properties', icon: Home, path: '/admin/properties', color: 'bg-orange-500' },
        { label: isRussian ? 'Транспорт' : 'Transport', icon: Car, path: '/admin/vehicles', color: 'bg-indigo-500' },
        { label: isRussian ? 'Клиники' : 'Clinics', icon: Stethoscope, path: '/admin/clinics', color: 'bg-teal-500' },
        { label: isRussian ? 'Аптеки' : 'Pharmacies', icon: Pill, path: '/admin/pharmacies', color: 'bg-green-500' },
        { label: isRussian ? 'Страхование' : 'Insurance', icon: Shield, path: '/admin/insurance', color: 'bg-purple-500' },
        { label: isRussian ? 'Магазины' : 'Stores', icon: ShoppingBag, path: '/admin/stores', color: 'bg-amber-500' },
      ]
    },
  ];

  const systemActions = [
    // Analytics & Insights
    { label: isRussian ? 'Аналитика' : 'Analytics', icon: BarChart3, path: '/admin/analytics', color: 'bg-indigo-500' },
    { label: isRussian ? 'Пользователи' : 'Users', icon: Users, path: '/admin/users', color: 'bg-blue-500' },
    { label: isRussian ? 'Метрики M&A' : 'Acquisition Metrics', icon: BarChart3, path: '/admin/acquisition-metrics', color: 'bg-violet-500' },
    
    // Operations & CRM
    { label: isRussian ? 'Операции' : 'Operations', icon: ClipboardCheck, path: '/admin/operations', color: 'bg-cyan-500' },
    { label: isRussian ? 'Лиды' : 'Leads', icon: Users, path: '/admin/leads', color: 'bg-green-500' },
    { label: isRussian ? 'Заявки' : 'Consultations', icon: ClipboardCheck, path: '/admin/consultations', color: 'bg-teal-500' },
    { label: isRussian ? 'Тикеты' : 'Tickets', icon: FileCheck, path: '/admin/tickets', color: 'bg-orange-500' },
    
    // Content & Moderation
    { label: isRussian ? 'Модерация' : 'Moderation', icon: Shield, path: '/admin/moderation', color: 'bg-yellow-500' },
    { label: isRussian ? 'Заявки партнёров' : 'Partner Apps', icon: Handshake, path: '/admin/partner-applications', color: 'bg-pink-500' },
    
    // Finance & Business
    { label: isRussian ? 'Финансы' : 'Finance', icon: Wallet, path: '/admin/finance', color: 'bg-emerald-500' },
    { label: isRussian ? 'Питч-дек' : 'Pitch Deck', icon: Presentation, path: '/admin/pitch-deck', color: 'bg-amber-500' },
    
    // System Configuration
    { label: isRussian ? 'Города' : 'Cities', icon: Globe, path: '/admin/cities', color: 'bg-teal-500' },
    { label: isRussian ? 'Провайдеры' : 'Providers', icon: Building2, path: '/admin/providers', color: 'bg-blue-500' },
    { label: isRussian ? 'Услуги' : 'Services', icon: Package, path: '/admin/services', color: 'bg-purple-500' },
    { label: isRussian ? 'UNO Team' : 'UNO Team', icon: Users, path: '/admin/uno-team', color: 'bg-emerald-500' },
    { label: isRussian ? 'Справочники' : 'Lookups', icon: Settings, path: '/admin/lookups', color: 'bg-slate-500' },
    { label: isRussian ? 'Быстрые заявки' : 'Quick Listings', icon: Sparkles, path: '/admin/quick-listings', color: 'bg-amber-500' },
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

        {/* Category Groups */}
        {categoryGroups.map((group, groupIndex) => (
          <Card key={groupIndex} className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {group.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-4 gap-2">
                {group.items.map((item, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="h-auto py-3 flex-col gap-1.5"
                    onClick={() => navigate(item.path)}
                  >
                    <div className={`p-2 rounded-lg ${item.color}`}>
                      <item.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-[10px] font-medium text-center leading-tight">
                      {item.label}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* System Actions */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {isRussian ? 'Система' : 'System'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {systemActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start h-auto py-2"
                onClick={() => navigate(action.path)}
              >
                <div className={`p-1.5 rounded-lg ${action.color} mr-3`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium text-sm">{action.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
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
