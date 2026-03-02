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
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Building2, Mail, Phone, Globe, MapPin, Save, Loader2, MessageCircle, Landmark, FileText, Image, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { createErrorHandler } from '@/lib/errorHandler';

const errorLog = createErrorHandler('CompanyProfileSettings');

interface CompanyDocument {
  name: string;
  url: string;
  type: string;
  uploaded_at: string;
}

interface CompanyProfile {
  name_en: string;
  name_ru: string;
  logo: string | null;
  cover_image: string | null;
  brand_color: string;
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
  legal_name: string | null;
  registration_number: string | null;
  legal_address: string | null;
  bank_name: string | null;
  bank_account: string | null;
  swift_code: string | null;
  dbd_card_url: string | null;
  documents: CompanyDocument[];
}

const COLOR_SCHEMES = [
  { id: 'blue', labelEn: 'Blue', labelRu: 'Синий', hsl: '221 83% 53%' },
  { id: 'teal', labelEn: 'Teal', labelRu: 'Бирюзовый', hsl: '173 80% 40%' },
  { id: 'violet', labelEn: 'Violet', labelRu: 'Фиолетовый', hsl: '263 70% 50%' },
  { id: 'rose', labelEn: 'Rose', labelRu: 'Розовый', hsl: '347 77% 50%' },
  { id: 'amber', labelEn: 'Amber', labelRu: 'Янтарный', hsl: '38 92% 50%' },
  { id: 'emerald', labelEn: 'Emerald', labelRu: 'Изумрудный', hsl: '160 84% 39%' },
  { id: 'slate', labelEn: 'Slate', labelRu: 'Графитовый', hsl: '215 16% 47%' },
];

const INITIAL_FORM: CompanyProfile = {
  name_en: '', name_ru: '', logo: null, cover_image: null, brand_color: 'blue',
  email: null, phone: null, whatsapp: null, website: null,
  address: null, district: null, description_en: null, description_ru: null,
  director_name: null, tax_id: null, license_number: null, founded_year: null,
  legal_name: null, registration_number: null, legal_address: null,
  bank_name: null, bank_account: null, swift_code: null,
  dbd_card_url: null, documents: [],
};

