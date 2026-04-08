import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, MapPin, Lock, Heart, AlertTriangle, Save, 
  Palette, ShieldCheck, Shield, MessageCircle
} from 'lucide-react';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard, SectionTitle } from '@/components/uno/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useProfileDetails, UpdateProfileDetailsData } from '@/hooks/useProfileDetails';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { ThemeSwitcher } from '@/components/uno/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { CurrencySwitcher } from '@/components/uno/CurrencySwitcher';
import { LocationSwitcher } from '@/components/uno/LocationSwitcher';
import { AppLayout } from '@/components/layout/AppLayout';
import { useNavigate } from 'react-router-dom';
import { SecuritySettingsSection } from '@/components/profile/SecuritySettingsSection';
import { ConnectedAccountsSection } from '@/components/profile/ConnectedAccountsSection';
import { ProfileCompletionCard } from '@/components/profile/ProfileCompletionCard';

const COUNTRIES = [
  { code: 'RU', nameEn: 'Russia', nameRu: 'Россия' },
  { code: 'TH', nameEn: 'Thailand', nameRu: 'Таиланд' },
  { code: 'US', nameEn: 'USA', nameRu: 'США' },
  { code: 'DE', nameEn: 'Germany', nameRu: 'Германия' },
  { code: 'UA', nameEn: 'Ukraine', nameRu: 'Украина' },
  { code: 'KZ', nameEn: 'Kazakhstan', nameRu: 'Казахстан' },
  { code: 'BY', nameEn: 'Belarus', nameRu: 'Беларусь' },
  { code: 'GB', nameEn: 'United Kingdom', nameRu: 'Великобритания' },
];

const GENDERS = [
  { value: 'male', labelEn: 'Male', labelRu: 'Мужской' },
  { value: 'female', labelEn: 'Female', labelRu: 'Женский' },
  { value: 'other', labelEn: 'Prefer not to say', labelRu: 'Не указывать' },
];

const RELATIONS = [
  { value: 'spouse', labelEn: 'Spouse', labelRu: 'Супруг(а)' },
  { value: 'parent', labelEn: 'Parent', labelRu: 'Родитель' },
  { value: 'child', labelEn: 'Child', labelRu: 'Ребёнок' },
  { value: 'sibling', labelEn: 'Sibling', labelRu: 'Брат/Сестра' },
  { value: 'friend', labelEn: 'Friend', labelRu: 'Друг' },
  { value: 'other', labelEn: 'Other', labelRu: 'Другое' },
];

