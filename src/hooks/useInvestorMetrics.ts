import { useMemo } from 'react';
import { useRealtimeStats, useAdminAnalytics } from './useAdminAnalytics';

// Market data from research
export const MARKET_DATA = {
  phuketTourismRevenue2024: 15.6, // billion USD
  phuketTourismRevenue2025Target: 17.3, // billion USD
  digitalPenetration: 91.2, // percent
  mobilePaymentAdoption: 90.4, // percent
  independentBookers: 81, // percent
  onlineBookers: 66, // percent
  aiWillingTourists: 86, // percent
  addressableMarket: 6.3, // billion USD
  takeRate: 0.1, // 10%
  potentialRevenue: 630, // million USD
};

export const PAIN_POINTS = [
  {
    id: 'taxi-mafia',
    title: 'Taxi Mafia',
    titleRu: 'Такси-мафия',
    stat: '68%',
    description: 'of tourists report overcharging',
    descriptionRu: 'туристов сообщают о завышенных ценах',
    icon: 'Car',
  },
  {
    id: 'fragmentation',
    title: 'App Fragmentation',
    titleRu: 'Фрагментация приложений',
    stat: '5+',
    description: 'apps needed per trip average',
    descriptionRu: 'приложений нужно в среднем за поездку',
    icon: 'Smartphone',
  },
  {
    id: 'trust',
    title: 'Trust Issues',
    titleRu: 'Проблемы доверия',
    stat: '12%',
    description: 'of tourists report scams',
    descriptionRu: 'туристов сообщают о мошенничестве',
    icon: 'ShieldX',
  },
  {
    id: 'cash',
    title: 'Cash-Only',
    titleRu: 'Только наличные',
    stat: '40%',
    description: 'of services are cash-only',
    descriptionRu: 'услуг принимают только наличные',
    icon: 'Banknote',
  },
];

export const SERVICE_VERTICALS = [
  { name: 'Transport', nameRu: 'Транспорт', icon: 'Car', color: 'bg-blue-500' },
  { name: 'Tours', nameRu: 'Туры', icon: 'Palmtree', color: 'bg-green-500' },
  { name: 'Restaurants', nameRu: 'Рестораны', icon: 'UtensilsCrossed', color: 'bg-orange-500' },
  { name: 'Property', nameRu: 'Недвижимость', icon: 'Home', color: 'bg-indigo-500' },
  { name: 'Medical', nameRu: 'Медицина', icon: 'Heart', color: 'bg-red-500' },
  { name: 'Spa & Beauty', nameRu: 'Спа и красота', icon: 'Sparkles', color: 'bg-pink-500' },
  { name: 'Yachts', nameRu: 'Яхты', icon: 'Ship', color: 'bg-cyan-500' },
  { name: 'Legal & Visa', nameRu: 'Юридические и виза', icon: 'Scale', color: 'bg-purple-500' },
  { name: 'Fitness', nameRu: 'Фитнес', icon: 'Dumbbell', color: 'bg-amber-500' },
  { name: 'Events', nameRu: 'Мероприятия', icon: 'Calendar', color: 'bg-rose-500' },
  { name: 'Water Sports', nameRu: 'Водный спорт', icon: 'Waves', color: 'bg-teal-500' },
  { name: 'Pharmacy', nameRu: 'Аптека', icon: 'Pill', color: 'bg-emerald-500' },
  { name: 'Pet Services', nameRu: 'Услуги для питомцев', icon: 'PawPrint', color: 'bg-yellow-500' },
  { name: 'Insurance', nameRu: 'Страхование', icon: 'Shield', color: 'bg-slate-500' },
  { name: 'Education', nameRu: 'Образование', icon: 'GraduationCap', color: 'bg-violet-500' },
];

