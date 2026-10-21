import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GooglePlacesAutocomplete } from '@/components/shared/GooglePlacesAutocomplete';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import {
  COMPLEX_TYPES, COMPLEX_AMENITIES, COMPLEX_SERVICES,
  COMPLEX_SECURITY, COMPLEX_INFRASTRUCTURE,
} from '@/lib/complexConstants';
import { useCreateComplex, useUpdateComplex, type PropertyComplex, type ComplexFormData } from '@/hooks/usePropertyComplexes';
import { cn } from '@/lib/utils';
import { pickLang } from '@/lib/i18n/pickLang';
import type { ComplexReviewStatus } from '@/lib/complexAuthoring';

interface ComplexFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complex?: PropertyComplex | null;
  footerActions?: ReactNode;
  managed?: {
    spaces: Array<{ id: string; name_en: string; name_ru: string }>;
    spaceId: string;
    onSpaceChange: (id: string) => void;
    status?: ComplexReviewStatus;
    isPending: boolean;
    blocked: boolean;
    scopeMessage?: string;
    onSave: (data: ComplexFormData, baseline: ComplexFormData, submit: boolean) => Promise<void>;
  };
}

const emptyForm: ComplexFormData = {
  name: '',
  name_ru: '',
  complex_type: 'condo',
  district: '',
  address: '',
  amenities: [],
  services: [],
  security_features: [],
  infrastructure: [],
  images: [],
  video_url: '',
};

