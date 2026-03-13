import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useAdminWaterActivities, AdminWaterActivity } from '@/hooks/useAdminWaterActivities';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProviderSelector } from '@/components/admin/ProviderSelector';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { Plus, MoreVertical, Pencil, Trash2, Waves } from 'lucide-react';
import { toast } from 'sonner';

const activityCategories = [
  { value: 'diving', label: 'Diving', labelRu: 'Дайвинг' },
  { value: 'snorkeling', label: 'Snorkeling', labelRu: 'Снорклинг' },
  { value: 'kayaking', label: 'Kayaking', labelRu: 'Каякинг' },
  { value: 'surfing', label: 'Surfing', labelRu: 'Серфинг' },
  { value: 'jetski', label: 'Jet Ski', labelRu: 'Гидроцикл' },
  { value: 'parasailing', label: 'Parasailing', labelRu: 'Парасейлинг' },
  { value: 'flyboard', label: 'Flyboard', labelRu: 'Флайборд' },
  { value: 'fishing', label: 'Fishing', labelRu: 'Рыбалка' },
  { value: 'sailing', label: 'Sailing', labelRu: 'Парусный спорт' },
  { value: 'paddleboard', label: 'Paddleboard', labelRu: 'Сап-борд' },
  { value: 'other', label: 'Other', labelRu: 'Другое' },
];

const difficultyLevels = [
  { value: 'beginner', label: 'Beginner', labelRu: 'Начинающий' },
  { value: 'intermediate', label: 'Intermediate', labelRu: 'Средний' },
  { value: 'advanced', label: 'Advanced', labelRu: 'Продвинутый' },
  { value: 'expert', label: 'Expert', labelRu: 'Эксперт' },
];

const pricePers = [
  { value: 'person', label: 'Per Person', labelRu: 'За человека' },
  { value: 'group', label: 'Per Group', labelRu: 'За группу' },
  { value: 'hour', label: 'Per Hour', labelRu: 'За час' },
];

interface WaterActivityFormData {
  provider_id: string | null;
  title_en: string;
  title_ru: string;
  description_en: string;
  description_ru: string;
  category: string;
  difficulty: string;
  cover_image: string;
  images: string[];
  price: number | null;
  price_per: string;
  currency: string;
  duration_minutes: number | null;
  min_participants: number;
  max_participants: number;
  location_name: string;
  meeting_point: string;
  meeting_point_lat: number | null;
  meeting_point_lng: number | null;
  includes: string;
  requirements: string;
  available_days: string;
  available_times: string;
  equipment_included: boolean;
  is_certified: boolean;
  certification_details: string;
  safety_briefing_required: boolean;
  age_restriction: number;
  is_active: boolean;
  is_featured: boolean;
}

const defaultFormData: WaterActivityFormData = {
  provider_id: null,
  title_en: '',
  title_ru: '',
  description_en: '',
  description_ru: '',
  category: 'diving',
  difficulty: 'beginner',
  cover_image: '',
  images: [],
  price: null,
  price_per: 'person',
  currency: 'AED',
  duration_minutes: 60,
  min_participants: 1,
  max_participants: 10,
  location_name: '',
  meeting_point: '',
  meeting_point_lat: null,
  meeting_point_lng: null,
  includes: '',
  requirements: '',
  available_days: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
  available_times: '09:00,10:00,14:00,16:00',
  equipment_included: true,
  is_certified: false,
  certification_details: '',
  safety_briefing_required: true,
  age_restriction: 0,
  is_active: true,
  is_featured: false,
};

