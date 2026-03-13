import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, AlertTriangle, Heart, Plane, Clock, ExternalLink } from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InsurancePolicyUpload } from '@/components/insurance/InsurancePolicyUpload';
import { toast } from 'sonner';

const FACTS = {
  en: [
    { icon: AlertTriangle, title: 'Hospital bills', desc: 'Average ER visit in Thailand costs $2,000–$15,000. ICU can exceed $50,000.', color: 'text-destructive' },
    { icon: Heart, title: 'Medical evacuation', desc: 'Air evacuation to home country costs $50,000–$300,000 without insurance.', color: 'text-orange-500' },
    { icon: Clock, title: 'Buy before you fly', desc: 'Most policies must be purchased before entering Thailand to be valid.', color: 'text-primary' },
    { icon: Shield, title: 'Peace of mind', desc: 'Travel insurance from $1–3/day covers medical, theft, flight delays & more.', color: 'text-emerald-500' },
  ],
  ru: [
    { icon: AlertTriangle, title: 'Счета за лечение', desc: 'Средний визит в ER в Таиланде стоит 70 000–500 000 ₽. Реанимация — от 1,5 млн ₽.', color: 'text-destructive' },
    { icon: Heart, title: 'Эвакуация', desc: 'Медицинская эвакуация на родину стоит 3–20 млн ₽ без страховки.', color: 'text-orange-500' },
    { icon: Clock, title: 'Купите до вылета', desc: 'Большинство полисов действительны только если оформлены до въезда в страну.', color: 'text-primary' },
    { icon: Shield, title: 'Спокойствие', desc: 'Страховка от 100–300 ₽/день покрывает лечение, кражу, задержки рейсов.', color: 'text-emerald-500' },
  ],
};

const COVERAGE_ITEMS = {
  en: ['Emergency medical treatment', 'Hospital stays & surgery', 'Medical evacuation', 'Trip cancellation', 'Lost luggage & theft', 'Flight delays', 'COVID-19 coverage', '24/7 assistance hotline'],
  ru: ['Экстренная медпомощь', 'Госпитализация и операции', 'Медицинская эвакуация', 'Отмена поездки', 'Потеря багажа и кража', 'Задержка рейса', 'Покрытие COVID-19', 'Горячая линия 24/7'],
};

export default function TravelInsurance() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const facts = isRu ? FACTS.ru : FACTS.en;
  const coverage = isRu ? COVERAGE_ITEMS.ru : COVERAGE_ITEMS.en;

  // Check if user returned from partner site
  useEffect(() => {
    const redirectFlag = sessionStorage.getItem('insurance_redirect');
    if (redirectFlag) {
      sessionStorage.removeItem('insurance_redirect');
      setTimeout(() => {
        toast.info(
          isRu
            ? 'Купили страховку? Загрузите полис ниже — мы поможем при страховом случае'
            : "Bought insurance? Upload your policy below — we'll help during claims",
          { duration: 8000 }
        );
      }, 500);
    }
  }, [isRu]);

  const handleCherehapa = () => {
    sessionStorage.setItem('insurance_redirect', 'true');
    window.open('https://cherehapa.ru/country/thailand?partnerid=MYUNO', '_blank');
  };

  const handleSafetyWing = () => {
    sessionStorage.setItem('insurance_redirect', 'true');
    window.open('https://safetywing.com/nomad-insurance?referenceID=myuno', '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <BackButton fallbackPath={APP_ROUTES.INSURANCE} variant="ghost" size="sm" />
          <div className="flex-1">
            <h1 className="font-semibold text-base">
              {isRu ? 'Туристическая страховка' : 'Travel Insurance'}
            </h1>
            <p className="text-xs text-muted-foreground">myUNO Travel Protection</p>
          </div>
          <Shield className="w-5 h-5 text-primary" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-24 space-y-6">
        {/* Hero */}
        <div className="relative mt-4 rounded-2xl overflow-hidden bg-gradient-to-br from-destructive/10 via-orange-500/10 to-primary/10 p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">
            {isRu ? '🚫 Не летите без страховки!' : "🚫 Don't Fly Without Insurance!"}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isRu
              ? 'Один визит в тайскую больницу может стоить больше, чем вся ваша поездка. Страховка — от 100 ₽/день.'
              : 'A single hospital visit in Thailand can cost more than your entire trip. Insurance starts from $1/day.'}
          </p>
        </div>

        {/* Key Facts */}
        <div className="space-y-3">
          <h3 className="font-semibold text-base">
            {isRu ? 'Почему это важно' : 'Why It Matters'}
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {facts.map((fact, i) => (
              <Card key={i} variant="content">
                <CardContent className="p-4 flex gap-3">
                  <div className={`mt-0.5 ${fact.color}`}>
                    <fact.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{fact.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fact.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* What's Covered */}
        <Card variant="surface">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              {isRu ? 'Что покрывает страховка' : "What's Covered"}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {coverage.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-primary text-xs">✓</span>
                  <span className="text-xs text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-base text-center">
            {isRu ? 'Оформить прямо сейчас' : 'Get Insured Now'}
          </h3>

          {/* Russian-speaking option */}
          <Card variant="interactive" onClick={handleCherehapa} className="border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      🇷🇺 {isRu ? 'Для граждан РФ/СНГ' : 'For RU/CIS Citizens'}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-sm">
                    {isRu ? 'Cherehapa — маркетплейс страховок' : 'Cherehapa — Insurance Marketplace'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isRu
                      ? '18+ страховых компаний. Сравните цены и купите полис за 2 минуты.'
                      : '18+ insurance companies. Compare prices and buy a policy in 2 minutes.'}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{isRu ? 'от 300 ₽/день' : 'from ₽300/day'}</span>
                    <span>•</span>
                    <span>{isRu ? 'Мгновенный полис' : 'Instant policy'}</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>

          {/* International option */}
          <Card variant="interactive" onClick={handleSafetyWing} className="border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      🌍 {isRu ? 'Международная' : 'International'}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-sm">
                    {isRu ? 'SafetyWing — страховка для номадов' : 'SafetyWing — Nomad Insurance'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isRu
                      ? 'Подписочная страховка с покрытием до $250,000. Идеально для digital-номадов.'
                      : 'Subscription insurance with coverage up to $250,000. Perfect for digital nomads.'}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>~$45/4 {isRu ? 'недели' : 'weeks'}</span>
                    <span>•</span>
                    <span>{isRu ? 'Глобальное покрытие' : 'Global coverage'}</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload policy block */}
        <InsurancePolicyUpload />

        {/* Existing providers link */}
        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate('/insurance')} className="text-xs">
            <Plane className="w-3 h-3 mr-1" />
            {isRu ? 'Страхование для резидентов →' : 'Insurance for residents →'}
          </Button>
        </div>
      </div>
    </div>
  );
}
