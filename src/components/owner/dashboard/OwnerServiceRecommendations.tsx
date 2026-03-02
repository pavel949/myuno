/**
 * @module OwnerServiceRecommendations
 * myUNO professional services carousel for property owners.
 * Creates leads via useUniversalLead + opens WhatsApp with pre-filled message.
 */
import { useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUniversalLead } from '@/hooks/useUniversalLead';
import { getWhatsAppUrl } from '@/lib/config/contacts';
import { QuickPriceChip } from '@/components/uno/QuickPriceChip';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ClipboardList, Camera, Search, BarChart3, Box,
  Wifi, ShieldCheck, DollarSign, Sparkles, MessageCircle,
  type LucideIcon,
} from 'lucide-react';

/* ─── Service catalog ─── */
interface MyUNOService {
  id: string;
  icon: LucideIcon;
  titleEn: string;
  titleRu: string;
  descEn: string;
  descRu: string;
  priceFromTHB: number;
  whatsappMsgEn: string;
  whatsappMsgRu: string;
  requestType: string;
}

const SERVICES: MyUNOService[] = [
  {
    id: 'inventory_audit',
    icon: ClipboardList,
    titleEn: 'Property Inventory',
    titleRu: 'Инвентаризация',
    descEn: 'Professional inventory audit with photo report',
    descRu: 'Профессиональный аудит с фотоотчётом',
    priceFromTHB: 3000,
    whatsappMsgEn: "Hi! I'd like to order a property inventory audit",
    whatsappMsgRu: 'Здравствуйте! Хочу заказать инвентаризацию объекта',
    requestType: 'inventory_audit',
  },
  {
    id: 'photo_shoot',
    icon: Camera,
    titleEn: 'Professional Photo Shoot',
    titleRu: 'Фотосессия объекта',
    descEn: 'Pro photography for listings & marketing',
    descRu: 'Профессиональные фото для листингов',
    priceFromTHB: 5000,
    whatsappMsgEn: "Hi! I'd like to order a professional photo session",
    whatsappMsgRu: 'Здравствуйте! Хочу заказать фотосессию объекта',
    requestType: 'photo_shoot',
  },
  {
    id: 'property_inspection',
    icon: Search,
    titleEn: 'Property Inspection',
    titleRu: 'Инспекция объекта',
    descEn: 'Detailed condition report with recommendations',
    descRu: 'Детальный отчёт о состоянии с рекомендациями',
    priceFromTHB: 2500,
    whatsappMsgEn: "Hi! I'd like to order a property inspection",
    whatsappMsgRu: 'Здравствуйте! Хочу заказать инспекцию объекта',
    requestType: 'property_inspection',
  },
  {
    id: 'management_audit',
    icon: BarChart3,
    titleEn: 'Management Audit',
    titleRu: 'Аудит управления',
    descEn: 'Review of MC performance & reporting',
    descRu: 'Анализ работы УК и отчётности',
    priceFromTHB: 7000,
    whatsappMsgEn: "Hi! I'd like to order a management audit",
    whatsappMsgRu: 'Здравствуйте! Хочу заказать аудит управления',
    requestType: 'management_audit',
  },
  {
    id: '3d_tour',
    icon: Box,
    titleEn: '3D Virtual Tour',
    titleRu: '3D тур',
    descEn: 'Matterport 3D scan of your property',
    descRu: '3D сканирование Matterport',
    priceFromTHB: 8000,
    whatsappMsgEn: "Hi! I'd like to order a 3D virtual tour",
    whatsappMsgRu: 'Здравствуйте! Хочу заказать 3D тур',
    requestType: '3d_tour',
  },
  {
    id: 'smart_home',
    icon: Wifi,
    titleEn: 'Smart Home Sensors',
    titleRu: 'Умный дом',
    descEn: 'Motion, climate & security sensors',
    descRu: 'Датчики движения, климата и безопасности',
    priceFromTHB: 4500,
    whatsappMsgEn: "Hi! I'd like to discuss smart home sensors installation",
    whatsappMsgRu: 'Здравствуйте! Хочу обсудить установку датчиков умного дома',
    requestType: 'smart_home_sensors',
  },
  {
    id: 'insurance',
    icon: ShieldCheck,
    titleEn: 'Insurance Consultation',
    titleRu: 'Страхование',
    descEn: 'Property insurance review & quotes',
    descRu: 'Обзор страховых программ и котировки',
    priceFromTHB: 0,
    whatsappMsgEn: "Hi! I'd like to consult about property insurance",
    whatsappMsgRu: 'Здравствуйте! Хочу проконсультироваться по страхованию',
    requestType: 'insurance_consultation',
  },
  {
    id: 'property_sale',
    icon: DollarSign,
    titleEn: 'Property Sale',
    titleRu: 'Продажа объекта',
    descEn: 'Full support for selling your property',
    descRu: 'Полное сопровождение продажи',
    priceFromTHB: 0,
    whatsappMsgEn: "Hi! I'd like to discuss selling my property",
    whatsappMsgRu: 'Здравствуйте! Хочу обсудить продажу объекта',
    requestType: 'property_sale',
  },
];

