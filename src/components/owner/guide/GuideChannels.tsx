import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, CheckCircle2, AlertCircle, Link2 } from 'lucide-react';

const channels = [
  { name: 'Airbnb', logo: '🏠', status: 'connected' },
  { name: 'Booking.com', logo: '📘', status: 'connected' },
  { name: 'VRBO', logo: '🏡', status: 'pending' },
  { name: 'Google Calendar', logo: '📅', status: 'connected' },
];

export function GuideChannels() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="p-8 print:p-12 space-y-8">
      <section id="channels" className="print-break-before">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          {isRu ? 'Channel Manager' : 'Channel Manager'}
        </h2>

        <p className="text-muted-foreground mb-6">
          {isRu 
            ? 'Синхронизируйте календари со всеми платформами, чтобы избежать двойных бронирований:'
            : 'Sync calendars with all platforms to avoid double bookings:'
          }
        </p>

        {/* Channels Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {channels.map((channel) => (
            <Card key={channel.name} className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <span className="text-3xl block mb-2">{channel.logo}</span>
                <h4 className="font-medium text-foreground text-sm mb-2">{channel.name}</h4>
                {channel.status === 'connected' ? (
                  <span className="inline-flex items-center gap-1 text-xs text-success">
                    <CheckCircle2 className="w-3 h-3" />
                    {isRu ? 'Подключён' : 'Connected'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <AlertCircle className="w-3 h-3" />
                    {isRu ? 'Настроить' : 'Setup'}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How it works */}
        <Card className="bg-secondary/30 border-border">
          <CardContent className="p-6">
            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              {isRu ? 'Как работает синхронизация' : 'How sync works'}
            </h4>
            <div className="space-y-3">
              <Step 
                number={1} 
                text={isRu 
                  ? 'Скопируйте iCal-ссылку с вашего OTA (Airbnb, Booking)' 
                  : 'Copy iCal link from your OTA (Airbnb, Booking)'
                } 
              />
              <Step 
                number={2} 
                text={isRu 
                  ? 'Добавьте ссылку в UNO через "Добавить канал"' 
                  : 'Add the link to UNO via "Add Channel"'
                } 
              />
              <Step 
                number={3} 
                text={isRu 
                  ? 'UNO автоматически импортирует все бронирования' 
                  : 'UNO automatically imports all bookings'
                } 
              />
              <Step 
                number={4} 
                text={isRu 
                  ? 'Экспортируйте календарь UNO обратно на OTA' 
                  : 'Export UNO calendar back to your OTA'
                } 
              />
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <BenefitCard 
            icon={<RefreshCw className="w-5 h-5" />}
            title={isRu ? 'Автосинхронизация' : 'Auto-sync'}
            desc={isRu ? 'Обновление каждые 15 минут' : 'Updates every 15 minutes'}
          />
          <BenefitCard 
            icon={<CheckCircle2 className="w-5 h-5" />}
            title={isRu ? 'Без овербукинга' : 'No overbooking'}
            desc={isRu ? 'Даты блокируются мгновенно' : 'Dates blocked instantly'}
          />
          <BenefitCard 
            icon={<Link2 className="w-5 h-5" />}
            title={isRu ? 'Единый календарь' : 'Unified calendar'}
            desc={isRu ? 'Все брони в одном месте' : 'All bookings in one place'}
          />
        </div>
      </section>
    </div>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">
        {number}
      </span>
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}

function BenefitCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="text-primary mb-2">{icon}</div>
        <h4 className="font-medium text-foreground text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1">{desc}</p>
      </CardContent>
    </Card>
  );
}
