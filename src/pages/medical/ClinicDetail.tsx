import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, MapPin, Clock, Phone, Globe, 
  Share2, CheckCircle, Calendar, User, Loader2, Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { FavoriteButton } from '@/components/uno/FavoriteButton';
import { useViewHistory } from '@/hooks/useViewHistory';
import { useClinic, useDoctors, useMedicalServices } from '@/hooks/useClinics';

const ClinicDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { trackView } = useViewHistory();
  const [selectedImage, setSelectedImage] = useState(0);

  const { clinic, isLoading } = useClinic(id);
  const { doctors } = useDoctors(id);
  const { services } = useMedicalServices(id);

  useEffect(() => {
    if (clinic && id) {
      trackView(id, 'clinic', {
        name: clinic.name_en,
        name_en: clinic.name_en,
        name_ru: clinic.name_ru,
        image: clinic.cover_image || clinic.images?.[0],
        rating: clinic.rating,
        location: clinic.district,
      });
    }
  }, [clinic?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <Stethoscope className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">{language === 'ru' ? 'Клиника не найдена' : 'Clinic not found'}</h2>
        <Button onClick={() => navigate('/medical')}>
          {language === 'ru' ? 'К списку клиник' : 'Back to clinics'}
        </Button>
      </div>
    );
  }

  const images = clinic.images?.length ? clinic.images : [clinic.cover_image || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800'];
  const name = language === 'ru' ? clinic.name_ru : clinic.name_en;
  const description = language === 'ru' ? clinic.description_ru : clinic.description_en;
  const clinicLanguages = clinic.languages || [];
  const specialties = clinic.specialty || [];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="relative h-64">
        <img src={images[selectedImage]} alt={name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Button variant="secondary" size="icon" onClick={() => navigate('/medical')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            <FavoriteButton
              itemType="clinic"
              itemId={id || ''}
              itemData={{ title_en: clinic.name_en, title_ru: clinic.name_ru, image: images[0], location: clinic.district, rating: clinic.rating }}
              variant="secondary"
            />
            <Button variant="secondary" size="icon"><Share2 className="w-5 h-5" /></Button>
          </div>
        </div>

        {images.length > 1 && (
          <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center">
            {images.map((img, idx) => (
              <button key={idx} onClick={() => setSelectedImage(idx)}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 ${selectedImage === idx ? 'border-primary' : 'border-white/50'}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 px-4 py-6 -mt-6 bg-background rounded-t-3xl relative z-10">
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold">{name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {clinic.is_verified && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {language === 'ru' ? 'Аккредитован' : 'Accredited'}
                  </Badge>
                )}
                {clinic.is_24h && <Badge className="bg-green-500 text-xs">24/7</Badge>}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold">{clinic.rating}</span>
              </div>
              <p className="text-sm text-muted-foreground">{clinic.review_count} reviews</p>
            </div>
          </div>
        </div>

        {clinicLanguages.length > 0 && (
          <div className="flex gap-1 mb-4">
            {clinicLanguages.map(lang => (
              <Badge key={lang} variant="outline" className="text-xs">{lang}</Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          {clinic.district && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-4 h-4" /><span>{clinic.district}</span>
            </div>
          )}
          {clinic.phone && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Phone className="w-4 h-4" /><span>{clinic.phone}</span>
            </div>
          )}
        </div>

        <Tabs defaultValue="about" className="mb-24">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="about">{language === 'ru' ? 'О клинике' : 'About'}</TabsTrigger>
            <TabsTrigger value="doctors">{language === 'ru' ? 'Врачи' : 'Doctors'}</TabsTrigger>
            <TabsTrigger value="services">{language === 'ru' ? 'Услуги' : 'Services'}</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-4 space-y-4">
            {description && <p className="text-muted-foreground">{description}</p>}
            {specialties.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">{language === 'ru' ? 'Специализации' : 'Specialties'}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {specialties.map((spec, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary" /><span>{spec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="doctors" className="mt-4 space-y-3">
            {doctors.length > 0 ? doctors.map((doctor) => (
              <div key={doctor.id} className="flex items-center gap-4 p-3 bg-card rounded-xl border border-border"
                onClick={() => navigate(`/medical/appointment/${id}?doctor=${doctor.id}`)}>
                {doctor.photo && (
                  <img src={doctor.photo} alt={doctor.name_en} className="w-14 h-14 rounded-full object-cover" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{language === 'ru' ? doctor.name_ru : doctor.name_en}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ru' ? (doctor.specialty_ru || doctor.specialty) : doctor.specialty}
                  </p>
                </div>
                {doctor.consultation_price && (
                  <p className="font-semibold text-primary">฿{doctor.consultation_price}</p>
                )}
              </div>
            )) : (
              <p className="text-muted-foreground text-center py-4">{language === 'ru' ? 'Информация скоро появится' : 'Coming soon'}</p>
            )}
          </TabsContent>

          <TabsContent value="services" className="mt-4 space-y-2">
            {services.length > 0 ? services.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                <span>{language === 'ru' ? service.name_ru : service.name_en}</span>
                {service.price && <span className="font-semibold text-primary">฿{service.price.toLocaleString()}</span>}
              </div>
            )) : (
              <p className="text-muted-foreground text-center py-4">{language === 'ru' ? 'Информация скоро появится' : 'Coming soon'}</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex gap-3">
          {clinic.phone && (
            <Button variant="outline" size="lg" className="flex-1" asChild>
              <a href={`tel:${clinic.phone}`}>
                <Phone className="w-4 h-4 mr-2" />
                {language === 'ru' ? 'Позвонить' : 'Call'}
              </a>
            </Button>
          )}
          <Button size="lg" className="flex-1" onClick={() => navigate(`/medical/appointment/${id}`)}>
            <Calendar className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Записаться' : 'Book'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClinicDetail;
