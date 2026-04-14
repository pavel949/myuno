import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useVendorExperiences, VendorExperience } from '@/hooks/useVendorExperiences';
import { ExperienceType, EXPERIENCE_CATEGORIES } from '@/hooks/useExperiences';
import { experienceDifficultyOptions } from '@/components/filters';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Compass,
  Waves,
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Users,
  MapPin,
  Loader2,
  Star,
  Shield,
} from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { ApprovalStatusBadge, ApprovalStatus } from '@/components/vendor/ApprovalStatusBadge';
import { cn } from '@/lib/utils';

type ViewType = 'all' | 'tour' | 'activity';

const getEmptyFormData = () => ({
  experience_type: 'tour' as ExperienceType,
  title_en: '',
  title_ru: '',
  description_en: '',
  description_ru: '',
  category: 'islands',
  difficulty: 'easy',
  duration_minutes: '240',
  price: '',
  price_per: 'person',
  currency: 'THB',
  min_participants: '1',
  max_participants: '10',
  meeting_point: '',
  location_name: '',
  cover_image: '',
  images: [] as string[],
  equipment_included: false,
  is_certified: false,
  is_active: true,
  external_link: '',
});

export default function VendorExperiences() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const isRu = language === 'ru';
  
  const [viewType, setViewType] = useState<ViewType>('all');
  
  const { experiences, isLoading, createExperience, updateExperience, deleteExperience } = useVendorExperiences(
    profile?.id,
    viewType === 'all' ? undefined : viewType
  );
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VendorExperience | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState(getEmptyFormData());

  // Stats
  const stats = useMemo(() => {
    const tours = experiences.filter(e => e.experience_type === 'tour').length;
    const activities = experiences.filter(e => e.experience_type === 'activity').length;
    return { total: experiences.length, tours, activities };
  }, [experiences]);

  // Form handlers
  const openCreateDialog = () => {
    setEditingItem(null);
    setFormData(getEmptyFormData());
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: VendorExperience) => {
    setEditingItem(item);
    setFormData({
      experience_type: item.experience_type,
      title_en: item.title_en || '',
      title_ru: item.title_ru || '',
      description_en: item.description_en || '',
      description_ru: item.description_ru || '',
      category: item.category || 'islands',
      difficulty: item.difficulty || 'easy',
      duration_minutes: String(item.duration_minutes || 240),
      price: String(item.price || ''),
      price_per: item.price_per || 'person',
      currency: item.currency || 'THB',
      min_participants: String(item.min_participants || 1),
      max_participants: String(item.max_participants || 10),
      meeting_point: item.meeting_point || '',
      location_name: item.location_name || '',
      cover_image: item.cover_image || '',
      images: item.images || [],
      equipment_included: item.equipment_included || false,
      is_certified: item.is_certified || false,
      is_active: item.is_active ?? true,
      external_link: item.external_link || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title_en.trim()) {
      toast.error(isRu ? 'Введите название' : 'Enter a title');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        experience_type: formData.experience_type,
        title_en: formData.title_en.trim(),
        title_ru: formData.title_ru.trim() || formData.title_en.trim(),
        description_en: formData.description_en.trim() || null,
        description_ru: formData.description_ru.trim() || null,
        category: formData.category,
        difficulty: formData.difficulty,
        duration_minutes: parseInt(formData.duration_minutes) || 240,
        price: parseFloat(formData.price) || null,
        price_per: formData.price_per,
        currency: formData.currency,
        min_participants: parseInt(formData.min_participants) || 1,
        max_participants: parseInt(formData.max_participants) || 10,
        meeting_point: formData.meeting_point || null,
        location_name: formData.location_name || null,
        cover_image: formData.cover_image || null,
        images: formData.images,
        equipment_included: formData.equipment_included,
        is_certified: formData.is_certified,
        is_active: formData.is_active,
        external_link: formData.external_link || null,
      };

      if (editingItem) {
        const { error } = await updateExperience(editingItem.id, payload);
        if (error) throw error;
        toast.success(isRu ? 'Обновлено' : 'Updated');
      } else {
        const { error } = await createExperience(payload);
        if (error) throw error;
        toast.success(isRu ? 'Создано! Ожидает модерации.' : 'Created! Pending review.');
      }

      setIsDialogOpen(false);
      setFormData(getEmptyFormData());
      setEditingItem(null);
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(isRu ? 'Ошибка сохранения' : 'Save failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await deleteExperience(id);
      if (error) throw error;
      toast.success(isRu ? 'Удалено' : 'Deleted');
    } catch (err) {
      toast.error(isRu ? 'Ошибка удаления' : 'Delete failed');
    }
    setDeleteConfirmId(null);
  };

  // Loading state
  if (authLoading || profileLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-12 w-48" />
            <div className="grid gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
            </div>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {isRu ? 'Сначала создайте профиль провайдера' : 'Create a provider profile first'}
            </p>
            <Button onClick={() => navigate('/vendor/onboarding')}>
              {isRu ? 'Создать профиль' : 'Create Profile'}
            </Button>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  const formatDuration = (mins: number | null | undefined) => {
    if (!mins) return 'N/A';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title={isRu ? 'Мои Туры и Активности' : 'My Experiences'}
          subtitle={isRu ? `${stats.total} записей` : `${stats.total} items`}
          actions={
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              {isRu ? 'Добавить' : 'Add New'}
            </Button>
          }
        />

        {/* Type Tabs */}
        <Tabs value={viewType} onValueChange={(v) => setViewType(v as ViewType)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              {isRu ? 'Все' : 'All'} ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="tour" className="gap-1.5">
              <Compass className="w-4 h-4" />
              {isRu ? 'Туры' : 'Tours'} ({stats.tours})
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <Waves className="w-4 h-4" />
              {isRu ? 'Активности' : 'Activities'} ({stats.activities})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : experiences.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Compass className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">{isRu ? 'Пока пусто' : 'No experiences yet'}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isRu ? 'Добавьте первый тур или активность' : 'Add your first tour or activity'}
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                {isRu ? 'Добавить' : 'Add New'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {experiences.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      {item.cover_image ? (
                        <img src={item.cover_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.experience_type === 'tour' ? (
                            <Compass className="w-6 h-6 text-muted-foreground" />
                          ) : (
                            <Waves className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              className={cn(
                                "text-xs",
                                item.experience_type === 'tour' 
                                  ? "bg-warning text-warning-foreground" 
                                  : "bg-accent-cyan text-white"
                              )}
                            >
                              {item.experience_type === 'tour' ? (isRu ? 'Тур' : 'Tour') : (isRu ? 'Активность' : 'Activity')}
                            </Badge>
                            <ApprovalStatusBadge status={(item.approval_status || 'pending') as ApprovalStatus} />
                          </div>
                          <h3 className="font-medium line-clamp-1">
                            {isRu ? item.title_ru : item.title_en}
                          </h3>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(item)}>
                              <Edit className="w-4 h-4 mr-2" />
                              {isRu ? 'Редактировать' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {isRu ? 'Удалить' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(item.duration_minutes)}
                        </span>
                        {item.price && (
                          <span className="font-medium text-primary">
                            ฿{item.price.toLocaleString()}
                          </span>
                        )}
                        {item.location_name && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {item.location_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingItem 
                  ? (isRu ? 'Редактировать' : 'Edit')
                  : (isRu ? 'Новый тур/активность' : 'New Experience')
                }
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                {/* Type & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isRu ? 'Тип' : 'Type'}</Label>
                    <Select
                      value={formData.experience_type}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, experience_type: v as ExperienceType }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tour">
                          <span className="flex items-center gap-2">
                            <Compass className="w-4 h-4" />
                            {isRu ? 'Тур' : 'Tour'}
                          </span>
                        </SelectItem>
                        <SelectItem value="activity">
                          <span className="flex items-center gap-2">
                            <Waves className="w-4 h-4" />
                            {isRu ? 'Активность' : 'Activity'}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{isRu ? 'Категория' : 'Category'}</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPERIENCE_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {isRu ? cat.labelRu : cat.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Titles */}
                <div>
                  <Label>Title (EN) *</Label>
                  <Input
                    value={formData.title_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                    placeholder="Island Hopping Tour"
                  />
                </div>
                <div>
                  <Label>Название (RU)</Label>
                  <Input
                    value={formData.title_ru}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_ru: e.target.value }))}
                    placeholder="Тур по островам"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label>Description (EN)</Label>
                  <Textarea
                    value={formData.description_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* Price, Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isRu ? 'Цена (THB)' : 'Price (THB)'}</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="1500"
                    />
                  </div>
                  <div>
                    <Label>{isRu ? 'Длительность (мин)' : 'Duration (min)'}</Label>
                    <Input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                      placeholder="240"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isRu ? 'Место встречи' : 'Meeting point'}</Label>
                    <Input
                      value={formData.meeting_point}
                      onChange={(e) => setFormData(prev => ({ ...prev, meeting_point: e.target.value }))}
                      placeholder="Patong Beach"
                    />
                  </div>
                  <div>
                    <Label>{isRu ? 'Локация' : 'Location'}</Label>
                    <Input
                      value={formData.location_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                      placeholder="Phuket"
                    />
                  </div>
                </div>

                {/* Cover Image */}
                <div>
                  <Label>{isRu ? 'Обложка' : 'Cover image'}</Label>
                  <ImageUpload
                    value={formData.cover_image}
                    onChange={(url) => setFormData(prev => ({ ...prev, cover_image: url }))}
                    folder="experiences"
                  />
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label className="cursor-pointer">{isRu ? 'Активен' : 'Active'}</Label>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label className="cursor-pointer">{isRu ? 'Снаряжение' : 'Equipment'}</Label>
                    <Switch
                      checked={formData.equipment_included}
                      onCheckedChange={(v) => setFormData(prev => ({ ...prev, equipment_included: v }))}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingItem 
                  ? (isRu ? 'Сохранить' : 'Save')
                  : (isRu ? 'Создать' : 'Create')
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRu ? 'Удалить?' : 'Delete?'}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              {isRu ? 'Это действие нельзя отменить.' : 'This action cannot be undone.'}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              >
                {isRu ? 'Удалить' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </AppLayout>
  );
}
