import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, MapPin, Clock, Phone, Globe, 
  Share2, CheckCircle, Calendar, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { FavoriteButton } from '@/components/uno/FavoriteButton';
import { useViewHistory } from '@/hooks/useViewHistory';

const clinicData = {
  id: 'clinic-1',
  name: 'Bangkok Hospital Phuket',
  nameRu: 'Бангкок Госпиталь Пхукет',
  type: 'hospital',
  images: [
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800',
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800',
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800',
  ],
  rating: 4.9,
  reviewCount: 892,
  location: 'Phuket Town',
  locationRu: 'Пхукет Таун',
  address: '2/1 Hongyok Utis Road, Phuket 83000',
  phone: '+66 76 254 425',
  website: 'phukethospital.com',
  descriptionEn: 'Bangkok Hospital Phuket is the largest private hospital in southern Thailand, offering world-class medical services with state-of-the-art technology and internationally trained physicians.',
  descriptionRu: 'Бангкок Госпиталь Пхукет - крупнейшая частная больница на юге Таиланда, предлагающая медицинские услуги мирового класса с современными технологиями и врачами с международной подготовкой.',
  isVerified: true,
  hours: '24/7',
  languages: ['EN', 'TH', 'RU', 'CN', 'DE', 'FR'],
  departments: [
    { nameEn: 'Emergency', nameRu: 'Экстренная помощь', available: true },
    { nameEn: 'General Practice', nameRu: 'Терапия', available: true },
    { nameEn: 'Dental', nameRu: 'Стоматология', available: true },
    { nameEn: 'Cardiology', nameRu: 'Кардиология', available: true },
    { nameEn: 'Orthopedics', nameRu: 'Ортопедия', available: true },
    { nameEn: 'Ophthalmology', nameRu: 'Офтальмология', available: true },
  ],
  doctors: [
    { 
      name: 'Dr. Somchai Prasert', 
      specialty: 'Cardiologist', 
      specialtyRu: 'Кардиолог',
      experience: '20 years',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200',
      available: true,
      price: 2500,
    },
    { 
      name: 'Dr. Sarah Johnson', 
      specialty: 'General Practice', 
      specialtyRu: 'Терапевт',
      experience: '15 years',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200',
      available: true,
      price: 1500,
    },
    { 
      name: 'Dr. Wei Chen', 
      specialty: 'Orthopedic', 
      specialtyRu: 'Ортопед',
      experience: '18 years',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200',
      available: false,
      price: 2000,
    },
  ],
  services: [
    { nameEn: 'Health Checkup', nameRu: 'Медосмотр', price: 5000 },
    { nameEn: 'Blood Test', nameRu: 'Анализ крови', price: 800 },
    { nameEn: 'X-Ray', nameRu: 'Рентген', price: 1500 },
    { nameEn: 'MRI Scan', nameRu: 'МРТ', price: 15000 },
    { nameEn: 'Dental Cleaning', nameRu: 'Чистка зубов', price: 1200 },
    { nameEn: 'Eye Exam', nameRu: 'Проверка зрения', price: 1000 },
  ],
};

const ClinicDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { trackView } = useViewHistory();
  const [selectedImage, setSelectedImage] = useState(0);

  // Track view when page loads
  useEffect(() => {
    if (id) {
      trackView(id, 'clinic', {
        name: clinicData.name,
        name_en: clinicData.name,
        name_ru: clinicData.nameRu,
        image: clinicData.images[0],
        rating: clinicData.rating,
        location: clinicData.location,
      });
    }
  }, [id]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header Image */}
      <div className="relative h-64">
        <img
          src={clinicData.images[selectedImage]}
          alt={clinicData.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Top Actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Button variant="secondary" size="icon" onClick={() => navigate('/medical')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            <FavoriteButton
              itemType="clinic"
              itemId={id || 'clinic-1'}
              itemData={{
                title_en: clinicData.name,
                title_ru: clinicData.nameRu,
                image: clinicData.images[0],
                location: clinicData.location,
                rating: clinicData.rating,
              }}
              variant="secondary"
            />
            <Button variant="secondary" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Image Thumbnails */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center">
          {clinicData.images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 ${
                selectedImage === idx ? 'border-primary' : 'border-white/50'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 -mt-6 bg-background rounded-t-3xl relative z-10">
        {/* Title Section */}
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold">
                {language === 'ru' ? clinicData.nameRu : clinicData.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {clinicData.isVerified && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {language === 'ru' ? 'Аккредитован' : 'Accredited'}
                  </Badge>
                )}
                <Badge className="bg-green-500 text-xs">24/7</Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold">{clinicData.rating}</span>
              </div>
              <p className="text-sm text-muted-foreground">{clinicData.reviewCount} reviews</p>
            </div>
          </div>
        </div>

        {/* Languages */}
        <div className="flex gap-1 mb-4">
          {clinicData.languages.map(lang => (
            <Badge key={lang} variant="outline" className="text-xs">
              {lang}
            </Badge>
          ))}
        </div>

        {/* Info Row */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{language === 'ru' ? clinicData.locationRu : clinicData.location}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span>{clinicData.phone}</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="about" className="mb-24">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="about">
              {language === 'ru' ? 'О клинике' : 'About'}
            </TabsTrigger>
            <TabsTrigger value="doctors">
              {language === 'ru' ? 'Врачи' : 'Doctors'}
            </TabsTrigger>
            <TabsTrigger value="services">
              {language === 'ru' ? 'Услуги' : 'Services'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-4 space-y-4">
            <p className="text-muted-foreground">
              {language === 'ru' ? clinicData.descriptionRu : clinicData.descriptionEn}
            </p>
            <div>
              <h4 className="font-semibold mb-2">
                {language === 'ru' ? 'Отделения' : 'Departments'}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {clinicData.departments.map(dept => (
                  <div key={dept.nameEn} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>{language === 'ru' ? dept.nameRu : dept.nameEn}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="doctors" className="mt-4 space-y-3">
            {clinicData.doctors.map((doctor, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-4 p-3 bg-card rounded-xl border border-border"
                onClick={() => navigate(`/medical/appointment/${id}?doctor=${idx}`)}
              >
                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold">{doctor.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ru' ? doctor.specialtyRu : doctor.specialty}
                  </p>
                  <p className="text-xs text-primary">{doctor.experience}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">฿{doctor.price}</p>
                  <Badge 
                    variant={doctor.available ? 'default' : 'secondary'}
                    className={`text-xs ${doctor.available ? 'bg-green-500' : ''}`}
                  >
                    {doctor.available 
                      ? (language === 'ru' ? 'Доступен' : 'Available')
                      : (language === 'ru' ? 'Занят' : 'Busy')
                    }
                  </Badge>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="services" className="mt-4 space-y-2">
            {clinicData.services.map((service, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                <span>{language === 'ru' ? service.nameRu : service.nameEn}</span>
                <span className="font-semibold text-primary">฿{service.price.toLocaleString()}</span>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex gap-3">
          <Button variant="outline" size="lg" className="flex-1">
            <Phone className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Позвонить' : 'Call'}
          </Button>
          <Button 
            size="lg" 
            className="flex-1"
            onClick={() => navigate(`/medical/appointment/${id}`)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Записаться' : 'Book'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClinicDetail;