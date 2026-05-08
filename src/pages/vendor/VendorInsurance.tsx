import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useVerticalCRUD } from '@/hooks/useVerticalCRUD';
import type { InsuranceProvider } from '@/hooks/useInsurance';
import { PageContainer } from '@/components/uno/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Shield, Plus, MoreVertical, Edit, Trash2, Loader2, MapPin, Phone, Clock } from 'lucide-react';
import { ImageUpload } from '@/components/upload/ImageUpload';

const INSURANCE_TYPES = [
  { value: 'health', en: 'Health', ru: 'Здоровье' },
  { value: 'travel', en: 'Travel', ru: 'Путешествия' },
  { value: 'vehicle', en: 'Vehicle', ru: 'Транспорт' },
  { value: 'property', en: 'Property', ru: 'Недвижимость' },
  { value: 'life', en: 'Life', ru: 'Жизнь' },
  { value: 'business', en: 'Business', ru: 'Бизнес' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'th', label: 'ไทย' },
  { value: 'zh', label: '中文' },
];

const initialForm = {
  name_en: '', name_ru: '', description_en: '', description_ru: '',
  address: '', district: '', phone: '', email: '', website: '',
  cover_image: '',
  insurance_types: [] as string[],
  languages: ['en'] as string[],
  has_online_claims: false,
  has_24h_support: false,
  license_number: '',
  is_active: true,
  is_featured: false,
};

