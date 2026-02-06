import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Calendar, 
  Star, 
  DollarSign, 
  Users, 
  Package,
  ArrowRight,
  Briefcase,
  BarChart3,
  MessageSquare,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DemoBanner } from '@/components/demo/DemoBanner';
import { useDemoMode, DEMO_VENDOR } from '@/hooks/useDemoMode';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/uno/BackButton';

const texts = {
  en: {
    title: 'Vendor Dashboard Demo',
    subtitle: 'See how partners manage their business on UNO',
    business: 'Paradise Tours Phuket',
    verified: 'Verified Partner',
    stats: 'This Month',
    revenue: 'Revenue',
    bookings: 'Bookings',
    rating: 'Rating',
    views: 'Profile Views',
    recentOrders: 'Recent Orders',
    order1: 'Phi Phi Islands Tour',
    order2: 'James Bond Island Tour',
    order3: 'Similan Islands Diving',
    confirmed: 'Confirmed',
    pending: 'Pending',
    completed: 'Completed',
    features: 'Partner Features',
    feature1: 'Real-time booking management',
    feature2: 'Analytics & revenue tracking',
    feature3: 'Customer messaging',
    feature4: 'Calendar sync (iCal, Google)',
    feature5: 'Promotion & featured listings',
    feature6: 'Multi-language support',
    becomePartner: 'Become a Partner',
    backToDemo: 'Back to Demo',
    quickActions: 'Quick Actions',
    manageListings: 'Manage Listings',
    viewAnalytics: 'Analytics',
    messages: 'Messages',
    settings: 'Settings',
  },
  ru: {
    title: 'Демо панели партнёра',
    subtitle: 'Посмотрите, как партнёры управляют бизнесом на UNO',
    business: 'Paradise Tours Phuket',
    verified: 'Верифицированный партнёр',
    stats: 'Этот месяц',
    revenue: 'Доход',
    bookings: 'Бронирования',
    rating: 'Рейтинг',
    views: 'Просмотры',
    recentOrders: 'Последние заказы',
    order1: 'Тур на острова Пхи-Пхи',
    order2: 'Тур на остров Джеймса Бонда',
    order3: 'Дайвинг на Симиланах',
    confirmed: 'Подтверждён',
    pending: 'Ожидает',
    completed: 'Завершён',
    features: 'Возможности партнёра',
    feature1: 'Управление бронированиями в реальном времени',
    feature2: 'Аналитика и отслеживание дохода',
    feature3: 'Переписка с клиентами',
    feature4: 'Синхронизация календаря (iCal, Google)',
    feature5: 'Продвижение и featured-листинги',
    feature6: 'Мультиязычная поддержка',
    becomePartner: 'Стать партнёром',
    backToDemo: 'Назад к демо',
    quickActions: 'Быстрые действия',
    manageListings: 'Управление',
    viewAnalytics: 'Аналитика',
    messages: 'Сообщения',
    settings: 'Настройки',
  },
};

const mockOrders = [
  { id: 1, nameKey: 'order1' as const, customer: 'John D.', amount: 2400, statusKey: 'confirmed' as const, statusColor: 'bg-green-500' },
  { id: 2, nameKey: 'order2' as const, customer: 'Maria S.', amount: 1800, statusKey: 'pending' as const, statusColor: 'bg-yellow-500' },
  { id: 3, nameKey: 'order3' as const, customer: 'Alex K.', amount: 4500, statusKey: 'completed' as const, statusColor: 'bg-blue-500' },
];

export default function VendorDemo() {
  const navigate = useNavigate();
  const { trackDemoAction } = useDemoMode();
  const { language } = useLanguage();
  const t = texts[language] || texts.en;

  useEffect(() => {
    trackDemoAction('vendor_demo_viewed');
    localStorage.setItem('demo_vendor', JSON.stringify(DEMO_VENDOR));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <DemoBanner />
      
      {/* Header */}
      <div className="pt-16 px-4 pb-4">
        <div className="max-w-2xl mx-auto">
          <BackButton fallbackPath="/demo" />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{t.business}</h1>
                <Badge variant="secondary" className="mt-1">
                  <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                  {t.verified}
                </Badge>
              </div>
            </div>
            
            <p className="text-muted-foreground text-sm">{t.subtitle}</p>
          </motion.div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 pb-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">{t.stats}</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs">{t.revenue}</span>
                </div>
                <p className="text-2xl font-bold text-green-600">฿128,450</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  +23% vs last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">{t.bookings}</span>
                </div>
                <p className="text-2xl font-bold">47</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  +12 new this week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Star className="w-4 h-4" />
                  <span className="text-xs">{t.rating}</span>
                </div>
                <p className="text-2xl font-bold">4.9</p>
                <p className="text-xs text-muted-foreground mt-1">142 reviews</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs">{t.views}</span>
                </div>
                <p className="text-2xl font-bold">2,847</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  +18% conversion
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">{t.quickActions}</h2>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Package, label: t.manageListings, color: 'text-blue-500' },
              { icon: BarChart3, label: t.viewAnalytics, color: 'text-green-500' },
              { icon: MessageSquare, label: t.messages, color: 'text-purple-500', badge: 3 },
              { icon: Settings, label: t.settings, color: 'text-gray-500' },
            ].map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3 text-center relative">
                    <action.icon className={`w-6 h-6 mx-auto mb-1 ${action.color}`} />
                    <span className="text-xs">{action.label}</span>
                    {action.badge && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                        {action.badge}
                      </span>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="px-4 pb-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t.recentOrders}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {mockOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-sm">{t[order.nameKey]}</p>
                      <p className="text-xs text-muted-foreground">{order.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">฿{order.amount.toLocaleString()}</p>
                      <Badge variant="secondary" className="text-xs">
                        <span className={`w-2 h-2 rounded-full ${order.statusColor} mr-1`} />
                        {t[order.statusKey]}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features List */}
      <div className="px-4 pb-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">{t.features}</h3>
              <ul className="space-y-2 text-sm">
                {[t.feature1, t.feature2, t.feature3, t.feature4, t.feature5, t.feature6].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-16">
        <div className="max-w-2xl mx-auto">
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              trackDemoAction('become_partner_clicked');
              navigate('/become-partner');
            }}
          >
            {t.becomePartner}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
