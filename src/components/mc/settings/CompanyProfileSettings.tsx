import { pickLang } from '@/lib/i18n/pickLang';
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
  { id: 'blue', labelTh: 'สีน้ำเงิน', labelEn: 'Blue', labelRu: 'Синий', hsl: '221 83% 53%' },
  { id: 'teal', labelTh: 'สีเขียวอมฟ้า', labelEn: 'Teal', labelRu: 'Бирюзовый', hsl: '173 80% 40%' },
  { id: 'violet', labelTh: 'สีม่วง', labelEn: 'Violet', labelRu: 'Фиолетовый', hsl: '263 70% 50%' },
  { id: 'rose', labelTh: 'สีชมพู', labelEn: 'Rose', labelRu: 'Розовый', hsl: '347 77% 50%' },
  { id: 'amber', labelTh: 'สีเหลืองอำพัน', labelEn: 'Amber', labelRu: 'Янтарный', hsl: '38 92% 50%' },
  { id: 'emerald', labelTh: 'สีเขียวมรกต', labelEn: 'Emerald', labelRu: 'Изумрудный', hsl: '160 84% 39%' },
  { id: 'slate', labelTh: 'สีเทา', labelEn: 'Slate', labelRu: 'Графитовый', hsl: '215 16% 47%' },
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
      toast.success(pickLang(language, {"en": "Profile saved", "ru": "Профиль сохранён", "th": "บันทึกข้อมูลบริษัทแล้ว"}));
    },
    onError: (error: unknown) => {
      errorLog.silent(error, 'save_company_profile');
      toast.error(pickLang(language, {"en": "Save failed", "ru": "Ошибка сохранения", "th": "บันทึกไม่สำเร็จ"}));
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
      <div role="status" aria-label={pickLang(language, { en: 'Loading...', ru: 'Загрузка...', th: 'กำลังโหลด...' })} className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Accordion type="multiple" defaultValue={[]} className="space-y-3">
        {/* Branding */}
        <AccordionItem value="branding" className="border rounded-none px-4">
          <AccordionTrigger className="text-sm font-semibold gap-2 hover:no-underline py-3">
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              {pickLang(language, {"en": "Company Branding", "ru": "Бренд компании", "th": "แบรนด์บริษัท"})}
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="flex items-start gap-4">
              <div className="space-y-1.5 shrink-0">
                <Label className="text-xs text-muted-foreground">
                  {pickLang(language, {"en": "Logo", "ru": "Логотип", "th": "โลโก้"})}
                </Label>
                <Avatar className="h-16 w-16 rounded-none border-2 border-dashed border-border">
                  <AvatarImage src={form.logo || undefined} className="object-cover" />
                  <AvatarFallback className="rounded-none bg-muted text-base font-bold">
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
                  placeholder={pickLang(language, {"en": "Logo (400×400)", "ru": "Логотип (400×400)", "th": "โลโก้ (400×400)"})}
                />
              </div>
            </div>

            {/* Cover Image */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs">
                <Image className="h-3.5 w-3.5" />
                {pickLang(language, {"en": "Cover", "ru": "Обложка", "th": "ภาพปก"})}
              </Label>
              {form.cover_image && (
                <img src={form.cover_image} alt={pickLang(language, {"en": "Company cover", "ru": "Обложка компании", "th": "ภาพปกบริษัท"})} className="w-full h-24 object-cover rounded-none border border-border" />
              )}
              <UnifiedMediaUploader
                mode="single"
                value={form.cover_image || ''}
                onChange={(url) => update({ cover_image: typeof url === 'string' ? url : '' })}
                bucket="company-logos"
                folder="covers"
                placeholder={pickLang(language, {"en": "Cover (1200×400)", "ru": "Обложка (1200×400)", "th": "ภาพปก (1200×400)"})}
              />
            </div>

            {/* Color Scheme */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs">
                <Palette className="h-3.5 w-3.5" />
                {pickLang(language, {"en": "Color Scheme", "ru": "Цветовая схема", "th": "ชุดสี"})}
              </Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_SCHEMES.map((scheme) => (
                  <button
                    key={scheme.id}
                    type="button"
                    onClick={() => update({ brand_color: scheme.id })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-none border text-xs font-medium transition-all ${
                      form.brand_color === scheme.id
                        ? 'border-foreground ring-2 ring-foreground/20 bg-accent'
                        : 'border-border hover:border-foreground/30 bg-card'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 ring-1 ring-black/10"
                      style={{ backgroundColor: `hsl(${scheme.hsl})` }}
                    />
                    {pickLang(language, { en: scheme.labelEn, ru: scheme.labelRu, th: scheme.labelTh })}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {pickLang(language, {"en": "Used in storefront and branded reports", "ru": "Используется в витрине и фирменных отчётах", "th": "ใช้ในหน้าร้านและรายงานของบริษัท"})}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{pickLang(language, {"en": "Name (EN)", "ru": "Название (EN)", "th": "ชื่อ (ภาษาอังกฤษ)"})}</Label>
                <Input value={form.name_en} onChange={(e) => update({ name_en: e.target.value })} placeholder="My Property Company" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{pickLang(language, {"en": "Name (RU)", "ru": "Название (RU)", "th": "ชื่อ (ภาษารัสเซีย)"})}</Label>
                <Input value={form.name_ru} onChange={(e) => update({ name_ru: e.target.value })} placeholder="Моя УК" className="h-9" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{pickLang(language, {"en": "Director", "ru": "Директор", "th": "ผู้อำนวยการ"})}</Label>
              <Input value={form.director_name || ''} onChange={(e) => update({ director_name: e.target.value })} placeholder={pickLang(language, {"en": "John Smith", "ru": "Иван Петров", "th": "สมชาย ใจดี"})} className="h-9" />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Contacts */}
        <AccordionItem value="contacts" className="border rounded-none px-4">
          <AccordionTrigger className="text-sm font-semibold gap-2 hover:no-underline py-3">
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              {pickLang(language, {"en": "Contacts", "ru": "Контакты", "th": "ข้อมูลติดต่อ"})}
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><Mail className="h-3 w-3" /> {pickLang(language, { en: 'Email', ru: 'Эл. почта', th: 'อีเมล' })}</Label>
                <Input type="email" value={form.email || ''} onChange={(e) => update({ email: e.target.value })} placeholder="info@company.com" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><Phone className="h-3 w-3" /> {pickLang(language, {"en": "Phone", "ru": "Телефон", "th": "โทรศัพท์"})}</Label>
                <Input type="tel" value={form.phone || ''} onChange={(e) => update({ phone: e.target.value })} placeholder="+66 XX XXX XXXX" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><MessageCircle className="h-3 w-3" /> WhatsApp</Label>
                <Input type="tel" value={form.whatsapp || ''} onChange={(e) => update({ whatsapp: e.target.value })} placeholder="+66 XX XXX XXXX" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><Globe className="h-3 w-3" /> {pickLang(language, {"en": "Website", "ru": "Сайт", "th": "เว็บไซต์"})}</Label>
                <Input value={form.website || ''} onChange={(e) => update({ website: e.target.value })} placeholder="https://company.com" className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><MapPin className="h-3 w-3" /> {pickLang(language, {"en": "Address", "ru": "Адрес", "th": "ที่อยู่"})}</Label>
                <Input value={form.address || ''} onChange={(e) => update({ address: e.target.value })} placeholder={pickLang(language, { en: '123 Main St', ru: 'Улица, дом', th: 'บ้านเลขที่ ถนน' })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{pickLang(language, {"en": "District", "ru": "Район", "th": "พื้นที่"})}</Label>
                <Input value={form.district || ''} onChange={(e) => update({ district: e.target.value })} placeholder={pickLang(language, { en: 'Rawai', ru: 'Раваи', th: 'ราไวย์' })} className="h-9" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* About */}
        <AccordionItem value="about" className="border rounded-none px-4">
          <AccordionTrigger className="text-sm font-semibold gap-2 hover:no-underline py-3">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {pickLang(language, {"en": "About", "ru": "О компании", "th": "เกี่ยวกับบริษัท"})}
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{pickLang(language, {"en": "Description (EN)", "ru": "Описание (EN)", "th": "คำอธิบาย (ภาษาอังกฤษ)"})}</Label>
              <Textarea value={form.description_en || ''} onChange={(e) => update({ description_en: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{pickLang(language, {"en": "Description (RU)", "ru": "Описание (RU)", "th": "คำอธิบาย (ภาษารัสเซีย)"})}</Label>
              <Textarea value={form.description_ru || ''} onChange={(e) => update({ description_ru: e.target.value })} rows={2} />
            </div>
          </AccordionContent>
        </AccordionItem>
        {/* Legal Details */}
        <AccordionItem value="legal" className="border rounded-none px-4">
          <AccordionTrigger className="text-sm font-semibold gap-2 hover:no-underline py-3">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {pickLang(language, {"en": "Legal Details", "ru": "Юридические данные", "th": "ข้อมูลทางกฎหมาย"})}
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{pickLang(language, {"en": "Legal Name", "ru": "Юридическое название", "th": "ชื่อตามทะเบียน"})}</Label>
                <Input value={form.legal_name || ''} onChange={(e) => update({ legal_name: e.target.value })} placeholder={pickLang(language, {"en": "Company LLC", "ru": "ООО «Компания»", "th": "บริษัท ตัวอย่าง จำกัด"})} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{pickLang(language, {"en": "Registration №", "ru": "Рег. номер", "th": "เลขทะเบียน"})}</Label>
                <Input value={form.registration_number || ''} onChange={(e) => update({ registration_number: e.target.value })} className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{pickLang(language, {"en": "Legal Address", "ru": "Юридический адрес", "th": "ที่อยู่ตามทะเบียน"})}</Label>
              <Input value={form.legal_address || ''} onChange={(e) => update({ legal_address: e.target.value })} className="h-9" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{pickLang(language, {"en": "Tax ID", "ru": "ИНН / Tax ID", "th": "เลขประจำตัวผู้เสียภาษี"})}</Label>
                <Input value={form.tax_id || ''} onChange={(e) => update({ tax_id: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{pickLang(language, {"en": "License №", "ru": "Лицензия", "th": "เลขที่ใบอนุญาต"})}</Label>
                <Input value={form.license_number || ''} onChange={(e) => update({ license_number: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{pickLang(language, {"en": "Founded", "ru": "Год основания", "th": "ปีที่ก่อตั้ง"})}</Label>
                <Input type="number" value={form.founded_year || ''} onChange={(e) => update({ founded_year: e.target.value ? Number(e.target.value) : null })} placeholder="2020" className="h-9" />
              </div>
            </div>

            {/* DBD Card */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                {pickLang(language, {"en": "DBD Card (Dept. of Business Development)", "ru": "DBD карточка (Dept. of Business Development)", "th": "เอกสาร DBD (กรมพัฒนาธุรกิจการค้า)"})}
              </Label>
              {form.dbd_card_url && (
                <img src={form.dbd_card_url} alt={pickLang(language, { en: 'DBD Card', ru: 'Карточка DBD', th: 'เอกสาร DBD' })} className="w-full max-w-sm h-auto rounded-none border border-border" />
              )}
              <UnifiedMediaUploader
                mode="single"
                value={form.dbd_card_url || ''}
                onChange={(url) => update({ dbd_card_url: typeof url === 'string' ? url : '' })}
                bucket="company-logos"
                folder="dbd-cards"
                placeholder={pickLang(language, {"en": "Upload DBD card", "ru": "Загрузите DBD карточку", "th": "อัปโหลดเอกสาร DBD"})}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Banking */}
        <AccordionItem value="banking" className="border rounded-none px-4">
          <AccordionTrigger className="text-sm font-semibold gap-2 hover:no-underline py-3">
            <span className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" />
              {pickLang(language, {"en": "Banking Details", "ru": "Банковские реквизиты", "th": "ข้อมูลธนาคาร"})}
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{pickLang(language, {"en": "Bank Name", "ru": "Название банка", "th": "ชื่อธนาคาร"})}</Label>
                <Input value={form.bank_name || ''} onChange={(e) => update({ bank_name: e.target.value })} placeholder="Bangkok Bank" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{pickLang(language, {"en": "Account №", "ru": "Номер счёта", "th": "เลขที่บัญชี"})}</Label>
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
        <AccordionItem value="documents" className="border rounded-none px-4">
          <AccordionTrigger className="text-sm font-semibold gap-2 hover:no-underline py-3">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {pickLang(language, {"en": "Company Documents", "ru": "Документы компании", "th": "เอกสารบริษัท"})}
              {form.documents.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">({form.documents.length})</span>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-xs text-muted-foreground">
              {pickLang(language, {"en": "Licenses, certificates, registration documents", "ru": "Лицензии, сертификаты, регистрационные документы", "th": "ใบอนุญาต ใบรับรอง และเอกสารจดทะเบียน"})}
            </p>

            {form.documents.length > 0 && (
              <div className="space-y-2">
                {form.documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-none border border-border bg-muted/30">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate flex-1">
                      {doc.name}
                    </a>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => removeDocument(i)}>
                      {pickLang(language, {"en": "Remove", "ru": "Удалить", "th": "นำออก"})}
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
              placeholder={pickLang(language, {"en": "Upload document", "ru": "Загрузите документ", "th": "อัปโหลดเอกสาร"})}
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
          {pickLang(language, {"en": "Save Profile", "ru": "Сохранить профиль", "th": "บันทึกข้อมูลบริษัท"})}
        </Button>
      </div>
    </div>
  );
}
