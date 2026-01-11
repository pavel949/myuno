import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Baby, Heart, Star, Shield, Languages, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout, ItemCard, type MiniAppCategory } from '@/components/miniapp';
import { FilterValues, babysitterFilterConfig } from '@/components/filters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const experienceFilters: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'newborn', labelEn: 'Newborn', labelRu: '0-1 год', icon: '👶' },
  { id: 'toddler', labelEn: 'Toddler', labelRu: '1-3 года', icon: '🧒' },
  { id: 'preschool', labelEn: 'Preschool', labelRu: '3-6 лет', icon: '👧' },
  { id: 'school', labelEn: 'School age', labelRu: 'Школьники', icon: '🎒' },
];

const babysitters = [
  {
    id: 'bs-1',
    nameEn: 'Anna Petrova',
    nameRu: 'Анна Петрова',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    rating: 4.9,
    reviewCount: 87,
    experience: '5 years',
    experienceRu: '5 лет опыта',
    pricePerHour: 500,
    languages: ['Russian', 'English'],
    languagesRu: ['Русский', 'Английский'],
    ageGroups: ['newborn', 'toddler', 'preschool'],
    certifications: ['First Aid', 'CPR'],
    certificationsRu: ['Первая помощь', 'СЛР'],
    available: true,
    isVerified: true,
    isFeatured: true,
    descEn: 'Professional nanny with early childhood education degree',
    descRu: 'Профессиональная няня с педагогическим образованием',
  },
  {
    id: 'bs-2',
    nameEn: 'Maria Ivanova',
    nameRu: 'Мария Иванова',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300',
    rating: 4.8,
    reviewCount: 65,
    experience: '8 years',
    experienceRu: '8 лет опыта',
    pricePerHour: 600,
    languages: ['Russian', 'English', 'Thai'],
    languagesRu: ['Русский', 'Английский', 'Тайский'],
    ageGroups: ['toddler', 'preschool', 'school'],
    certifications: ['First Aid', 'Montessori'],
    certificationsRu: ['Первая помощь', 'Монтессори'],
    available: true,
    isVerified: true,
    descEn: 'Montessori-trained nanny, great with activities',
    descRu: 'Няня с Монтессори-подготовкой, творческие занятия',
  },
  {
    id: 'bs-3',
    nameEn: 'Olga Smirnova',
    nameRu: 'Ольга Смирнова',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
    rating: 4.7,
    reviewCount: 42,
    experience: '3 years',
    experienceRu: '3 года опыта',
    pricePerHour: 400,
    languages: ['Russian'],
    languagesRu: ['Русский'],
    ageGroups: ['preschool', 'school'],
    certifications: ['First Aid'],
    certificationsRu: ['Первая помощь'],
    available: true,
    isVerified: true,
    descEn: 'Patient and caring, homework help available',
    descRu: 'Терпеливая и заботливая, помощь с уроками',
  },
  {
    id: 'bs-4',
    nameEn: 'Natalia Kozlova',
    nameRu: 'Наталья Козлова',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300',
    rating: 5.0,
    reviewCount: 28,
    experience: '10 years',
    experienceRu: '10 лет опыта',
    pricePerHour: 800,
    languages: ['Russian', 'English', 'French'],
    languagesRu: ['Русский', 'Английский', 'Французский'],
    ageGroups: ['newborn', 'toddler'],
    certifications: ['First Aid', 'CPR', 'Pediatric Nurse'],
    certificationsRu: ['Первая помощь', 'СЛР', 'Детская медсестра'],
    available: false,
    isVerified: true,
    isFeatured: true,
    descEn: 'Former pediatric nurse, specialized in newborn care',
    descRu: 'Бывшая детская медсестра, специализация на новорожденных',
  },
];

export default function BabysitterIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filterValues).forEach(([key, value]) => {
      if (key === 'priceLevel' && value) count++;
      else if (Array.isArray(value)) count += value.length;
      else if (value) count++;
    });
    return count;
  }, [filterValues]);

  const filteredBabysitters = useMemo(() => {
    return babysitters.filter(bs => {
      const name = language === 'ru' ? bs.nameRu : bs.nameEn;
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAge = selectedAgeGroup === 'all' || bs.ageGroups.includes(selectedAgeGroup);
      
      // Age group filter
      const ageGroups = filterValues.ageGroup as string[] | undefined;
      if (ageGroups?.length && !ageGroups.some(ag => bs.ageGroups.includes(ag))) return false;
      
      // Languages filter
      const langs = filterValues.languages as string[] | undefined;
      if (langs?.length) {
        const bsLangsLower = bs.languages.map(l => l.toLowerCase());
        if (!langs.some(l => bsLangsLower.includes(l))) return false;
      }
      
      return matchesSearch && matchesAge;
    });
  }, [searchQuery, selectedAgeGroup, filterValues, language]);

  return (
    <MiniAppLayout
      title={language === 'ru' ? 'Няни' : 'Babysitters'}
      subtitle={language === 'ru' ? `${filteredBabysitters.length} нянь` : `${filteredBabysitters.length} babysitters`}
      heroIcon={Baby}
      heroTitle={language === 'ru' ? 'Проверенные няни' : 'Trusted Babysitters'}
      heroSubtitle={language === 'ru' ? 'Все няни прошли проверку и имеют сертификаты' : 'All babysitters are verified and certified'}
      heroImage="https://images.unsplash.com/photo-1587616211892-f743fcca64f9?w=800"
      heroGradient={{ from: 'from-pink-500/20', via: 'via-rose-500/20', to: 'to-primary/20' }}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск няни...' : 'Search babysitters...'}
      categories={experienceFilters}
      selectedCategory={selectedAgeGroup}
      onCategoryChange={setSelectedAgeGroup}
      filterConfig={babysitterFilterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      filterActiveCount={activeFilterCount}
      isEmpty={filteredBabysitters.length === 0}
      emptyIcon={Baby}
      emptyText={language === 'ru' ? 'Няни не найдены' : 'No babysitters found'}
      quickActions={
        <Button 
          className="w-full h-14 text-base gap-2"
          onClick={() => navigate('/babysitter/book')}
        >
          <Calendar className="w-5 h-5" />
          {language === 'ru' ? 'Найти няню на сегодня' : 'Find a babysitter today'}
        </Button>
      }
    >
      <div className="space-y-4">
        {filteredBabysitters.map((bs) => (
          <ItemCard
            key={bs.id}
            image={bs.image}
            title={language === 'ru' ? bs.nameRu : bs.nameEn}
            subtitle={language === 'ru' ? bs.descRu : bs.descEn}
            rating={bs.rating}
            reviewCount={bs.reviewCount}
            price={bs.pricePerHour}
            priceUnit={`/${language === 'ru' ? 'час' : 'hr'}`}
            currency="฿"
            isVerified={bs.isVerified}
            badge={bs.isFeatured 
              ? { text: language === 'ru' ? 'Топ' : 'Top', className: 'bg-amber-500 text-white' }
              : !bs.available
                ? { text: language === 'ru' ? 'Занята' : 'Busy', className: 'bg-muted text-muted-foreground' }
                : undefined
            }
            tags={(language === 'ru' ? bs.certificationsRu : bs.certifications).slice(0, 2)}
            onClick={() => navigate(`/babysitter/${bs.id}`)}
          />
        ))}
      </div>
    </MiniAppLayout>
  );
}