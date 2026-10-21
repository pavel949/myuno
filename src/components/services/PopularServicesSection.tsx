import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useServices, Service } from '@/hooks/useServices';
import { UnifiedSectionHeader, UnifiedScrollSection } from '@/components/shared';
import { Flame, Shield, Wrench } from 'lucide-react';
import { pickLang } from '@/lib/i18n/pickLang';
import { ServiceSummary } from './ServiceSummary';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function PopularServicesSection() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { services, isLoading } = useServices({ sortBy: 'popular', limit: 10 });
  const isRu = language === 'ru';

  if (isLoading) {
    return (
      <div className="px-4 py-4">
        <Skeleton className="h-6 w-44 mb-4" />
        <div className="flex gap-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="w-[180px] h-[200px] rounded-none shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (services.length === 0) return null;

  return (
    <section className="py-4">
      <div className="px-4">
        <UnifiedSectionHeader
          icon={Flame}
          iconColor="text-primary"
          title={isRu ? 'Популярные услуги' : 'Popular Services'}
          viewAllPath="/services?sort=popular"
          viewAllLabel={isRu ? 'Все' : 'All'}
        />
      </div>

      <UnifiedScrollSection>
        {services.map((service) => (
          <ServiceCard 
            key={service.id} 
            service={service} 
            onClick={() => navigate(`/services/provider/${service.provider_id}?service=${service.id}`)}
          />
        ))}
      </UnifiedScrollSection>
    </section>
  );
}

interface ServiceCardProps {
  service: Service;
  onClick?: () => void;
  compact?: boolean;
}

export function ServiceCard({ service, onClick, compact = false }: ServiceCardProps) {
  const { language } = useLanguage();
  const name = (language === 'ru' ? service.name_ru : service.name_en) || service.name_en;
  const description = (language === 'ru' ? service.description_ru : service.description_en) || service.description_en;
  const image = service.images?.[0];
  return <button type="button" onClick={onClick} className={cn(
    'flex shrink-0 snap-center flex-col overflow-hidden border border-border bg-card text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    compact ? 'w-[180px]' : 'w-[240px]'
  )}>
    <span className="relative flex h-28 w-full items-center justify-center border-b border-border bg-muted/50">
      {image ? <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" /> : <Wrench aria-hidden="true" className="h-10 w-10 text-primary" strokeWidth={1.25} />}
      {service.provider?.is_verified && <Shield aria-label={pickLang(language, { ru: 'Проверен', en: 'Verified', th: 'ยืนยันแล้ว' })} className="absolute right-2 top-2 h-5 w-5 text-primary" />}
    </span>
    <span className="flex w-full flex-1 flex-col gap-2 p-4">
      {service.provider?.name && <span className="text-xs text-muted-foreground">{service.provider.name}</span>}
      <ServiceSummary name={name} description={description} price={service.price} currency={service.currency} durationMinutes={service.duration_minutes}
        actionLabel={pickLang(language, { ru: 'Посмотреть услугу', en: 'View service', th: 'ดูบริการ' })} />
    </span>
  </button>;
}
