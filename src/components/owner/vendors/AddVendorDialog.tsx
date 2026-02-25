import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import { VENDOR_CATEGORIES, type VendorCategory } from '@/hooks/useOwnerVendors';

interface AddVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  isSaving: boolean;
  initialData?: any;
}

export function AddVendorDialog({ open, onOpenChange, onSave, isSaving, initialData }: AddVendorDialogProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    name_ru: initialData?.name_ru ?? '',
    category: initialData?.category ?? 'other',
    contact_person: initialData?.contact_person ?? '',
    phone: initialData?.phone ?? '',
    email: initialData?.email ?? '',
    whatsapp: initialData?.whatsapp ?? '',
    line_id: initialData?.line_id ?? '',
    address: initialData?.address ?? '',
    photo_url: initialData?.photo_url ?? '',
    notes: initialData?.notes ?? '',
    source: initialData?.source ?? 'own',
  });

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? (isRu ? 'Редактировать' : 'Edit Vendor') : (isRu ? 'Новый поставщик' : 'New Vendor')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo */}
          <div>
            <Label className="mb-1.5 block">{isRu ? 'Фото' : 'Photo'}</Label>
            <UnifiedMediaUploader
              mode="avatar"
              value={form.photo_url}
              onChange={(url) => setForm(f => ({ ...f, photo_url: typeof url === 'string' ? url : '' }))}
              name={form.name}
              folder="vendors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">{isRu ? 'Имя (EN)' : 'Name (EN)'}</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Somchai Electric" />
            </div>
            <div>
              <Label className="mb-1.5 block">{isRu ? 'Имя (RU)' : 'Name (RU)'}</Label>
              <Input value={form.name_ru} onChange={e => setForm(f => ({ ...f, name_ru: e.target.value }))} placeholder="Сомчай Электрик" />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">{isRu ? 'Категория' : 'Category'}</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VENDOR_CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{isRu ? c.ru : c.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block">{isRu ? 'Контактное лицо' : 'Contact Person'}</Label>
            <Input value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">{isRu ? 'Телефон' : 'Phone'}</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+66 8x xxx xxxx" />
            </div>
            <div>
              <Label className="mb-1.5 block">WhatsApp</Label>
              <Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Email</Label>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-1.5 block">LINE ID</Label>
              <Input value={form.line_id} onChange={e => setForm(f => ({ ...f, line_id: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">{isRu ? 'Адрес' : 'Address'}</Label>
            <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>

          <div>
            <Label className="mb-1.5 block">{isRu ? 'Источник' : 'Source'}</Label>
            <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="own">{isRu ? 'Свой поставщик' : 'Own vendor'}</SelectItem>
                <SelectItem value="myuno">{isRu ? 'Через myUNO' : 'Via myUNO'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block">{isRu ? 'Заметки' : 'Notes'}</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>

          <Button onClick={handleSave} disabled={isSaving || !form.name.trim()} className="w-full">
            {isSaving ? (isRu ? 'Сохранение...' : 'Saving...') : (isRu ? 'Сохранить' : 'Save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
