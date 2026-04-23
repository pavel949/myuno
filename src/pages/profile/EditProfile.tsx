import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard, SectionTitle } from '@/components/uno/SectionCard';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

const texts = {
  ru: {
    pageTitle: 'Редактировать профиль',
    personalData: 'Личные данные',
    fullName: 'Полное имя',
    fullNamePlaceholder: 'Введите ваше имя',
    phone: 'Телефон',
    emailNote: 'Email нельзя изменить',
    interfaceLanguage: 'Язык интерфейса',
    emergencyContact: 'Экстренный контакт',
    emergencyNote: 'Этот контакт будет использован в случае чрезвычайной ситуации',
    contactName: 'Имя контакта',
    contactNamePlaceholder: 'Иван Иванов',
    relationship: 'Кем приходится',
    selectPlaceholder: 'Выберите',
    spouse: 'Супруг(а)',
    parent: 'Родитель',
    child: 'Ребёнок',
    sibling: 'Брат/Сестра',
    friend: 'Друг',
    colleague: 'Коллега',
    other: 'Другое',
    saving: 'Сохранение...',
    saveChanges: 'Сохранить изменения',
    validation: {
      nameRequired: 'Введите имя',
      nameTooLong: 'Слишком длинное имя',
    },
  },
  en: {
    pageTitle: 'Edit Profile',
    personalData: 'Personal Data',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter your name',
    phone: 'Phone',
    emailNote: 'Email cannot be changed',
    interfaceLanguage: 'Interface Language',
    emergencyContact: 'Emergency Contact',
    emergencyNote: 'This contact will be used in case of emergency',
    contactName: 'Contact Name',
    contactNamePlaceholder: 'John Doe',
    relationship: 'Relationship',
    selectPlaceholder: 'Select',
    spouse: 'Spouse',
    parent: 'Parent',
    child: 'Child',
    sibling: 'Sibling',
    friend: 'Friend',
    colleague: 'Colleague',
    other: 'Other',
    saving: 'Saving...',
    saveChanges: 'Save Changes',
    validation: {
      nameRequired: 'Name is required',
      nameTooLong: 'Name is too long',
    },
  },
};

const getSchema = (t: typeof texts.en) => z.object({
  full_name: z.string().min(1, t.validation.nameRequired).max(100, t.validation.nameTooLong),
  phone: z.string().optional(),
  avatar_url: z.string().nullable().optional(),
  preferred_language: z.enum(['ru', 'en', 'th']),
  emergency_contact_name: z.string().max(100).optional(),
  emergency_contact_phone: z.string().max(20).optional(),
  emergency_contact_relationship: z.string().optional(),
});

type ProfileFormData = z.infer<ReturnType<typeof getSchema>>;

const languages = [
  { code: 'ru', flag: '🇷🇺', name: 'Русский' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'th', flag: '🇹🇭', name: 'ไทย' },
] as const;

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading, updateProfileAsync, isUpdating } = useProfile();
  const { language } = useLanguage();
  
  const t = texts[language === 'th' ? 'en' : language] || texts.en;
  const profileSchema = getSchema(t);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      avatar_url: null,
      preferred_language: language,
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relationship: '',
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Populate form with profile data
  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url,
        preferred_language: (profile.preferred_language as 'ru' | 'en' | 'th') || language,
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
        emergency_contact_relationship: profile.emergency_contact_relationship || '',
      });
    }
  }, [profile, form, language]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfileAsync({
        full_name: data.full_name || null,
        phone: data.phone || null,
        avatar_url: data.avatar_url,
        preferred_language: data.preferred_language,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        emergency_contact_relationship: data.emergency_contact_relationship || null,
      });
      navigate('/profile');
    } catch (error) {
      // Error handled in hook
    }
  };

  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return null;
  }

  const watchedName = form.watch('full_name');
  const watchedAvatar = form.watch('avatar_url');

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title={t.pageTitle}
          showBack
          fallbackPath="/profile"
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-24">
            {/* Avatar Section */}
            <SectionCard>
              <FormField
                control={form.control}
                name="avatar_url"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center">
                    <FormControl>
                      <AvatarUpload
                        value={field.value ?? null}
                        onChange={field.onChange}
                        name={watchedName}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SectionCard>

            {/* Personal Info Section */}
            <SectionCard>
              <SectionTitle>{t.personalData}</SectionTitle>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.fullName}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t.fullNamePlaceholder}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.phone}</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+7 (999) 123-45-67"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label className="text-sm font-medium mb-3 block">Email</Label>
                  <Input
                    value={profile?.email || user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.emailNote}
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Language Section */}
            <SectionCard>
              <SectionTitle>{t.interfaceLanguage}</SectionTitle>
              <FormField
                control={form.control}
                name="preferred_language"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex gap-2">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => field.onChange(lang.code)}
                            className={cn(
                              'flex-1 py-3 px-4 rounded-none border-2 transition-all',
                              'flex flex-col items-center gap-1',
                              field.value === lang.code
                                ? 'border-primary bg-primary/10'
                                : 'border-border bg-background hover:border-muted-foreground/50'
                            )}
                          >
                            <span className="text-2xl">{lang.flag}</span>
                            <span className="text-sm font-medium">{lang.name}</span>
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SectionCard>

            {/* Emergency Contact Section */}
            <SectionCard>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-accent" />
                <SectionTitle className="mb-0">{t.emergencyContact}</SectionTitle>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{t.emergencyNote}</p>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="emergency_contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.contactName}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.contactNamePlaceholder} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergency_contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.phone}</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+7 (999) 123-45-67" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergency_contact_relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.relationship}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.selectPlaceholder} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="spouse">{t.spouse}</SelectItem>
                          <SelectItem value="parent">{t.parent}</SelectItem>
                          <SelectItem value="child">{t.child}</SelectItem>
                          <SelectItem value="sibling">{t.sibling}</SelectItem>
                          <SelectItem value="friend">{t.friend}</SelectItem>
                          <SelectItem value="colleague">{t.colleague}</SelectItem>
                          <SelectItem value="other">{t.other}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SectionCard>

            {/* Submit Button */}
            <div className="fixed bottom-[var(--bottom-nav-h)] left-0 right-0 p-4 bg-background/95 border-t">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isUpdating || !form.formState.isDirty}
              >
                {isUpdating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {t.saving}
                  </>
                ) : (
                  t.saveChanges
                )}
              </Button>
            </div>
          </form>
        </Form>
      </PageContainer>
    </AppLayout>
  );
}
