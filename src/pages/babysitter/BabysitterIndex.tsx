import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Baby, Heart, Clock, Star, MapPin, Shield, 
  Languages, GraduationCap, CheckCircle2, Calendar
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { FilterChip } from '@/components/uno/FilterChip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const experienceFilters = [
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
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');

  const filteredBabysitters = babysitters.filter(bs => 
    selectedAgeGroup === 'all' || bs.ageGroups.includes(selectedAgeGroup)
  );

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title={language === 'ru' ? 'Няни' : 'Babysitters'}
          showBack
          fallbackPath="/"
          subtitle={language === 'ru' ? `${filteredBabysitters.length} нянь` : `${filteredBabysitters.length} babysitters`}
        />

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500/20 via-rose-500/20 to-primary/20 p-6 mt-4 mb-6">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Baby className="w-6 h-6 text-pink-500" />
              <span className="text-sm font-medium text-pink-600">
                {language === 'ru' ? 'Проверенные няни' : 'Trusted Babysitters'}
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              {language === 'ru'
                ? 'Все няни прошли проверку и имеют сертификаты'
                : 'All babysitters are verified and certified'}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">
                {language === 'ru' ? 'Проверка документов' : 'Background checked'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Book */}
        <Button 
          className="w-full h-14 text-base gap-2"
          onClick={() => navigate('/babysitter/book')}
        >
          <Calendar className="w-5 h-5" />
          {language === 'ru' ? 'Найти няню на сегодня' : 'Find a babysitter today'}
        </Button>

        {/* Age Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {experienceFilters.map((filter) => (
            <FilterChip
              key={filter.id}
              label={language === 'ru' ? filter.labelRu : filter.labelEn}
              isActive={selectedAgeGroup === filter.id}
              onToggle={() => setSelectedAgeGroup(filter.id)}
            />
          ))}
        </div>

        {/* Babysitters List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {language === 'ru' ? 'Доступные няни' : 'Available Babysitters'}
            </h2>
            <span className="text-sm text-muted-foreground">
              {filteredBabysitters.length} {language === 'ru' ? 'найдено' : 'found'}
            </span>
          </div>

          {filteredBabysitters.map((bs) => (
            <div
              key={bs.id}
              onClick={() => navigate(`/babysitter/${bs.id}`)}
              className={cn(
                "bg-card rounded-2xl border border-border/50 p-4 cursor-pointer transition-all",
                bs.available ? "hover:border-primary/30" : "opacity-60"
              )}
            >
              <div className="flex gap-4">
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={bs.image}
                    alt={language === 'ru' ? bs.nameRu : bs.nameEn}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  {bs.isVerified && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">
                        {language === 'ru' ? bs.nameRu : bs.nameEn}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ru' ? bs.experienceRu : bs.experience}
                      </p>
                    </div>
                    {bs.isFeatured && (
                      <Badge className="bg-amber-500 text-white flex-shrink-0">
                        <Star className="w-3 h-3 mr-1" />
                        {language === 'ru' ? 'Топ' : 'Top'}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {language === 'ru' ? bs.descRu : bs.descEn}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{bs.rating}</span>
                      <span className="text-muted-foreground">({bs.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Languages className="w-4 h-4" />
                      <span>{(language === 'ru' ? bs.languagesRu : bs.languages).join(', ')}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {(language === 'ru' ? bs.certificationsRu : bs.certifications).map((cert, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                <Badge variant={bs.available ? "default" : "secondary"}>
                  {bs.available 
                    ? (language === 'ru' ? 'Доступна' : 'Available')
                    : (language === 'ru' ? 'Занята' : 'Busy')
                  }
                </Badge>
                <span className="text-lg font-bold text-primary">
                  ฿{bs.pricePerHour}/{language === 'ru' ? 'час' : 'hr'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </AppLayout>
  );
}
