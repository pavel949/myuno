import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Star, Clock, Stethoscope, 
  Heart, Pill, Baby, Bone, Eye, ArrowLeft
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { triggerRipple } from '@/hooks/useRipple';

const specialties = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: Stethoscope },
  { id: 'general', labelEn: 'General', labelRu: 'Терапевт', icon: Stethoscope },
  { id: 'dental', labelEn: 'Dental', labelRu: 'Стоматолог', icon: Pill },
  { id: 'cardio', labelEn: 'Cardio', labelRu: 'Кардиолог', icon: Heart },
  { id: 'pediatric', labelEn: 'Pediatric', labelRu: 'Педиатр', icon: Baby },
  { id: 'ortho', labelEn: 'Orthopedic', labelRu: 'Ортопед', icon: Bone },
  { id: 'eye', labelEn: 'Eye', labelRu: 'Офтальмолог', icon: Eye },
];

const clinics = [
  {
    id: 'clinic-1',
    name: 'Bangkok Hospital Phuket',
    nameRu: 'Бангкок Госпиталь Пхукет',
    type: 'hospital',
    specialty: 'general',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600',
    rating: 4.9,
    reviewCount: 892,
    location: 'Phuket Town',
    locationRu: 'Пхукет Таун',
    price: 1500,
    isVerified: true,
    isFeatured: true,
    isOpen: true,
    languages: ['EN', 'TH', 'RU', 'CN'],
  },
  {
    id: 'clinic-2',
    name: 'Phuket Dental Signature',
    nameRu: 'Пхукет Дентал Сигнатюр',
    type: 'clinic',
    specialty: 'dental',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600',
    rating: 4.8,
    reviewCount: 234,
    location: 'Patong',
    locationRu: 'Патонг',
    price: 800,
    isVerified: true,
    isOpen: true,
    languages: ['EN', 'TH', 'RU'],
  },
  {
    id: 'clinic-3',
    name: 'Heart Center Phuket',
    nameRu: 'Кардиоцентр Пхукет',
    type: 'clinic',
    specialty: 'cardio',
    image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=600',
    rating: 4.9,
    reviewCount: 156,
    location: 'Kata',
    locationRu: 'Ката',
    price: 2500,
    isVerified: true,
    isNew: true,
    isOpen: true,
    languages: ['EN', 'TH'],
  },
  {
    id: 'clinic-4',
    name: 'Kids Health Clinic',
    nameRu: 'Детская Клиника',
    type: 'clinic',
    specialty: 'pediatric',
    image: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=600',
    rating: 4.7,
    reviewCount: 189,
    location: 'Rawai',
    locationRu: 'Равай',
    price: 1200,
    isVerified: true,
    isOpen: false,
    languages: ['EN', 'TH', 'RU'],
  },
  {
    id: 'clinic-5',
    name: 'Phuket Eye Center',
    nameRu: 'Глазной Центр Пхукет',
    type: 'clinic',
    specialty: 'eye',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600',
    rating: 4.8,
    reviewCount: 145,
    location: 'Phuket Town',
    locationRu: 'Пхукет Таун',
    price: 1000,
    isVerified: true,
    isOpen: true,
    languages: ['EN', 'TH'],
  },
];

const MedicalIndex = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  const filteredClinics = clinics.filter(clinic => {
    const matchesSearch = clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         clinic.nameRu.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'all' || clinic.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3 mb-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-display font-bold">
                  {language === 'ru' ? 'Медицина' : 'Medical'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Клиники, врачи, запись' : 'Clinics, doctors, appointments'}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={language === 'ru' ? 'Поиск клиник...' : 'Search clinics...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Specialty Filters */}
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
            {specialties.map(spec => {
              const Icon = spec.icon;
              return (
                <Button
                  key={spec.id}
                  variant={selectedSpecialty === spec.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSpecialty(spec.id)}
                  className="shrink-0 gap-1"
                >
                  <Icon className="w-3 h-3" />
                  {language === 'ru' ? spec.labelRu : spec.labelEn}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Emergency Banner */}
        <div className="mx-4 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-red-500">
                {language === 'ru' ? 'Экстренная помощь' : 'Emergency'}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Звоните 1669' : 'Call 1669'}
              </p>
            </div>
            <Button variant="destructive" size="sm">
              {language === 'ru' ? 'Позвонить' : 'Call Now'}
            </Button>
          </div>
        </div>

        {/* Clinics List */}
        <div className="flex-1 px-4 py-4 pb-24 space-y-4">
          {filteredClinics.map(clinic => (
            <div
              key={clinic.id}
              onClick={(e) => {
                triggerRipple(e);
                navigate(`/medical/clinic/${clinic.id}`);
              }}
              className="relative overflow-hidden bg-card rounded-xl border border-border cursor-pointer hover:border-primary/30 transition-all active:scale-[0.98]"
            >
              <div className="flex">
                <div className="w-28 h-28 shrink-0">
                  <img
                    src={clinic.image}
                    alt={clinic.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-3">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-sm line-clamp-1">
                      {language === 'ru' ? clinic.nameRu : clinic.name}
                    </h3>
                    <Badge 
                      variant={clinic.isOpen ? 'default' : 'secondary'}
                      className={`text-xs shrink-0 ${clinic.isOpen ? 'bg-green-500' : ''}`}
                    >
                      {clinic.isOpen 
                        ? (language === 'ru' ? 'Открыто' : 'Open')
                        : (language === 'ru' ? 'Закрыто' : 'Closed')
                      }
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>{language === 'ru' ? clinic.locationRu : clinic.location}</span>
                    <span className="mx-1">•</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{clinic.rating}</span>
                  </div>

                  <div className="flex gap-1 mb-2">
                    {clinic.languages.map(lang => (
                      <Badge key={lang} variant="outline" className="text-xs px-1.5">
                        {lang}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    {clinic.isVerified && (
                      <Badge variant="secondary" className="text-xs">
                        ✓ {language === 'ru' ? 'Проверен' : 'Verified'}
                      </Badge>
                    )}
                    <p className="font-semibold text-primary text-sm">
                      {language === 'ru' ? 'от' : 'from'} ฿{clinic.price}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default MedicalIndex;