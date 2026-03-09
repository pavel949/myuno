import React from 'react';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Baby, Star, Shield, Languages, GraduationCap, CheckCircle2, Calendar
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { DetailPageHeader } from '@/components/uno/DetailPageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RelatedServicesSection } from '@/components/crosssell';

const babysitters = [
  {
    id: 'bs-1',
    nameEn: 'Anna Petrova',
    nameRu: 'Анна Петрова',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    rating: 4.9,
    reviewCount: 87,
    experience: '5 years',
    experienceRu: '5 лет опыта',
    pricePerHour: 500,
    languages: ['Russian', 'English'],
    languagesRu: ['Русский', 'Английский'],
    ageGroups: ['newborn', 'toddler', 'preschool'],
    ageGroupsEn: ['Newborns (0-1)', 'Toddlers (1-3)', 'Preschool (3-6)'],
    ageGroupsRu: ['Новорожденные (0-1)', 'Малыши (1-3)', 'Дошкольники (3-6)'],
    certifications: ['First Aid', 'CPR'],
    certificationsRu: ['Первая помощь', 'СЛР'],
    available: true,
    isVerified: true,
    descEn: 'Professional nanny with early childhood education degree. I have been working with children for over 5 years and love creating educational and fun activities. I am patient, caring, and dedicated to providing the best care for your little ones.',
    descRu: 'Профессиональная няня с педагогическим образованием. Я работаю с детьми более 5 лет и люблю создавать образовательные и весёлые занятия. Я терпеливая, заботливая и преданная своему делу.',
  },
  {
    id: 'bs-2',
    nameEn: 'Maria Ivanova',
    nameRu: 'Мария Иванова',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    rating: 4.8,
    reviewCount: 65,
    experience: '8 years',
    experienceRu: '8 лет опыта',
    pricePerHour: 600,
    languages: ['Russian', 'English', 'Thai'],
    languagesRu: ['Русский', 'Английский', 'Тайский'],
    ageGroups: ['toddler', 'preschool', 'school'],
    ageGroupsEn: ['Toddlers (1-3)', 'Preschool (3-6)', 'School age (6+)'],
    ageGroupsRu: ['Малыши (1-3)', 'Дошкольники (3-6)', 'Школьники (6+)'],
    certifications: ['First Aid', 'Montessori'],
    certificationsRu: ['Первая помощь', 'Монтессори'],
    available: true,
    isVerified: true,
    descEn: 'Montessori-trained nanny with 8 years of experience. I specialize in creative activities, educational games, and helping children develop their independence and curiosity.',
    descRu: 'Няня с Монтессори-подготовкой и 8-летним опытом. Специализируюсь на творческих занятиях, развивающих играх и помощи детям в развитии самостоятельности и любознательности.',
  },
  {
    id: 'bs-3',
    nameEn: 'Olga Smirnova',
    nameRu: 'Ольга Смирнова',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    rating: 4.7,
    reviewCount: 42,
    experience: '3 years',
    experienceRu: '3 года опыта',
    pricePerHour: 400,
    languages: ['Russian'],
    languagesRu: ['Русский'],
    ageGroups: ['preschool', 'school'],
    ageGroupsEn: ['Preschool (3-6)', 'School age (6+)'],
    ageGroupsRu: ['Дошкольники (3-6)', 'Школьники (6+)'],
    certifications: ['First Aid'],
    certificationsRu: ['Первая помощь'],
    available: true,
    isVerified: true,
    descEn: 'Patient and caring nanny who loves helping children with their homework and school activities. I have 3 years of experience working with preschool and school-age children.',
    descRu: 'Терпеливая и заботливая няня, которая любит помогать детям с домашними заданиями и школьными делами. 3 года опыта работы с дошкольниками и школьниками.',
  },
  {
    id: 'bs-4',
    nameEn: 'Natalia Kozlova',
    nameRu: 'Наталья Козлова',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
    rating: 5.0,
    reviewCount: 28,
    experience: '10 years',
    experienceRu: '10 лет опыта',
    pricePerHour: 800,
    languages: ['Russian', 'English', 'French'],
    languagesRu: ['Русский', 'Английский', 'Французский'],
    ageGroups: ['newborn', 'toddler'],
    ageGroupsEn: ['Newborns (0-1)', 'Toddlers (1-3)'],
    ageGroupsRu: ['Новорожденные (0-1)', 'Малыши (1-3)'],
    certifications: ['First Aid', 'CPR', 'Pediatric Nurse'],
    certificationsRu: ['Первая помощь', 'СЛР', 'Детская медсестра'],
    available: false,
    isVerified: true,
    descEn: 'Former pediatric nurse with 10 years of experience specializing in newborn and infant care. I provide expert care with a focus on health, safety, and developmental milestones.',
    descRu: 'Бывшая детская медсестра с 10-летним опытом, специализирующаяся на уходе за новорожденными и младенцами. Я обеспечиваю профессиональный уход с акцентом на здоровье, безопасность и этапы развития.',
  },
];

