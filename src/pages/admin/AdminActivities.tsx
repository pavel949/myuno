import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useAdminActivities } from '@/hooks/useAdminContent';
import { VendorActivity } from '@/hooks/useVendorActivities';

import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { ProviderSelector } from '@/components/admin/ProviderSelector';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Waves, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Users,
  MapPin,
  Loader2,
  Shield
} from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';

const activityCategories = [
  { id: 'diving', label: 'Diving', labelRu: 'Дайвинг' },
  { id: 'snorkeling', label: 'Snorkeling', labelRu: 'Снорклинг' },
  { id: 'surfing', label: 'Surfing', labelRu: 'Серфинг' },
  { id: 'kayaking', label: 'Kayaking', labelRu: 'Каякинг' },
  { id: 'jet-ski', label: 'Jet Ski', labelRu: 'Гидроцикл' },
  { id: 'parasailing', label: 'Parasailing', labelRu: 'Парасейлинг' },
  { id: 'fishing', label: 'Fishing', labelRu: 'Рыбалка' },
  { id: 'sailing', label: 'Sailing', labelRu: 'Яхтинг' },
];

const difficultyLevels = [
  { id: 'beginner', label: 'Beginner', labelRu: 'Новичок' },
  { id: 'intermediate', label: 'Intermediate', labelRu: 'Средний' },
  { id: 'advanced', label: 'Advanced', labelRu: 'Продвинутый' },
];

