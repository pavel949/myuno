import { useState, useEffect, useRef, type FormEvent, type ReactNode } from 'react';
import { ArrowDown, Bell, LockKeyhole, Palette, Save, Shield, User, type LucideIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/page/PageHeader';
import { SectionHeader } from '@/components/ds/SectionHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useProfileDetails, type UpdateProfileDetailsData } from '@/hooks/useProfileDetails';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { ThemeSwitcher } from '@/components/uno/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { CurrencySwitcher } from '@/components/uno/CurrencySwitcher';
import { LocationSwitcher } from '@/components/uno/LocationSwitcher';
import { AppLayout } from '@/components/layout/AppLayout';
import { SecuritySettingsSection } from '@/components/profile/SecuritySettingsSection';
import { ConnectedAccountsSection } from '@/components/profile/ConnectedAccountsSection';
import { ProfileCountrySelect } from '@/components/profile/ProfileCountrySelect';
import { redirectToAuth } from '@/lib/auth/redirectToAuth';
import { pickLang } from '@/lib/i18n/pickLang';
import { PUBLIC_CONTENT_ANCHOR } from '@/design-system/ecosystemLayout';
import { FLOATING_OFFSET } from '@/lib/nav/floatingStack';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';
import '@/styles/premium-account.css';

const GENDERS = [
  { value: 'male', labelEn: 'Male', labelRu: 'Мужской', labelTh: 'ชาย' },
  { value: 'female', labelEn: 'Female', labelRu: 'Женский', labelTh: 'หญิง' },
  { value: 'other', labelEn: 'Prefer not to say', labelRu: 'Не указывать', labelTh: 'ไม่ระบุ' },
];

const RELATIONS = [
  { value: 'spouse', labelEn: 'Spouse', labelRu: 'Супруг(а)', labelTh: 'คู่สมรส' },
  { value: 'parent', labelEn: 'Parent', labelRu: 'Родитель', labelTh: 'บิดาหรือมารดา' },
  { value: 'child', labelEn: 'Child', labelRu: 'Ребёнок', labelTh: 'บุตร' },
  { value: 'sibling', labelEn: 'Sibling', labelRu: 'Брат/Сестра', labelTh: 'พี่น้อง' },
  { value: 'friend', labelEn: 'Friend', labelRu: 'Друг', labelTh: 'เพื่อน' },
  { value: 'other', labelEn: 'Other', labelRu: 'Другое', labelTh: 'อื่น ๆ' },
];

type EditableField = 'date_of_birth' | 'gender' | 'nationality' | 'address_line1' | 'city' | 'country'
  | 'emergency_contact_name' | 'emergency_contact_phone' | 'emergency_contact_relationship' | 'medical_conditions';
type DetailsDraft = Pick<UpdateProfileDetailsData, EditableField>;

function SettingsSection({ id, title, subtitle, icon, children }: {
  id: string; title: string; subtitle?: string; icon: LucideIcon; children: ReactNode;
}) {
  return <section id={id} aria-labelledby={`${id}-title`} className={cn(PUBLIC_CONTENT_ANCHOR, 'min-w-0 space-y-3')} tabIndex={-1}>
    <SectionHeader headingId={`${id}-title`} title={title} subtitle={subtitle} icon={icon} density="workspace" size="lg" />
    {children}
  </section>;
}

export default function ProfileSettings() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoading && !user) redirectToAuth(navigate);
  }, [user, isLoading, navigate]);

  if (isLoading) return <AppLayout><div className="flex justify-center py-12"><LoadingSpinner /></div></AppLayout>;
  if (!user) return null;
  // A different signed-in actor must never inherit the previous editor's draft.
  return <SettingsForUser key={user.id} actorId={user.id} email={user.email} />;
}

