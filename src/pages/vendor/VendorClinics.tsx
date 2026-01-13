import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useVendorClinics, VendorClinic } from '@/hooks/useVendorClinics';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Stethoscope, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  MapPin,
  Phone,
  Star,
  Clock
} from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';

const clinicTypes = [
  { value: 'general', label: 'General Clinic', labelRu: 'Общая клиника' },
  { value: 'dental', label: 'Dental', labelRu: 'Стоматология' },
  { value: 'hospital', label: 'Hospital', labelRu: 'Госпиталь' },
  { value: 'specialist', label: 'Specialist Clinic', labelRu: 'Специализированная клиника' },
  { value: 'laboratory', label: 'Laboratory', labelRu: 'Лаборатория' },
  { value: 'pharmacy', label: 'Pharmacy with Consultation', labelRu: 'Аптека с консультацией' },
];

const specialtiesList = [
  { value: 'general', label: 'General Practice', labelRu: 'Терапия' },
  { value: 'dental', label: 'Dentistry', labelRu: 'Стоматология' },
  { value: 'dermatology', label: 'Dermatology', labelRu: 'Дерматология' },
  { value: 'cardiology', label: 'Cardiology', labelRu: 'Кардиология' },
  { value: 'pediatrics', label: 'Pediatrics', labelRu: 'Педиатрия' },
  { value: 'gynecology', label: 'Gynecology', labelRu: 'Гинекология' },
  { value: 'orthopedics', label: 'Orthopedics', labelRu: 'Ортопедия' },
  { value: 'ophthalmology', label: 'Ophthalmology', labelRu: 'Офтальмология' },
  { value: 'ent', label: 'ENT', labelRu: 'ЛОР' },
  { value: 'psychology', label: 'Psychology', labelRu: 'Психология' },
];

const languagesList = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'th', label: 'ไทย' },
  { value: 'zh', label: '中文' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
];