export const COMPETITORS = [
  { 
    name: 'UNO', 
    transport: true, 
    food: true, 
    tours: true, 
    property: true, 
    medical: true, 
    legal: true,
    yachts: true,
    fitness: true,
    insurance: true,
    isMain: true
  },
  { 
    name: 'Grab', 
    transport: true, 
    food: true, 
    tours: false, 
    property: false, 
    medical: false, 
    legal: false,
    yachts: false,
    fitness: false,
    insurance: false,
    isMain: false
  },
  { 
    name: 'Bolt', 
    transport: true, 
    food: true, 
    tours: false, 
    property: false, 
    medical: false, 
    legal: false,
    yachts: false,
    fitness: false,
    insurance: false,
    isMain: false
  },
  { 
    name: 'LINE Man', 
    transport: false, 
    food: true, 
    tours: false, 
    property: false, 
    medical: false, 
    legal: false,
    yachts: false,
    fitness: false,
    insurance: false,
    isMain: false
  },
  { 
    name: 'Klook', 
    transport: false, 
    food: false, 
    tours: true, 
    property: false, 
    medical: false, 
    legal: false,
    yachts: false,
    fitness: false,
    insurance: false,
    isMain: false
  },
];

export const REVENUE_STREAMS = [
  { name: 'Transaction Fees', nameRu: 'Комиссии', value: 45, color: 'hsl(var(--primary))' },
  { name: 'SaaS Subscriptions', nameRu: 'Подписки', value: 40, color: 'hsl(var(--chart-2))' },
  { name: 'Featured Listings', nameRu: 'Продвижение', value: 10, color: 'hsl(var(--chart-3))' },
  { name: 'API Access', nameRu: 'API доступ', value: 5, color: 'hsl(var(--chart-4))' },
];

export const FINANCIAL_PROJECTIONS = [
  { year: 'Year 1', gmv: 500000, revenue: 50000, users: 5000, providers: 200 },
  { year: 'Year 2', gmv: 2000000, revenue: 200000, users: 25000, providers: 800 },
  { year: 'Year 3', gmv: 8000000, revenue: 800000, users: 100000, providers: 2500 },
];

export const PMF_TARGETS = [
  { metric: 'MAU', target: '5K-10K', icon: 'Users' },
  { metric: 'Monthly GMV', target: '$50K-100K', icon: 'DollarSign' },
  { metric: 'Active Vendors', target: '100-200', icon: 'Building2' },
  { metric: 'Paid Subscriptions', target: '20-50', icon: 'CreditCard' },
  { metric: 'D30 Retention', target: '>30%', icon: 'TrendingUp' },
  { metric: 'NPS Score', target: '>50', icon: 'ThumbsUp' },
];

export function useInvestorMetrics() {
  const { stats, isLoading: statsLoading } = useRealtimeStats();
  const { summary, revenueChartData, isLoading: analyticsLoading } = useAdminAnalytics(30);

  const tractionMetrics = useMemo(() => ({
    totalUsers: stats.totalUsers || summary.totalUsers || 0,
    totalProviders: stats.totalProviders || summary.totalProviders || 0,
    totalBookings: stats.totalBookings || summary.totalBookings || 0,
    gmv: summary.totalGMV || 0,
    revenue: summary.totalRevenue || 0,
    growth: {
      users: summary.userGrowth || 0,
      providers: summary.providerGrowth || 0,
      bookings: summary.bookingGrowth || 0,
      revenue: summary.revenueGrowth || 0,
    }
  }), [stats, summary]);

  const tamSamSom = useMemo(() => ({
    tam: MARKET_DATA.phuketTourismRevenue2024,
    sam: MARKET_DATA.addressableMarket,
    som: MARKET_DATA.potentialRevenue / 1000, // Convert to billions
  }), []);

  return {
    tractionMetrics,
    revenueChartData,
    tamSamSom,
    marketData: MARKET_DATA,
    painPoints: PAIN_POINTS,
    serviceVerticals: SERVICE_VERTICALS,
    competitors: COMPETITORS,
    revenueStreams: REVENUE_STREAMS,
    financialProjections: FINANCIAL_PROJECTIONS,
    pmfTargets: PMF_TARGETS,
    isLoading: statsLoading || analyticsLoading,
  };
}
