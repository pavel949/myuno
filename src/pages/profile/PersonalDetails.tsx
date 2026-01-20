import { useState, useEffect } from 'react';
import { User, MapPin, AlertTriangle, Heart, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfileDetails, UpdateProfileDetailsData } from '@/hooks/useProfileDetails';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';

const COUNTRIES = [
  { code: 'RU', nameEn: 'Russia', nameRu: 'Россия' },
  { code: 'TH', nameEn: 'Thailand', nameRu: 'Таиланд' },
  { code: 'US', nameEn: 'USA', nameRu: 'США' },
  { code: 'DE', nameEn: 'Germany', nameRu: 'Германия' },
  { code: 'UA', nameEn: 'Ukraine', nameRu: 'Украина' },
];

const RELATIONS = [
  { value: 'spouse', labelEn: 'Spouse', labelRu: 'Супруг(а)' },
  { value: 'parent', labelEn: 'Parent', labelRu: 'Родитель' },
  { value: 'friend', labelEn: 'Friend', labelRu: 'Друг' },
  { value: 'other', labelEn: 'Other', labelRu: 'Другое' },
];

export default function PersonalDetails() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { details, isLoading, updateDetails, isUpdating } = useProfileDetails();

  const [formData, setFormData] = useState<UpdateProfileDetailsData>({});

  useEffect(() => {
    if (details) {
      setFormData({
        date_of_birth: details.date_of_birth,
        gender: details.gender,
        nationality: details.nationality,
        address_line1: details.address_line1,
        city: details.city,
        country: details.country,
        emergency_contact_name: details.emergency_contact_name,
        emergency_contact_phone: details.emergency_contact_phone,
        emergency_contact_relation: details.emergency_contact_relation,
        medical_conditions: details.medical_conditions,
      });
    }
  }, [details]);

  const handleChange = (field: keyof UpdateProfileDetailsData, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value || null }));
  };

  const handleSave = () => updateDetails(formData);

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title={isRu ? 'Личные данные' : 'Personal Details'} showBack />
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title={isRu ? 'Личные данные' : 'Personal Details'} showBack />

      <div className="space-y-6">
        {/* Personal Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
            <User className="w-4 h-4" />
            {isRu ? 'Основная информация' : 'Basic Information'}
          </div>
          <SectionCard className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRu ? 'Дата рождения' : 'Date of Birth'}</Label>
                <Input type="date" value={formData.date_of_birth || ''} onChange={(e) => handleChange('date_of_birth', e.target.value)} />
              </div>
              <div>
                <Label>{isRu ? 'Пол' : 'Gender'}</Label>
                <Select value={formData.gender || ''} onValueChange={(v) => handleChange('gender', v)}>
                  <SelectTrigger><SelectValue placeholder={isRu ? 'Выбрать' : 'Select'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{isRu ? 'Мужской' : 'Male'}</SelectItem>
                    <SelectItem value="female">{isRu ? 'Женский' : 'Female'}</SelectItem>
                    <SelectItem value="other">{isRu ? 'Другой' : 'Other'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{isRu ? 'Гражданство' : 'Nationality'}</Label>
              <Select value={formData.nationality || ''} onValueChange={(v) => handleChange('nationality', v)}>
                <SelectTrigger><SelectValue placeholder={isRu ? 'Выбрать' : 'Select'} /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{isRu ? c.nameRu : c.nameEn}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </SectionCard>
        </motion.div>

        {/* Address */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {isRu ? 'Адрес' : 'Address'}
          </div>
          <SectionCard className="space-y-4">
            <div>
              <Label>{isRu ? 'Адрес' : 'Address'}</Label>
              <Input value={formData.address_line1 || ''} onChange={(e) => handleChange('address_line1', e.target.value)} placeholder={isRu ? 'Улица, дом' : 'Street, building'} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRu ? 'Город' : 'City'}</Label>
                <Input value={formData.city || ''} onChange={(e) => handleChange('city', e.target.value)} />
              </div>
              <div>
                <Label>{isRu ? 'Страна' : 'Country'}</Label>
                <Select value={formData.country || ''} onValueChange={(v) => handleChange('country', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{isRu ? c.nameRu : c.nameEn}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SectionCard>
        </motion.div>

        {/* Emergency Contact */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-amber-600">
            <AlertTriangle className="w-4 h-4" />
            {isRu ? 'Экстренный контакт' : 'Emergency Contact'}
          </div>
          <SectionCard className="space-y-4">
            <div>
              <Label>{isRu ? 'Имя контакта' : 'Contact Name'}</Label>
              <Input value={formData.emergency_contact_name || ''} onChange={(e) => handleChange('emergency_contact_name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRu ? 'Телефон' : 'Phone'}</Label>
                <Input type="tel" value={formData.emergency_contact_phone || ''} onChange={(e) => handleChange('emergency_contact_phone', e.target.value)} />
              </div>
              <div>
                <Label>{isRu ? 'Кем приходится' : 'Relation'}</Label>
                <Select value={formData.emergency_contact_relation || ''} onValueChange={(v) => handleChange('emergency_contact_relation', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RELATIONS.map(r => <SelectItem key={r.value} value={r.value}>{isRu ? r.labelRu : r.labelEn}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SectionCard>
        </motion.div>

        {/* Medical */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-red-500">
            <Heart className="w-4 h-4" />
            {isRu ? 'Медицинская информация' : 'Medical Info'}
          </div>
          <SectionCard>
            <Textarea value={formData.medical_conditions || ''} onChange={(e) => handleChange('medical_conditions', e.target.value)} placeholder={isRu ? 'Аллергии, заболевания...' : 'Allergies, conditions...'} rows={3} />
          </SectionCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Button className="w-full gap-2" size="lg" onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? <LoadingSpinner size="sm" /> : <Save className="w-5 h-5" />}
            {isRu ? 'Сохранить' : 'Save'}
          </Button>
        </motion.div>
      </div>
    </PageContainer>
  );
}
