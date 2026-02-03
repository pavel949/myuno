import React from 'react';
import { cn } from '@/lib/utils';
import { SERVICE_DOMAINS } from '@/lib/taxonomies';
import type { ServiceDomain } from '@/lib/config/homeServicesTaxonomy';
import { useLanguage } from '@/contexts/LanguageContext';

interface DomainTabsProps {
  selectedDomain: ServiceDomain | 'all';
  onDomainChange: (domain: ServiceDomain | 'all') => void;
  className?: string;
}

export function DomainTabs({ selectedDomain, onDomainChange, className }: DomainTabsProps) {
  const { language } = useLanguage();
  
  const allTab = {
    id: 'all' as const,
    labelEn: 'All',
    labelRu: 'Все',
    icon: '🏠',
  };
  
  const tabs = [allTab, ...SERVICE_DOMAINS];

  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2 scrollbar-hide", className)}>
      {tabs.map((tab) => {
        const isSelected = selectedDomain === tab.id;
        const label = language === 'ru' ? tab.labelRu : tab.labelEn;
        
        return (
          <button
            key={tab.id}
            onClick={() => onDomainChange(tab.id as ServiceDomain | 'all')}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              "border",
              isSelected
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground"
            )}
          >
            <span>{tab.icon}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
