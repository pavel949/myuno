/**
 * InvestmentCalculatorPage — /invest/calculator
 *
 * Interactive ROI calculator for Phuket real-estate investments.
 * Pure-frontend math; CTA submits a lead via useUniversalLead (vertical='properties').
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  TrendingUp,
  Percent,
  Coins,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUniversalLead } from '@/hooks/useUniversalLead';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHead } from '@/components/seo';
import { toast } from 'sonner';
import { APP_ROUTES } from '@/lib/config/routes';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(n));

export default function InvestmentCalculatorPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const t = <T,>(p: { ru: T; en: T }): T => (isRu ? p.ru : p.en);
  const { submitLead, isSubmitting } = useUniversalLead();

  // Inputs (THB)
  const [price, setPrice] = useState<number>(8_000_000); // ฿
  const [adr, setAdr] = useState<number>(4500); // avg daily rate ฿
  const [occupancy, setOccupancy] = useState<number>(70); // %
  const [opexPct, setOpexPct] = useState<number>(35); // % of gross
  const [appreciation, setAppreciation] = useState<number>(6); // % yoy
  const [horizon, setHorizon] = useState<number>(5); // years

  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');

  const calc = useMemo(() => {
    const grossAnnual = adr * 365 * (occupancy / 100);
    const opex = grossAnnual * (opexPct / 100);
    const noi = grossAnnual - opex;
    const grossYield = price > 0 ? (grossAnnual / price) * 100 : 0;
    const netYield = price > 0 ? (noi / price) * 100 : 0;
    const futureValue = price * Math.pow(1 + appreciation / 100, horizon);
    const cumulativeNoi = noi * horizon;
    const totalReturn = futureValue - price + cumulativeNoi;
    const totalReturnPct = price > 0 ? (totalReturn / price) * 100 : 0;
    const irrApprox = horizon > 0 ? totalReturnPct / horizon : 0;
    return {
      grossAnnual,
      opex,
      noi,
      grossYield,
      netYield,
      futureValue,
      cumulativeNoi,
      totalReturn,
      totalReturnPct,
      irrApprox,
    };
  }, [price, adr, occupancy, opexPct, appreciation, horizon]);

  const handleLead = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error(t({ ru: 'Заполните имя и телефон', en: 'Enter name and phone' }));
      return;
    }
    await submitLead.mutateAsync({
      vertical_id: 'properties',
      request_type: 'investment_calculator',
      lead_source: 'cta',
      entry_point: '/invest/calculator',
      name,
      phone,
      email: email || undefined,
      currency: 'THB',
      budget_max: price,
      notes: [
        `Price: ฿${fmt(price)}`,
        `ADR: ฿${fmt(adr)} · Occupancy: ${occupancy}%`,
        `Net yield: ${calc.netYield.toFixed(2)}%`,
        `Horizon: ${horizon}y · Total return: ${calc.totalReturnPct.toFixed(0)}%`,
      ].join('\n'),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={t({
          ru: 'Калькулятор доходности недвижимости Пхукета — myUNO',
          en: 'Phuket real-estate ROI calculator — myUNO',
        })}
        description={t({
          ru: 'Посчитайте доходность инвестиции в недвижимость Пхукета: ADR, загрузка, OPEX, рост стоимости.',
          en: 'Estimate Phuket real-estate ROI: ADR, occupancy, OPEX, capital appreciation.',
        })}
      />

      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            {t({ ru: 'Назад', en: 'Back' })}
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
          <Calculator className="h-3.5 w-3.5" />
          {t({ ru: 'Калькулятор доходности', en: 'ROI calculator' })}
        </div>
        <h1 className="text-3xl sm:text-5xl font-semibold leading-tight tracking-tight text-foreground">
          {t({
            ru: 'Сколько принесёт ваша инвестиция в Пхукет',
            en: 'What your Phuket investment will return',
          })}
        </h1>
        <p className="mt-3 text-base text-muted-foreground max-w-2xl">
          {t({
            ru: 'Введите параметры объекта и сценарий аренды — посчитаем валовую и чистую доходность, рост капитала и совокупный возврат за горизонт.',
            en: 'Enter unit parameters and a rental scenario — we compute gross/net yield, capital growth and cumulative return over your horizon.',
          })}
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* INPUTS */}
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="price">
                  {t({ ru: 'Цена объекта, ฿', en: 'Property price, ฿' })}
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adr">
                  {t({ ru: 'Средняя цена за ночь (ADR), ฿', en: 'Avg daily rate (ADR), ฿' })}
                </Label>
                <Input
                  id="adr"
                  type="number"
                  value={adr}
                  onChange={(e) => setAdr(Number(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t({ ru: 'Загрузка', en: 'Occupancy' })}</Label>
                  <span className="text-sm font-mono text-muted-foreground">{occupancy}%</span>
                </div>
                <Slider
                  value={[occupancy]}
                  min={20}
                  max={95}
                  step={5}
                  onValueChange={(v) => setOccupancy(v[0])}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t({ ru: 'OPEX (% от валового)', en: 'OPEX (% of gross)' })}</Label>
                  <span className="text-sm font-mono text-muted-foreground">{opexPct}%</span>
                </div>
                <Slider
                  value={[opexPct]}
                  min={15}
                  max={60}
                  step={5}
                  onValueChange={(v) => setOpexPct(v[0])}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t({ ru: 'Рост стоимости в год', en: 'Annual appreciation' })}</Label>
                  <span className="text-sm font-mono text-muted-foreground">{appreciation}%</span>
                </div>
                <Slider
                  value={[appreciation]}
                  min={0}
                  max={15}
                  step={1}
                  onValueChange={(v) => setAppreciation(v[0])}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t({ ru: 'Горизонт, лет', en: 'Horizon, years' })}</Label>
                  <span className="text-sm font-mono text-muted-foreground">{horizon}</span>
                </div>
                <Slider
                  value={[horizon]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(v) => setHorizon(v[0])}
                />
              </div>
            </CardContent>
          </Card>

          {/* RESULTS */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultTile
                icon={Percent}
                label={t({ ru: 'Валовая доходность', en: 'Gross yield' })}
                value={`${calc.grossYield.toFixed(2)}%`}
              />
              <ResultTile
                icon={Percent}
                label={t({ ru: 'Чистая доходность', en: 'Net yield' })}
                value={`${calc.netYield.toFixed(2)}%`}
                accent
              />
              <ResultTile
                icon={Coins}
                label={t({ ru: 'NOI / год', en: 'NOI / year' })}
                value={`฿${fmt(calc.noi)}`}
              />
              <ResultTile
                icon={TrendingUp}
                label={t({ ru: `Стоимость ч-з ${horizon}л`, en: `Value in ${horizon}y` })}
                value={`฿${fmt(calc.futureValue)}`}
              />
              <ResultTile
                icon={Coins}
                label={t({ ru: 'Совокупный NOI', en: 'Cumulative NOI' })}
                value={`฿${fmt(calc.cumulativeNoi)}`}
              />
              <ResultTile
                icon={TrendingUp}
                label={t({ ru: 'Total return', en: 'Total return' })}
                value={`${calc.totalReturnPct.toFixed(0)}%`}
                accent
              />
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">
                  {t({ ru: 'Получить персональную подборку', en: 'Get a personal shortlist' })}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t({
                    ru: 'Пришлём 3–5 объектов под ваш бюджет с реальной доходностью.',
                    en: 'We will send 3–5 properties matching your budget with real-world yields.',
                  })}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder={t({ ru: 'Имя', en: 'Name' })}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    placeholder={t({ ru: 'Телефон / WhatsApp', en: 'Phone / WhatsApp' })}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <Input
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button className="w-full" size="lg" disabled={isSubmitting} onClick={handleLead}>
                  {isSubmitting
                    ? t({ ru: 'Отправляем…', en: 'Sending…' })
                    : t({ ru: 'Получить подборку', en: 'Get shortlist' })}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(APP_ROUTES.CAPITAL_ADVISORY)}
                >
                  {t({ ru: 'Капитал от $2M — Capital Advisory', en: 'Capital from $2M — Capital Advisory' })}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  {t({
                    ru: 'Только историческая статистика и сопоставимые объекты. Это не финансовый совет и не обещание будущих результатов. myUNO — площадка по недвижимости, а не инвестиционный консультант.',
                    en: 'Historical and comparable data only. Not financial advice and not a guarantee of future performance. myUNO is a real-estate marketplace, not an investment adviser.',
                  })}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

function ResultTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-none border p-4 ${
        accent ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div
        className={`mt-1 text-xl font-semibold font-mono ${
          accent ? 'text-primary' : 'text-foreground'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
