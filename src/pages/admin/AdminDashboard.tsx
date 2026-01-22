import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Baby,
  Flower2,
  Pill,
  ShoppingBag,
  ClipboardCheck,
  Wallet,
  Globe,
  Handshake,
  Search,
  ChevronDown,
  TrendingUp,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle2,
  UserCog,
  LayoutDashboard,
  Database,
  Zap
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { data: stats, isLoading, error } = useAdminDashboardStats();
  const [searchQuery, setSearchQuery] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'travel': true,
    'lifestyle': true,
    'services': true,
    'infrastructure': true,
  });

  const isRu = language === 'ru';

  if (isLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-64" />
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <PageContainer>
          <Card className="border-destructive">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <p className="text-destructive font-medium">
                {isRu ? 'Ошибка загрузки данных' : 'Error loading data'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {isRu ? 'Проверьте права доступа или попробуйте позже' : 'Check permissions or try again later'}
              </p>
            </CardContent>
          </Card>
        </PageContainer>
      </AppLayout>
    );
  }

  // Main stats
  const mainStats = [
    {
      label: isRu ? 'Провайдеры' : 'Providers',
      value: stats?.providers || 0,
      icon: Building2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      path: '/admin/providers',
    },
    {
      label: isRu ? 'Услуги' : 'Services',
      value: stats?.services || 0,
      icon: Package,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      path: '/admin/services',
    },
    {
      label: isRu ? 'Пользователи' : 'Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      path: '/admin/users',
    },
    {
      label: isRu ? 'Бронирования' : 'Bookings',
      value: stats?.totalBookings || 0,
      icon: Calendar,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      path: '/admin/operations',
    },
  ];

  // Status indicators
  const statusCards = [
    {
      label: isRu ? 'Активные провайдеры' : 'Active Providers',
      value: stats?.activeProviders || 0,
      icon: CheckCircle2,
      color: 'text-green-500',
    },
    {
      label: isRu ? 'На модерации' : 'Pending Review',
      value: stats?.pendingProviders || 0,
      icon: Clock,
      color: 'text-orange-500',
    },
    {
      label: isRu ? 'UNO Team' : 'UNO Team',
      value: stats?.unoTeamMembers || 0,
      icon: UserCog,
      color: 'text-primary',
    },
    {
      label: isRu ? 'Ожидающие заказы' : 'Pending Orders',
      value: stats?.pendingBookings || 0,
      icon: AlertCircle,
      color: 'text-red-500',
    },
  ];

  // Category groups with counts
  const categoryGroups = [
    {
      id: 'travel',
      title: isRu ? 'Путешествия и отдых' : 'Travel & Leisure',
      icon: Palmtree,
      items: [
        { label: isRu ? 'Яхты' : 'Yachts', icon: Sailboat, path: '/admin/yachts', color: 'bg-sky-500', count: stats?.yachts },
        { label: isRu ? 'Туры' : 'Tours', icon: Palmtree, path: '/admin/tours', color: 'bg-green-500', count: stats?.tours },
        { label: isRu ? 'Активности' : 'Activities', icon: Waves, path: '/admin/activities', color: 'bg-cyan-500' },
        { label: isRu ? 'Водные' : 'Water', icon: Ship, path: '/admin/water-activities', color: 'bg-blue-500' },
        { label: isRu ? 'Мероприятия' : 'Events', icon: Calendar, path: '/admin/events', color: 'bg-pink-500', count: stats?.events },
      ]
    },
    {
      id: 'lifestyle',
      title: isRu ? 'Лайфстайл' : 'Lifestyle',
      icon: Sparkles,
      items: [
        { label: isRu ? 'Рестораны' : 'Restaurants', icon: UtensilsCrossed, path: '/admin/restaurants', color: 'bg-orange-500', count: stats?.restaurants },
        { label: isRu ? 'Салоны' : 'Salons', icon: Sparkles, path: '/admin/salons', color: 'bg-pink-500', count: stats?.salons },
        { label: isRu ? 'Фитнес' : 'Fitness', icon: Dumbbell, path: '/admin/gyms', color: 'bg-red-500', count: stats?.gyms },
        { label: isRu ? 'Цветы' : 'Flowers', icon: Flower2, path: '/admin/flowers', color: 'bg-rose-500' },
      ]
    },
    {
      id: 'services',
      title: isRu ? 'Услуги' : 'Services',
      icon: Settings,
      items: [
        { label: isRu ? 'Уборка' : 'Cleaning', icon: Sparkles, path: '/admin/cleaning', color: 'bg-emerald-500' },
        { label: isRu ? 'Няни' : 'Babysitters', icon: Baby, path: '/admin/babysitters', color: 'bg-violet-500' },
        { label: isRu ? 'Юристы' : 'Legal', icon: Scale, path: '/admin/legal', color: 'bg-slate-500' },
        { label: isRu ? 'Образование' : 'Education', icon: GraduationCap, path: '/admin/education', color: 'bg-blue-500' },
        { label: isRu ? 'Питомцы' : 'Pets', icon: PawPrint, path: '/admin/pets', color: 'bg-amber-500' },
      ]
    },
    {
      id: 'infrastructure',
      title: isRu ? 'Инфраструктура' : 'Infrastructure',
      icon: Building2,
      items: [
        { label: isRu ? 'Недвижимость' : 'Properties', icon: Home, path: '/admin/properties', color: 'bg-orange-500', count: stats?.properties },
        { label: isRu ? 'Транспорт' : 'Transport', icon: Car, path: '/admin/vehicles', color: 'bg-indigo-500', count: stats?.vehicles },
        { label: isRu ? 'Клиники' : 'Clinics', icon: Stethoscope, path: '/admin/clinics', color: 'bg-teal-500', count: stats?.clinics },
        { label: isRu ? 'Аптеки' : 'Pharmacies', icon: Pill, path: '/admin/pharmacies', color: 'bg-green-500' },
        { label: isRu ? 'Страхование' : 'Insurance', icon: Shield, path: '/admin/insurance', color: 'bg-purple-500' },
        { label: isRu ? 'Магазины' : 'Stores', icon: ShoppingBag, path: '/admin/stores', color: 'bg-amber-500' },
      ]
    },
  ];

  // System actions organized by category
  const systemActions = {
    analytics: [
      { label: isRu ? 'Общая аналитика' : 'Analytics', icon: BarChart3, path: '/admin/analytics', color: 'bg-indigo-500' },
      { label: isRu ? 'Пользователи' : 'User Analytics', icon: Users, path: '/admin/users', color: 'bg-blue-500' },
      { label: isRu ? 'M&A метрики' : 'Acquisition', icon: TrendingUp, path: '/admin/acquisition-metrics', color: 'bg-violet-500' },
    ],
    operations: [
      { label: isRu ? 'Операции' : 'Operations', icon: Activity, path: '/admin/operations', color: 'bg-cyan-500' },
      { label: isRu ? 'Лиды' : 'Leads', icon: Users, path: '/admin/leads', color: 'bg-green-500' },
      { label: isRu ? 'Заявки' : 'Consultations', icon: ClipboardCheck, path: '/admin/consultations', color: 'bg-teal-500' },
      { label: isRu ? 'Тикеты' : 'Tickets', icon: FileCheck, path: '/admin/tickets', color: 'bg-orange-500' },
    ],
    content: [
      { label: isRu ? 'Модерация' : 'Moderation', icon: Shield, path: '/admin/moderation', color: 'bg-yellow-500' },
      { label: isRu ? 'Заявки партнёров' : 'Partner Apps', icon: Handshake, path: '/admin/partner-applications', color: 'bg-pink-500' },
      { label: isRu ? 'Быстрые листинги' : 'Quick Listings', icon: Zap, path: '/admin/quick-listings', color: 'bg-amber-500' },
    ],
    finance: [
      { label: isRu ? 'Финансы' : 'Finance', icon: Wallet, path: '/admin/finance', color: 'bg-emerald-500' },
      { label: isRu ? 'Питч-дек' : 'Pitch Deck', icon: Presentation, path: '/admin/pitch-deck', color: 'bg-amber-500' },
    ],
    system: [
      { label: isRu ? 'UNO Team' : 'UNO Team', icon: UserCog, path: '/admin/uno-team', color: 'bg-primary' },
      { label: isRu ? 'Провайдеры' : 'Providers', icon: Building2, path: '/admin/providers', color: 'bg-blue-500' },
      { label: isRu ? 'Услуги' : 'Services', icon: Package, path: '/admin/services', color: 'bg-purple-500' },
      { label: isRu ? 'Города' : 'Cities', icon: Globe, path: '/admin/cities', color: 'bg-teal-500' },
      { label: isRu ? 'Справочники' : 'Lookups', icon: Database, path: '/admin/lookups', color: 'bg-slate-500' },
    ],
  };

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter items based on search
  const filterItems = (items: typeof categoryGroups[0]['items']) => {
    if (!searchQuery) return items;
    return items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const hasSearchResults = categoryGroups.some(group => filterItems(group.items).length > 0);

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Панель управления' : 'Admin Dashboard'}
          showBack
        />

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {mainStats.map((stat) => (
            <Card 
              key={stat.label} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(stat.path)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {statusCards.map((card) => (
            <div key={card.label} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-sm text-muted-foreground">{card.label}:</span>
              <span className="font-semibold">{card.value}</span>
            </div>
          ))}
        </div>

        {/* Tabs for organization */}
        <Tabs defaultValue="verticals" className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="verticals" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              {isRu ? 'Вертикали' : 'Verticals'}
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Settings className="h-4 w-4" />
              {isRu ? 'Система' : 'System'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verticals" className="mt-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isRu ? 'Поиск по вертикалям...' : 'Search verticals...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Groups */}
            {categoryGroups.map((group) => {
              const filteredItems = filterItems(group.items);
              if (searchQuery && filteredItems.length === 0) return null;

              return (
                <Collapsible 
                  key={group.id} 
                  open={openGroups[group.id]} 
                  onOpenChange={() => toggleGroup(group.id)}
                >
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="pb-2 hover:bg-muted/50 transition-colors rounded-t-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <group.icon className="h-4 w-4 text-primary" />
                            <CardTitle className="text-sm font-medium">
                              {group.title}
                            </CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {group.items.length}
                            </Badge>
                          </div>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openGroups[group.id] ? 'rotate-180' : ''}`} />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                          {filteredItems.map((item) => (
                            <Button
                              key={item.path}
                              variant="ghost"
                              className="h-auto py-3 flex-col gap-1.5 relative"
                              onClick={() => navigate(item.path)}
                            >
                              <div className={`p-2 rounded-lg ${item.color}`}>
                                <item.icon className="h-4 w-4 text-white" />
                              </div>
                              <span className="text-[10px] font-medium text-center leading-tight">
                                {item.label}
                              </span>
                              {item.count !== undefined && item.count > 0 && (
                                <Badge variant="secondary" className="absolute -top-1 -right-1 text-[10px] h-5 min-w-5 px-1">
                                  {item.count}
                                </Badge>
                              )}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}

            {searchQuery && !hasSearchResults && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{isRu ? 'Ничего не найдено' : 'No results found'}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="system" className="mt-4 space-y-4">
            {/* Analytics */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-indigo-500" />
                  {isRu ? 'Аналитика и отчёты' : 'Analytics & Reports'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {systemActions.analytics.map((action) => (
                    <Button
                      key={action.path}
                      variant="outline"
                      className="h-auto py-3 flex-col gap-1.5"
                      onClick={() => navigate(action.path)}
                    >
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <action.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs font-medium">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Operations */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-500" />
                  {isRu ? 'Операции и CRM' : 'Operations & CRM'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {systemActions.operations.map((action) => (
                    <Button
                      key={action.path}
                      variant="outline"
                      className="h-auto py-3 flex-col gap-1.5"
                      onClick={() => navigate(action.path)}
                    >
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <action.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs font-medium">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content & Finance */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4 text-yellow-500" />
                    {isRu ? 'Контент' : 'Content'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {systemActions.content.map((action) => (
                      <Button
                        key={action.path}
                        variant="outline"
                        className="h-auto py-2 flex-col gap-1"
                        onClick={() => navigate(action.path)}
                      >
                        <div className={`p-1.5 rounded-lg ${action.color}`}>
                          <action.icon className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-[10px] font-medium">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-emerald-500" />
                    {isRu ? 'Финансы' : 'Finance'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {systemActions.finance.map((action) => (
                      <Button
                        key={action.path}
                        variant="outline"
                        className="h-auto py-2 flex-col gap-1"
                        onClick={() => navigate(action.path)}
                      >
                        <div className={`p-1.5 rounded-lg ${action.color}`}>
                          <action.icon className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-[10px] font-medium">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Configuration */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4 text-slate-500" />
                  {isRu ? 'Конфигурация системы' : 'System Configuration'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {systemActions.system.map((action) => (
                  <Button
                    key={action.path}
                    variant="ghost"
                    className="w-full justify-start h-auto py-2.5"
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
          </TabsContent>
        </Tabs>

        {/* Quick Add Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="h-auto py-4 flex-col gap-2"
            onClick={() => navigate('/admin/providers?action=new')}
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm">{isRu ? 'Новый провайдер' : 'New Provider'}</span>
          </Button>
          <Button 
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => navigate('/admin/services?action=new')}
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm">{isRu ? 'Новая услуга' : 'New Service'}</span>
          </Button>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
