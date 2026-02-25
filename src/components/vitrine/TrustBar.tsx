import React from 'react';
import { Users, Layers, Building2, CheckCircle, Shield, CreditCard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTotalCounts } from '@/hooks/useServiceCounts';
import { Skeleton } from '@/components/ui/skeleton';

export function TrustBar() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: counts, isLoading } = useTotalCounts();

  const stats = [
    {
      icon: Users,
      value: counts?.verifiedProviders ?? 0,
      suffix: '+',
      labelEn: 'Verified Providers',
      labelRu: 'Проверенных провайдеров',
    },
    {
      icon: Layers,
      value: counts?.totalServices ?? 0,
      suffix: '+',
      labelEn: 'Services Available',
      labelRu: 'Доступных услуг',
    },
    {
      icon: Building2,
      value: counts?.propertiesManaged ?? 0,
      suffix: '',
      labelEn: 'Properties Managed',
      labelRu: 'Объектов под управлением',
    },
  ];

  const badges = [
    { icon: CheckCircle, labelEn: 'G-Trust Quality Verified', labelRu: 'Проверено G-Trust' },
    { icon: Shield, labelEn: 'Ombudsman Protection', labelRu: 'Защита омбудсмена' },
    { icon: CreditCard, labelEn: 'Secure Payments', labelRu: 'Безопасные платежи' },
  ];

  return (
    <section className="max-w-[1280px] mx-auto px-4 lg:px-8 py-10 lg:py-14">
      <div className="rounded-2xl bg-muted/30 border border-border/30 p-6 lg:p-8">
        {/* Numbers */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {stats.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.labelEn} className="text-center">
                <div className="flex justify-center mb-2">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                {isLoading ? (
                  <Skeleton className="h-7 w-16 mx-auto mb-1" />
                ) : (
                  <p className="text-2xl lg:text-3xl font-bold text-foreground font-display">
                    {s.value.toLocaleString()}{s.suffix}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {isRu ? s.labelRu : s.labelEn}
                </p>
              </div>
            );
          })}
        </div>

        {/* Badges */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-border/30">
          {badges.map(b => {
            const Icon = b.icon;
            return (
              <div key={b.labelEn} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-success" />
                <span className="text-xs font-medium text-muted-foreground">
                  {isRu ? b.labelRu : b.labelEn}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
