import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowRight, LineChart, Building2 } from 'lucide-react';

const HIGHLIGHTS = [
  {
    icon: Building2,
    labelEn: 'Off-Plan Deals',
    labelRu: 'Оффплан сделки',
    descEn: 'Pre-sale pricing',
    descRu: 'Цены раннего входа',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    href: '/property/offplan',
  },
  {
    icon: TrendingUp,
    labelEn: 'Rental Yield',
    labelRu: 'Доходность аренды',
    descEn: '8–12% avg/year',
    descRu: '8–12% в год',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    href: '/invest/market',
  },
  {
    icon: LineChart,
    labelEn: 'Portfolio',
    labelRu: 'Портфель',
    descEn: 'Track your assets',
    descRu: 'Управляйте активами',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    href: '/invest/dashboard',
  },
];

export function InvestmentHighlightStrip() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  return (
    <div className="px-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {isRu ? 'Инвестиции на Пхукете' : 'Phuket Investment'}
        </h2>
        <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate('/invest/dashboard')}>
          {isRu ? 'Все' : 'View all'}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {HIGHLIGHTS.map(({ icon: Icon, labelEn, labelRu, descEn, descRu, color, bg, href }) => (
          <Card
            key={href}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(href)}
          >
            <CardContent className="p-3 flex flex-col gap-2">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-xs font-semibold leading-tight">
                  {isRu ? labelRu : labelEn}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  {isRu ? descRu : descEn}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
