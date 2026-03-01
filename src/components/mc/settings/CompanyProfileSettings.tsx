import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, Mail, Phone, Globe, MapPin, Save, Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createErrorHandler } from '@/lib/errorHandler';

const errorLog = createErrorHandler('CompanyProfileSettings');

interface CompanyProfile {
  name_en: string;
  name_ru: string;
  logo: string | null;
  cover_image: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  address: string | null;
  district: string | null;
  description_en: string | null;
  description_ru: string | null;
  director_name: string | null;
  tax_id: string | null;
  license_number: string | null;
  founded_year: number | null;
}

export function CompanyProfileSettings() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;
  const queryClient = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ['mc-profile', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('management_companies')
        .select('name_en, name_ru, logo, cover_image, email, phone, whatsapp, website, address, district, description_en, description_ru, director_name, tax_id, license_number, founded_year')
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return data as CompanyProfile;
    },
    enabled: !!companyId,
  });

  const [form, setForm] = useState<CompanyProfile>({
    name_en: '', name_ru: '', logo: null, cover_image: null,
    email: null, phone: null, whatsapp: null, website: null,
    address: null, district: null, description_en: null, description_ru: null,
    director_name: null, tax_id: null, license_number: null, founded_year: null,
  });

  useEffect(() => {
    if (company) setForm(company);
  }, [company]);

  const update = useCallback((updates: Partial<CompanyProfile>) => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company');
      const { error } = await supabase
        .from('management_companies')
        .update({
          ...form,
          updated_at: new Date().toISOString(),
        })
        .eq('id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mc-profile', companyId] });
      toast.success(isRu ? 'Профиль сохранён' : 'Profile saved');
    },
    onError: (error: unknown) => {
      errorLog.silent(error, 'save_company_profile');
      toast.error(isRu ? 'Ошибка сохранения' : 'Save failed');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo & Branding */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {isRu ? 'Бренд компании' : 'Company Branding'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-start gap-6">
            {/* Logo preview */}
            <div className="space-y-2 shrink-0">
              <Label className="text-xs text-muted-foreground">
                {isRu ? 'Логотип' : 'Logo'}
              </Label>
              <Avatar className="h-20 w-20 rounded-xl border-2 border-dashed border-border">
                <AvatarImage src={form.logo || undefined} className="object-cover" />
                <AvatarFallback className="rounded-xl bg-muted text-lg font-bold">
                  {(form.name_en || 'MC')[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 space-y-3">
              <UnifiedMediaUploader
                mode="single"
                value={form.logo || ''}
                onChange={(url) => update({ logo: typeof url === 'string' ? url : '' })}
                bucket="company-logos"
                placeholder={isRu ? 'Загрузите логотип (рекомендуется 400×400)' : 'Upload logo (recommended 400×400)'}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isRu ? 'Название (EN)' : 'Company Name (EN)'}</Label>
              <Input
                value={form.name_en}
                onChange={(e) => update({ name_en: e.target.value })}
                placeholder="My Property Company"
              />
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Название (RU)' : 'Company Name (RU)'}</Label>
              <Input
                value={form.name_ru}
                onChange={(e) => update({ name_ru: e.target.value })}
                placeholder="Моя управляющая компания"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{isRu ? 'Директор / Представитель' : 'Director / Representative'}</Label>
            <Input
              value={form.director_name || ''}
              onChange={(e) => update({ director_name: e.target.value })}
              placeholder={isRu ? 'Иван Петров' : 'John Smith'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4" />
            {isRu ? 'Контакты' : 'Contact Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Email
              </Label>
              <Input
                type="email"
                value={form.email || ''}
                onChange={(e) => update({ email: e.target.value })}
                placeholder="info@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {isRu ? 'Телефон' : 'Phone'}
              </Label>
              <Input
                type="tel"
                value={form.phone || ''}
                onChange={(e) => update({ phone: e.target.value })}
                placeholder="+66 XX XXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </Label>
              <Input
                type="tel"
                value={form.whatsapp || ''}
                onChange={(e) => update({ whatsapp: e.target.value })}
                placeholder="+66 XX XXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                {isRu ? 'Сайт' : 'Website'}
              </Label>
              <Input
                value={form.website || ''}
                onChange={(e) => update({ website: e.target.value })}
                placeholder="https://company.com"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {isRu ? 'Адрес' : 'Address'}
              </Label>
              <Input
                value={form.address || ''}
                onChange={(e) => update({ address: e.target.value })}
                placeholder={isRu ? '123 Main St, Rawai' : '123 Main St, Rawai'}
              />
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Район' : 'District'}</Label>
              <Input
                value={form.district || ''}
                onChange={(e) => update({ district: e.target.value })}
                placeholder={isRu ? 'Раваи' : 'Rawai'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description & Legal */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {isRu ? 'О компании и юр. данные' : 'About & Legal'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{isRu ? 'Описание (EN)' : 'Description (EN)'}</Label>
            <Textarea
              value={form.description_en || ''}
              onChange={(e) => update({ description_en: e.target.value })}
              placeholder={isRu ? 'Краткое описание компании на английском' : 'Brief company description in English'}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>{isRu ? 'Описание (RU)' : 'Description (RU)'}</Label>
            <Textarea
              value={form.description_ru || ''}
              onChange={(e) => update({ description_ru: e.target.value })}
              placeholder={isRu ? 'Краткое описание компании на русском' : 'Brief company description in Russian'}
              rows={3}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{isRu ? 'ИНН / Tax ID' : 'Tax ID'}</Label>
              <Input
                value={form.tax_id || ''}
                onChange={(e) => update({ tax_id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Лицензия' : 'License №'}</Label>
              <Input
                value={form.license_number || ''}
                onChange={(e) => update({ license_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Год основания' : 'Founded Year'}</Label>
              <Input
                type="number"
                value={form.founded_year || ''}
                onChange={(e) => update({ founded_year: e.target.value ? Number(e.target.value) : null })}
                placeholder="2020"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end sticky bottom-4">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          size="lg"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isRu ? 'Сохранить профиль' : 'Save Profile'}
        </Button>
      </div>
    </div>
  );
}
