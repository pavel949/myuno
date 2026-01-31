import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Store, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext } from '@/hooks/useUserContext';
import { SectionCard } from '@/components/uno/SectionCard';
import { cn } from '@/lib/utils';

interface BecomePartnerCTAProps {
  className?: string;
}

const texts = {
  en: {
    title: 'Become a Partner',
    subtitle: 'Unlock new opportunities with myUNO',
    owner: {
      title: 'List Your Property',
      desc: 'Earn from your villa or apartment',
    },
    vendor: {
      title: 'Offer Services',
      desc: 'Tours, transfers, experiences',
    },
  },
  ru: {
    title: 'Стать партнёром',
    subtitle: 'Откройте новые возможности с myUNO',
    owner: {
      title: 'Сдать недвижимость',
      desc: 'Зарабатывайте на вилле или квартире',
    },
    vendor: {
      title: 'Предложить услуги',
      desc: 'Туры, трансферы, впечатления',
    },
  },
};

/**
 * CTA block for users to become owners or vendors
 * Only shown if user doesn't already have these roles
 */
export function BecomePartnerCTA({ className }: BecomePartnerCTAProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { hasRole, isLoading } = useUserContext();

  if (isLoading) return null;

  // Don't show if user already has both roles
  const hasOwnerRole = hasRole('owner');
  const hasVendorRole = hasRole('vendor');
  
  if (hasOwnerRole && hasVendorRole) return null;

  const t = texts[language] || texts.en;

  const options = [
    {
      key: 'owner',
      icon: Building2,
      title: t.owner.title,
      desc: t.owner.desc,
      path: '/owner/onboarding',
      color: 'from-teal-500 to-teal-600',
      hidden: hasOwnerRole,
    },
    {
      key: 'vendor',
      icon: Store,
      title: t.vendor.title,
      desc: t.vendor.desc,
      path: '/vendor/onboarding',
      color: 'from-purple-500 to-purple-600',
      hidden: hasVendorRole,
    },
  ].filter(o => !o.hidden);

  if (options.length === 0) return null;

  return (
    <SectionCard className={cn("space-y-3", className)}>
      <div>
        <h3 className="text-sm font-semibold">{t.title}</h3>
        <p className="text-xs text-muted-foreground">{t.subtitle}</p>
      </div>
      
      <div className={cn("grid gap-2", options.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.key}
              onClick={() => navigate(option.path)}
              className={cn(
                "flex flex-col items-start gap-2 p-3 rounded-xl",
                "bg-gradient-to-br text-white",
                option.color,
                "hover:opacity-90 transition-opacity",
                "text-left"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 opacity-70" />
              </div>
              <div>
                <p className="text-sm font-medium">{option.title}</p>
                <p className="text-xs opacity-80">{option.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}