function SettingsForUser({ actorId, email }: { actorId: string; email?: string }) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const { profile, isLoading: profileLoading } = useProfile();
  const { details, dataUpdatedAt, error, isLoading, isUpdating, updateDetailsAsync } = useProfileDetails();
  const ownedDetails = details?.id === actorId ? details : null;
  const ownedProfile = profile?.id === actorId ? profile : null;
  const [draft, setDraft] = useState<DetailsDraft>({});
  const [recentSave, setRecentSave] = useState<{ sourceUpdatedAt: number; values: DetailsDraft }>();
  const [status, setStatus] = useState<'saved' | 'error'>();
  const saving = useRef(false);
  // Bridge the invalidation gap only. Any later successful query result is
  // authoritative, even when the server legitimately returns a former value.
  const submitted = recentSave?.sourceUpdatedAt === dataUpdatedAt ? recentSave?.values : undefined;
  const baseline = { ...ownedDetails, ...submitted };
  const value = (key: EditableField) => String((Object.prototype.hasOwnProperty.call(draft, key) ? draft[key] : baseline[key]) ?? '');
  const dirty = Object.keys(draft).length > 0;
  const handleChange = (key: EditableField, input: string) => {
    const parsed = input || null;
    setStatus(undefined);
    setDraft(previous => {
      const next = { ...previous };
      if (parsed === (baseline[key] ?? null)) delete next[key];
      else next[key] = parsed;
      return next;
    });
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving.current || !dirty || !ownedDetails || error) return;
    saving.current = true;
    try {
      await updateDetailsAsync(draft);
      setRecentSave({ sourceUpdatedAt: dataUpdatedAt, values: { ...submitted, ...draft } });
      setDraft({});
      setStatus('saved');
    } catch {
      setStatus('error');
    } finally {
      saving.current = false;
    }
  };

  const title = t('Настройки профиля', 'Profile settings', 'การตั้งค่าโปรไฟล์');
  const sections = [
    { id: 'preferences', title: t('Предпочтения', 'Preferences', 'ค่ากำหนด'), icon: Palette },
    { id: 'personal-details', title: t('Личные данные', 'Personal details', 'ข้อมูลส่วนตัว'), icon: User },
    { id: 'sign-in-security', title: t('Вход и безопасность', 'Sign-in and security', 'การเข้าสู่ระบบและความปลอดภัย'), icon: Shield },
    { id: 'account-actions', title: t('Действия с аккаунтом', 'Account actions', 'การจัดการบัญชี'), icon: LockKeyhole },
  ] as const;
  const switcher = 'min-h-11 min-w-11 px-3 whitespace-nowrap';
  const preferences = [
    { label: t('Тема', 'Theme', 'ธีม'), control: <ThemeSwitcher variant="dropdown" className={switcher} /> },
    { label: t('Язык', 'Language', 'ภาษา'), control: <LanguageSwitcher className={switcher} /> },
    { label: t('Валюта', 'Currency', 'สกุลเงิน'), control: <CurrencySwitcher className={switcher} /> },
    { label: t('Регион', 'Region', 'ภูมิภาค'), control: <LocationSwitcher /> },
  ];
  const identity = [
    { label: t('Полное имя', 'Full name', 'ชื่อ-นามสกุล'), value: ownedProfile?.full_name },
    { label: t('Электронная почта', 'Email', 'อีเมล'), value: ownedProfile?.email || email },
    { label: t('Телефон', 'Phone', 'โทรศัพท์'), value: ownedProfile?.phone },
  ];

  return <AppLayout usePageContainer={false}><PageContainer width="default" className={cn("profile-settings", FLOATING_OFFSET.contentClearance)}>
    <PageHeader title={title} showBack fallbackPath={APP_ROUTES.PROFILE} className="profile-settings-header" />
    <div className="profile-settings-layout">
      <nav aria-label={t('Разделы настроек', 'Settings sections', 'หมวดการตั้งค่า')} className="profile-settings-navigation">
        {sections.map(({ id, title, icon: Icon }) => <a key={id} href={`#${id}`} className="profile-settings-jump">
          <Icon aria-hidden className="size-4 shrink-0 text-primary" /><span>{title}</span><ArrowDown aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
        </a>)}
      </nav>
      <div className="min-w-0 space-y-8">
        <SettingsSection {...sections[0]} subtitle={t('Эти настройки применяются сразу.', 'These settings apply immediately.', 'การตั้งค่าเหล่านี้มีผลทันที')}>
          <SectionCard noPadding className="divide-y divide-border">
            {preferences.map(({ label, control }) => <div key={label} className="profile-settings-row"><span className="min-w-0 font-medium">{label}</span>{control}</div>)}
            <Link to={APP_ROUTES.NOTIFICATION_SETTINGS} className="profile-settings-row hover:bg-muted/50">
              <span className="flex min-w-0 items-center gap-2"><Bell aria-hidden className="size-4 shrink-0 text-primary" />{t('Уведомления', 'Notifications', 'การแจ้งเตือน')}</span>
              <span className="text-primary">{t('Настроить', 'Manage', 'ตั้งค่า')}</span>
            </Link>
          </SectionCard>
        </SettingsSection>

        <SettingsSection {...sections[1]}>
          <SectionCard className="space-y-3">
            <h3 className="text-base font-semibold">{t('Основные сведения', 'Basic information', 'ข้อมูลพื้นฐาน')}</h3>
            {profileLoading ? <LoadingSpinner size="sm" /> : <dl className="profile-settings-identity">
              {identity.map(item => <div key={item.label} className="min-w-0"><dt className="text-sm text-muted-foreground">{item.label}</dt>
                <dd className="break-words text-sm font-medium">{item.value || t('Не указано', 'Not provided', 'ไม่ได้ระบุ')}</dd></div>)}
            </dl>}
            <Button asChild variant="outline" className="min-h-11 max-w-full whitespace-normal">
              <Link to={APP_ROUTES.SUPPORT}>{t('Запросить изменение данных', 'Request a change', 'ขอแก้ไขข้อมูล')}</Link>
            </Button>
          </SectionCard>

          {isLoading ? <SectionCard><LoadingSpinner size="sm" /></SectionCard> : !ownedDetails || error ? (
            <SectionCard><p role="status" className="text-sm">{t('Не удалось загрузить данные для редактирования. Обновите страницу и попробуйте снова.', 'Details could not be loaded for editing. Refresh the page and try again.', 'โหลดข้อมูลเพื่อแก้ไขไม่สำเร็จ โปรดรีเฟรชและลองอีกครั้ง')}</p></SectionCard>
          ) : (
            <form onSubmit={handleSave} aria-label={t('Дополнительные сведения', 'Additional details', 'ข้อมูลเพิ่มเติม')}>
              <fieldset className="min-w-0" disabled={isUpdating}>
                <SectionCard className="space-y-5">
                  <h3 className="text-base font-semibold">{t('Дополнительные сведения', 'Additional details', 'ข้อมูลเพิ่มเติม')}</h3>
                  <div className="profile-settings-fields">
                    <div className="min-w-0 space-y-1.5"><Label htmlFor="settings-date_of_birth">{t('Дата рождения', 'Date of birth', 'วันเกิด')}</Label><Input id="settings-date_of_birth" className="min-w-0" value={value('date_of_birth')} onChange={(e) => handleChange('date_of_birth', e.target.value)} type="date" /></div>
                    <div className="min-w-0 space-y-1.5"><Label htmlFor="settings-gender">{t('Пол', 'Gender', 'เพศ')}</Label><Select value={value('gender')} onValueChange={(v) => handleChange('gender', v)}>
                      <SelectTrigger id="settings-gender" className="min-w-0 w-full"><SelectValue placeholder={t('Выбрать', 'Select', 'เลือก')} /></SelectTrigger>
                      <SelectContent>{GENDERS.map(option => <SelectItem key={option.value} value={option.value}>{t(option.labelRu, option.labelEn, option.labelTh)}</SelectItem>)}</SelectContent>
                    </Select></div>
                    <div className="min-w-0 space-y-1.5"><Label htmlFor="settings-nationality">{t('Гражданство', 'Nationality', 'สัญชาติ')}</Label><ProfileCountrySelect id="settings-nationality" className="min-w-0" value={value('nationality')} onChange={(v) => handleChange('nationality', v)} /></div>
                  </div>
                  <h3 className="border-t border-border pt-4 text-base font-semibold">{t('Адрес проживания', 'Residential address', 'ที่อยู่ปัจจุบัน')}</h3>
                  <div className="min-w-0 space-y-1.5"><Label htmlFor="settings-address_line1">{t('Улица, дом, квартира', 'Street, building, apartment', 'ถนน อาคาร ห้อง')}</Label><Input id="settings-address_line1" className="min-w-0" value={value('address_line1')} onChange={(e) => handleChange('address_line1', e.target.value)} autoComplete="address-line1" /></div>
                  <div className="profile-settings-fields">
                    <div className="min-w-0 space-y-1.5"><Label htmlFor="settings-city">{t('Город', 'City', 'เมือง')}</Label><Input id="settings-city" className="min-w-0" value={value('city')} onChange={(e) => handleChange('city', e.target.value)} autoComplete="address-level2" /></div>
                    <div className="min-w-0 space-y-1.5"><Label htmlFor="settings-country">{t('Страна', 'Country', 'ประเทศ')}</Label><ProfileCountrySelect id="settings-country" className="min-w-0" value={value('country')} onChange={(v) => handleChange('country', v)} /></div>
                  </div>
                  <details className="border-t border-border pt-3">
                    <summary className="min-h-11 cursor-pointer py-2 font-medium">{t('Экстренный контакт и медицинская информация', 'Emergency contact and medical information', 'ผู้ติดต่อฉุกเฉินและข้อมูลสุขภาพ')}</summary>
                    <p className="mb-4 text-sm text-muted-foreground">{t('Эти сведения необязательны. Укажите только то, чем готовы поделиться.', 'These details are optional. Only share what you are comfortable providing.', 'คุณไม่จำเป็นต้องกรอกข้อมูลส่วนนี้ ระบุเฉพาะข้อมูลที่ยินดีเปิดเผย')}</p>
                    <div className="profile-settings-fields">
                      <div className="min-w-0 space-y-1.5"><Label htmlFor="settings-emergency_contact_name">{t('Имя контакта', 'Contact name', 'ชื่อผู้ติดต่อ')}</Label><Input id="settings-emergency_contact_name" className="min-w-0" value={value('emergency_contact_name')} onChange={(e) => handleChange('emergency_contact_name', e.target.value)} autoComplete="off" /></div>
                      <div className="min-w-0 space-y-1.5"><Label htmlFor="settings-emergency_contact_phone">{t('Телефон контакта', 'Contact phone', 'เบอร์โทรผู้ติดต่อ')}</Label><Input id="settings-emergency_contact_phone" className="min-w-0" value={value('emergency_contact_phone')} onChange={(e) => handleChange('emergency_contact_phone', e.target.value)} type="tel" autoComplete="off" /></div>
                      <div className="min-w-0 space-y-1.5"><Label htmlFor="settings-emergency_contact_relationship">{t('Кем приходится', 'Relationship', 'ความสัมพันธ์')}</Label><Select value={value('emergency_contact_relationship')} onValueChange={(v) => handleChange('emergency_contact_relationship', v)}>
                      <SelectTrigger id="settings-emergency_contact_relationship" className="min-w-0 w-full"><SelectValue placeholder={t('Выбрать', 'Select', 'เลือก')} /></SelectTrigger>
                      <SelectContent>{RELATIONS.map(option => <SelectItem key={option.value} value={option.value}>{t(option.labelRu, option.labelEn, option.labelTh)}</SelectItem>)}</SelectContent>
                    </Select></div>
                    </div>
                    <div className="mt-4"><div className="min-w-0 space-y-1.5"><Label htmlFor="settings-medical_conditions">{t('Что важно знать', 'What to know', 'ข้อมูลที่ควรทราบ')}</Label><Textarea id="settings-medical_conditions" className="min-w-0" value={value('medical_conditions')} onChange={(e) => handleChange('medical_conditions', e.target.value)} rows={3} /></div></div>
                  </details>
                  <div className="profile-settings-save">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{t('Кнопка сохраняет только дополнительные сведения, адрес и данные для экстренных случаев.', 'This saves only additional details, address and emergency information.', 'ปุ่มนี้บันทึกเฉพาะข้อมูลเพิ่มเติม ที่อยู่ และข้อมูลฉุกเฉิน')}</p>
                      {status === 'saved' && <p role="status" className="text-sm font-medium text-success">{t('Изменения сохранены', 'Changes saved', 'บันทึกแล้ว')}</p>}
                      {status === 'error' && <p role="alert" className="text-sm font-medium text-destructive">{t('Не удалось сохранить. Попробуйте ещё раз.', 'Could not save. Please try again.', 'บันทึกไม่สำเร็จ โปรดลองอีกครั้ง')}</p>}
                    </div>
                    <Button type="submit" disabled={!dirty || isUpdating} className="min-h-11 gap-2 whitespace-normal">
                      {isUpdating ? <LoadingSpinner size="sm" /> : <Save className="size-4 shrink-0" aria-hidden />}
                      {t('Сохранить изменения', 'Save changes', 'บันทึกการเปลี่ยนแปลง')}
                    </Button>
                  </div>
                </SectionCard>
              </fieldset>
            </form>
          )}
        </SettingsSection>

        <SettingsSection {...sections[2]}>
          <SecuritySettingsSection />
          <ConnectedAccountsSection />
        </SettingsSection>

        <SettingsSection {...sections[3]}>
          <SectionCard className="space-y-4">
            <Button asChild variant="outline" className="min-h-11 whitespace-normal">
              <Link to={APP_ROUTES.PRIVACY}>{t('Политика конфиденциальности', 'Privacy policy', 'นโยบายความเป็นส่วนตัว')}</Link>
            </Button>
            <div className="space-y-2 border-t border-border pt-4">
              <h3 className="text-base font-semibold text-foreground">{t('Удаление аккаунта', 'Account deletion', 'การลบบัญชี')}</h3>
              <p className="text-sm text-muted-foreground">{t('Если вы хотите удалить аккаунт, обратитесь в поддержку myUNO.', 'To delete your account, contact myUNO support.', 'หากต้องการลบบัญชี โปรดติดต่อฝ่ายช่วยเหลือ myUNO')}</p>
              <Button asChild variant="outline" className="min-h-11 whitespace-normal">
                <Link to={APP_ROUTES.SUPPORT}>{t('Обратиться в поддержку', 'Contact support', 'ติดต่อฝ่ายช่วยเหลือ')}</Link>
              </Button>
            </div>
          </SectionCard>
        </SettingsSection>
      </div>
    </div>
  </PageContainer></AppLayout>;
}