export function ComplexFormDialog({ open, onOpenChange, complex, managed, footerActions }: ComplexFormDialogProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const text = (en: string, ru: string, th: string) => pickLang(language, { en, ru, th });
  const locked = !!managed && (managed.status === 'pending' || managed.status === 'approved');
  const createMutation = useCreateComplex();
  const updateMutation = useUpdateComplex();
  const [form, setForm] = useState<ComplexFormData>(emptyForm);
  const baseline = useRef<ComplexFormData>(emptyForm);
  const saving = useRef(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string[] | null>(null);

  useEffect(() => {
    if (complex) {
      const next: ComplexFormData = {
        name: complex.name || '',
        name_ru: complex.name_ru || '',
        description_en: complex.description_en || '',
        description_ru: complex.description_ru || '',
        complex_type: complex.complex_type || 'condo',
        total_units: complex.total_units,
        total_buildings: complex.total_buildings,
        year_built: complex.year_built,
        total_floors: complex.total_floors,
        district: complex.district || '',
        address: complex.address || '',
        lat: complex.lat,
        lng: complex.lng,
        cover_image: complex.cover_image || '',
        images: complex.images || [],
        amenities: complex.amenities || [],
        services: complex.services || [],
        security_features: complex.security_features || [],
        infrastructure: complex.infrastructure || [],
        management_company_id: complex.management_company_id,
        cam_fee_per_sqm: complex.cam_fee_per_sqm,
        cam_includes: complex.cam_includes || [],
        juristic_person_name: complex.juristic_person_name || '',
        juristic_phone: complex.juristic_phone || '',
        juristic_email: complex.juristic_email || '',
        video_url: complex.video_url || '',
      };
      baseline.current = next;
      setForm(next);
    } else {
      baseline.current = emptyForm;
      setForm(emptyForm);
    }
    setSaveError(null);
  }, [complex, open]);

  const setField = <K extends keyof ComplexFormData>(key: K, value: ComplexFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: 'amenities' | 'services' | 'security_features' | 'infrastructure', value: string) => {
    setForm(prev => {
      const arr = prev[key] || [];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  };

  const handleSave = async (submit = false) => {
    if (!form.name.trim() || saving.current || locked || managed?.blocked) return;
    saving.current = true;
    setSaveError(null);
    try {
      if (managed) {
        await managed.onSave(form, baseline.current, submit);
      } else if (complex) {
        await updateMutation.mutateAsync({ id: complex.id, ...form });
      } else {
        await createMutation.mutateAsync(form);
      }
      onOpenChange(false);
    } catch {
      setSaveError(text('Saving was not confirmed. Close and refresh the list before trying again; a new complex may already have been created.', 'Сохранение не подтверждено. Закройте форму и обновите список перед повторной попыткой: новый комплекс уже мог быть создан.', 'ยังยืนยันการบันทึกไม่ได้ ปิดแบบฟอร์มและรีเฟรชรายการก่อนลองใหม่ เนื่องจากอาจสร้างโครงการใหม่แล้ว'));
    } finally {
      saving.current = false;
    }
  };

  const handleAiParse = async () => {
    if (!aiText.trim()) {
      toast.error(isRu ? 'Вставьте текст сообщения' : 'Paste message text first');
      return;
    }
    setAiLoading(true);
    setAiSummary(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-intake-extract', {
        body: {
          input: aiText.trim(),
          inputType: 'text',
          entityType: 'property_project',
          language,
        },
      });
      if (error) throw error;
      const ex = data?.extracted;
      if (!ex) throw new Error('Empty result');
      const meta = data?.meta;

      const filled: string[] = [];
      setForm(prev => {
        const next: ComplexFormData = { ...prev };
        const setIf = <K extends keyof ComplexFormData>(k: K, v: ComplexFormData[K] | undefined | null, label: string) => {
          if (v === undefined || v === null || v === '') return;
          if (Array.isArray(v) && v.length === 0) return;
          next[k] = v as ComplexFormData[K];
          filled.push(label);
        };
        setIf('name', ex.name_en, isRu ? 'Название EN' : 'Name EN');
        setIf('name_ru', ex.name_ru, isRu ? 'Название RU' : 'Name RU');
        setIf('description_en', ex.description_en, isRu ? 'Описание EN' : 'Description EN');
        setIf('description_ru', ex.description_ru, isRu ? 'Описание RU' : 'Description RU');
        setIf('complex_type', ex.complex_type, isRu ? 'Тип' : 'Type');
        setIf('address', ex.address, isRu ? 'Адрес' : 'Address');
        setIf('district', ex.district, text('District', 'Район', 'พื้นที่'));
        setIf('lat', typeof ex.lat === 'number' ? ex.lat : undefined, 'Lat');
        setIf('lng', typeof ex.lng === 'number' ? ex.lng : undefined, 'Lng');
        setIf('year_built', ex.year_built, isRu ? 'Год' : 'Year');
        setIf('total_units', ex.total_units, isRu ? 'Юниты' : 'Units');
        setIf('total_buildings', ex.total_buildings, isRu ? 'Корпусы' : 'Buildings');
        setIf('total_floors', ex.total_floors, isRu ? 'Этажи' : 'Floors');
        setIf('amenities', ex.amenities, text('Amenities', 'Удобства', 'สิ่งอำนวยความสะดวก'));
        setIf('services', ex.services, isRu ? 'Услуги' : 'Services');
        setIf('security_features', ex.security_features, isRu ? 'Безопасность' : 'Security');
        setIf('infrastructure', ex.infrastructure, isRu ? 'Инфраструктура' : 'Infrastructure');
        setIf('juristic_person_name', ex.juristic_person_name, isRu ? 'Юрлицо' : 'Juristic');
        setIf('juristic_phone', ex.juristic_phone, isRu ? 'Телефон' : 'Phone');
        setIf('juristic_email', ex.juristic_email, 'Email');
        setIf('video_url', ex.video_url, 'Video');

        // Photos imported from Drive — merge with any existing
        if (Array.isArray(ex.images) && ex.images.length > 0) {
          const existing = new Set(prev.images || []);
          const merged = [...(prev.images || [])];
          for (const url of ex.images) {
            if (!existing.has(url)) {
              merged.push(url);
              existing.add(url);
            }
          }
          next.images = merged;
          filled.push(isRu ? `Фото (${ex.images.length})` : `Photos (${ex.images.length})`);
        }
        if (ex.cover_image && !next.cover_image) {
          next.cover_image = ex.cover_image;
        }
        return next;
      });

      // Append meta-derived chips (maps resolved, drive stats)
      if (meta?.maps_url && (typeof ex.lat === 'number' && typeof ex.lng === 'number')) {
        filled.push(isRu ? 'Карта 📍' : 'Map 📍');
      }
      if (meta?.drive?.error) {
        toast.warning(
          isRu
            ? `Drive: ${meta.drive.error}. Убедитесь, что папка расшарена «Anyone with the link».`
            : `Drive: ${meta.drive.error}. Make sure folder is shared "Anyone with the link".`
        );
      } else if (meta?.drive?.tried > 0 && meta?.drive?.saved === 0) {
        toast.warning(
          isRu
            ? 'Не удалось скачать фото с Drive — проверьте права доступа к папке.'
            : 'Could not download photos from Drive — check folder sharing settings.'
        );
      }

      setAiSummary(filled);
      toast.success(
        isRu
          ? `Заполнено полей: ${filled.length}${meta?.drive?.saved ? `, фото: ${meta.drive.saved}` : ''}`
          : `Filled ${filled.length} fields${meta?.drive?.saved ? `, photos: ${meta.drive.saved}` : ''}`
      );
    } catch (e: unknown) {
      console.error('AI parse error:', e);
      toast.error(e instanceof Error ? e.message : (isRu ? 'Ошибка AI разбора' : 'AI parse failed'));
    } finally {
      setAiLoading(false);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || managed?.isPending;

  const renderChipGroup = (
    label: string,
    items: readonly { value: string; labelEn: string; labelRu: string; labelTh: string; icon: string }[],
    key: 'amenities' | 'services' | 'security_features' | 'infrastructure'
  ) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {items.map(item => {
          const selected = (form[key] || []).includes(item.value);
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => toggleArrayItem(key, item.value)}
              disabled={locked || isPending}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all",
                selected
                  ? "bg-primary/10 border-primary/40 text-primary font-medium"
                  : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30 hover:bg-muted"
              )}
            >
              <span>{item.icon}</span>
              <span>{pickLang(language, { en: item.labelEn, ru: item.labelRu, th: item.labelTh })}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={value => { if (!saving.current) onOpenChange(value); }}>
      <DialogContent className="max-w-2xl h-[90dvh] max-h-[90dvh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2 pr-12">
          <DialogTitle>
            {complex 
              ? footerActions ? text('Review complex', 'Проверить комплекс', 'ตรวจสอบโครงการ') : locked ? text('View complex', 'Просмотр комплекса', 'ดูโครงการ') : text('Edit Complex', 'Редактировать комплекс', 'แก้ไขโครงการ')
              : text('New Complex', 'Новый комплекс', 'โครงการใหม่')
            }
          </DialogTitle>
        </DialogHeader>

        {/* AI Intake panel — only for new complexes */}
        {!complex && !managed && (
          <div className="px-6 pb-2">
            <button
              type="button"
              onClick={() => setAiOpen(o => !o)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-none border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-sm"
            >
              <span className="flex items-center gap-2 font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                {isRu
                  ? 'AI распознавание (вставьте сообщение от застройщика)'
                  : 'AI Intake — paste developer message'}
              </span>
              {aiOpen ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />}
            </button>

            {aiOpen && (
              <div className="mt-2 space-y-2 p-3 rounded-none border border-border bg-muted/30">
                <Textarea
                  rows={6}
                  value={aiText}
                  onChange={e => setAiText(e.target.value)}
                  placeholder={
                    isRu
                      ? 'Вставьте сообщение из WhatsApp / email / брошюру.\nAI распознает поля, скачает фото с Google Drive (если папка расшарена «Anyone with the link»), и определит координаты по ссылке Google Maps.\n\nПример:\nGreetings from Verdana Pool Villa.\nProject infos: https://drive.google.com/drive/folders/1dvN9K7vY-Q0iwhdyxR1ALFD1Ol1E_TFU\n📍 Pru Jumpa, Thalang, Phuket\n   Google Maps: https://maps.app.goo.gl/k7BU5n517Fe8HJeUA\n💰 Starting from 12.5 MB\n☎️ +66...'
                      : 'Paste WhatsApp message / email / brochure.\nAI fills fields, imports photos from Google Drive (folder must be shared "Anyone with the link"), and resolves coordinates from Google Maps link.\n\nExample:\nGreetings from Verdana Pool Villa.\nProject infos: https://drive.google.com/drive/folders/...\n📍 Pru Jumpa, Thalang, Phuket\n   Google Maps: https://maps.app.goo.gl/...\n💰 Starting from 12.5 MB'
                  }
                  className="text-sm"
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {isRu
                      ? 'Заполнит название, описание, удобства, координаты с Maps и подгрузит фото из Drive.'
                      : 'Fills name, description, amenities, Maps coords + imports photos from Drive.'}
                  </p>
                  <Button
                    size="sm"
                    onClick={handleAiParse}
                    disabled={aiLoading || !aiText.trim()}
                    className="gap-2 shrink-0"
                  >
                    {aiLoading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Sparkles className="h-4 w-4" />}
                    {isRu ? 'Разобрать' : 'Parse'}
                  </Button>
                </div>
                {aiSummary && aiSummary.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {aiSummary.map((f, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{f}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <Tabs defaultValue="general" className="flex flex-1 min-h-0 flex-col">
          <div className="shrink-0 px-6 overflow-x-auto">
            <TabsList className="w-full grid grid-cols-2 sm:grid-cols-5 h-auto gap-1">
              <TabsTrigger value="general" className="text-xs py-1.5">{text('General', 'Основное', 'ทั่วไป')}</TabsTrigger>
              <TabsTrigger value="location" className="text-xs py-1.5">{text('Location', 'Локация', 'ที่ตั้ง')}</TabsTrigger>
              <TabsTrigger value="media" className="text-xs py-1.5">{text('Media', 'Фото', 'สื่อ')}</TabsTrigger>
              <TabsTrigger value="amenities" className="text-xs py-1.5">{text('Amenities', 'Удобства', 'สิ่งอำนวยความสะดวก')}</TabsTrigger>
              <TabsTrigger value="management" className="text-xs py-1.5" disabled={!!managed}>{text('Mgmt', 'Управл.', 'การจัดการ')}</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea data-complex-form-scroll className="min-h-0 flex-1 px-6 py-4">
        {managed && <div className="pb-4 space-y-2 text-sm">
          <p className="text-muted-foreground">{text('Catalogue content only. Ownership, legal contacts and management fees are managed separately.', 'Только данные каталога. Право собственности, юридические контакты и сборы управляются отдельно.', 'เฉพาะข้อมูลแค็ตตาล็อก ข้อมูลกรรมสิทธิ์ ผู้ติดต่อทางกฎหมาย และค่าบริหารจัดการแยกต่างหาก')}</p>
          {locked && <p role="status">{text('This version is read-only while under review or published.', 'Эта версия доступна только для чтения во время проверки и после публикации.', 'เวอร์ชันนี้อ่านได้อย่างเดียวระหว่างตรวจสอบหรือหลังเผยแพร่')}</p>}
          {complex?.rejection_reason && <p className="break-words">{text('Review feedback: ', 'Комментарий проверяющего: ', 'ความเห็นจากผู้ตรวจสอบ: ')}{complex.rejection_reason}</p>}
          {managed.scopeMessage && <p role="status">{managed.scopeMessage}</p>}
          {!complex && <div className="space-y-1">
            <Label htmlFor="complex-authoring-space">{text('Operating Space', 'Рабочая область', 'พื้นที่ปฏิบัติงาน')}</Label>
            <select id="complex-authoring-space" className="flex h-10 w-full rounded-none border border-input bg-background px-3 py-2" value={managed.spaceId} onChange={event => managed.onSpaceChange(event.target.value)} disabled={isPending || managed.blocked}>
              <option value="">{text('Select an assigned Space', 'Выберите назначенную область', 'เลือกพื้นที่ที่ได้รับมอบหมาย')}</option>
              {managed.spaces.map(space => <option key={space.id} value={space.id}>{isRu ? space.name_ru || space.name_en : space.name_en || space.name_ru}</option>)}
            </select>
          </div>}
        </div>}

            <fieldset disabled={locked || isPending} className="min-w-0">
            <TabsContent value="general" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="complex-name">{text('Name (EN)', 'Название (EN)', 'ชื่อ (EN)')}</Label>
                  <Input id="complex-name" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Palm Garden Residence" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="complex-name_ru">{text('Name (RU)', 'Название (RU)', 'ชื่อ (RU)')}</Label>
                  <Input id="complex-name" value={form.name_ru || ''} onChange={e => setField('name_ru', e.target.value)} placeholder="Палм Гарден Резиденс" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="complex-type">{text('Complex Type', 'Тип комплекса', 'ประเภทโครงการ')}</Label>
                <Select value={form.complex_type || 'condo'} onValueChange={v => setField('complex_type', v)}>
                  <SelectTrigger id="complex-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMPLEX_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{pickLang(language, { en: t.labelEn, ru: t.labelRu, th: t.labelTh })}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="complex-total_units">{text('Units', 'Юнитов', 'จำนวนยูนิต')}</Label>
                  <Input id="complex-total_units" type="number" value={form.total_units ?? ''} onChange={e => setField('total_units', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="complex-total_buildings">{text('Buildings', 'Корпусов', 'จำนวนอาคาร')}</Label>
                  <Input id="complex-total_buildings" type="number" value={form.total_buildings ?? ''} onChange={e => setField('total_buildings', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="complex-total_floors">{text('Floors', 'Этажей', 'จำนวนชั้น')}</Label>
                  <Input id="complex-total_floors" type="number" value={form.total_floors ?? ''} onChange={e => setField('total_floors', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="complex-year_built">{text('Year Built', 'Год', 'ปีที่สร้าง')}</Label>
                  <Input id="complex-year_built" type="number" value={form.year_built ?? ''} onChange={e => setField('year_built', e.target.value ? Number(e.target.value) : undefined)} placeholder="2020" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="complex-description_en">{text('Description (EN)', 'Описание (EN)', 'คำอธิบาย (EN)')}</Label>
                  <Textarea id="complex-description_en" value={form.description_en || ''} onChange={e => setField('description_en', e.target.value)} rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="complex-description_ru">{text('Description (RU)', 'Описание (RU)', 'คำอธิบาย (RU)')}</Label>
                  <Textarea id="complex-description_ru" value={form.description_ru || ''} onChange={e => setField('description_ru', e.target.value)} rows={3} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label>{text('Search Address', 'Поиск адреса', 'ค้นหาที่อยู่')}</Label>
                <GooglePlacesAutocomplete
                  value={form.address || ''}
                  onChange={(val) => setField('address', val)}
                  onPlaceSelect={(place) => {
                    setField('address', place.address);
                    if (place.lat != null) setField('lat', place.lat);
                    if (place.lng != null) setField('lng', place.lng);
                    if (place.district) setField('district', place.district);
                  }}
                  placeholder={text('Type address to search...', 'Введите адрес для поиска...', 'พิมพ์ที่อยู่เพื่อค้นหา…')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="complex-district">{text('District', 'Район', 'พื้นที่')}</Label>
                <Input id="complex-district" value={form.district || ''} onChange={e => setField('district', e.target.value)} placeholder="Bang Tao" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="complex-lat">{text('Latitude', 'Широта', 'ละติจูด')}</Label>
                  <Input id="complex-lat" type="number" step="any" value={form.lat ?? ''} onChange={e => setField('lat', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="complex-lng">{text('Longitude', 'Долгота', 'ลองจิจูด')}</Label>
                  <Input id="complex-lng" type="number" step="any" value={form.lng ?? ''} onChange={e => setField('lng', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label>{text('Cover Image', 'Обложка', 'รูปหน้าปก')}</Label>
                <UnifiedMediaUploader
                  mode="single"
                  value={form.cover_image || ''}
                  onChange={v => setField('cover_image', typeof v === 'string' ? v : v[0] || '')}
                  folder="complexes/covers"
                  modalLayer="above-sheet"
                  disabled={locked || isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{text('Gallery', 'Галерея', 'แกลเลอรี')}</Label>
                <UnifiedMediaUploader
                  mode="gallery"
                  value={form.images || []}
                  onChange={v => setField('images', Array.isArray(v) ? v : [v])}
                  folder="complexes/gallery"
                  modalLayer="above-sheet"
                  disabled={locked || isPending}
                  maxItems={20}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="complex-video_url">{text('YouTube Video', 'Видео YouTube', 'วิดีโอ YouTube')}</Label>
                <Input id="complex-video_url"
                  value={form.video_url || ''}
                  onChange={e => setField('video_url', e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            </TabsContent>

            <TabsContent value="amenities" className="space-y-6 mt-0">
              {renderChipGroup(text('🏊 Complex Amenities', '🏊 Удобства комплекса', '🏊 สิ่งอำนวยความสะดวกในโครงการ'), COMPLEX_AMENITIES, 'amenities')}
              {renderChipGroup(text('🔔 Services', '🔔 Услуги', '🔔 บริการ'), COMPLEX_SERVICES, 'services')}
              {renderChipGroup(text('🛡️ Security', '🛡️ Безопасность', '🛡️ ความปลอดภัย'), COMPLEX_SECURITY, 'security_features')}
              {renderChipGroup(text('🏪 Infrastructure', '🏪 Инфраструктура', '🏪 สิ่งอำนวยความสะดวกส่วนกลาง'), COMPLEX_INFRASTRUCTURE, 'infrastructure')}
            </TabsContent>

            {!managed && <TabsContent value="management" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label>CAM Fee (฿/m²)</Label>
                <Input type="number" className="max-w-xs" value={form.cam_fee_per_sqm ?? ''} onChange={e => setField('cam_fee_per_sqm', e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div className="space-y-1.5">
                <Label>{isRu ? 'Юридическое лицо' : 'Juristic Person'}</Label>
                <Input value={form.juristic_person_name || ''} onChange={e => setField('juristic_person_name', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{isRu ? 'Телефон юрлица' : 'Juristic Phone'}</Label>
                  <Input value={form.juristic_phone || ''} onChange={e => setField('juristic_phone', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={form.juristic_email || ''} onChange={e => setField('juristic_email', e.target.value)} />
                </div>
              </div>
            </TabsContent>}
            </fieldset>
          </ScrollArea>
        </Tabs>

        {saveError && <p role="alert" className="shrink-0 px-6 text-sm text-destructive">{saveError}</p>}
        <div data-complex-form-actions className="shrink-0 flex flex-wrap justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
            {text('Close', 'Закрыть', 'ปิด')}
          </Button>
          {footerActions}
          {!locked && <>
            <Button variant={managed ? 'outline' : 'default'} onClick={() => void handleSave(false)} disabled={isPending || !form.name.trim() || !!managed?.blocked || (!!managed && !complex && !managed.spaceId)}>
              {isPending ? text('Saving…', 'Сохраняем…', 'กำลังบันทึก…') : managed ? text('Save draft', 'Сохранить черновик', 'บันทึกฉบับร่าง') : text('Save', 'Сохранить', 'บันทึก')}
            </Button>
            {managed && <Button onClick={() => void handleSave(true)} disabled={isPending || !form.name.trim() || managed.blocked || (!complex && !managed.spaceId)}>{text('Submit for review', 'Отправить на проверку', 'ส่งเพื่อตรวจสอบ')}</Button>}
          </>}

        </div>
      </DialogContent>
    </Dialog>
  );
}