export default function ProfileSettings() {
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { details, isLoading: detailsLoading, updateDetails, isUpdating } = useProfileDetails();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const [formData, setFormData] = useState<UpdateProfileDetailsData>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (details) {
      setFormData({
        date_of_birth: details.date_of_birth,
        gender: details.gender,
        nationality: details.nationality,
        address_line1: details.address_line1,
        address_line2: details.address_line2,
        city: details.city,
        state_province: details.state_province,
        postal_code: details.postal_code,
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

  const isLoading = authLoading || profileLoading || detailsLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <PageHeader title={isRu ? 'Настройки профиля' : 'Profile Settings'} showBack />
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (!user) return null;

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader title={isRu ? 'Настройки профиля' : 'Profile Settings'} showBack fallbackPath="/profile" />

        <div className="space-y-6 pb-24 [&_label]:text-foreground/80 [&_input]:text-foreground [&_input]:bg-secondary/50 [&_input:disabled]:bg-muted/80 [&_input:disabled]:text-foreground/60 [&_input:disabled]:opacity-100 [&_textarea]:text-foreground [&_textarea]:bg-secondary/50 [&_.text-sm]:text-foreground/90">
          {/* Profile Completion Progress */}
          <ProfileCompletionCard />

          {/* Trust Ecosystem Banner */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <SectionCard className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">
                    {isRu ? 'Экосистема доверия myUNO' : 'myUNO Trust Ecosystem'}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isRu 
                      ? 'Заполнение профиля помогает нам обеспечить вашу безопасность и предложить персонализированный сервис. Ваши данные защищены и используются только для верификации и улучшения качества услуг.'
                      : 'Completing your profile helps us ensure your safety and provide personalized service. Your data is protected and used only for verification and service quality improvement.'}
                  </p>
                </div>
              </div>
            </SectionCard>
          </motion.div>

          {/* Interface Settings */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground/70">
              <Palette className="w-4 h-4" />
              {isRu ? 'Настройки интерфейса' : 'Interface Settings'}
            </div>
            <SectionCard>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/80">{isRu ? 'Тема' : 'Theme'}</span>
                  <ThemeSwitcher variant="cards" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/80">{isRu ? 'Язык' : 'Language'}</span>
                  <LanguageSwitcher variant="toggle" size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/80">{isRu ? 'Валюта' : 'Currency'}</span>
                  <CurrencySwitcher size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/80">{isRu ? 'Город' : 'Location'}</span>
                  <LocationSwitcher />
                </div>
              </div>
            </SectionCard>
          </motion.div>

          {/* Personal Information */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground/70">
              <User className="w-4 h-4" />
              {isRu ? 'Личные данные' : 'Personal Information'}
            </div>
            <SectionCard className="space-y-4">
              <p className="text-xs text-muted-foreground -mt-2 mb-2">
                {isRu 
                  ? 'Эти данные используются для персонализации сервиса и верификации вашей личности при бронировании премиальных услуг.'
                  : 'This information is used to personalize services and verify your identity when booking premium services.'}
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">{isRu ? 'Дата рождения' : 'Date of Birth'}</Label>
                  <Input 
                    type="date" 
                    value={formData.date_of_birth || ''} 
                    onChange={(e) => handleChange('date_of_birth', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">{isRu ? 'Пол' : 'Gender'}</Label>
                  <Select value={formData.gender || ''} onValueChange={(v) => handleChange('gender', v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={isRu ? 'Выбрать' : 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map(g => (
                        <SelectItem key={g.value} value={g.value}>
                          {isRu ? g.labelRu : g.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">{isRu ? 'Гражданство' : 'Nationality'}</Label>
                <Select value={formData.nationality || ''} onValueChange={(v) => handleChange('nationality', v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={isRu ? 'Выбрать страну' : 'Select country'} />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {isRu ? c.nameRu : c.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </SectionCard>
          </motion.div>

          {/* Verified Identity Data */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground/70">
              <Shield className="w-4 h-4" />
              {isRu ? 'Верифицированные данные' : 'Verified Identity'}
            </div>
            <SectionCard className="space-y-4 border-primary/20">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 -mt-2 mb-2">
                <Lock className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRu 
                    ? 'Эти данные являются частью вашей верифицированной личности и защищены от изменений. Для обновления обратитесь в службу поддержки.'
                    : 'This data is part of your verified identity and protected from changes. Contact support to update.'}
                </p>
              </div>
              
              <div>
                <Label className="text-xs flex items-center gap-1">
                  {isRu ? 'Полное имя' : 'Full Name'}
                  <ShieldCheck className="w-3 h-3 text-primary" />
                </Label>
                <Input 
                  value={profile?.full_name || ''} 
                  disabled 
                  className="mt-1 bg-muted"
                />
              </div>

              <div>
                <Label className="text-xs flex items-center gap-1">
                  Email
                  <ShieldCheck className="w-3 h-3 text-primary" />
                </Label>
                <Input 
                  value={profile?.email || user?.email || ''} 
                  disabled 
                  className="mt-1 bg-muted"
                />
              </div>

              <div>
                <Label className="text-xs flex items-center gap-1">
                  {isRu ? 'Телефон' : 'Phone'}
                  <ShieldCheck className="w-3 h-3 text-primary" />
                </Label>
                <Input 
                  value={profile?.phone || (isRu ? 'Не указан' : 'Not provided')} 
                  disabled 
                  className="mt-1 bg-muted"
                />
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => navigate('/support')}
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                {isRu ? 'Запросить изменение данных' : 'Request Data Change'}
              </Button>
            </SectionCard>
          </motion.div>

          {/* Address */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground/70">
              <MapPin className="w-4 h-4" />
              {isRu ? 'Адрес проживания' : 'Residential Address'}
            </div>
            <SectionCard className="space-y-4">
              <p className="text-xs text-muted-foreground -mt-2 mb-2">
                {isRu 
                  ? 'Адрес может потребоваться для доставки документов или трансферов.'
                  : 'Address may be required for document delivery or transfers.'}
              </p>
              
              <div>
                <Label className="text-xs">{isRu ? 'Адрес' : 'Address'}</Label>
                <Input 
                  value={formData.address_line1 || ''} 
                  onChange={(e) => handleChange('address_line1', e.target.value)}
                  placeholder={isRu ? 'Улица, дом, квартира' : 'Street, building, apt'}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">{isRu ? 'Город' : 'City'}</Label>
                  <Input 
                    value={formData.city || ''} 
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">{isRu ? 'Страна' : 'Country'}</Label>
                  <Select value={formData.country || ''} onValueChange={(v) => handleChange('country', v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={isRu ? 'Выбрать' : 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {isRu ? c.nameRu : c.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SectionCard>
          </motion.div>

          {/* Emergency Contact */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-warning">
              <AlertTriangle className="w-4 h-4" />
              {isRu ? 'Экстренный контакт' : 'Emergency Contact'}
            </div>
            <SectionCard className="space-y-4 border-warning/20">
              <p className="text-xs text-muted-foreground -mt-2 mb-2">
                {isRu 
                  ? 'Этот контакт будет использован в экстренных ситуациях во время вашего путешествия.'
                  : 'This contact will be used in emergency situations during your trip.'}
              </p>
              
              <div>
                <Label className="text-xs">{isRu ? 'Имя контакта' : 'Contact Name'}</Label>
                <Input 
                  value={formData.emergency_contact_name || ''} 
                  onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                  placeholder={isRu ? 'Иван Иванов' : 'John Doe'}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">{isRu ? 'Телефон' : 'Phone'}</Label>
                  <Input 
                    type="tel"
                    value={formData.emergency_contact_phone || ''} 
                    onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                    placeholder="+7 999 123-45-67"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">{isRu ? 'Кем приходится' : 'Relationship'}</Label>
                  <Select value={formData.emergency_contact_relation || ''} onValueChange={(v) => handleChange('emergency_contact_relation', v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={isRu ? 'Выбрать' : 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONS.map(r => (
                        <SelectItem key={r.value} value={r.value}>
                          {isRu ? r.labelRu : r.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SectionCard>
          </motion.div>

          {/* Medical Info */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-destructive">
              <Heart className="w-4 h-4" />
              {isRu ? 'Медицинская информация' : 'Medical Information'}
            </div>
            <SectionCard className="border-destructive/20">
              <p className="text-xs text-muted-foreground mb-3">
                {isRu 
                  ? 'Эта информация строго конфиденциальна и будет использована только в экстренных медицинских ситуациях.'
                  : 'This information is strictly confidential and will only be used in medical emergencies.'}
              </p>
              <Textarea 
                value={formData.medical_conditions || ''} 
                onChange={(e) => handleChange('medical_conditions', e.target.value)}
                placeholder={isRu ? 'Аллергии, хронические заболевания, принимаемые лекарства...' : 'Allergies, chronic conditions, medications...'}
                rows={3}
              />
            </SectionCard>
          </motion.div>

          {/* Data Protection Notice */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <SectionCard className="bg-muted/50">
              <div className="flex items-start gap-3">
                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isRu 
                      ? 'Все данные хранятся в зашифрованном виде и соответствуют требованиям GDPR и PDPA. Мы никогда не передаём ваши персональные данные третьим лицам без вашего согласия.'
                      : 'All data is stored encrypted and complies with GDPR and PDPA requirements. We never share your personal data with third parties without your consent.'}
                  </p>
                </div>
              </div>
            </SectionCard>
          </motion.div>

          {/* Security Settings */}
          <SecuritySettingsSection />

          {/* Connected Accounts */}
          <ConnectedAccountsSection />

          {/* Save Button */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Button 
              className="w-full gap-2" 
              size="lg" 
              onClick={handleSave} 
              disabled={isUpdating}
            >
              {isUpdating ? <LoadingSpinner size="sm" /> : <Save className="w-5 h-5" />}
              {isRu ? 'Сохранить изменения' : 'Save Changes'}
            </Button>
          </motion.div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
