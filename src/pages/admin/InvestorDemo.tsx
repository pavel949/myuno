import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Presentation, 
  LineChart, 
  Play, 
  MapPin,
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InvestorLiveMetrics } from '@/components/investor/InvestorLiveMetrics';
import { InvestorPlatformTour } from '@/components/investor/InvestorPlatformTour';
import { MobilePitchDeck } from '@/components/pitch';
import { useInvestorMetrics } from '@/hooks/useInvestorMetrics';

export default function InvestorDemo() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { tractionMetrics, isLoading: metricsLoading } = useInvestorMetrics();
  const isRussian = language === 'ru';
  const [activeTab, setActiveTab] = useState('overview');
  const [showPitchDeck, setShowPitchDeck] = useState(false);

  // Auth redirects
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (num: number) => `$${formatNumber(num)}`;

  const quickStats = [
    { 
      label: isRussian ? 'Пользователи' : 'Users', 
      value: formatNumber(tractionMetrics.totalUsers), 
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    { 
      label: isRussian ? 'Провайдеры' : 'Providers', 
      value: formatNumber(tractionMetrics.totalProviders), 
      icon: Building2,
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    { 
      label: isRussian ? 'Бронирования' : 'Bookings', 
      value: formatNumber(tractionMetrics.totalBookings), 
      icon: TrendingUp,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    { 
      label: 'GMV', 
      value: formatCurrency(tractionMetrics.gmv), 
      icon: DollarSign,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
  ];

  const demoSections = [
    {
      id: 'pitch-deck',
      title: isRussian ? 'Питч-презентация' : 'Pitch Deck',
      description: isRussian 
        ? '10 слайдов со свайп-навигацией, оптимизировано для мобильных'
        : '10 slides with swipe navigation, optimized for mobile',
      icon: Presentation,
      color: 'from-primary to-primary/60',
      action: () => setShowPitchDeck(true),
    },
    {
      id: 'live-metrics',
      title: isRussian ? 'Метрики в реальном времени' : 'Live Metrics Dashboard',
      description: isRussian 
        ? 'Все KPI платформы: GMV, рост, вертикали'
        : 'All platform KPIs: GMV, growth, verticals coverage',
      icon: LineChart,
      color: 'from-green-500 to-emerald-500',
      action: () => setActiveTab('metrics'),
    },
    {
      id: 'platform-tour',
      title: isRussian ? 'Интерактивный тур' : 'Interactive Platform Tour',
      description: isRussian 
        ? 'Пошаговый обзор ключевых функций'
        : 'Step-by-step walkthrough of key features',
      icon: MapPin,
      color: 'from-purple-500 to-violet-500',
      action: () => setActiveTab('tour'),
    },
  ];

  return (
    <>
      {/* Mobile Pitch Deck Overlay */}
      {showPitchDeck && (
        <MobilePitchDeck 
          isRussian={isRussian} 
          onExit={() => setShowPitchDeck(false)} 
        />
      )}
      
      <div className="p-4 md:p-6 space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 text-white"
      >
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="absolute top-4 right-4">
          <Sparkles className="w-8 h-8 text-primary/60 animate-pulse" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/20 rounded-xl">
              <Presentation className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {isRussian ? 'Инвестор Демо' : 'Investor Demo Suite'}
            </h1>
          </div>
          
          <p className="text-slate-300 max-w-2xl mb-6">
            {isRussian 
              ? 'Полная презентация платформы myUNO для инвесторов: питч-дек, живые метрики и интерактивный тур по продукту.'
              : 'Complete myUNO platform presentation for investors: pitch deck, live metrics dashboard, and interactive product tour.'}
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10"
              >
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs text-slate-400">{stat.label}</span>
                </div>
                <p className="text-xl font-bold">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="overview" className="text-xs md:text-sm">
            {isRussian ? 'Обзор' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="metrics" className="text-xs md:text-sm">
            {isRussian ? 'Метрики' : 'Metrics'}
          </TabsTrigger>
          <TabsTrigger value="tour" className="text-xs md:text-sm">
            {isRussian ? 'Тур' : 'Tour'}
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="overview" className="space-y-6">
            {/* Demo Sections Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              {demoSections.map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className="h-full cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group overflow-hidden"
                    onClick={section.action}
                  >
                    <div className={`h-2 bg-gradient-to-r ${section.color}`} />
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${section.color}`}>
                          <section.icon className="w-5 h-5 text-white" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {section.id === 'pitch-deck' ? (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            {isRussian ? 'Запустить' : 'Launch'}
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {isRussian ? 'Открыть' : 'Open'}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Key Highlights */}
            <Card>
              <CardHeader>
                <CardTitle>{isRussian ? 'Ключевые тезисы' : 'Key Investment Highlights'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    {
                      title: isRussian ? 'Рынок $15.6B' : '$15.6B Market',
                      desc: isRussian ? 'Туристический рынок Пхукета 2024' : 'Phuket tourism market 2024',
                    },
                    {
                      title: isRussian ? '15+ вертикалей' : '15+ Verticals',
                      desc: isRussian ? 'От транспорта до юридических услуг' : 'From transport to legal services',
                    },
                    {
                      title: isRussian ? 'Уникальные сервисы' : 'Unique Services',
                      desc: isRussian ? 'Юридические, страховые и ВНЖ' : 'Legal, insurance, and visa services',
                    },
                    {
                      title: isRussian ? 'UNO Team на месте' : 'UNO Team On Ground',
                      desc: isRussian ? 'Офлайн поддержка 24/7' : '24/7 offline support network',
                    },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics">
            <InvestorLiveMetrics />
          </TabsContent>

          <TabsContent value="tour">
            <InvestorPlatformTour />
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
    </>
  );
}
