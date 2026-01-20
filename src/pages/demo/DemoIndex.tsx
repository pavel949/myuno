import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Play, ArrowRight, Building2, UtensilsCrossed, Compass, Car, Heart, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DemoBanner } from '@/components/demo/DemoBanner';
import { useTour } from '@/components/demo/GuidedTour';
import { useDemoMode, DEMO_USER } from '@/hooks/useDemoMode';
import { useLanguage } from '@/contexts/LanguageContext';

const texts = {
  en: {
    title: 'Welcome to UNO Demo',
    subtitle: 'Experience the super-app for expats & travelers',
    startTour: 'Start Guided Tour',
    explore: 'Explore on Your Own',
    featuredTitle: 'Popular Categories',
    property: 'Property',
    restaurants: 'Restaurants',
    tours: 'Tours',
    transport: 'Transport',
    beauty: 'Beauty & Spa',
    services: 'Services',
    demoUser: 'Demo User',
    tryFeatures: 'Try these features:',
    feature1: 'Browse 15+ service categories',
    feature2: 'Add items to cart from different vendors',
    feature3: 'See personalized recommendations',
    feature4: 'Explore the vendor dashboard',
    vendorDemo: 'See Vendor Dashboard',
    createReal: 'Create Real Account',
  },
  ru: {
    title: 'Добро пожаловать в UNO Demo',
    subtitle: 'Познакомьтесь с супер-приложением для экспатов и путешественников',
    startTour: 'Начать тур',
    explore: 'Изучить самостоятельно',
    featuredTitle: 'Популярные категории',
    property: 'Недвижимость',
    restaurants: 'Рестораны',
    tours: 'Туры',
    transport: 'Транспорт',
    beauty: 'Красота и Спа',
    services: 'Услуги',
    demoUser: 'Демо-пользователь',
    tryFeatures: 'Попробуйте:',
    feature1: 'Просмотрите 15+ категорий услуг',
    feature2: 'Добавьте товары в корзину от разных продавцов',
    feature3: 'Посмотрите персональные рекомендации',
    feature4: 'Изучите панель партнёра',
    vendorDemo: 'Панель партнёра',
    createReal: 'Создать аккаунт',
  },
};

const categories = [
  { icon: Building2, path: '/property', key: 'property' as const, color: 'bg-blue-500' },
  { icon: UtensilsCrossed, path: '/restaurants', key: 'restaurants' as const, color: 'bg-orange-500' },
  { icon: Compass, path: '/tours', key: 'tours' as const, color: 'bg-green-500' },
  { icon: Car, path: '/transport', key: 'transport' as const, color: 'bg-purple-500' },
  { icon: Heart, path: '/beauty', key: 'beauty' as const, color: 'bg-pink-500' },
  { icon: Briefcase, path: '/services', key: 'services' as const, color: 'bg-indigo-500' },
];

export default function DemoIndex() {
  const navigate = useNavigate();
  const { startTour } = useTour();
  const { trackDemoAction } = useDemoMode();
  const { language } = useLanguage();
  const t = texts[language] || texts.en;

  useEffect(() => {
    trackDemoAction('demo_page_viewed');
    // Set demo mode in localStorage
    localStorage.setItem('demo_mode', 'true');
    localStorage.setItem('demo_user', JSON.stringify(DEMO_USER));
  }, []);

  const handleCategoryClick = (path: string, category: string) => {
    trackDemoAction('category_clicked', { category });
    navigate(`/demo${path}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <DemoBanner />
      
      {/* Hero Section */}
      <div className="pt-16 pb-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">{t.demoUser}</span>
          </div>
          
          <h1 className="text-3xl font-bold mb-3">{t.title}</h1>
          <p className="text-muted-foreground mb-8">{t.subtitle}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => {
                trackDemoAction('tour_button_clicked');
                startTour();
              }}
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              {t.startTour}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                trackDemoAction('explore_clicked');
                navigate('/demo/home');
              }}
              className="gap-2"
            >
              {t.explore}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Categories Grid */}
      <div className="px-4 pb-8">
        <div className="max-w-md mx-auto">
          <h2 className="text-lg font-semibold mb-4">{t.featuredTitle}</h2>
          <div className="grid grid-cols-3 gap-3">
            {categories.map((cat, index) => (
              <motion.div
                key={cat.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                  onClick={() => handleCategoryClick(cat.path, cat.key)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 ${cat.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                      <cat.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-medium">{t[cat.key]}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="px-4 pb-8">
        <div className="max-w-md mx-auto">
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">{t.tryFeatures}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs text-primary font-bold">1</span>
                  {t.feature1}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs text-primary font-bold">2</span>
                  {t.feature2}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs text-primary font-bold">3</span>
                  {t.feature3}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs text-primary font-bold">4</span>
                  {t.feature4}
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTAs */}
      <div className="px-4 pb-16">
        <div className="max-w-md mx-auto flex flex-col gap-3">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {
              trackDemoAction('vendor_demo_clicked');
              navigate('/demo/vendor');
            }}
          >
            <Briefcase className="w-4 h-4 mr-2" />
            {t.vendorDemo}
          </Button>
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              trackDemoAction('create_account_clicked');
              navigate('/auth');
            }}
          >
            {t.createReal}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
