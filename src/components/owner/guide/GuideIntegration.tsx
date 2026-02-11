import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { OWNER_REVENUE } from '@/lib/config/ownerConstants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowDown, Building2, CalendarCheck, Brush, Wrench, Car, 
  Stethoscope, Users, Percent
} from 'lucide-react';

const useCases = [
  {
    situationRu: 'Гость просит ранний заезд',
    situationEn: 'Guest requests early check-in',
    solutionRu: 'Одобряете в приложении → клинер получает новое время',
    solutionEn: 'Approve in app → cleaner gets new time',
    icon: CalendarCheck,
  },
  {
    situationRu: 'Сломался кондиционер',
    situationEn: 'AC breaks down',
    solutionRu: 'Создаёте заявку → мастер из UNO приезжает в тот же день',
    solutionEn: 'Create request → UNO technician arrives same day',
    icon: Wrench,
  },
  {
    situationRu: 'Гость хочет тур',
    situationEn: 'Guest wants a tour',
    solutionRu: 'Предлагаете туры из каталога UNO → получаете комиссию',
    solutionEn: 'Offer tours from UNO catalog → earn commission',
    icon: Car,
  },
  {
    situationRu: 'Нужна юридическая помощь',
    situationEn: 'Need legal help',
    solutionRu: 'Связываетесь с юристами UNO для оформления документов',
    solutionEn: 'Contact UNO lawyers for document processing',
    icon: Users,
  },
];

export function GuideIntegration() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="p-8 print:p-12 space-y-8">
      <section id="integration" className="print-break-before">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          {isRu ? 'Интеграция с экосистемой UNO' : 'UNO Ecosystem Integration'}
        </h2>

        <p className="text-muted-foreground mb-8">
          {isRu 
            ? 'Управление недвижимостью связано со всеми сервисами платформы:'
            : 'Property management is connected to all platform services:'
          }
        </p>

        {/* Flow Diagram */}
        <Card className="bg-card border-border mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              {/* Property */}
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
                <Building2 className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">
                  {isRu ? 'Ваш объект в UNO' : 'Your Property in UNO'}
                </span>
              </div>

              <ArrowDown className="w-5 h-5 text-muted-foreground" />

              {/* Booking */}
              <div className="px-4 py-2 bg-secondary rounded-lg">
                <span className="text-sm text-muted-foreground">
                  {isRu ? 'Бронирование от гостя' : 'Guest Booking'}
                </span>
              </div>

              <ArrowDown className="w-5 h-5 text-muted-foreground" />

              {/* Auto Tasks */}
              <div className="w-full max-w-md p-4 bg-secondary/50 rounded-xl">
                <p className="text-sm font-medium text-foreground mb-3 text-center">
                  📅 {isRu ? 'Автоматические задачи:' : 'Automatic tasks:'}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-xs">Check-in</span>
                  <span className="px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-xs">Check-out</span>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-500 rounded-full text-xs">
                    {isRu ? 'Уборка' : 'Cleaning'}
                  </span>
                </div>
              </div>

              <ArrowDown className="w-5 h-5 text-muted-foreground" />

              {/* Connected Services */}
              <div className="w-full max-w-md p-4 bg-primary/5 rounded-xl border border-primary/20">
                <p className="text-sm font-medium text-foreground mb-3 text-center">
                  🔗 {isRu ? 'Связанные сервисы UNO:' : 'Connected UNO Services:'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <ServiceLink icon={Brush} label={isRu ? 'Уборка → проверенные клинеры' : 'Cleaning → verified cleaners'} />
                  <ServiceLink icon={Wrench} label={isRu ? 'Ремонт → сантехники, электрики' : 'Repair → plumbers, electricians'} />
                  <ServiceLink icon={Car} label={isRu ? 'Трансфер → такси для гостей' : 'Transfer → taxi for guests'} />
                  <ServiceLink icon={Stethoscope} label={isRu ? 'SOS → экстренная помощь' : 'SOS → emergency help'} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Use Cases */}
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          {isRu ? 'Примеры использования' : 'Use Cases'}
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {useCases.map((uc) => (
            <Card key={uc.situationEn} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <uc.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm mb-1">
                      {isRu ? uc.situationRu : uc.situationEn}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      → {isRu ? uc.solutionRu : uc.solutionEn}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Management Options */}
      <section id="management-options" className="print-break-before">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          {isRu ? 'Два варианта управления' : 'Two Management Options'}
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Self Management */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                {isRu ? 'Самостоятельное' : 'Self-Management'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col">
                <span className="text-2xl font-bold text-primary">{OWNER_REVENUE.SELF_MANAGEMENT.labelEn}</span>
                <span className="text-xs text-muted-foreground">
                  {isRu ? OWNER_REVENUE.SELF_MANAGEMENT.descRu : OWNER_REVENUE.SELF_MANAGEMENT.descEn}
                </span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ {isRu ? 'Инструменты — бесплатно' : 'Tools — free'}</li>
                <li>✓ {isRu ? 'Channel Manager' : 'Channel Manager'}</li>
                <li>✓ {isRu ? 'Финансовая отчётность' : 'Financial reporting'}</li>
                <li>✓ {isRu ? 'Заказ услуг по необходимости' : 'Order services as needed'}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Full Management */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {isRu ? 'Полное управление' : 'Full Management'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">{OWNER_REVENUE.FULL_MANAGEMENT.ownerSharePercent}%</span>
                  <span className="text-sm text-muted-foreground">
                    {isRu ? OWNER_REVENUE.FULL_MANAGEMENT.ownerDescRu : OWNER_REVENUE.FULL_MANAGEMENT.ownerDescEn}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {isRu ? OWNER_REVENUE.FULL_MANAGEMENT.platformDescRu : OWNER_REVENUE.FULL_MANAGEMENT.platformDescEn}
                </span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ {isRu ? 'Поиск и проверка гостей' : 'Guest search and vetting'}</li>
                <li>✓ {isRu ? 'Check-in / Check-out' : 'Check-in / Check-out'}</li>
                <li>✓ {isRu ? 'Уборка и обслуживание' : 'Cleaning and maintenance'}</li>
                <li>✓ {isRu ? 'Оплата счетов' : 'Bill payments'}</li>
                <li>✓ {isRu ? 'Поддержка гостей 24/7' : '24/7 guest support'}</li>
                <li>✓ {isRu ? 'Ежемесячные отчёты' : 'Monthly reports'}</li>
              </ul>
              <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                <p className="text-xs text-primary flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  {isRu ? 'Прозрачная отчётность каждый месяц' : 'Transparent monthly reporting'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function ServiceLink({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon className="w-3 h-3 text-primary" />
      <span>{label}</span>
    </div>
  );
}