const AdminWaterActivities = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterProviderId = searchParams.get('provider') || undefined;
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { activities, isLoading, createActivity, updateActivity, deleteActivity } = useAdminWaterActivities(filterProviderId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminWaterActivity | null>(null);
  const [formData, setFormData] = useState<WaterActivityFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (authLoading || adminLoading) {
    return (
      <PageContainer>
        <PageHeader title="Water Activities" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    navigate(APP_ROUTES.AUTH);
    return null;
  }

  if (!isAdmin) {
    navigate(APP_ROUTES.HOME);
    return null;
  }

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingItem(null);
  };

  const openEditDialog = (item: AdminWaterActivity) => {
    setEditingItem(item);
    setFormData({
      provider_id: item.provider_id,
      title_en: item.title_en || '',
      title_ru: item.title_ru || '',
      description_en: item.description_en || '',
      description_ru: item.description_ru || '',
      category: item.category || 'diving',
      difficulty: item.difficulty || 'beginner',
      cover_image: item.cover_image || '',
      images: item.images || [],
      price: item.price,
      price_per: item.price_per || 'person',
      currency: item.currency || 'AED',
      duration_minutes: item.duration_minutes,
      min_participants: item.min_participants || 1,
      max_participants: item.max_participants || 10,
      location_name: item.location_name || '',
      meeting_point: item.meeting_point || '',
      meeting_point_lat: item.meeting_point_lat,
      meeting_point_lng: item.meeting_point_lng,
      includes: (item.includes || []).join(', '),
      requirements: (item.requirements || []).join(', '),
      available_days: (item.available_days || []).join(','),
      available_times: (item.available_times || []).join(','),
      equipment_included: item.equipment_included ?? true,
      is_certified: item.is_certified || false,
      certification_details: item.certification_details || '',
      safety_briefing_required: item.safety_briefing_required ?? true,
      age_restriction: item.age_restriction || 0,
      is_active: item.is_active ?? true,
      is_featured: item.is_featured || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title_en.trim() || !formData.title_ru.trim()) {
      toast.error('Please fill in required fields (titles)');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSave = {
        ...formData,
        includes: formData.includes.split(',').map((s) => s.trim()).filter(Boolean),
        requirements: formData.requirements.split(',').map((s) => s.trim()).filter(Boolean),
        available_days: formData.available_days.split(',').map((s) => s.trim()).filter(Boolean),
        available_times: formData.available_times.split(',').map((s) => s.trim()).filter(Boolean),
      };

      if (editingItem) {
        await updateActivity(editingItem.id, dataToSave);
      } else {
        await createActivity(dataToSave);
      }
      setIsDialogOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteActivity(id);
    setDeleteConfirmId(null);
  };

  const getCategoryLabel = (cat: string) => {
    const found = activityCategories.find((c) => c.value === cat);
    return found ? (language === 'en' ? found.label : found.labelRu) : cat;
  };

  const getDifficultyLabel = (diff: string) => {
    const found = difficultyLevels.find((d) => d.value === diff);
    return found ? (language === 'en' ? found.label : found.labelRu) : diff;
  };

  return (
    <PageContainer>
      <PageHeader
        title={language === 'en' ? 'Water Activities' : 'Водные активности'}
        actions={
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Add Activity' : 'Добавить активность'}
          </Button>
        }
      />

      {!filterProviderId && (
        <div className="mb-4">
          <ProviderSelector
            value=""
            onChange={(v) => navigate(v ? `/admin/water-activities?provider=${v}` : '/admin/water-activities')}
            label={language === 'en' ? 'Filter by Provider' : 'Фильтр по провайдеру'}
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <Card className="p-8 text-center">
          <Waves className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {language === 'en' ? 'No water activities found' : 'Водные активности не найдены'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <Card key={activity.id} className="p-4">
              <div className="flex items-start gap-4">
                {activity.cover_image && (
                  <img
                    src={activity.cover_image}
                    alt={activity.title_en}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">
                    {language === 'en' ? activity.title_en : activity.title_ru}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {getCategoryLabel(activity.category)} • {getDifficultyLabel(activity.difficulty)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {activity.price && (
                      <span className="text-sm font-medium">
                        {activity.price} {activity.currency}
                      </span>
                    )}
                    {activity.equipment_included && (
                      <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded">
                        {language === 'en' ? 'Equipment' : 'Оборудование'}
                      </span>
                    )}
                    {activity.is_featured && (
                      <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded">
                        {language === 'en' ? 'Featured' : 'Рекомендуемый'}
                      </span>
                    )}
                    {!activity.is_active && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                        {language === 'en' ? 'Inactive' : 'Неактивно'}
                      </span>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(activity)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      {language === 'en' ? 'Edit' : 'Редактировать'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteConfirmId(activity.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {language === 'en' ? 'Delete' : 'Удалить'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? (language === 'en' ? 'Edit Water Activity' : 'Редактировать активность')
                : (language === 'en' ? 'Add Water Activity' : 'Добавить активность')}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Provider */}
              <ProviderSelector
                value={formData.provider_id || ''}
                onChange={(v) => setFormData({ ...formData, provider_id: v || null })}
                label={language === 'en' ? 'Provider' : 'Провайдер'}
              />

              {/* Category & Difficulty */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Category' : 'Категория'}</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activityCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {language === 'en' ? cat.label : cat.labelRu}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === 'en' ? 'Difficulty' : 'Сложность'}</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(v) => setFormData({ ...formData, difficulty: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficultyLevels.map((lvl) => (
                        <SelectItem key={lvl.value} value={lvl.value}>
                          {language === 'en' ? lvl.label : lvl.labelRu}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Titles */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title (EN) *</Label>
                  <Input
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    placeholder="Activity title"
                  />
                </div>
                <div>
                  <Label>Название (RU) *</Label>
                  <Input
                    value={formData.title_ru}
                    onChange={(e) => setFormData({ ...formData, title_ru: e.target.value })}
                    placeholder="Название активности"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Description (EN)</Label>
                  <Textarea
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    placeholder="Description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Описание (RU)</Label>
                  <Textarea
                    value={formData.description_ru}
                    onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                    placeholder="Описание"
                    rows={3}
                  />
                </div>
              </div>

              {/* Images */}
              <div>
                <Label>{language === 'en' ? 'Cover Image' : 'Обложка'}</Label>
                <ImageUpload
                  value={formData.cover_image}
                  onChange={(v) => setFormData({ ...formData, cover_image: v })}
                  folder="water-activities"
                />
              </div>
              <div>
                <Label>{language === 'en' ? 'Gallery' : 'Галерея'}</Label>
                <MultiImageUpload
                  value={formData.images}
                  onChange={(v) => setFormData({ ...formData, images: v })}
                  folder="water-activities"
                  maxImages={6}
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Price' : 'Цена'}</Label>
                  <Input
                    type="number"
                    value={formData.price ?? ''}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Price Per' : 'Цена за'}</Label>
                  <Select
                    value={formData.price_per}
                    onValueChange={(v) => setFormData({ ...formData, price_per: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pricePers.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {language === 'en' ? p.label : p.labelRu}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === 'en' ? 'Duration (min)' : 'Длительность (мин)'}</Label>
                  <Input
                    type="number"
                    value={formData.duration_minutes ?? ''}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
              </div>

              {/* Participants */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Min Participants' : 'Мин. участников'}</Label>
                  <Input
                    type="number"
                    value={formData.min_participants}
                    onChange={(e) => setFormData({ ...formData, min_participants: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Max Participants' : 'Макс. участников'}</Label>
                  <Input
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Location Name' : 'Название места'}</Label>
                  <Input
                    value={formData.location_name}
                    onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Meeting Point' : 'Точка сбора'}</Label>
                  <Input
                    value={formData.meeting_point}
                    onChange={(e) => setFormData({ ...formData, meeting_point: e.target.value })}
                  />
                </div>
              </div>

              {/* Includes & Requirements */}
              <div>
                <Label>{language === 'en' ? 'What\'s Included (comma-separated)' : 'Что включено (через запятую)'}</Label>
                <Input
                  value={formData.includes}
                  onChange={(e) => setFormData({ ...formData, includes: e.target.value })}
                  placeholder="Equipment, Instructor, Photos"
                />
              </div>
              <div>
                <Label>{language === 'en' ? 'Requirements (comma-separated)' : 'Требования (через запятую)'}</Label>
                <Input
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Swimming ability, Health certificate"
                />
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Available Days' : 'Дни работы'}</Label>
                  <Input
                    value={formData.available_days}
                    onChange={(e) => setFormData({ ...formData, available_days: e.target.value })}
                    placeholder="Mon,Tue,Wed,Thu,Fri,Sat,Sun"
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Available Times' : 'Время'}</Label>
                  <Input
                    value={formData.available_times}
                    onChange={(e) => setFormData({ ...formData, available_times: e.target.value })}
                    placeholder="09:00,10:00,14:00"
                  />
                </div>
              </div>

              {/* Age Restriction */}
              <div>
                <Label>{language === 'en' ? 'Minimum Age' : 'Минимальный возраст'}</Label>
                <Input
                  type="number"
                  value={formData.age_restriction}
                  onChange={(e) => setFormData({ ...formData, age_restriction: Number(e.target.value) })}
                />
              </div>

              {/* Certification */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>{language === 'en' ? 'Certified' : 'Сертифицировано'}</Label>
                  <Switch
                    checked={formData.is_certified}
                    onCheckedChange={(v) => setFormData({ ...formData, is_certified: v })}
                  />
                </div>
                {formData.is_certified && (
                  <div>
                    <Label>{language === 'en' ? 'Certification Details' : 'Детали сертификации'}</Label>
                    <Input
                      value={formData.certification_details}
                      onChange={(e) => setFormData({ ...formData, certification_details: e.target.value })}
                      placeholder="PADI, SSI, etc."
                    />
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>{language === 'en' ? 'Equipment Included' : 'Оборудование включено'}</Label>
                  <Switch
                    checked={formData.equipment_included}
                    onCheckedChange={(v) => setFormData({ ...formData, equipment_included: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{language === 'en' ? 'Safety Briefing Required' : 'Инструктаж обязателен'}</Label>
                  <Switch
                    checked={formData.safety_briefing_required}
                    onCheckedChange={(v) => setFormData({ ...formData, safety_briefing_required: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{language === 'en' ? 'Active' : 'Активно'}</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{language === 'en' ? 'Featured' : 'Рекомендуемый'}</Label>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {language === 'en' ? 'Cancel' : 'Отмена'}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? (language === 'en' ? 'Saving...' : 'Сохранение...')
                : (language === 'en' ? 'Save' : 'Сохранить')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'en' ? 'Delete Water Activity?' : 'Удалить активность?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'en'
                ? 'This action cannot be undone.'
                : 'Это действие нельзя отменить.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'en' ? 'Cancel' : 'Отмена'}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              {language === 'en' ? 'Delete' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default AdminWaterActivities;
