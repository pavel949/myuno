import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, UtensilsCrossed, Dumbbell, Stethoscope, 
  GraduationCap, Home, Car, Ticket, ShoppingBag, Wrench,
  ArrowRight, MapPin
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { UnifiedCard } from '@/components/uno/UnifiedCard';
import { cn } from '@/lib/utils';

const categories = [
  { id: 'beauty-spa', icon: Sparkles, path: '/beauty', color: 'from-pink-500 to-purple-500' },
  { id: 'restaurants', icon: UtensilsCrossed, path: '/food', color: 'from-orange-500 to-red-500' },
  { id: 'fitness', icon: Dumbbell, path: '/fitness', color: 'from-blue-500 to-cyan-500' },
  { id: 'medical', icon: Stethoscope, path: '/medical', color: 'from-emerald-500 to-green-500' },
  { id: 'kids-education', icon: GraduationCap, path: '/discover', color: 'from-yellow-500 to-orange-500' },
  { id: 'real-estate', icon: Home, path: '/property', color: 'from-teal-500 to-emerald-500' },
  { id: 'transport', icon: Car, path: '/transport', color: 'from-indigo-500 to-blue-500' },
  { id: 'events', icon: Ticket, path: '/discover', color: 'from-purple-500 to-pink-500' },
];

const featuredServices = [
  {
    id: 'featured-1',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6c?w=600',
    title: 'Orchid Spa & Wellness',
    titleRu: 'Орхидея СПА и Велнес',
    rating: 4.9,
    reviewCount: 156,
    price: 1500,
    location: 'Kata Beach',
    locationRu: 'Ката Бич',
    isFeatured: true,
    isVerified: true,
    path: '/beauty',
  },
  {
    id: 'featured-2',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
    title: 'Ocean View Restaurant',
    titleRu: 'Ресторан с видом на океан',
    rating: 4.7,
    reviewCount: 89,
    price: 800,
    location: 'Patong',
    locationRu: 'Патонг',
    isNew: true,
    path: '/discover',
  },
  {
    id: 'featured-3',
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600',
    title: 'Fitness First Phuket',
    titleRu: 'Фитнес Ферст Пхукет',
    rating: 4.8,
    reviewCount: 234,
    price: 2500,
    location: 'Rawai',
    locationRu: 'Равай',
    path: '/discover',
  },
];

const Index = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6 border border-primary/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              {t('home.welcome')}
            </h1>
            <p className="text-muted-foreground">
              {t('home.subtitle')}
            </p>
            <div className="flex items-center gap-2 mt-4 text-sm">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Phuket, Thailand</span>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('home.categories')}</h2>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(cat.path)}
                  className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mb-2 bg-gradient-to-br",
                    cat.color,
                    "group-hover:scale-110 transition-transform"
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">
                    {t(`category.${cat.id}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Featured Services */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('home.featuredServices')}</h2>
            <button 
              onClick={() => navigate('/discover')}
              className="text-sm text-primary flex items-center gap-1"
            >
              {t('action.viewAll')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredServices.map((service) => (
              <UnifiedCard
                key={service.id}
                id={service.id}
                image={service.image}
                title={language === 'ru' ? service.titleRu : service.title}
                rating={service.rating}
                reviewCount={service.reviewCount}
                price={service.price}
                priceLabel={t('label.from')}
                location={language === 'ru' ? service.locationRu : service.location}
                isVerified={service.isVerified}
                isNew={service.isNew}
                isFeatured={service.isFeatured}
                onClick={() => navigate(service.path)}
              />
            ))}
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Beauty & Spa Card */}
          <div 
            onClick={() => navigate('/beauty')}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-primary/20 p-6 border border-primary/20 cursor-pointer hover:border-primary/40 transition-all group"
          >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540555700478-4be289fbec6c?w=800')] bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {t('category.beauty-spa')}
                  </span>
                </div>
                <h3 className="text-lg font-display font-bold mb-1">
                  {language === 'ru' ? 'Мир красоты' : 'Beauty World'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'СПА, массаж, салоны' : 'Spas, massage, salons'}
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Food & Delivery Card */}
          <div 
            onClick={() => navigate('/food')}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/20 via-red-500/20 to-primary/20 p-6 border border-primary/20 cursor-pointer hover:border-primary/40 transition-all group"
          >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800')] bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <UtensilsCrossed className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {t('category.restaurants')}
                  </span>
                </div>
                <h3 className="text-lg font-display font-bold mb-1">
                  {language === 'ru' ? 'Еда и Доставка' : 'Food & Delivery'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Рестораны, кафе, доставка' : 'Restaurants, cafes, delivery'}
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Property Card */}
          <div 
            onClick={() => navigate('/property')}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500/20 via-emerald-500/20 to-primary/20 p-6 border border-primary/20 cursor-pointer hover:border-primary/40 transition-all group"
          >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800')] bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {t('category.real-estate')}
                  </span>
                </div>
                <h3 className="text-lg font-display font-bold mb-1">
                  {language === 'ru' ? 'Недвижимость' : 'Real Estate'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Виллы, квартиры, кондо' : 'Villas, apartments, condos'}
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Transport Card */}
          <div 
            onClick={() => navigate('/transport')}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/20 via-blue-500/20 to-primary/20 p-6 border border-primary/20 cursor-pointer hover:border-primary/40 transition-all group"
          >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800')] bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Car className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {t('category.transport')}
                  </span>
                </div>
                <h3 className="text-lg font-display font-bold mb-1">
                  {language === 'ru' ? 'Транспорт' : 'Transport'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Аренда авто, такси, трансферы' : 'Car rental, taxi, transfers'}
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