export default function BabysitterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const babysitter = babysitters.find(bs => bs.id === id) || babysitters[0];
  const name = language === 'ru' ? babysitter.nameRu : babysitter.nameEn;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: language === 'ru' ? babysitter.descRu : babysitter.descEn,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    }
  };

  return (
    <AppLayout>
      <PageContainer className="pb-28 px-0">
        {/* Hero Image with Overlay Header */}
        <div className="relative h-64 bg-gradient-to-b from-primary/20 to-background">
          <DetailPageHeader fallbackPath="/babysitter" onShare={handleShare} />
          
          {/* Profile Header */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center text-center pb-4">
            <div className="relative mb-3">
              <img 
                src={babysitter.image} 
                alt={name}
                className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg"
              />
              {babysitter.isVerified && (
                <div className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-3 border-background">
                  <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pt-4 text-center">
          <h1 className="text-2xl font-bold">
            {name}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ru' ? babysitter.experienceRu : babysitter.experience}
          </p>
          
          <div className="flex items-center justify-center gap-1 mt-2">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{babysitter.rating}</span>
            <span className="text-muted-foreground">({babysitter.reviewCount} {language === 'ru' ? 'отзывов' : 'reviews'})</span>
          </div>

          <Badge 
            variant={babysitter.available ? "default" : "secondary"} 
            className="mt-3"
          >
            {babysitter.available 
              ? (language === 'ru' ? 'Доступна' : 'Available')
              : (language === 'ru' ? 'Занята' : 'Busy')
            }
          </Badge>
        </div>

        {/* Info Cards */}
        <div className="px-4 space-y-4 mt-6">
          {/* About */}
          <div className="bg-card rounded-xl border p-5">
            <h3 className="font-semibold mb-3">
              {language === 'ru' ? 'Обо мне' : 'About Me'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {language === 'ru' ? babysitter.descRu : babysitter.descEn}
            </p>
          </div>

          {/* Age Groups */}
          <div className="bg-card rounded-xl border p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Baby className="w-5 h-5 text-primary" />
              {language === 'ru' ? 'Возраст детей' : 'Age Groups'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(language === 'ru' ? babysitter.ageGroupsRu : babysitter.ageGroupsEn).map((age, i) => (
                <Badge key={i} variant="outline">{age}</Badge>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="bg-card rounded-xl border p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Languages className="w-5 h-5 text-primary" />
              {language === 'ru' ? 'Языки' : 'Languages'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(language === 'ru' ? babysitter.languagesRu : babysitter.languages).map((lang, i) => (
                <Badge key={i} variant="outline">{lang}</Badge>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-card rounded-xl border p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              {language === 'ru' ? 'Сертификаты' : 'Certifications'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(language === 'ru' ? babysitter.certificationsRu : babysitter.certifications).map((cert, i) => (
                <Badge key={i} variant="secondary">{cert}</Badge>
              ))}
            </div>
          </div>

          {/* Trust */}
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-xl">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm">
              {language === 'ru' 
                ? 'Проверка документов пройдена'
                : 'Background check verified'}
            </span>
          </div>
        </div>

        {/* Cross-sell */}
        <div className="pb-24">
          <RelatedServicesSection currentVertical="babysitter" />
        </div>

        {/* Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4 z-50">
          <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
            <div>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'За час' : 'Per hour'}
              </p>
              <p className="text-2xl font-bold text-primary">
                ฿{babysitter.pricePerHour}
              </p>
            </div>
            <Button 
              size="lg" 
              className="flex-1 gap-2"
              onClick={() => navigate(`/babysitter/${babysitter.id}/book`)}
              disabled={!babysitter.available}
            >
              <Calendar className="w-5 h-5" />
              {language === 'ru' ? 'Забронировать' : 'Book Now'}
            </Button>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