/** Rotate services based on day-of-year so owners see different ones daily */
function getDailyServices(count: number = 4): MyUNOService[] {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const start = dayOfYear % SERVICES.length;
  const result: MyUNOService[] = [];
  for (let i = 0; i < count; i++) {
    result.push(SERVICES[(start + i) % SERVICES.length]);
  }
  return result;
}

/* ─── Component ─── */
export function OwnerServiceRecommendations() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { submitLead, isSubmitting } = useUniversalLead();
  const isRu = language === 'ru';
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  const services = useMemo(() => getDailyServices(4), []);

  const handleRequest = (service: MyUNOService) => {
    if (requestedIds.has(service.id) || isSubmitting) return;

    // 1. Create internal lead
    submitLead.mutate({
      vertical_id: 'property_services',
      request_type: service.requestType,
      lead_source: 'dashboard_recommendation',
      entry_point: 'owner_dashboard_services',
      name: user?.user_metadata?.full_name || user?.email || 'Owner',
      phone: user?.user_metadata?.phone || '',
      email: user?.email,
      preferred_language: language,
      notes: `Service: ${service.titleEn}`,
    });

    // 2. Open WhatsApp
    const msg = isRu ? service.whatsappMsgRu : service.whatsappMsgEn;
    const url = getWhatsAppUrl(msg);
    window.open(url, '_blank');

    setRequestedIds(prev => new Set(prev).add(service.id));
  };

  if (!user) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-[15px]">
          {isRu ? 'Сервисы myUNO' : 'myUNO Services'}
        </h3>
        <Badge variant="secondary" className="text-[10px]">
          {isRu ? 'для собственников' : 'for owners'}
        </Badge>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {services.map(service => {
          const Icon = service.icon;
          const isRequested = requestedIds.has(service.id);

          return (
            <Card
              key={service.id}
              className={cn(
                'shrink-0 w-[200px] cursor-pointer hover:shadow-md transition-all group',
                isRequested && 'opacity-60'
              )}
              onClick={() => handleRequest(service)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="text-sm font-medium leading-tight">
                    {isRu ? service.titleRu : service.titleEn}
                  </h4>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {isRu ? service.descRu : service.descEn}
                </p>

                <div className="flex items-center justify-between">
                  {service.priceFromTHB > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {isRu ? 'от ' : 'from '}
                      <QuickPriceChip priceInTHB={service.priceFromTHB} className="text-xs font-medium text-foreground" />
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {isRu ? 'бесплатно' : 'free'}
                    </span>
                  )}

                  <Button
                    size="sm"
                    variant={isRequested ? 'secondary' : 'default'}
                    className="h-7 text-xs px-2.5 gap-1"
                    disabled={isRequested || isSubmitting}
                  >
                    <MessageCircle className="h-3 w-3" />
                    {isRequested
                      ? (isRu ? 'Отправлено' : 'Sent')
                      : (isRu ? 'Запросить' : 'Request')
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
