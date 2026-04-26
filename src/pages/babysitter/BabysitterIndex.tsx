/**
 * BabysitterIndex — Airbnb-style babysitter catalog
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Baby, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { CatalogCard } from '@/components/miniapp/CatalogCard';
import { EmptyState } from '@/components/uno/EmptyState';
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
    image: PLACEHOLDER_IMAGES.avatar,
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
  const navigate = useNavigate();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const isRu = language === 'ru';

  const filteredBabysitters = useMemo(() => {
    if (selectedAgeGroup === 'all') return babysitters;
    return babysitters.filter(bs => bs.ageGroups.includes(selectedAgeGroup));
  }, [selectedAgeGroup]);

  return (
    <MiniAppLayout
      title={isRu ? 'Няни' : 'Babysitters'}
      subtitle={`${filteredBabysitters.length} ${isRu ? 'нянь' : 'babysitters'}`}
      fallbackPath="/discover"
      categories={AGE_GROUPS}
      selectedCategory={selectedAgeGroup}
      onCategoryChange={setSelectedAgeGroup}
      showHero={false}
      showSearch={false}
      showFilter={false}
      seoTitle={isRu ? 'Няни на Пхукете | myUNO' : 'Babysitters in Phuket | myUNO'}
      seoDescription={
        isRu
          ? 'Проверенные русскоязычные няни на Пхукете: первая помощь, сертификации, почасовая оплата.'
          : 'Verified English/Russian-speaking babysitters in Phuket: first-aid certified, hourly rates.'
      }
      crossSellVertical="babysitter"
    >
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
            const badges = [];
            if (bs.isFeatured) {
              badges.push({
                text: isRu ? 'Топ' : 'Top',
                className: 'bg-primary text-primary-foreground',
              });
            }
            return (
              <CatalogCard
                key={bs.id}
                image={bs.image}
                title={name}
                subtitle={desc}
                aspectRatio="3:4"
                onClick={() => navigate(`/babysitter/${bs.id}`)}
                rating={bs.rating > 0 ? bs.rating : undefined}
                reviewCount={bs.reviewCount}
                badges={badges}
                statusBadge={
                  !bs.available
                    ? { text: isRu ? 'Занята' : 'Busy', className: 'bg-muted text-muted-foreground' }
                    : undefined
                }
                meta={[{ icon: Shield, label: isRu ? bs.experienceRu : bs.experienceEn }]}
                price={bs.pricePerHour}
                priceSuffix={`/${isRu ? 'час' : 'hr'}`}
              />
            );
          })}
        </div>
      )}
    </MiniAppLayout>
  );
}
