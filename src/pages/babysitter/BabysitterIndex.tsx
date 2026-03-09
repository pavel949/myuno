/**
 * BabysitterIndex — Airbnb-style babysitter catalog
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Baby, Star, Shield, Languages } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { CatalogHeader } from '@/components/shared/CatalogHeader';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

const AGE_GROUPS = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'newborn', labelEn: 'Newborn', labelRu: '0-1 год' },
  { id: 'toddler', labelEn: 'Toddler', labelRu: '1-3 года' },
  { id: 'preschool', labelEn: 'Preschool', labelRu: '3-6 лет' },
  { id: 'school', labelEn: 'School age', labelRu: 'Школьники' },
];

const babysitters = [
  {
    id: 'bs-1',
    nameEn: 'Anna Petrova',
    nameRu: 'Анна Петрова',
    image: PLACEHOLDER_IMAGES.avatar,
    rating: 4.9,
    reviewCount: 87,
    experienceEn: '5 years',
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
    image: PLACEHOLDER_IMAGES.avatar,
    rating: 4.8,
    reviewCount: 65,
    experienceEn: '8 years',
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
    image: PLACEHOLDER_IMAGES.avatar,
    rating: 4.7,
    reviewCount: 42,
    experienceEn: '3 years',
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
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
    rating: 5.0,
    reviewCount: 28,
    experienceEn: '10 years',
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
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const isRu = language === 'ru';

  const filteredBabysitters = useMemo(() => {
    if (selectedAgeGroup === 'all') return babysitters;
    return babysitters.filter(bs => bs.ageGroups.includes(selectedAgeGroup));
  }, [selectedAgeGroup]);

  return (
    <AppLayout showHeader={false} showBottomNav>
      <CatalogHeader
        title={isRu ? 'Няни' : 'Babysitters'}
        subtitle={`${filteredBabysitters.length} ${isRu ? 'нянь' : 'babysitters'}`}
        fallbackPath="/discover"
        categories={AGE_GROUPS.map(c => ({ id: c.id, label: isRu ? c.labelRu : c.labelEn }))}
        selectedCategory={selectedAgeGroup}
        onCategoryChange={setSelectedAgeGroup}
      />

      {/* Content */}
      <div className="max-w-[1536px] mx-auto px-4 py-4 pb-24">
        {filteredBabysitters.length === 0 ? (
          <EmptyState
            icon={Baby}
            title={isRu ? 'Няни не найдены' : 'No babysitters found'}
            description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBabysitters.map(bs => {
              const name = isRu ? bs.nameRu : bs.nameEn;
              const desc = isRu ? bs.descRu : bs.descEn;
              return (
                <div
                  key={bs.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/babysitter/${bs.id}`)}
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2">
                    <OptimizedImage
                      src={bs.image}
                      alt={name}
                      width={400}
                      height={533}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                      quality={80}
                    />
                    {bs.isFeatured && (
                      <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">
                        {isRu ? 'Топ' : 'Top'}
                      </Badge>
                    )}
                    {!bs.available && (
                      <Badge className="absolute top-2 right-2 bg-muted text-muted-foreground text-[10px]">
                        {isRu ? 'Занята' : 'Busy'}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-semibold text-sm truncate">{name}</h3>
                      {bs.rating > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-medium shrink-0">
                          <Star className="w-3 h-3 fill-foreground" />
                          {bs.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{desc}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Shield className="w-3 h-3 shrink-0" />
                      {isRu ? bs.experienceRu : bs.experienceEn}
                    </p>
                    <p className="text-sm font-semibold">
                      {formatPrice(bs.pricePerHour)}/{isRu ? 'час' : 'hr'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
