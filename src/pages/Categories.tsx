import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { CategoryGroupsSection } from '@/components/home/CategoryGroupsSection';

export default function Categories() {
  const { language } = useLanguage();
  
  return (
    <AppLayout title={language === 'ru' ? 'Все категории' : 'All Categories'}>
      <div className="p-4 pb-24">
        <CategoryGroupsSection expanded showAll />
      </div>
    </AppLayout>
  );
}
