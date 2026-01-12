import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useVendorTours, VendorTour } from '@/hooks/useVendorTours';
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
  Map, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Users,
  MapPin,
  Loader2,
  Star,
  X
} from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { CardPreview, CardPreviewSection } from '@/components/vendor/CardPreview';

const tourCategories = [
  { id: 'island', label: 'Island Hopping', labelRu: 'Острова' },
  { id: 'cultural', label: 'Cultural', labelRu: 'Культурный' },
  { id: 'adventure', label: 'Adventure', labelRu: 'Приключения' },
  { id: 'nature', label: 'Nature', labelRu: 'Природа' },
  { id: 'food', label: 'Food Tour', labelRu: 'Гастрономический' },
  { id: 'city', label: 'City Tour', labelRu: 'Городской' },
];

const difficultyLevels = [
  { id: 'easy', label: 'Easy', labelRu: 'Лёгкий' },
  { id: 'moderate', label: 'Moderate', labelRu: 'Средний' },
  { id: 'challenging', label: 'Challenging', labelRu: 'Сложный' },
];

const VendorTours = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { tours, isLoading: toursLoading, createTour, updateTour, deleteTour } = useVendorTours(profile?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<VendorTour | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title_en: '',
    title_ru: '',
    description_en: '',
    description_ru: '',
    category: 'island',
    difficulty: 'easy',
    duration_hours: '4',
    price: '',
    max_participants: '10',
    meeting_point: '',
    cover_image: '',
    images: [] as string[],
    includes: '',
    highlights: '',
    is_active: true,
  });

  const isRussian = language === 'ru';

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  React.useEffect(() => {
    if (!profileLoading && !profile && user) {
      navigate('/vendor/onboarding');
    }
  }, [profile, profileLoading, user, navigate]);

  const resetForm = () => {
    setFormData({
      title_en: '',
      title_ru: '',
      description_en: '',
      description_ru: '',
      category: 'island',
      difficulty: 'easy',
      duration_hours: '4',
      price: '',
      max_participants: '10',
      meeting_point: '',
      cover_image: '',
      images: [],
      includes: '',
      highlights: '',
      is_active: true,
    });
    setEditingTour(null);
  };

  const openEditDialog = (tour: VendorTour) => {
    setEditingTour(tour);
    setFormData({
      title_en: tour.title_en,
      title_ru: tour.title_ru || '',
      description_en: tour.description_en || '',
      description_ru: tour.description_ru || '',
      category: tour.category || 'island',
      difficulty: tour.difficulty || 'easy',
      duration_hours: tour.duration_hours?.toString() || '4',
      price: tour.price?.toString() || '',
      max_participants: tour.max_participants?.toString() || '10',
      meeting_point: tour.meeting_point || '',
      cover_image: tour.cover_image || '',
      images: tour.images || [],
      includes: (tour.includes || []).join('\n'),
      highlights: (tour.highlights || []).join('\n'),
      is_active: tour.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title_en || !formData.price) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Please fill required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const includesArray = formData.includes.split('\n').filter(s => s.trim());
      const highlightsArray = formData.highlights.split('\n').filter(s => s.trim());

      const tourData = {
        title_en: formData.title_en,
        title_ru: formData.title_ru || formData.title_en,
        description_en: formData.description_en || undefined,
        description_ru: formData.description_ru || undefined,
        category: formData.category,
        difficulty: formData.difficulty,
        duration_hours: parseInt(formData.duration_hours) || 4,
        price: parseFloat(formData.price),
        currency: 'THB',
        max_participants: parseInt(formData.max_participants) || 10,
        meeting_point: formData.meeting_point || undefined,
        cover_image: formData.cover_image || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        includes: includesArray.length > 0 ? includesArray : undefined,
        highlights: highlightsArray.length > 0 ? highlightsArray : undefined,
        is_active: formData.is_active,
      };

      if (editingTour) {
        const { error } = await updateTour(editingTour.id, tourData);
        if (error) throw error;
        toast.success(isRussian ? 'Тур обновлён' : 'Tour updated');
      } else {
        const { error } = await createTour(tourData);
        if (error) throw error;
        toast.success(isRussian ? 'Тур создан' : 'Tour created');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving tour:', error);
      toast.error(isRussian ? 'Ошибка при сохранении' : 'Error saving tour');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tourId: string) => {
    try {
      const { error } = await deleteTour(tourId);
      if (error) throw error;
      toast.success(isRussian ? 'Тур удалён' : 'Tour deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting tour:', error);
      toast.error(isRussian ? 'Ошибка при удалении' : 'Error deleting tour');
    }
  };

  if (authLoading || profileLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (!profile) return null;

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRussian ? 'Туры' : 'Tours'}
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
          {isRussian ? 'Добавить тур' : 'Add Tour'}
        </Button>

        {toursLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : tours.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Map className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">
                {isRussian ? 'Нет туров' : 'No tours'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRussian ? 'Добавьте свои туры' : 'Add your tours'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tours.map((tour) => (
              <Card key={tour.id} className={!tour.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {tour.cover_image ? (
                      <img 
                        src={tour.cover_image} 
                        alt={tour.title_en}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                        <Map className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">
                              {isRussian ? tour.title_ru : tour.title_en}
                            </h3>
                            {!tour.is_active && (
                              <Badge variant="outline" className="text-xs">
                                {isRussian ? 'Неактивен' : 'Inactive'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {tour.duration_hours}h
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {tour.max_participants}
                            </span>
                            {tour.rating && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                {tour.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                          {tour.meeting_point && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                              <MapPin className="h-3 w-3" />
                              {tour.meeting_point}
                            </p>
                          )}
                          <p className="font-bold text-primary">
                            ฿{tour.price?.toLocaleString()}
                          </p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(tour)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {isRussian ? 'Редактировать' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-500"
                              onClick={() => setDeleteConfirmId(tour.id)}
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTour 
                  ? (isRussian ? 'Редактировать тур' : 'Edit Tour')
                  : (isRussian ? 'Новый тур' : 'New Tour')}
              </DialogTitle>
            </DialogHeader>

            <div className="grid md:grid-cols-[1fr,280px] gap-6 py-4">
              {/* Form */}
              <div className="space-y-4">
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
                        {tourCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {isRussian ? cat.labelRu : cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Сложность' : 'Difficulty'}</Label>
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
                  <Label htmlFor="title_en">{isRussian ? 'Название (EN) *' : 'Title (EN) *'}</Label>
                  <Input
                    id="title_en"
                    value={formData.title_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                    placeholder="Phi Phi Islands Day Trip"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title_ru">{isRussian ? 'Название (RU)' : 'Title (Russian)'}</Label>
                  <Input
                    id="title_ru"
                    value={formData.title_ru}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_ru: e.target.value }))}
                    placeholder="Экскурсия на острова Пхи-Пхи"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description_en">{isRussian ? 'Описание (EN)' : 'Description (EN)'}</Label>
                  <Textarea
                    id="description_en"
                    value={formData.description_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description_ru">{isRussian ? 'Описание (RU)' : 'Description (Russian)'}</Label>
                  <Textarea
                    id="description_ru"
                    value={formData.description_ru}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">{isRussian ? 'Цена (฿) *' : 'Price (฿) *'}</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="2500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">{isRussian ? 'Длительность (ч)' : 'Duration (hours)'}</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration_hours}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_participants">{isRussian ? 'Макс. участников' : 'Max Participants'}</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_participants: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meeting_point">{isRussian ? 'Место встречи' : 'Meeting Point'}</Label>
                  <Input
                    id="meeting_point"
                    value={formData.meeting_point}
                    onChange={(e) => setFormData(prev => ({ ...prev, meeting_point: e.target.value }))}
                    placeholder="Chalong Pier"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{isRussian ? 'Фото обложки' : 'Cover Image'}</Label>
                  <ImageUpload
                    value={formData.cover_image}
                    onChange={(url) => setFormData(prev => ({ ...prev, cover_image: url }))}
                    folder="tours"
                    placeholder={isRussian ? 'Загрузить фото' : 'Upload photo'}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{isRussian ? 'Галерея фото' : 'Photo Gallery'}</Label>
                  <MultiImageUpload
                    value={formData.images}
                    onChange={(urls) => setFormData(prev => ({ ...prev, images: urls }))}
                    folder="tours"
                    maxImages={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="includes">
                    {isRussian ? 'Что включено (по одному на строку)' : "What's Included (one per line)"}
                  </Label>
                  <Textarea
                    id="includes"
                    value={formData.includes}
                    onChange={(e) => setFormData(prev => ({ ...prev, includes: e.target.value }))}
                    rows={3}
                    placeholder={isRussian 
                      ? "Трансфер из отеля\nОбед\nСнаряжение для снорклинга" 
                      : "Hotel pickup\nLunch\nSnorkeling gear"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="highlights">
                    {isRussian ? 'Основные моменты (по одному на строку)' : 'Highlights (one per line)'}
                  </Label>
                  <Textarea
                    id="highlights"
                    value={formData.highlights}
                    onChange={(e) => setFormData(prev => ({ ...prev, highlights: e.target.value }))}
                    rows={3}
                    placeholder={isRussian 
                      ? "Посещение Maya Bay\nСнорклинг с рыбками\nЗакат на пляже" 
                      : "Visit Maya Bay\nSnorkeling with fish\nBeach sunset"}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">{isRussian ? 'Тур активен' : 'Tour active'}</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
              </div>

              {/* Preview */}
              <CardPreviewSection className="hidden md:block sticky top-0">
                <CardPreview
                  type="tour"
                  image={formData.cover_image}
                  title={formData.title_en}
                  titleRu={formData.title_ru}
                  description={formData.description_en}
                  descriptionRu={formData.description_ru}
                  price={formData.price ? parseFloat(formData.price) : undefined}
                  durationHours={formData.duration_hours ? parseInt(formData.duration_hours) : undefined}
                  maxParticipants={formData.max_participants ? parseInt(formData.max_participants) : undefined}
                  category={formData.category}
                  difficulty={formData.difficulty}
                  meetingPoint={formData.meeting_point}
                />
              </CardPreviewSection>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isRussian ? 'Сохранить' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRussian ? 'Удалить тур?' : 'Delete tour?'}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {isRussian ? 'Это действие нельзя отменить.' : 'This action cannot be undone.'}
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
    </AppLayout>
  );
};

export default VendorTours;