const VendorClinics = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { clinics, isLoading: clinicsLoading, createClinic, updateClinic, deleteClinic } = useVendorClinics(profile?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<VendorClinic | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name_en: '',
    name_ru: '',
    description_en: '',
    description_ru: '',
    clinic_type: 'general',
    specialty: [] as string[],
    cover_image: '',
    images: [] as string[],
    address: '',
    district: '',
    phone: '',
    email: '',
    website: '',
    languages: ['en'] as string[],
    consultation_price: '',
    is_24h: false,
    is_featured: false,
    is_active: true,
  });

  const isRussian = language === 'ru';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!profileLoading && !profile && user) {
      navigate('/vendor/onboarding');
    }
  }, [profile, profileLoading, user, navigate]);

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_ru: '',
      description_en: '',
      description_ru: '',
      clinic_type: 'general',
      specialty: [],
      cover_image: '',
      images: [],
      address: '',
      district: '',
      phone: '',
      email: '',
      website: '',
      languages: ['en'],
      consultation_price: '',
      is_24h: false,
      is_featured: false,
      is_active: true,
    });
    setEditingClinic(null);
  };

  const openEditDialog = (clinic: VendorClinic) => {
    setEditingClinic(clinic);
    setFormData({
      name_en: clinic.name_en || '',
      name_ru: clinic.name_ru || '',
      description_en: clinic.description_en || '',
      description_ru: clinic.description_ru || '',
      clinic_type: clinic.clinic_type || 'general',
      specialty: clinic.specialty || [],
      cover_image: clinic.cover_image || '',
      images: clinic.images || [],
      address: clinic.address || '',
      district: clinic.district || '',
      phone: clinic.phone || '',
      email: clinic.email || '',
      website: clinic.website || '',
      languages: clinic.languages || ['en'],
      consultation_price: clinic.consultation_price?.toString() || '',
      is_24h: clinic.is_24h || false,
      is_featured: clinic.is_featured || false,
      is_active: clinic.is_active !== false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name_en || !formData.name_ru) {
      toast.error(isRussian ? 'Заполните название на обоих языках' : 'Please fill in name in both languages');
      return;
    }

    setIsSubmitting(true);
    try {
      const clinicData = {
        name_en: formData.name_en,
        name_ru: formData.name_ru,
        description_en: formData.description_en || null,
        description_ru: formData.description_ru || null,
        clinic_type: formData.clinic_type,
        specialty: formData.specialty,
        cover_image: formData.cover_image || null,
        images: formData.images,
        address: formData.address || null,
        district: formData.district || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        languages: formData.languages,
        consultation_price: formData.consultation_price ? parseFloat(formData.consultation_price) : null,
        is_24h: formData.is_24h,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        currency: 'THB',
      };

      if (editingClinic) {
        const { error } = await updateClinic(editingClinic.id, clinicData);
        if (error) throw error;
        toast.success(isRussian ? 'Клиника обновлена' : 'Clinic updated');
      } else {
        const { error } = await createClinic(clinicData);
        if (error) throw error;
        toast.success(isRussian ? 'Клиника добавлена' : 'Clinic added');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving clinic:', error);
      toast.error(isRussian ? 'Ошибка сохранения' : 'Error saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const { error } = await deleteClinic(deleteConfirmId);
      if (error) throw error;
      toast.success(isRussian ? 'Клиника удалена' : 'Clinic deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting clinic:', error);
      toast.error(isRussian ? 'Ошибка удаления' : 'Error deleting');
    }
  };

  const handleSpecialtyToggle = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specialty: prev.specialty.includes(spec)
        ? prev.specialty.filter(s => s !== spec)
        : [...prev.specialty, spec]
    }));
  };

  const handleLanguageToggle = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  if (authLoading || profileLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRussian ? 'Мои клиники' : 'My Clinics'} 
          showBack 
        />

        <div className="flex justify-end mb-4">
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            {isRussian ? 'Добавить клинику' : 'Add Clinic'}
          </Button>
        </div>

        {clinicsLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : clinics.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Stethoscope className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {isRussian ? 'У вас пока нет клиник' : 'You have no clinics yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {clinics.map((clinic) => (
              <Card key={clinic.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex gap-4">
                    <div className="w-32 h-32 flex-shrink-0">
                      <img
                        src={clinic.cover_image || '/placeholder.svg'}
                        alt={isRussian ? clinic.name_ru : clinic.name_en}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 py-3 pr-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {isRussian ? clinic.name_ru : clinic.name_en}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Badge variant="outline">
                              {clinicTypes.find(t => t.value === clinic.clinic_type)?.[isRussian ? 'labelRu' : 'label'] || clinic.clinic_type}
                            </Badge>
                            {clinic.is_24h && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                24/7
                              </Badge>
                            )}
                            {!clinic.is_active && (
                              <Badge variant="secondary">
                                {isRussian ? 'Неактивна' : 'Inactive'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(clinic)}>
                              <Edit className="w-4 h-4 mr-2" />
                              {isRussian ? 'Редактировать' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteConfirmId(clinic.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {isRussian ? 'Удалить' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {clinic.address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {clinic.address}
                          </div>
                        )}
                        {clinic.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {clinic.phone}
                          </div>
                        )}
                        {clinic.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {clinic.rating.toFixed(1)} ({clinic.review_count})
                          </div>
                        )}
                      </div>
                      {clinic.consultation_price && (
                        <p className="mt-2 font-medium text-primary">
                          {isRussian ? 'Консультация' : 'Consultation'}: ฿{clinic.consultation_price}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingClinic 
                  ? (isRussian ? 'Редактировать клинику' : 'Edit Clinic')
                  : (isRussian ? 'Добавить клинику' : 'Add Clinic')
                }
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
              <div className="space-y-6 py-4">
                {/* Cover Image */}
                <div className="space-y-2">
                  <Label>{isRussian ? 'Обложка' : 'Cover Image'}</Label>
                  <ImageUpload
                    value={formData.cover_image}
                    onChange={(url) => setFormData({ ...formData, cover_image: url })}
                    folder="clinics"
                  />
                </div>

                {/* Gallery */}
                <div className="space-y-2">
                  <Label>{isRussian ? 'Галерея' : 'Gallery'}</Label>
                  <MultiImageUpload
                    value={formData.images}
                    onChange={(urls) => setFormData({ ...formData, images: urls })}
                    folder="clinics"
                    maxImages={10}
                  />
                </div>

                {/* Names */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Название (EN)' : 'Name (EN)'} *</Label>
                    <Input
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      placeholder="Medical Center"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Название (RU)' : 'Name (RU)'} *</Label>
                    <Input
                      value={formData.name_ru}
                      onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                      placeholder="Медицинский центр"
                    />
                  </div>
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label>{isRussian ? 'Тип клиники' : 'Clinic Type'}</Label>
                  <Select value={formData.clinic_type} onValueChange={(v) => setFormData({ ...formData, clinic_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {clinicTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {isRussian ? type.labelRu : type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Specialties */}
                <div className="space-y-2">
                  <Label>{isRussian ? 'Специализации' : 'Specialties'}</Label>
                  <div className="flex flex-wrap gap-2">
                    {specialtiesList.map(spec => (
                      <Badge
                        key={spec.value}
                        variant={formData.specialty.includes(spec.value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleSpecialtyToggle(spec.value)}
                      >
                        {isRussian ? spec.labelRu : spec.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Описание (EN)' : 'Description (EN)'}</Label>
                    <Textarea
                      value={formData.description_en}
                      onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Описание (RU)' : 'Description (RU)'}</Label>
                    <Textarea
                      value={formData.description_ru}
                      onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Адрес' : 'Address'}</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Район' : 'District'}</Label>
                    <Input
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Телефон' : 'Phone'}</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Сайт' : 'Website'}</Label>
                    <Input
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>
                </div>

                {/* Languages */}
                <div className="space-y-2">
                  <Label>{isRussian ? 'Языки обслуживания' : 'Languages'}</Label>
                  <div className="flex flex-wrap gap-2">
                    {languagesList.map(lang => (
                      <Badge
                        key={lang.value}
                        variant={formData.languages.includes(lang.value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleLanguageToggle(lang.value)}
                      >
                        {lang.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label>{isRussian ? 'Цена консультации (THB)' : 'Consultation Price (THB)'}</Label>
                  <Input
                    type="number"
                    value={formData.consultation_price}
                    onChange={(e) => setFormData({ ...formData, consultation_price: e.target.value })}
                  />
                </div>

                {/* Toggles */}
                <div className="flex items-center justify-between">
                  <Label>{isRussian ? 'Работает 24/7' : 'Open 24/7'}</Label>
                  <Switch
                    checked={formData.is_24h}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_24h: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{isRussian ? 'Активна' : 'Active'}</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{isRussian ? 'Рекомендуемая' : 'Featured'}</Label>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingClinic 
                  ? (isRussian ? 'Сохранить' : 'Save')
                  : (isRussian ? 'Добавить' : 'Add')
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRussian ? 'Удалить клинику?' : 'Delete Clinic?'}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              {isRussian 
                ? 'Это действие нельзя отменить.' 
                : 'This action cannot be undone.'}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                {isRussian ? 'Удалить' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </AppLayout>
  );
};

export default VendorClinics;
