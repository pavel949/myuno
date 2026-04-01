/**
 * CostOfLivingPage — Monthly cost calculator for Phuket
 * Bible cluster: ARRIVE/RELOCATE → upsell to relocation packages
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Home, Utensils, Car, Stethoscope, GraduationCap, Wifi, ShoppingBag, Dumbbell, PlusCircle, MinusCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/seo';
import { cn } from '@/lib/utils';

interface CostCategory {
  id: string;
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  minTHB: number;
  maxTHB: number;
  defaultTHB: number;
  stepTHB: number;
  tipsEn: string[];
  tipsRu: string[];
}

const CATEGORIES: CostCategory[] = [
  {
    id: 'housing', icon: Home, labelEn: 'Housing', labelRu: 'Жильё',
    minTHB: 8000, maxTHB: 120000, defaultTHB: 25000, stepTHB: 1000,
    tipsEn: ['Studio: 8-15K', 'Condo 1BR: 15-35K', 'Villa 2BR: 35-80K', 'Luxury villa: 80K+'],
    tipsRu: ['Студия: 8-15К', 'Кондо 1BR: 15-35К', 'Вилла 2BR: 35-80К', 'Люкс вилла: 80К+'],
  },
  {
    id: 'food', icon: Utensils, labelEn: 'Food & Dining', labelRu: 'Еда и рестораны',
    minTHB: 5000, maxTHB: 60000, defaultTHB: 15000, stepTHB: 1000,
    tipsEn: ['Street food: 50-80฿/meal', 'Cafe: 150-300฿', 'Restaurant: 500-1500฿', 'Groceries: 8-15K/mo'],
    tipsRu: ['Уличная еда: 50-80฿', 'Кафе: 150-300฿', 'Ресторан: 500-1500฿', 'Продукты: 8-15К/мес'],
  },
  {
    id: 'transport', icon: Car, labelEn: 'Transport', labelRu: 'Транспорт',
    minTHB: 2000, maxTHB: 30000, defaultTHB: 5000, stepTHB: 500,
    tipsEn: ['Scooter rental: 3-5K/mo', 'Car rental: 15-25K/mo', 'Grab: 200-500฿/trip'],
    tipsRu: ['Аренда скутера: 3-5К/мес', 'Аренда авто: 15-25К/мес', 'Grab: 200-500฿/поездка'],
  },
  {
    id: 'health', icon: Stethoscope, labelEn: 'Healthcare', labelRu: 'Медицина',
    minTHB: 0, maxTHB: 25000, defaultTHB: 3000, stepTHB: 500,
    tipsEn: ['Insurance: 2-8K/mo', 'Dental: 1-5K/visit', 'GP visit: 500-2K'],
    tipsRu: ['Страховка: 2-8К/мес', 'Стоматолог: 1-5К/визит', 'Терапевт: 500-2К'],
  },
  {
    id: 'telecom', icon: Wifi, labelEn: 'Phone & Internet', labelRu: 'Связь и интернет',
    minTHB: 500, maxTHB: 3000, defaultTHB: 1000, stepTHB: 100,
    tipsEn: ['SIM: 300-600฿/mo', 'Home WiFi: 500-800฿/mo', 'Co-working: 3-8K/mo'],
    tipsRu: ['SIM: 300-600฿/мес', 'Домашний WiFi: 500-800฿/мес', 'Коворкинг: 3-8К/мес'],
  },
  {
    id: 'fitness', icon: Dumbbell, labelEn: 'Fitness & Leisure', labelRu: 'Спорт и досуг',
    minTHB: 0, maxTHB: 15000, defaultTHB: 3000, stepTHB: 500,
    tipsEn: ['Gym: 1.5-4K/mo', 'Yoga: 3-5K/mo', 'Muay Thai: 5-12K/mo'],
    tipsRu: ['Зал: 1.5-4К/мес', 'Йога: 3-5К/мес', 'Муай Тай: 5-12К/мес'],
  },
  {
    id: 'shopping', icon: ShoppingBag, labelEn: 'Shopping & Other', labelRu: 'Покупки и прочее',
    minTHB: 0, maxTHB: 30000, defaultTHB: 5000, stepTHB: 1000,
    tipsEn: ['Clothing, household items, personal care', 'Visa runs: 3-10K each'],
    tipsRu: ['Одежда, бытовые товары, уход', 'Визараны: 3-10К каждый'],
  },
  {
    id: 'education', icon: GraduationCap, labelEn: 'Education', labelRu: 'Образование',
    minTHB: 0, maxTHB: 80000, defaultTHB: 0, stepTHB: 5000,
    tipsEn: ['International school: 15-70K/mo', 'Thai language: 3-8K/mo', 'Private tutor: 500-1500฿/hr'],
    tipsRu: ['Международная школа: 15-70К/мес', 'Тайский язык: 3-8К/мес', 'Репетитор: 500-1500฿/час'],
  },
];

type LifestylePreset = 'budget' | 'comfort' | 'luxury';

const PRESETS: Record<LifestylePreset, Record<string, number>> = {
  budget: { housing: 12000, food: 8000, transport: 3000, health: 1500, telecom: 600, fitness: 1500, shopping: 3000, education: 0 },
  comfort: { housing: 30000, food: 18000, transport: 6000, health: 4000, telecom: 1200, fitness: 3500, shopping: 6000, education: 0 },
  luxury: { housing: 80000, food: 40000, transport: 20000, health: 8000, telecom: 2000, fitness: 8000, shopping: 15000, education: 0 },
};

export default function CostOfLivingPage() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(CATEGORIES.map(c => [c.id, c.defaultTHB]))
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const total = useMemo(() => Object.values(values).reduce((s, v) => s + v, 0), [values]);

  const applyPreset = (preset: LifestylePreset) => {
    setValues({ ...PRESETS[preset] });
  };

  const handleSlider = (id: string, val: number[]) => {
    setValues(prev => ({ ...prev, [id]: val[0] }));
  };

  const lifestyleLabel = total < 30000
    ? (isRu ? '🪴 Бюджетно' : '🪴 Budget')
    : total < 60000
    ? (isRu ? '☀️ Комфортно' : '☀️ Comfortable')
    : total < 100000
    ? (isRu ? '🌴 Премиум' : '🌴 Premium')
    : (isRu ? '👑 Люкс' : '👑 Luxury');

  return (
    <AppLayout showHeader={false} showBottomNav>
      <SEOHead
        title={isRu ? 'Стоимость жизни на Пхукете — Калькулятор' : 'Cost of Living in Phuket — Calculator'}
        description={isRu ? 'Рассчитайте ежемесячные расходы: жильё, еда, транспорт, медицина' : 'Calculate monthly expenses: housing, food, transport, healthcare'}
      />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <BackButton fallbackPath="/discover" />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate">{isRu ? 'Стоимость жизни' : 'Cost of Living'}</h1>
            <p className="text-xs text-muted-foreground">Phuket, Thailand</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4">
        {/* Total card */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{isRu ? 'Ежемесячные расходы' : 'Monthly expenses'}</p>
            <p className="text-3xl font-bold text-primary">{formatPrice(total)}</p>
            <Badge variant="secondary" className="mt-2">{lifestyleLabel}</Badge>
          </CardContent>
        </Card>

        {/* Presets */}
        <div className="flex gap-2">
          {([
            { id: 'budget' as const, labelEn: '🪴 Budget', labelRu: '🪴 Бюджет' },
            { id: 'comfort' as const, labelEn: '☀️ Comfort', labelRu: '☀️ Комфорт' },
            { id: 'luxury' as const, labelEn: '👑 Luxury', labelRu: '👑 Люкс' },
          ]).map(p => (
            <Button
              key={p.id}
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => applyPreset(p.id)}
            >
              {isRu ? p.labelRu : p.labelEn}
            </Button>
          ))}
        </div>

        {/* Categories */}
        <div className="space-y-2">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const val = values[cat.id] ?? cat.defaultTHB;
            const isExpanded = expandedId === cat.id;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;

            return (
              <Card key={cat.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <button
                    className="w-full flex items-center gap-3 p-3 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : cat.id)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{isRu ? cat.labelRu : cat.labelEn}</p>
                      <p className="text-xs text-muted-foreground">{pct}%</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{formatPrice(val)}</p>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-3">
                      <Slider
                        value={[val]}
                        min={cat.minTHB}
                        max={cat.maxTHB}
                        step={cat.stepTHB}
                        onValueChange={(v) => handleSlider(cat.id, v)}
                        className="w-full"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{formatPrice(cat.minTHB)}</span>
                        <span>{formatPrice(cat.maxTHB)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(isRu ? cat.tipsRu : cat.tipsEn).map((tip, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] font-normal">{tip}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="space-y-3 pt-2">
          <Button className="w-full" onClick={() => navigate('/relocate')}>
            {isRu ? 'Узнать о релокации на Пхукет' : 'Explore Phuket Relocation'}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate('/property')}>
            <Home className="w-4 h-4 mr-2" />
            {isRu ? 'Найти жильё' : 'Find Housing'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