const SELECT_FIELDS = 'name_en, name_ru, logo, cover_image, brand_color, email, phone, whatsapp, website, address, district, description_en, description_ru, director_name, tax_id, license_number, founded_year, legal_name, registration_number, legal_address, bank_name, bank_account, swift_code, dbd_card_url, documents';

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
        .select(SELECT_FIELDS)
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return {
        ...data,
        documents: Array.isArray(data.documents) ? data.documents : [],
      } as unknown as CompanyProfile;
    },
    enabled: !!companyId,
  });

  const [form, setForm] = useState<CompanyProfile>(INITIAL_FORM);

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
          documents: form.documents as any,
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

  const handleDocumentUpload = (url: string) => {
    if (!url) return;
    const doc: CompanyDocument = {
      name: url.split('/').pop() || 'document',
      url,
      type: 'other',
      uploaded_at: new Date().toISOString(),
    };
    update({ documents: [...form.documents, doc] });
  };

  const removeDocument = (index: number) => {
    update({ documents: form.documents.filter((_, i) => i !== index) });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Accordion type="multiple" defaultValue={[]} className="space-y-3">
        {/* Branding */}
        <AccordionItem value="branding" className="border rounded-xl px-4">
          <AccordionTrigger className="text-sm font-semibold gap-2 hover:no-underline py-3">
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              {isRu ? 'Бренд компании' : 'Company Branding'}
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="flex items-start gap-4">
              <div className="space-y-1.5 shrink-0">
                <Label className="text-xs text-muted-foreground">
                  {isRu ? 'Логотип' : 'Logo'}
                </Label>
                <Avatar className="h-16 w-16 rounded-xl border-2 border-dashed border-border">
                  <AvatarImage src={form.logo || undefined} className="object-cover" />
                  <AvatarFallback className="rounded-xl bg-muted text-base font-bold">
                    {(form.name_en || 'MC')[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                <UnifiedMediaUploader
                  mode="single"
                  value={form.logo || ''}
                  onChange={(url) => update({ logo: typeof url === 'string' ? url : '' })}
                  bucket="company-logos"
                  placeholder={isRu ? 'Логотип (400×400)' : 'Logo (400×400)'}
                />
              </div>
            </div>

            {/* Cover Image */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs">
                <Image className="h-3.5 w-3.5" />
                {isRu ? 'Обложка' : 'Cover'}
              </Label>
              {form.cover_image && (
                <img src={form.cover_image} alt="Cover" className="w-full h-24 object-cover rounded-lg border border-border" />
              )}
              <UnifiedMediaUploader
                mode="single"
                value={form.cover_image || ''}
                onChange={(url) => update({ cover_image: typeof url === 'string' ? url : '' })}
                bucket="company-logos"
                folder="covers"
                placeholder={isRu ? 'Обложка (1200×400)' : 'Cover (1200×400)'}
              />
            </div>

            {/* Color Scheme */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs">
                <Palette className="h-3.5 w-3.5" />
                {isRu ? 'Цветовая схема' : 'Color Scheme'}
              </Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_SCHEMES.map((scheme) => (
                  <button
                    key={scheme.id}
                    type="button"
                    onClick={() => update({ brand_color: scheme.id })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      form.brand_color === scheme.id
                        ? 'border-foreground ring-2 ring-foreground/20 bg-accent'
                        : 'border-border hover:border-foreground/30 bg-card'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 ring-1 ring-black/10"
                      style={{ backgroundColor: `hsl(${scheme.hsl})` }}
                    />
                    {isRu ? scheme.labelRu : scheme.labelEn}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isRu ? 'Используется в витрине и фирменных отчётах' : 'Used in storefront and branded reports'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{isRu ? 'Название (EN)' : 'Name (EN)'}</Label>
                <Input value={form.name_en} onChange={(e) => update({ name_en: e.target.value })} placeholder="My Property Company" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isRu ? 'Название (RU)' : 'Name (RU)'}</Label>
                <Input value={form.name_ru} onChange={(e) => update({ name_ru: e.target.value })} placeholder="Моя УК" className="h-9" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{isRu ? 'Директор' : 'Director'}</Label>
              <Input value={form.director_name || ''} onChange={(e) => update({ director_name: e.target.value })} placeholder={isRu ? 'Иван Петров' : 'John Smith'} className="h-9" />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Contacts */}
        <AccordionItem value="contacts" className="border rounded-xl px-4">
          <AccordionTrigger className="text-sm font-semibold gap-2 hover:no-underline py-3">
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              {isRu ? 'Контакты' : 'Contacts'}
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><Mail className="h-3 w-3" /> Email</Label>
                <Input type="email" value={form.email || ''} onChange={(e) => update({ email: e.target.value })} placeholder="info@company.com" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><Phone className="h-3 w-3" /> {isRu ? 'Телефон' : 'Phone'}</Label>
                <Input type="tel" value={form.phone || ''} onChange={(e) => update({ phone: e.target.value })} placeholder="+66 XX XXX XXXX" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><MessageCircle className="h-3 w-3" /> WhatsApp</Label>
                <Input type="tel" value={form.whatsapp || ''} onChange={(e) => update({ whatsapp: e.target.value })} placeholder="+66 XX XXX XXXX" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><Globe className="h-3 w-3" /> {isRu ? 'Сайт' : 'Website'}</Label>
                <Input value={form.website || ''} onChange={(e) => update({ website: e.target.value })} placeholder="https://company.com" className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><MapPin className="h-3 w-3" /> {isRu ? 'Адрес' : 'Address'}</Label>
                <Input value={form.address || ''} onChange={(e) => update({ address: e.target.value })} placeholder="123 Main St" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isRu ? 'Район' : 'District'}</Label>
                <Input value={form.district || ''} onChange={(e) => update({ district: e.target.value })} placeholder="Rawai" className="h-9" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* About */}
        <AccordionItem value="about" className="border rounded-xl px-4">
          <AccordionTrigger className="text-sm font-semibold gap-2 hover:no-underline py-3">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {isRu ? 'О компании' : 'About'}
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{isRu ? 'Описание (EN)' : 'Description (EN)'}</Label>
              <Textarea value={form.description_en || ''} onChange={(e) => update({ description_en: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isRu ? 'Описание (RU)' : 'Description (RU)'}</Label>
              <Textarea value={form.description_ru || ''} onChange={(e) => update({ description_ru: e.target.value })} rows={2} />
            </div>
          </AccordionContent>
        </AccordionItem>
        {/* Legal Details */}
        <AccordionItem value="legal" className="border rounded-xl px-4">
          <AccordionTrigger className="text-sm font-semibold gap-2 hover:no-underline py-3">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {isRu ? 'Юридические данные' : 'Legal Details'}
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{isRu ? 'Юридическое название' : 'Legal Name'}</Label>
                <Input value={form.legal_name || ''} onChange={(e) => update({ legal_name: e.target.value })} placeholder={isRu ? 'ООО «Компания»' : 'Company LLC'} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isRu ? 'Рег. номер' : 'Registration №'}</Label>
                <Input value={form.registration_number || ''} onChange={(e) => update({ registration_number: e.target.value })} className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isRu ? 'Юридический адрес' : 'Legal Address'}</Label>
              <Input value={form.legal_address || ''} onChange={(e) => update({ legal_address: e.target.value })} className="h-9" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{isRu ? 'ИНН / Tax ID' : 'Tax ID'}</Label>
                <Input value={form.tax_id || ''} onChange={(e) => update({ tax_id: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isRu ? 'Лицензия' : 'License №'}</Label>
                <Input value={form.license_number || ''} onChange={(e) => update({ license_number: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isRu ? 'Год основания' : 'Founded'}</Label>
                <Input type="number" value={form.founded_year || ''} onChange={(e) => update({ founded_year: e.target.value ? Number(e.target.value) : null })} placeholder="2020" className="h-9" />
              </div>
            </div>

            {/* DBD Card */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                {isRu ? 'DBD карточка (Dept. of Business Development)' : 'DBD Card (Dept. of Business Development)'}
              </Label>
              {form.dbd_card_url && (
                <img src={form.dbd_card_url} alt="DBD Card" className="w-full max-w-sm h-auto rounded-lg border border-border" />
              )}
              <UnifiedMediaUploader
                mode="single"
                value={form.dbd_card_url || ''}
                onChange={(url) => update({ dbd_card_url: typeof url === 'string' ? url : '' })}
                bucket="company-logos"
                folder="dbd-cards"
                placeholder={isRu ? 'Загрузите DBD карточку' : 'Upload DBD card'}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Banking */}
        <AccordionItem value="banking" className="border rounded-xl px-4">
          <AccordionTrigger className="text-sm font-semibold gap-2 hover:no-underline py-3">
            <span className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" />
              {isRu ? 'Банковские реквизиты' : 'Banking Details'}
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{isRu ? 'Название банка' : 'Bank Name'}</Label>
                <Input value={form.bank_name || ''} onChange={(e) => update({ bank_name: e.target.value })} placeholder="Bangkok Bank" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isRu ? 'Номер счёта' : 'Account №'}</Label>
                <Input value={form.bank_account || ''} onChange={(e) => update({ bank_account: e.target.value })} className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5 max-w-xs">
              <Label className="text-xs">SWIFT</Label>
              <Input value={form.swift_code || ''} onChange={(e) => update({ swift_code: e.target.value })} placeholder="BKKBTHBK" className="h-9" />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Company Documents */}
        <AccordionItem value="documents" className="border rounded-xl px-4">
          <AccordionTrigger className="text-sm font-semibold gap-2 hover:no-underline py-3">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {isRu ? 'Документы компании' : 'Company Documents'}
              {form.documents.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">({form.documents.length})</span>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Лицензии, сертификаты, регистрационные документы' : 'Licenses, certificates, registration documents'}
            </p>

            {form.documents.length > 0 && (
              <div className="space-y-2">
                {form.documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-muted/30">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate flex-1">
                      {doc.name}
                    </a>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => removeDocument(i)}>
                      {isRu ? 'Удалить' : 'Remove'}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <UnifiedMediaUploader
              mode="document"
              value=""
              onChange={(url) => handleDocumentUpload(typeof url === 'string' ? url : '')}
              bucket="company-logos"
              folder="documents"
              placeholder={isRu ? 'Загрузите документ' : 'Upload document'}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Save Button */}
      <div className="flex justify-end sticky bottom-4">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} size="lg">
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
