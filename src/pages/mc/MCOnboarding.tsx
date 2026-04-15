import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingLayout, type OnboardingStep } from '@/components/layout/OnboardingLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Upload, Users, Rocket, Plus, X, ArrowRight, Check } from 'lucide-react';

const mcOnboardingSteps: OnboardingStep[] = [
  { id: 'company', labelEn: 'Company Info', labelRu: 'О компании' },
  { id: 'logo', labelEn: 'Branding', labelRu: 'Брендирование' },
  { id: 'team', labelEn: 'Team', labelRu: 'Команда' },
  { id: 'complete', labelEn: 'Get Started', labelRu: 'Начать работу' },
];

interface CompanyForm {
  name_en: string;
  name_ru: string;
  email: string;
  phone: string;
  address: string;
  description_en: string;
  description_ru: string;
}

interface TeamInvite {
  email: string;
  full_name: string;
  role: string;
  sent?: boolean;
}

const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

const MCOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { setActiveCompanyId } = useActiveCompany();
  const queryClient = useQueryClient();
  const isRu = language === 'ru';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Step 1: Company form
  const [form, setForm] = useState<CompanyForm>({
    name_en: '', name_ru: '', email: '', phone: '', address: '', description_en: '', description_ru: '',
  });

  // Step 2: Logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Step 3: Team invites
  const [invites, setInvites] = useState<TeamInvite[]>([{ email: '', full_name: '', role: 'manager' }]);

  const updateField = (field: keyof CompanyForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Step 1: Register company
  const handleRegister = useCallback(async () => {
    const nameEn = form.name_en.trim();
    const nameRu = form.name_ru.trim();
    if (!nameEn || !nameRu) {
      toast.error(isRu ? 'Заполните названия компании' : 'Fill in company names');
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error(isRu ? 'Некорректный email' : 'Invalid email address');
      return;
    }
    if (form.phone.trim() && !/^\+?[\d\s-()]{7,20}$/.test(form.phone.trim())) {
      toast.error(isRu ? 'Некорректный телефон' : 'Invalid phone number');
      return;
    }
    setLoading(true);
    try {
      // Generate slug with uniqueness suffix
      let slug = slugify(nameEn);
      const { data: existing } = await supabase
        .from('management_companies')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (existing) {
        slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
      }

      const { data, error } = await supabase.functions.invoke('register-mc', {
        body: {
          name_en: nameEn,
          name_ru: nameRu,
          slug,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          description_en: form.description_en.trim() || undefined,
          description_ru: form.description_ru.trim() || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCompanyId(data.company_id);
      await queryClient.invalidateQueries({ queryKey: ['user-companies'] });
      await queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      await queryClient.invalidateQueries({ queryKey: ['user-context'] });
      setActiveCompanyId(data.company_id);
      toast.success(isRu ? 'Компания создана!' : 'Company created!');
      setStep(2);
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : '') || (isRu ? 'Ошибка при создании' : 'Failed to create company'));
    } finally {
      setLoading(false);
    }
  }, [form, isRu, queryClient, setActiveCompanyId]);

  // Step 2: Upload logo
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleLogoUpload = useCallback(async () => {
    if (!logoFile || !companyId) { setStep(3); return; }
    setLoading(true);
    try {
      const ext = logoFile.name.split('.').pop();
      const path = `mc-logos/${companyId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(path, logoFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('company-assets').getPublicUrl(path);

      const { error: updateError } = await supabase
        .from('management_companies')
        .update({ logo: urlData.publicUrl })
        .eq('id', companyId);
      if (updateError) throw updateError;

      toast.success(isRu ? 'Логотип загружен' : 'Logo uploaded');
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : '') || 'Upload failed');
    } finally {
      setLoading(false);
      setStep(3);
    }
  }, [logoFile, companyId, isRu]);

  // Step 3: Invite team
  const addInvite = () => {
    if (invites.length >= 3) return;
    setInvites(prev => [...prev, { email: '', full_name: '', role: 'manager' }]);
  };

  const removeInvite = (index: number) => {
    setInvites(prev => prev.filter((_, i) => i !== index));
  };

  const updateInvite = (index: number, field: 'email' | 'role' | 'full_name', value: string) => {
    setInvites(prev => prev.map((inv, i) => i === index ? { ...inv, [field]: value } : inv));
  };

  const handleInviteTeam = useCallback(async () => {
    const validInvites = invites.filter(i => i.email.trim() && !i.sent);
    if (validInvites.length === 0) { setStep(4); return; }

    setLoading(true);
    try {
      for (const invite of validInvites) {
        const { data, error } = await supabase.functions.invoke('invite-team-member', {
          body: {
            email: invite.email.trim(),
            full_name: invite.full_name.trim() || invite.email.split('@')[0],
            role: invite.role,
            company_id: companyId,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        invite.sent = true;
      }
      setInvites([...invites]);
      toast.success(isRu ? 'Приглашения отправлены' : 'Invitations sent');
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : '') || 'Failed to send invitations');
    } finally {
      setLoading(false);
      setStep(4);
    }
  }, [invites, companyId, isRu]);

  const handleGoBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <OnboardingLayout
      currentStep={step}
      totalSteps={4}
      steps={mcOnboardingSteps}
      title={isRu ? 'Регистрация УК' : 'Register Company'}
      titleRu="Регистрация УК"
      showBack={step > 1 && step < 4}
      onBack={handleGoBack}
      exitPath="/"
      role="owner"
    >
      <PageContainer className="max-w-lg mx-auto py-6">
        <AnimatePresence mode="wait">
          {/* ── Step 1: Company Info ── */}
          {step === 1 && (
            <motion.div key="step1" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold">{isRu ? 'О компании' : 'Company Details'}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRu ? 'Основная информация об управляющей компании' : 'Basic information about your management company'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="onboard-name-en">{isRu ? 'Название (EN) *' : 'Name (EN) *'}</Label>
                  <Input id="onboard-name-en" value={form.name_en} onChange={e => updateField('name_en', e.target.value)} placeholder="Sunrise Property Management" />
                </div>
                <div>
                  <Label htmlFor="onboard-name-ru">{isRu ? 'Название (RU) *' : 'Name (RU) *'}</Label>
                  <Input id="onboard-name-ru" value={form.name_ru} onChange={e => updateField('name_ru', e.target.value)} placeholder="Санрайз Управление Недвижимостью" />
                </div>
                {form.name_en && (
                  <p className="text-xs text-muted-foreground">
                    Slug: <span className="font-mono">{slugify(form.name_en)}</span>
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="onboard-email">Email</Label>
                    <Input id="onboard-email" type="email" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="info@company.com" />
                  </div>
                  <div>
                    <Label htmlFor="onboard-phone">{isRu ? 'Телефон' : 'Phone'}</Label>
                    <Input id="onboard-phone" value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+66..." />
                  </div>
                </div>
                <div>
                  <Label htmlFor="onboard-address">{isRu ? 'Адрес офиса' : 'Office Address'}</Label>
                  <Input id="onboard-address" value={form.address} onChange={e => updateField('address', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="onboard-description-en">{isRu ? 'Описание (EN)' : 'Description (EN)'}</Label>
                  <Textarea id="onboard-description-en" value={form.description_en} onChange={e => updateField('description_en', e.target.value)} rows={2} />
                </div>
                <div>
                  <Label htmlFor="onboard-description-ru">{isRu ? 'Описание (RU)' : 'Description (RU)'}</Label>
                  <Textarea id="onboard-description-ru" value={form.description_ru} onChange={e => updateField('description_ru', e.target.value)} rows={2} />
                </div>

                <Button className="w-full" size="lg" onClick={handleRegister} disabled={loading || !form.name_en.trim() || !form.name_ru.trim()}>
                  {loading ? (isRu ? 'Создание...' : 'Creating...') : (isRu ? 'Создать компанию' : 'Create Company')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Logo ── */}
          {step === 2 && (
            <motion.div key="step2" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Upload className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold">{isRu ? 'Логотип компании' : 'Company Logo'}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRu ? 'Загрузите логотип для брендирования' : 'Upload your logo for branding'}
                </p>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary/50 transition-colors">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="w-24 h-24 object-contain rounded-lg mb-3" />
                    ) : (
                      <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {logoPreview ? (isRu ? 'Нажмите чтобы заменить' : 'Click to replace') : (isRu ? 'Нажмите для загрузки' : 'Click to upload')}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
                  </label>
                </CardContent>
              </Card>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setStep(3)} disabled={loading}>
                  {isRu ? 'Пропустить' : 'Skip'}
                </Button>
                <Button className="flex-1" onClick={handleLogoUpload} disabled={loading || !logoFile}>
                  {loading ? (isRu ? 'Загрузка...' : 'Uploading...') : (isRu ? 'Загрузить' : 'Upload')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Team ── */}
          {step === 3 && (
            <motion.div key="step3" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold">{isRu ? 'Пригласите команду' : 'Invite Your Team'}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRu ? 'До 3 сотрудников. Можно пропустить.' : 'Up to 3 members. You can skip this.'}
                </p>
              </div>

              <div className="space-y-3">
                {invites.map((inv, i) => (
                  <Card key={i}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={inv.full_name}
                            onChange={e => updateInvite(i, 'full_name', e.target.value)}
                            placeholder={isRu ? 'Имя сотрудника' : 'Employee name'}
                            disabled={inv.sent}
                          />
                          <Input
                            type="email"
                            value={inv.email}
                            onChange={e => updateInvite(i, 'email', e.target.value)}
                            placeholder="email@example.com"
                            disabled={inv.sent}
                          />
                          <Select value={inv.role} onValueChange={v => updateInvite(i, 'role', v)} disabled={inv.sent}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manager">{isRu ? 'Менеджер' : 'Manager'}</SelectItem>
                              <SelectItem value="staff">{isRu ? 'Сотрудник' : 'Staff'}</SelectItem>
                              <SelectItem value="accountant">{isRu ? 'Бухгалтер' : 'Accountant'}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {inv.sent ? (
                          <Check className="h-5 w-5 text-primary mt-2" />
                        ) : invites.length > 1 ? (
                          <Button variant="ghost" size="icon" onClick={() => removeInvite(i)} className="mt-1">
                            <X className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {invites.length < 3 && (
                  <Button variant="outline" size="sm" onClick={addInvite} className="w-full">
                    <Plus className="h-4 w-4 mr-1" />
                    {isRu ? 'Добавить ещё' : 'Add Another'}
                  </Button>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setStep(4)} disabled={loading}>
                  {isRu ? 'Пропустить' : 'Skip'}
                </Button>
                <Button className="flex-1" onClick={handleInviteTeam} disabled={loading}>
                  {loading ? (isRu ? 'Отправка...' : 'Sending...') : (isRu ? 'Пригласить' : 'Invite')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 4: Complete ── */}
          {step === 4 && (
            <motion.div key="step4" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Rocket className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">{isRu ? 'Всё готово!' : 'All Set!'}</h2>
                <p className="text-muted-foreground mt-2">
                  {isRu
                    ? 'Ваша управляющая компания создана. Добавьте первый объект или перейдите в панель управления.'
                    : 'Your management company is created. Add your first property or go to your dashboard.'}
                </p>
              </div>

              <div className="space-y-3">
                <Button className="w-full" size="lg" onClick={() => navigate('/mc/properties/new')}>
                  <Building2 className="mr-2 h-5 w-5" />
                  {isRu ? 'Добавить первый объект' : 'Add First Property'}
                </Button>
                <Button variant="outline" className="w-full" size="lg" onClick={() => navigate('/mc')}>
                  {isRu ? 'Перейти в панель управления' : 'Go to Dashboard'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </PageContainer>
    </OnboardingLayout>
  );
};

export default MCOnboarding;
