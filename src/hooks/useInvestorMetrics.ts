import { useMemo } from 'react';
import { useRealtimeStats, useAdminAnalytics } from './useAdminAnalytics';

// Updated market data from research - aligned with $2M seed valuation
export const MARKET_DATA = {
  // Phuket market
  phuketTourismRevenue2024: 15.6, // billion USD
  phuketTourismRevenue2025Target: 17.3, // billion USD
  
  // Thailand overall
  thailandTourismRevenue: 93, // billion USD - total tourism revenue 2024
  seaTourismMarket: 420, // billion USD - Southeast Asia travel & tourism
  
  // Digital adoption
  digitalPenetration: 91.2, // percent
  mobilePaymentAdoption: 90.4, // percent
  independentBookers: 81, // percent
  onlineBookers: 66, // percent
  aiWillingTourists: 86, // percent
  
  // Target markets
  addressableMarket: 6.3, // billion USD - digital addressable in Phuket
  
  // UNO economics
  takeRate: 0.1, // 10% average
  potentialRevenue: 630, // million USD at full capture
  
  // Expat/Long-stay stats
  expatsInThailand: 3.5, // million - long-term foreigners
  digitalNomads: 150000, // active digital nomads in Thailand
  russianTouristsMonthly: 250000, // Russian tourists per month to Thailand
};

export const PAIN_POINTS = [
  {
    id: 'fragmentation',
    title: 'Service Fragmentation',
    titleRu: 'Фрагментация сервисов',
    stat: '7+',
    description: 'apps needed per trip on average',
    descriptionRu: 'приложений нужно для одной поездки',
    icon: 'Smartphone',
  },
  {
    id: 'trust',
    title: 'Trust & Safety',
    titleRu: 'Доверие и безопасность',
    stat: '43%',
    description: 'worry about scams abroad',
    descriptionRu: 'беспокоятся о мошенничестве за рубежом',
    icon: 'ShieldX',
  },
  {
    id: 'language',
    title: 'Language Barrier',
    titleRu: 'Языковой барьер',
    stat: '65%',
    description: 'struggle with local communication',
    descriptionRu: 'испытывают сложности с коммуникацией',
    icon: 'Globe',
  },
  {
    id: 'support',
    title: 'No Real Support',
    titleRu: 'Отсутствие поддержки',
    stat: '24/7',
    description: 'on-ground help needed but unavailable',
    descriptionRu: 'нужна помощь на месте, но её нет',
    icon: 'Headphones',
  },
];

export const SERVICE_VERTICALS = [
  { name: 'Transport', nameRu: 'Транспорт', icon: 'Car', color: 'bg-blue-500', category: 'travel' },
  { name: 'Tours', nameRu: 'Туры', icon: 'Palmtree', color: 'bg-green-500', category: 'travel' },
  { name: 'Yachts', nameRu: 'Яхты', icon: 'Ship', color: 'bg-cyan-500', category: 'travel' },
  { name: 'Property', nameRu: 'Недвижимость', icon: 'Home', color: 'bg-indigo-500', category: 'lifestyle' },
  { name: 'Restaurants', nameRu: 'Рестораны', icon: 'UtensilsCrossed', color: 'bg-orange-500', category: 'lifestyle' },
  { name: 'Spa & Beauty', nameRu: 'Спа и красота', icon: 'Sparkles', color: 'bg-pink-500', category: 'lifestyle' },
  { name: 'Medical', nameRu: 'Медицина', icon: 'Heart', color: 'bg-red-500', category: 'infrastructure' },
  { name: 'Legal & Visa', nameRu: 'Юридические и виза', icon: 'Scale', color: 'bg-purple-500', category: 'infrastructure' },
  { name: 'Insurance', nameRu: 'Страхование', icon: 'Shield', color: 'bg-slate-500', category: 'infrastructure' },
  { name: 'Fitness', nameRu: 'Фитнес', icon: 'Dumbbell', color: 'bg-amber-500', category: 'lifestyle' },
  { name: 'Events', nameRu: 'Мероприятия', icon: 'Calendar', color: 'bg-rose-500', category: 'travel' },
  { name: 'Water Sports', nameRu: 'Водный спорт', icon: 'Waves', color: 'bg-teal-500', category: 'travel' },
  { name: 'Pharmacy', nameRu: 'Аптека', icon: 'Pill', color: 'bg-emerald-500', category: 'infrastructure' },
  { name: 'Pet Services', nameRu: 'Услуги для питомцев', icon: 'PawPrint', color: 'bg-yellow-500', category: 'lifestyle' },
  { name: 'Education', nameRu: 'Образование', icon: 'GraduationCap', color: 'bg-violet-500', category: 'lifestyle' },
];

