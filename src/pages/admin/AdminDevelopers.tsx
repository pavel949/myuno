/**
 * Admin Developers Management
 * CRUD for developers table (property developers/builders)
 */
import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  useAdminDevelopers, 
  useCreateDeveloper, 
  useUpdateDeveloper,
  useDeleteDeveloper,
  Developer,
  DeveloperFormData
} from '@/hooks/useAdminDevelopers';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Building2, 
  Plus, 
  Loader2,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  Star,
  Globe,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Target,
} from 'lucide-react';
import { TranslatableInput } from '@/components/forms/TranslatableInput';
import { AirbnbStyleImageUpload } from '@/components/upload/AirbnbStyleImageUpload';
import { BulkLogoUploadModal } from '@/components/admin/developers/BulkLogoUploadModal';
import { Upload } from 'lucide-react';

const getEmptyForm = (): DeveloperFormData => ({
  name_en: '',
  name_ru: '',
  is_active: true,
  is_verified: false,
  is_featured: false,
});

export default function AdminDevelopers() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const { data: developers, isLoading } = useAdminDevelopers();
  const createDeveloper = useCreateDeveloper();
  const updateDeveloper = useUpdateDeveloper();
  const deleteDeveloper = useDeleteDeveloper();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDeveloper, setEditingDeveloper] = useState<Developer | null>(null);
  const [formData, setFormData] = useState<DeveloperFormData>(getEmptyForm());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [bulkLogoOpen, setBulkLogoOpen] = useState(false);

  // Filter developers
  const filteredDevelopers = useMemo(() => {
    if (!developers) return [];
    
    if (!searchQuery.trim()) return developers;
    
    const q = searchQuery.toLowerCase();
    return developers.filter(d => 
      d.name_en.toLowerCase().includes(q) || 
      d.name_ru.toLowerCase().includes(q) ||
      d.headquarters?.toLowerCase().includes(q)
    );
  }, [developers, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    if (!developers) return { total: 0, verified: 0, featured: 0, avgScore: 0 };
    const verified = developers.filter(d => d.is_verified).length;
    const featured = developers.filter(d => d.is_featured).length;
    const scoresSum = developers.reduce((sum, d) => sum + (d.muuno_score || 0), 0);
    const avgScore = developers.length > 0 ? Math.round(scoresSum / developers.length) : 0;
    return { total: developers.length, verified, featured, avgScore };
  }, [developers]);

  const handleOpenCreate = () => {
    setEditingDeveloper(null);
    setFormData(getEmptyForm());
    setIsFormOpen(true);
  };

  const handleOpenEdit = (developer: Developer) => {
    setEditingDeveloper(developer);
    setFormData({
      name_en: developer.name_en,
      name_ru: developer.name_ru,
      slug: developer.slug || undefined,
      description_en: developer.description_en || undefined,
      description_ru: developer.description_ru || undefined,
      logo_url: developer.logo_url || undefined,
      cover_image: developer.cover_image || undefined,
      website: developer.website || undefined,
      phone: developer.phone || undefined,
      email: developer.email || undefined,
      established_year: developer.established_year || undefined,
      headquarters: developer.headquarters || undefined,
      projects_completed: developer.projects_completed || undefined,
      projects_ongoing: developer.projects_ongoing || undefined,
      total_units_delivered: developer.total_units_delivered || undefined,
      muuno_score: developer.muuno_score || undefined,
      is_verified: developer.is_verified,
      is_featured: developer.is_featured,
      is_active: developer.is_active,
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name_en?.trim()) {
      toast.error(isRu ? 'Введите название' : 'Enter name');
      return;
    }

    try {
      if (editingDeveloper) {
        await updateDeveloper.mutateAsync({ id: editingDeveloper.id, ...formData });
      } else {
        await createDeveloper.mutateAsync(formData);
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteDeveloper.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const updateField = (field: keyof DeveloperFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={isRu ? 'Застройщики' : 'Developers'}
        subtitle={isRu ? 'Управление реестром застройщиков' : 'Manage developer registry'}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBulkLogoOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              {isRu ? 'Логотипы' : 'Bulk Logos'}
            </Button>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              {isRu ? 'Новый застройщик' : 'New Developer'}
            </Button>
          </div>
        }
      />
      <BulkLogoUploadModal
        open={bulkLogoOpen}
        onOpenChange={setBulkLogoOpen}
        developers={developers || []}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">
                  {isRu ? 'Всего' : 'Total'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.verified}</div>
                <div className="text-sm text-muted-foreground">
                  {isRu ? 'Верифицированы' : 'Verified'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-warning/10">
                <Star className="h-5 w-5 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.featured}</div>
                <div className="text-sm text-muted-foreground">
                  {isRu ? 'Избранные' : 'Featured'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-accent/10">
                <Target className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.avgScore}</div>
                <div className="text-sm text-muted-foreground">
                  {isRu ? 'Ср. скоринг' : 'Avg Score'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isRu ? 'Поиск застройщиков...' : 'Search developers...'}
          className="pl-10"
        />
      </div>

      {/* Developers Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredDevelopers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery 
                ? (isRu ? 'Застройщики не найдены' : 'No developers found')
                : (isRu ? 'Нет застройщиков. Добавьте первого!' : 'No developers yet. Add your first!')
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDevelopers.map((developer) => (
            <Card 
              key={developer.id} 
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleOpenEdit(developer)}
            >
              {/* Cover/Logo */}
              <div className="aspect-video bg-muted relative">
                {developer.cover_image ? (
                  <img
                    src={developer.cover_image}
                    alt={developer.name_en}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {developer.logo_url ? (
                      <img 
                        src={developer.logo_url} 
                        alt="" 
                        className="max-h-20 max-w-32 object-contain"
                      />
                    ) : (
                      <Building2 className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {developer.is_verified && (
                    <Badge variant="default" className="bg-success">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {developer.is_featured && (
                    <Badge variant="gold">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
                {developer.muuno_score && (
                  <div className="absolute bottom-2 left-2">
                    <div className="w-10 h-10 rounded-full bg-background/90 flex items-center justify-center text-sm font-bold text-primary border-2 border-primary">
                      {developer.muuno_score}
                    </div>
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {isRu ? developer.name_ru : developer.name_en}
                    </h3>
                    {developer.headquarters && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {developer.headquarters}
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(developer.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {developer.established_year && (
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {developer.established_year}
                    </Badge>
                  )}
                  {developer.projects_completed && (
                    <Badge variant="secondary" className="text-xs">
                      {developer.projects_completed} {isRu ? 'проектов' : 'projects'}
                    </Badge>
                  )}
                  {!developer.is_active && (
                    <Badge variant="destructive" className="text-xs">
                      {isRu ? 'Неактивен' : 'Inactive'}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {editingDeveloper 
                ? (isRu ? 'Редактировать застройщика' : 'Edit Developer')
                : (isRu ? 'Новый застройщик' : 'New Developer')
              }
            </SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="basic" className="p-6 pt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">{isRu ? 'Основное' : 'Basic'}</TabsTrigger>
              <TabsTrigger value="details">{isRu ? 'Детали' : 'Details'}</TabsTrigger>
              <TabsTrigger value="media">{isRu ? 'Медиа' : 'Media'}</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <TranslatableInput
                label={isRu ? 'Название' : 'Name'}
                value={formData.name_en || ''}
                translatedValue={formData.name_ru || ''}
                onChange={(val) => updateField('name_en', val)}
                onTranslatedChange={(val) => updateField('name_ru', val)}
                placeholder="Sansiri"
              />

              <TranslatableInput
                label={isRu ? 'Описание' : 'Description'}
                value={formData.description_en || ''}
                translatedValue={formData.description_ru || ''}
                onChange={(val) => updateField('description_en', val)}
                onTranslatedChange={(val) => updateField('description_ru', val)}
                multiline
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Штаб-квартира' : 'Headquarters'}</Label>
                  <Input
                    value={formData.headquarters || ''}
                    onChange={(e) => updateField('headquarters', e.target.value)}
                    placeholder="Bangkok, Thailand"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{isRu ? 'Год основания' : 'Established'}</Label>
                  <Input
                    type="number"
                    value={formData.established_year || ''}
                    onChange={(e) => updateField('established_year', parseInt(e.target.value) || undefined)}
                    placeholder="1984"
                  />
                </div>
              </div>

              {/* Flags */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={formData.is_active ?? true}
                    onCheckedChange={(val) => updateField('is_active', val)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Verified
                  </Label>
                  <Switch
                    checked={formData.is_verified || false}
                    onCheckedChange={(val) => updateField('is_verified', val)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-warning" />
                    Featured
                  </Label>
                  <Switch
                    checked={formData.is_featured || false}
                    onCheckedChange={(val) => updateField('is_featured', val)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    Website
                  </Label>
                  <Input
                    value={formData.website || ''}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="info@..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {isRu ? 'Телефон' : 'Phone'}
                </Label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+66..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Завершено проектов' : 'Projects Completed'}</Label>
                  <Input
                    type="number"
                    value={formData.projects_completed || ''}
                    onChange={(e) => updateField('projects_completed', parseInt(e.target.value) || undefined)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{isRu ? 'В работе' : 'Ongoing'}</Label>
                  <Input
                    type="number"
                    value={formData.projects_ongoing || ''}
                    onChange={(e) => updateField('projects_ongoing', parseInt(e.target.value) || undefined)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{isRu ? 'Юнитов сдано' : 'Units Delivered'}</Label>
                  <Input
                    type="number"
                    value={formData.total_units_delivered || ''}
                    onChange={(e) => updateField('total_units_delivered', parseInt(e.target.value) || undefined)}
                  />
                </div>
              </div>

              {/* MuUNO Score */}
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    muUNO Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>{isRu ? 'Рейтинг надёжности' : 'Reliability Rating'}</Label>
                      <span className="font-bold text-primary">{formData.muuno_score || 0}</span>
                    </div>
                    <Slider
                      value={[formData.muuno_score || 0]}
                      onValueChange={([val]) => updateField('muuno_score', val)}
                      max={100}
                      step={1}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Логотип' : 'Logo'}</Label>
                <AirbnbStyleImageUpload
                  value={formData.logo_url ? [formData.logo_url] : []}
                  onChange={(imgs) => updateField('logo_url', imgs[0] || undefined)}
                  maxImages={1}
                  folder="developer-logos"
                />
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Обложка' : 'Cover Image'}</Label>
                <AirbnbStyleImageUpload
                  value={formData.cover_image ? [formData.cover_image] : []}
                  onChange={(imgs) => updateField('cover_image', imgs[0] || undefined)}
                  maxImages={1}
                  folder="developer-images"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="p-6 pt-0 flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsFormOpen(false)}
              className="flex-1"
            >
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleSave}
              disabled={createDeveloper.isPending || updateDeveloper.isPending}
              className="flex-1"
            >
              {(createDeveloper.isPending || updateDeveloper.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isRu ? 'Сохранить' : 'Save'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRu ? 'Удалить застройщика?' : 'Delete developer?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRu 
                ? 'Это действие нельзя отменить. Застройщик будет удалён навсегда.'
                : 'This action cannot be undone. The developer will be permanently deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRu ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
