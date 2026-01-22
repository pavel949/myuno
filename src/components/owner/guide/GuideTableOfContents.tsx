import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronRight } from 'lucide-react';

interface TOCItem {
  id: string;
  titleRu: string;
  titleEn: string;
  page: number;
}

const tocItems: TOCItem[] = [
  { id: 'ecosystem', titleRu: 'Что такое myUNO', titleEn: 'What is myUNO', page: 3 },
  { id: 'services', titleRu: 'Все сервисы платформы', titleEn: 'All Platform Services', page: 4 },
  { id: 'advantages', titleRu: 'Преимущества UNO', titleEn: 'UNO Advantages', page: 5 },
  { id: 'property-care', titleRu: 'UNO Property Care', titleEn: 'UNO Property Care', page: 6 },
  { id: 'dashboard', titleRu: 'Личный кабинет', titleEn: 'Dashboard', page: 7 },
  { id: 'add-property', titleRu: 'Добавление объекта', titleEn: 'Adding a Property', page: 8 },
  { id: 'bookings', titleRu: 'Управление бронированиями', titleEn: 'Booking Management', page: 9 },
  { id: 'operations', titleRu: 'Операционное управление', titleEn: 'Operations Management', page: 10 },
  { id: 'financials', titleRu: 'Финансовый учёт', titleEn: 'Financial Management', page: 11 },
  { id: 'channels', titleRu: 'Channel Manager', titleEn: 'Channel Manager', page: 12 },
  { id: 'integration', titleRu: 'Интеграция с экосистемой', titleEn: 'Ecosystem Integration', page: 13 },
  { id: 'management-options', titleRu: 'Варианты управления', titleEn: 'Management Options', page: 14 },
  { id: 'comparison', titleRu: 'Сравнение с конкурентами', titleEn: 'Competitor Comparison', page: 15 },
  { id: 'roadmap', titleRu: 'Развитие системы', titleEn: 'System Roadmap', page: 16 },
  { id: 'contacts', titleRu: 'Контакты и поддержка', titleEn: 'Contacts & Support', page: 17 },
];

export function GuideTableOfContents() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="p-8 print:p-12 print-break-before">
      <h2 className="text-2xl font-bold mb-8 text-foreground">
        {isRu ? 'Содержание' : 'Table of Contents'}
      </h2>

      <div className="space-y-2">
        {tocItems.map((item, index) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className="w-full flex items-center justify-between py-3 px-4 rounded-lg hover:bg-secondary/50 transition-colors group text-left print:hover:bg-transparent"
          >
            <div className="flex items-center gap-3">
              <span className="text-primary font-medium w-6">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-foreground group-hover:text-primary transition-colors">
                {isRu ? item.titleRu : item.titleEn}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm hidden print:inline">{item.page}</span>
              <ChevronRight className="w-4 h-4 print:hidden" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
