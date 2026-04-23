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
    image: PLACEHOLDER_IMAGES.babysitter,
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
    descEn: 'Professional nanny with early childhood education degree. I have been working with children for over 5 years and love creating educational and fun activities. I am patient, caring, and dedicated to providing attentive care for your little ones.',
    descRu: 'Профессиональная няня с педагогическим образованием. Я работаю с детьми более 5 лет и люблю создавать образовательные и весёлые занятия. Я терпеливая, заботливая и преданная своему делу.',
  },
  {
    id: 'bs-2',
    nameEn: 'Maria Ivanova',
    nameRu: 'Мария Иванова',
    image: PLACEHOLDER_IMAGES.babysitter,
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
    image: PLACEHOLDER_IMAGES.babysitter,
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
    image: PLACEHOLDER_IMAGES.babysitter,
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

const BabysitterDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const babysitter = React.useMemo(() => {
    return babysitters.find((bs) => bs.id === id);
  }, [id]);

  if (!babysitter) {
    return <div>Babysitter not found</div>;
  }

  const name = language === 'en' ? babysitter.nameEn : babysitter.nameRu;
  const experience = language === 'en' ? babysitter.experience : babysitter.experienceRu;
  const languages = language === 'en' ? babysitter.languages : babysitter.languagesRu;
  const ageGroups = language === 'en' ? babysitter.ageGroupsEn : babysitter.ageGroupsRu;
  const certifications = language === 'en' ? babysitter.certifications : babysitter.certificationsRu;
  const description = language === 'en' ? babysitter.descEn : babysitter.descRu;

  return (
    <AppLayout>
      <PageContainer>
        <DetailPageHeader fallbackPath="/babysitters" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">{language === 'en' ? 'About Me' : 'Обо мне'}</h2>
              <p className="text-gray-700">{description}</p>

              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-3">{language === 'en' ? 'Details' : 'Подробности'}</h3>
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="text-yellow-500" size={16} />
                  <span>{babysitter.rating} ({babysitter.reviewCount} {language === 'en' ? 'reviews' : 'отзывов'})</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <Baby className="text-gray-500" size={16} />
                  <span>{experience}</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <Languages className="text-gray-500" size={16} />
                  <span>{languages.join(', ')}</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <GraduationCap className="text-gray-500" size={16} />
                  <span>{language === 'en' ? 'Age Groups' : 'Возрастные группы'}: {ageGroups.join(', ')}</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle2 className="text-gray-500" size={16} />
                  <span>{language === 'en' ? 'Certifications' : 'Сертификаты'}: {certifications.join(', ')}</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="text-gray-500" size={16} />
                  <span>{babysitter.isVerified ? (language === 'en' ? 'Verified Babysitter' : 'Проверенная няня') : (language === 'en' ? 'Not Verified' : 'Не проверено')}</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="text-gray-500" size={16} />
                  <span>{babysitter.available ? (language === 'en' ? 'Available' : 'Доступна') : (language === 'en' ? 'Not Available' : 'Не доступна')}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">{language === 'en' ? 'Book Now' : 'Заказать'}</h2>
              <div className="mb-4">
                <span className="text-gray-700">{language === 'en' ? 'Price per hour' : 'Цена за час'}:</span>
                <span className="ml-2 font-semibold">{babysitter.pricePerHour} RUB</span>
              </div>
              <Button>{language === 'en' ? 'Contact Babysitter' : 'Связаться с няней'}</Button>
            </div>
          </div>
        </div>

        <RelatedServicesSection currentVertical="babysitter" />
      </PageContainer>
    </AppLayout>
  );
};

export default BabysitterDetail;
