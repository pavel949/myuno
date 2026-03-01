import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import {
  COMPLEX_TYPES, COMPLEX_AMENITIES, COMPLEX_SERVICES,
  COMPLEX_SECURITY, COMPLEX_INFRASTRUCTURE,
} from '@/lib/complexConstants';
import { useCreateComplex, useUpdateComplex, type PropertyComplex, type ComplexFormData } from '@/hooks/usePropertyComplexes';
import { cn } from '@/lib/utils';

interface ComplexFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complex?: PropertyComplex | null;
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
};

export function ComplexFormDialog({ open, onOpenChange, complex }: ComplexFormDialogProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const createMutation = useCreateComplex();
  const updateMutation = useUpdateComplex();
  const [form, setForm] = useState<ComplexFormData>(emptyForm);

  useEffect(() => {
    if (complex) {
      setForm({
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
      });
    } else {
      setForm(emptyForm);
    }
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

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (complex) {
        await updateMutation.mutateAsync({ id: complex.id, ...form });
      } else {
        await createMutation.mutateAsync(form);
      }
      onOpenChange(false);
    } catch (e) {
      // error handled by mutation
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const renderChipGroup = (
    label: string,
    items: readonly { value: string; labelEn: string; labelRu: string; icon: string }[],
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
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all",
                selected
                  ? "bg-primary/10 border-primary/40 text-primary font-medium"
                  : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30 hover:bg-muted"
              )}
            >
              <span>{item.icon}</span>
              <span>{isRu ? item.labelRu : item.labelEn}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>
            {complex 
              ? (isRu ? 'Редактировать комплекс' : 'Edit Complex')
              : (isRu ? 'Новый комплекс' : 'New Complex')
            }
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex-1">
          <div className="px-6 overflow-x-auto">
            <TabsList className="w-full grid grid-cols-3 sm:grid-cols-5 h-auto gap-1">
              <TabsTrigger value="general" className="text-xs py-1.5">{isRu ? 'Основное' : 'General'}</TabsTrigger>
              <TabsTrigger value="location" className="text-xs py-1.5">{isRu ? 'Локация' : 'Location'}</TabsTrigger>
              <TabsTrigger value="media" className="text-xs py-1.5">{isRu ? 'Фото' : 'Media'}</TabsTrigger>
              <TabsTrigger value="amenities" className="text-xs py-1.5">{isRu ? 'Удобства' : 'Amenities'}</TabsTrigger>
              <TabsTrigger value="management" className="text-xs py-1.5">{isRu ? 'Управл.' : 'Mgmt'}</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[55vh] px-6 py-4">
            <TabsContent value="general" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{isRu ? 'Название (EN)' : 'Name (EN)'}</Label>
                  <Input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Palm Garden Residence" />
                </div>
                <div className="space-y-1.5">
                  <Label>{isRu ? 'Название (RU)' : 'Name (RU)'}</Label>
                  <Input value={form.name_ru || ''} onChange={e => setField('name_ru', e.target.value)} placeholder="Палм Гарден Резиденс" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{isRu ? 'Тип комплекса' : 'Complex Type'}</Label>
                <Select value={form.complex_type || 'condo'} onValueChange={v => setField('complex_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMPLEX_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{isRu ? t.labelRu : t.labelEn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label>{isRu ? 'Юнитов' : 'Units'}</Label>
                  <Input type="number" value={form.total_units || ''} onChange={e => setField('total_units', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{isRu ? 'Корпусов' : 'Buildings'}</Label>
                  <Input type="number" value={form.total_buildings || ''} onChange={e => setField('total_buildings', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{isRu ? 'Этажей' : 'Floors'}</Label>
                  <Input type="number" value={form.total_floors || ''} onChange={e => setField('total_floors', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{isRu ? 'Год' : 'Year Built'}</Label>
                  <Input type="number" value={form.year_built || ''} onChange={e => setField('year_built', e.target.value ? Number(e.target.value) : undefined)} placeholder="2020" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{isRu ? 'Описание (EN)' : 'Description (EN)'}</Label>
                  <Textarea value={form.description_en || ''} onChange={e => setField('description_en', e.target.value)} rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label>{isRu ? 'Описание (RU)' : 'Description (RU)'}</Label>
                  <Textarea value={form.description_ru || ''} onChange={e => setField('description_ru', e.target.value)} rows={3} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label>{isRu ? 'Адрес' : 'Address'}</Label>
                <Input value={form.address || ''} onChange={e => setField('address', e.target.value)} placeholder="123/45 Moo 5, Choeng Thale" />
              </div>
              <div className="space-y-1.5">
                <Label>{isRu ? 'Район' : 'District'}</Label>
                <Input value={form.district || ''} onChange={e => setField('district', e.target.value)} placeholder="Bang Tao" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Latitude</Label>
                  <Input type="number" step="any" value={form.lat || ''} onChange={e => setField('lat', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Longitude</Label>
                  <Input type="number" step="any" value={form.lng || ''} onChange={e => setField('lng', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label>{isRu ? 'Обложка' : 'Cover Image'}</Label>
                <UnifiedMediaUploader
                  mode="single"
                  value={form.cover_image || ''}
                  onChange={v => setField('cover_image', typeof v === 'string' ? v : v[0] || '')}
                  folder="complexes/covers"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{isRu ? 'Галерея' : 'Gallery'}</Label>
                <UnifiedMediaUploader
                  mode="gallery"
                  value={form.images || []}
                  onChange={v => setField('images', Array.isArray(v) ? v : [v])}
                  folder="complexes/gallery"
                  maxItems={20}
                />
              </div>
            </TabsContent>

            <TabsContent value="amenities" className="space-y-6 mt-0">
              {renderChipGroup(isRu ? '🏊 Удобства комплекса' : '🏊 Complex Amenities', COMPLEX_AMENITIES, 'amenities')}
              {renderChipGroup(isRu ? '🔔 Услуги' : '🔔 Services', COMPLEX_SERVICES, 'services')}
              {renderChipGroup(isRu ? '🛡️ Безопасность' : '🛡️ Security', COMPLEX_SECURITY, 'security_features')}
              {renderChipGroup(isRu ? '🏪 Инфраструктура' : '🏪 Infrastructure', COMPLEX_INFRASTRUCTURE, 'infrastructure')}
            </TabsContent>

            <TabsContent value="management" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label>CAM Fee (฿/m²)</Label>
                <Input type="number" className="max-w-xs" value={form.cam_fee_per_sqm || ''} onChange={e => setField('cam_fee_per_sqm', e.target.value ? Number(e.target.value) : undefined)} />
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
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isRu ? 'Отмена' : 'Cancel'}
          </Button>
          <Button onClick={handleSave} disabled={isPending || !form.name.trim()}>
            {isPending ? (isRu ? 'Сохранение...' : 'Saving...') : (isRu ? 'Сохранить' : 'Save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