export default function AdminActivities() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  
  const [filterProviderId, setFilterProviderId] = useState<string>('');
  const { activities, isLoading: activitiesLoading, createActivity, updateActivity, deleteActivity } = useAdminActivities(filterProviderId || undefined);
  
  const [isDialogOpen, setIsDialogOpen] = useState(searchParams.get('action') === 'new');
  const [editingActivity, setEditingActivity] = useState<VendorActivity | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    provider_id: '',
    title_en: '',
    title_ru: '',
    description_en: '',
    description_ru: '',
    category: 'diving',
    difficulty: 'beginner',
    duration_minutes: '60',
    price: '',
    price_per: 'person',
    min_participants: '1',
    max_participants: '10',
    age_restriction: '',
    location_name: '',
    meeting_point: '',
    equipment_included: true,
    is_certified: false,
    safety_briefing_required: true,
    cover_image: '',
    images: [] as string[],
    includes: '',
    requirements: '',
    is_active: true,
  });

  const isRussian = language === 'ru';

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  React.useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, user, navigate]);

  const resetForm = () => {
    setFormData({
      provider_id: '',
      title_en: '',
      title_ru: '',
      description_en: '',
      description_ru: '',
      category: 'diving',
      difficulty: 'beginner',
      duration_minutes: '60',
      price: '',
      price_per: 'person',
      min_participants: '1',
      max_participants: '10',
      age_restriction: '',
      location_name: '',
      meeting_point: '',
      equipment_included: true,
      is_certified: false,
      safety_briefing_required: true,
      cover_image: '',
      images: [],
      includes: '',
      requirements: '',
      is_active: true,
    });
    setEditingActivity(null);
  };

  const openEditDialog = (activity: VendorActivity) => {
    setEditingActivity(activity);
    setFormData({
      provider_id: activity.provider_id || '',
      title_en: activity.title_en,
      title_ru: activity.title_ru || '',
      description_en: activity.description_en || '',
      description_ru: activity.description_ru || '',
      category: activity.category || 'diving',
      difficulty: activity.difficulty || 'beginner',
      duration_minutes: activity.duration_minutes?.toString() || '60',
      price: activity.price?.toString() || '',
      price_per: activity.price_per || 'person',
      min_participants: activity.min_participants?.toString() || '1',
      max_participants: activity.max_participants?.toString() || '10',
      age_restriction: activity.age_restriction?.toString() || '',
      location_name: activity.location_name || '',
      meeting_point: activity.meeting_point || '',
      equipment_included: activity.equipment_included ?? true,
      is_certified: activity.is_certified ?? false,
      safety_briefing_required: activity.safety_briefing_required ?? true,
      cover_image: activity.cover_image || '',
      images: activity.images || [],
      includes: (activity.includes || []).join('\n'),
      requirements: (activity.requirements || []).join('\n'),
      is_active: activity.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title_en || !formData.price || !formData.provider_id) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Please fill required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const includesArray = formData.includes.split('\n').filter(s => s.trim());
      const requirementsArray = formData.requirements.split('\n').filter(s => s.trim());

      const activityData = {
        provider_id: formData.provider_id,
        title_en: formData.title_en,
        title_ru: formData.title_ru || formData.title_en,
        description_en: formData.description_en || undefined,
        description_ru: formData.description_ru || undefined,
        category: formData.category,
        difficulty: formData.difficulty,
        duration_minutes: parseInt(formData.duration_minutes) || 60,
        price: parseFloat(formData.price),
        price_per: formData.price_per,
        currency: 'THB',
        min_participants: parseInt(formData.min_participants) || 1,
        max_participants: parseInt(formData.max_participants) || 10,
        age_restriction: formData.age_restriction ? parseInt(formData.age_restriction) : undefined,
        location_name: formData.location_name || undefined,
        meeting_point: formData.meeting_point || undefined,
        equipment_included: formData.equipment_included,
        is_certified: formData.is_certified,
        safety_briefing_required: formData.safety_briefing_required,
        cover_image: formData.cover_image || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        includes: includesArray.length > 0 ? includesArray : undefined,
        requirements: requirementsArray.length > 0 ? requirementsArray : undefined,
        is_active: formData.is_active,
      };

      if (editingActivity) {
        const { error } = await updateActivity(editingActivity.id, activityData);
        if (error) throw error;
        toast.success(isRussian ? 'Активность обновлена' : 'Activity updated');
      } else {
        const { error } = await createActivity(activityData);
        if (error) throw error;
        toast.success(isRussian ? 'Активность создана' : 'Activity created');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving activity:', error);
      toast.error(isRussian ? 'Ошибка при сохранении' : 'Error saving activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (activityId: string) => {
    try {
      const { error } = await deleteActivity(activityId);
      if (error) throw error;
      toast.success(isRussian ? 'Активность удалена' : 'Activity deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error(isRussian ? 'Ошибка при удалении' : 'Error deleting activity');
    }
  };

  if (authLoading || adminLoading) {
    return (
      <>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </PageContainer>
      </>
    );
  }

  if (!isAdmin) return null;

  return (
    <>
      <PageContainer>
        <PageHeader 
          title={isRussian ? 'Управление активностями' : 'Activity Management'}
          showBack
        />

        <Button 
          className="w-full mb-4" 
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isRussian ? 'Добавить активность' : 'Add Activity'}
        </Button>

        {activitiesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Waves className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">
                {isRussian ? 'Нет активностей' : 'No activities'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRussian ? 'Добавьте активности' : 'Add activities'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <Card key={activity.id} className={!activity.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {activity.cover_image ? (
                      <img 
                        src={activity.cover_image} 
                        alt={activity.title_en}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                        <Waves className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">
                              {isRussian ? activity.title_ru : activity.title_en}
                            </h3>
                            {activity.is_certified && (
                              <Shield className="h-4 w-4 text-green-500" />
                            )}
                            {!activity.is_active && (
                              <Badge variant="outline" className="text-xs">
                                {isRussian ? 'Неактивна' : 'Inactive'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {activity.duration_minutes}min
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {activity.min_participants}-{activity.max_participants}
                            </span>
                          </div>
                          {activity.location_name && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                              <MapPin className="h-3 w-3" />
                              {activity.location_name}
                            </p>
                          )}
                          <p className="font-bold text-primary">
                            ฿{activity.price?.toLocaleString()}/{activity.price_per || 'person'}
                          </p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(activity)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {isRussian ? 'Редактировать' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-500"
                              onClick={() => setDeleteConfirmId(activity.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {isRussian ? 'Удалить' : 'Delete'}
                            </DropdownMenuItem>
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

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingActivity 
                  ? (isRussian ? 'Редактировать активность' : 'Edit Activity')
                  : (isRussian ? 'Новая активность' : 'New Activity')}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Provider Selection */}
              <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed">
                <ProviderSelector
                  value={formData.provider_id}
                  onChange={(id) => setFormData(prev => ({ ...prev, provider_id: id }))}
                  label={isRussian ? 'Привязать к провайдеру' : 'Assign to Provider'}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRussian ? 'Категория' : 'Category'}</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activityCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {isRussian ? cat.labelRu : cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isRussian ? 'Уровень' : 'Difficulty'}</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficultyLevels.map(level => (
                        <SelectItem key={level.id} value={level.id}>
                          {isRussian ? level.labelRu : level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isRussian ? 'Обложка' : 'Cover Image'}</Label>
                <ImageUpload
                  value={formData.cover_image}
                  onChange={(url) => setFormData(prev => ({ ...prev, cover_image: url }))}
                  folder="activities"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRussian ? 'Название (EN) *' : 'Title (EN) *'}</Label>
                  <Input
                    value={formData.title_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRussian ? 'Название (RU)' : 'Title (Russian)'}</Label>
                  <Input
                    value={formData.title_ru}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_ru: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRussian ? 'Описание (EN)' : 'Description (EN)'}</Label>
                  <Textarea
                    value={formData.description_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRussian ? 'Описание (RU)' : 'Description (Russian)'}</Label>
                  <Textarea
                    value={formData.description_ru}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{isRussian ? 'Цена (฿) *' : 'Price (฿) *'}</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRussian ? 'За' : 'Per'}</Label>
                  <Select
                    value={formData.price_per}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, price_per: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="person">{isRussian ? 'Человек' : 'Person'}</SelectItem>
                      <SelectItem value="group">{isRussian ? 'Группа' : 'Group'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isRussian ? 'Длительность (мин)' : 'Duration (min)'}</Label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{isRussian ? 'Мин. участников' : 'Min Participants'}</Label>
                  <Input
                    type="number"
                    value={formData.min_participants}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_participants: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRussian ? 'Макс. участников' : 'Max Participants'}</Label>
                  <Input
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_participants: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRussian ? 'Мин. возраст' : 'Min Age'}</Label>
                  <Input
                    type="number"
                    value={formData.age_restriction}
                    onChange={(e) => setFormData(prev => ({ ...prev, age_restriction: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRussian ? 'Локация' : 'Location'}</Label>
                  <Input
                    value={formData.location_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRussian ? 'Место встречи' : 'Meeting Point'}</Label>
                  <Input
                    value={formData.meeting_point}
                    onChange={(e) => setFormData(prev => ({ ...prev, meeting_point: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{isRussian ? 'Оборудование включено' : 'Equipment Included'}</Label>
                  <Switch
                    checked={formData.equipment_included}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, equipment_included: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{isRussian ? 'Сертифицированный' : 'Certified'}</Label>
                  <Switch
                    checked={formData.is_certified}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_certified: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{isRussian ? 'Активен' : 'Active'}</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingActivity 
                  ? (isRussian ? 'Сохранить' : 'Save')
                  : (isRussian ? 'Создать' : 'Create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRussian ? 'Удалить активность?' : 'Delete activity?'}</DialogTitle>
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
              <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
                {isRussian ? 'Удалить' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