const VendorInsurance = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { items, isLoading, create, update, remove } = useVerticalCRUD<InsuranceProvider>('insurance', profile?.id);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InsuranceProvider | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialForm);

  const isRu = language === 'ru';

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!profileLoading && !profile && user) navigate('/vendor/onboarding');
  }, [profile, profileLoading, user, navigate]);

  const resetForm = () => { setFormData(initialForm); setEditingItem(null); };

  const openEditDialog = (item: InsuranceProvider) => {
    setEditingItem(item);
    setFormData({
      name_en: item.name_en, name_ru: item.name_ru || '',
      description_en: item.description_en || '', description_ru: item.description_ru || '',
      address: item.address || '', district: item.district || '',
      phone: item.phone || '', email: item.email || '', website: item.website || '',
      cover_image: item.cover_image || '',
      insurance_types: item.insurance_types || [],
      languages: item.languages || ['en'],
      has_online_claims: item.has_online_claims ?? false,
      has_24h_support: item.has_24h_support ?? false,
      license_number: item.license_number || '',
      is_active: (item as any).is_active ?? true,
      is_featured: item.is_featured ?? false,
    });
    setIsDialogOpen(true);
  };

  const toggleArrayItem = (key: 'insurance_types' | 'languages', value: string) => {
    setFormData(p => ({
      ...p,
      [key]: p[key].includes(value) ? p[key].filter(x => x !== value) : [...p[key], value],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name_en) {
      toast.error(isRu ? 'Заполните название (EN)' : 'Please fill the name (EN)');
      return;
    }
    setIsSubmitting(true);
    try {
      const data: Partial<InsuranceProvider> = {
        name_en: formData.name_en,
        name_ru: formData.name_ru || formData.name_en,
        description_en: formData.description_en || null,
        description_ru: formData.description_ru || null,
        address: formData.address || null,
        district: formData.district || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        cover_image: formData.cover_image || null,
        insurance_types: formData.insurance_types,
        languages: formData.languages,
        has_online_claims: formData.has_online_claims,
        has_24h_support: formData.has_24h_support,
        license_number: formData.license_number || null,
        is_featured: formData.is_featured,
        ...({ is_active: formData.is_active } as any),
      };

      const { error } = editingItem ? await update(editingItem.id, data) : await create(data);
      if (error) throw error;
      toast.success(editingItem ? (isRu ? 'Обновлено' : 'Updated') : (isRu ? 'Добавлено' : 'Added'));
      setIsDialogOpen(false);
      resetForm();
    } catch {
      toast.error(isRu ? 'Ошибка сохранения' : 'Error saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await remove(id);
      if (error) throw error;
      toast.success(isRu ? 'Удалено' : 'Deleted');
      setDeleteConfirmId(null);
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  if (authLoading || profileLoading) {
    return <PageContainer><Skeleton className="h-8 w-48" /></PageContainer>;
  }

  return (
    <PageContainer>
      <Button className="w-full mb-4" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
        <Plus className="h-4 w-4 mr-2" />{isRu ? 'Добавить страховую' : 'Add Insurance Provider'}
      </Button>

      {isLoading ? (
        <div className="space-y-4">{[1, 2].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : items.length === 0 ? (
        <Card><CardContent className="p-8 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-medium mb-1">{isRu ? 'Нет страховых компаний' : 'No insurance providers'}</h3>
          <p className="text-sm text-muted-foreground">{isRu ? 'Добавьте первую страховую' : 'Add your first provider'}</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {item.cover_image ? (
                    <img src={item.cover_image} alt={item.name_en} className="w-20 h-20 rounded-none object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-none bg-muted flex items-center justify-center">
                      <Shield className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-medium">{isRu ? item.name_ru : item.name_en}</h3>
                          {item.has_24h_support && <Badge variant="secondary" className="bg-success/15 text-success text-xs"><Clock className="h-3 w-3 mr-1" />24/7</Badge>}
                          {item.is_featured && <Badge variant="default" className="text-xs">Featured</Badge>}
                        </div>
                        {item.address && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{item.address}</p>
                        )}
                        {item.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{item.phone}</p>
                        )}
                        {item.insurance_types?.length > 0 && (
                          <div className="flex gap-1 flex-wrap mt-1">
                            {item.insurance_types.map(t => {
                              const def = INSURANCE_TYPES.find(x => x.value === t);
                              return <Badge key={t} variant="outline" className="text-xs">{def ? (isRu ? def.ru : def.en) : t}</Badge>;
                            })}
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(item)}><Edit className="h-4 w-4 mr-2" />{isRu ? 'Редактировать' : 'Edit'}</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirmId(item.id)}><Trash2 className="h-4 w-4 mr-2" />{isRu ? 'Удалить' : 'Delete'}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setIsDialogOpen(o); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0"><DialogTitle>{editingItem ? (isRu ? 'Редактировать' : 'Edit Provider') : (isRu ? 'Добавить страховую' : 'Add Provider')}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-140px)] px-6">
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>{isRu ? 'Логотип' : 'Logo'}</Label>
                <ImageUpload value={formData.cover_image} onChange={(url) => setFormData(p => ({ ...p, cover_image: url }))} folder="insurance" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Name (EN) *</Label><Input value={formData.name_en} onChange={(e) => setFormData(p => ({ ...p, name_en: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Name (RU)</Label><Input value={formData.name_ru} onChange={(e) => setFormData(p => ({ ...p, name_ru: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{isRu ? 'Описание (EN)' : 'Description (EN)'}</Label><Textarea value={formData.description_en} onChange={(e) => setFormData(p => ({ ...p, description_en: e.target.value }))} /></div>
                <div className="space-y-2"><Label>{isRu ? 'Описание (RU)' : 'Description (RU)'}</Label><Textarea value={formData.description_ru} onChange={(e) => setFormData(p => ({ ...p, description_ru: e.target.value }))} /></div>
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Виды страхования' : 'Insurance Types'}</Label>
                <div className="flex gap-2 flex-wrap">
                  {INSURANCE_TYPES.map(t => (
                    <Badge
                      key={t.value}
                      variant={formData.insurance_types.includes(t.value) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleArrayItem('insurance_types', t.value)}
                    >
                      {isRu ? t.ru : t.en}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Языки обслуживания' : 'Languages'}</Label>
                <div className="flex gap-2 flex-wrap">
                  {LANGUAGES.map(l => (
                    <Badge
                      key={l.value}
                      variant={formData.languages.includes(l.value) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleArrayItem('languages', l.value)}
                    >
                      {l.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{isRu ? 'Адрес' : 'Address'}</Label><Input value={formData.address} onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))} /></div>
                <div className="space-y-2"><Label>{isRu ? 'Район' : 'District'}</Label><Input value={formData.district} onChange={(e) => setFormData(p => ({ ...p, district: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{isRu ? 'Телефон' : 'Phone'}</Label><Input value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{isRu ? 'Сайт' : 'Website'}</Label><Input value={formData.website} onChange={(e) => setFormData(p => ({ ...p, website: e.target.value }))} /></div>
                <div className="space-y-2"><Label>{isRu ? 'Номер лицензии' : 'License Number'}</Label><Input value={formData.license_number} onChange={(e) => setFormData(p => ({ ...p, license_number: e.target.value }))} /></div>
              </div>

              <div className="flex items-center justify-between"><Label>{isRu ? 'Онлайн-урегулирование' : 'Online Claims'}</Label><Switch checked={formData.has_online_claims} onCheckedChange={(v) => setFormData(p => ({ ...p, has_online_claims: v }))} /></div>
              <div className="flex items-center justify-between"><Label>{isRu ? 'Поддержка 24/7' : '24/7 Support'}</Label><Switch checked={formData.has_24h_support} onCheckedChange={(v) => setFormData(p => ({ ...p, has_24h_support: v }))} /></div>
              <div className="flex items-center justify-between"><Label>{isRu ? 'Активна' : 'Active'}</Label><Switch checked={formData.is_active} onCheckedChange={(v) => setFormData(p => ({ ...p, is_active: v }))} /></div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 pt-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{isRu ? 'Отмена' : 'Cancel'}</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{isRu ? 'Сохранить' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isRu ? 'Удалить?' : 'Delete?'}</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>{isRu ? 'Отмена' : 'Cancel'}</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>{isRu ? 'Удалить' : 'Delete'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default VendorInsurance;
