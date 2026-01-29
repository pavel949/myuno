import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { CategoryGroupsSection } from '@/components/home/CategoryGroupsSection';
import { Input } from '@/components/ui/input';

export default function Categories() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  return (
    <AppLayout title={language === 'ru' ? 'Все категории' : 'All Categories'}>
      <div className="p-4 pb-24 space-y-4">
        {/* Search bar - navigates to search page */}
        <div 
          className="relative cursor-pointer"
          onClick={() => navigate('/search')}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder={language === 'ru' ? 'Поиск категорий...' : 'Search categories...'}
            className="pl-10 cursor-pointer"
            readOnly
          />
        </div>
        
        {/* All categories grouped */}
        <CategoryGroupsSection expanded showAll />
      </div>
    </AppLayout>
  );
}