export const COMPETITORS = [
  { 
    name: 'myUNO', 
    transport: true, 
    food: true, 
    tours: true, 
    property: true, 
    medical: true, 
    legal: true,
    yachts: true,
    fitness: true,
    insurance: true,
    offline: true,
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
    offline: false,
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
    offline: false,
    isMain: false
  },
  { 
    name: 'Airbnb', 
    transport: false, 
    food: false, 
    tours: true, 
    property: true, 
    medical: false, 
    legal: false,
    yachts: false,
    fitness: false,
    insurance: false,
    offline: false,
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
    offline: false,
    isMain: false
  },
];

// Revenue streams - aligned with actual business model
export const REVENUE_STREAMS = [
  { name: 'Transaction Fees', nameRu: 'Комиссии (8-15%)', value: 50, color: 'hsl(var(--primary))' },
  { name: 'SaaS Subscriptions', nameRu: 'Подписки ($49-149/мес)', value: 30, color: 'hsl(var(--chart-2))' },
  { name: 'Property Management', nameRu: 'Управление (70/30)', value: 15, color: 'hsl(var(--chart-3))' },
  { name: 'Featured Listings', nameRu: 'Продвижение', value: 5, color: 'hsl(var(--chart-4))' },
];

// Financial projections - aligned with $2M seed valuation (5-10x Year 3 revenue)
export const FINANCIAL_PROJECTIONS = [
  { year: 'Year 1', yearRu: '1 год', gmv: 400000, revenue: 40000, users: 3000, providers: 100 },
  { year: 'Year 2', yearRu: '2 год', gmv: 2500000, revenue: 250000, users: 20000, providers: 500 },
  { year: 'Year 3', yearRu: '3 год', gmv: 8000000, revenue: 800000, users: 80000, providers: 2000 },
];

// PMF milestones for seed round
export const PMF_TARGETS = [
  { metric: 'MAU', metricRu: 'MAU', target: '5K-10K', icon: 'Users' },
  { metric: 'Monthly GMV', metricRu: 'GMV/мес', target: '$50K-100K', icon: 'DollarSign' },
  { metric: 'Active Vendors', metricRu: 'Провайдеров', target: '100-200', icon: 'Building2' },
  { metric: 'Paid Subs', metricRu: 'Подписок', target: '30-50', icon: 'CreditCard' },
  { metric: 'D30 Retention', metricRu: 'D30 Retention', target: '>35%', icon: 'TrendingUp' },
  { metric: 'NPS Score', metricRu: 'NPS', target: '>50', icon: 'ThumbsUp' },
];

// Investment details
export const INVESTMENT_DETAILS = {
  raising: { min: 500000, max: 1500000, target: 1000000 },
  valuation: 2000000, // $2M pre-money
  stage: 'Pre-Seed / Seed',
  useOfFunds: [
    { label: 'Product & Engineering', labelRu: 'Продукт и разработка', percent: 40, color: 'bg-blue-500' },
    { label: 'Marketing & Growth', labelRu: 'Маркетинг и рост', percent: 30, color: 'bg-green-500' },
    { label: 'Operations & UNO Team', labelRu: 'Операции и UNO Team', percent: 20, color: 'bg-purple-500' },
    { label: 'Legal & Compliance', labelRu: 'Юридические', percent: 10, color: 'bg-amber-500' },
  ],
};

// Value propositions for different segments
export const VALUE_PROPOSITIONS = [
  {
    segment: 'Tourists',
    segmentRu: 'Туристы',
    icon: 'Plane',
    value: 'One app for your entire trip',
    valueRu: 'Одно приложение для всей поездки',
    features: ['Verified services', 'Fair prices', '24/7 support'],
    featuresRu: ['Проверенные услуги', 'Честные цены', 'Поддержка 24/7'],
  },
  {
    segment: 'Expats & Nomads',
    segmentRu: 'Экспаты и номады',
    icon: 'Globe',
    value: 'Your local life, simplified',
    valueRu: 'Ваша местная жизнь, упрощённая',
    features: ['Visa & legal', 'Property rental', 'Local services'],
    featuresRu: ['Визы и юридические вопросы', 'Аренда жилья', 'Местные услуги'],
  },
  {
    segment: 'Property Owners',
    segmentRu: 'Владельцы недвижимости',
    icon: 'Home',
    value: 'Maximize your investment',
    valueRu: 'Максимизируйте ваши инвестиции',
    features: ['Full management', 'Guest services', 'Analytics'],
    featuresRu: ['Полное управление', 'Услуги для гостей', 'Аналитика'],
  },
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
    investmentDetails: INVESTMENT_DETAILS,
    valuePropositions: VALUE_PROPOSITIONS,
    isLoading: statsLoading || analyticsLoading,
  };
}
