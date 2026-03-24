import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useAdminExperiences, AdminExperience } from '@/hooks/useAdminExperiences';
import { ExperienceType, EXPERIENCE_CATEGORIES } from '@/hooks/useExperiences';
import { experienceDifficultyOptions } from '@/components/filters/ExperiencesFilters';

import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { ProviderSelector } from '@/components/admin/ProviderSelector';
import { ExperiencePricingEditor } from '@/components/admin/tours/ExperiencePricingEditor';
import { SourceVerificationPanel } from '@/components/admin/tours/SourceVerificationPanel';
import { useImportExperienceMedia } from '@/hooks/useExperienceMedia';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Compass, Waves, Plus, MoreVertical, Edit, Trash2, Clock, Users, MapPin,
  Loader2, Star, Shield, ExternalLink, Image, Truck, Globe,
} from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { cn } from '@/lib/utils';

type ViewType = 'all' | 'tour' | 'activity';

const getEmptyFormData = () => ({
  provider_id: '',
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
  is_featured: false,
  external_link: '',
  booking_url: '',
  source_page_url: '',
});

export default function AdminExperiences() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const isRu = language === 'ru';
  const importMedia = useImportExperienceMedia();

  const [filterProviderId, setFilterProviderId] = useState<string>('');
  const [viewType, setViewType] = useState<ViewType>((searchParams.get('type') as ViewType) || 'all');
  const [selectedExperienceId, setSelectedExperienceId] = useState<string | null>(null);

  const { experiences, isLoading, createExperience, updateExperience, deleteExperience } = useAdminExperiences({
    providerId: filterProviderId || undefined,
    experienceType: viewType === 'all' ? undefined : viewType,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(searchParams.get('action') === 'new');
  const [editingItem, setEditingItem] = useState<AdminExperience | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState(getEmptyFormData());

  const stats = useMemo(() => {
    const tours = experiences.filter(e => e.experience_type === 'tour').length;
    const activities = experiences.filter(e => e.experience_type === 'activity').length;
    return { total: experiences.length, tours, activities };
  }, [experiences]);

  const handleTypeChange = (type: ViewType) => {
    setViewType(type);
    const newParams = new URLSearchParams(searchParams);
    if (type === 'all') newParams.delete('type');
    else newParams.set('type', type);
    setSearchParams(newParams);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    setFormData(getEmptyFormData());
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: AdminExperience) => {
    setEditingItem(item);
    setFormData({
      provider_id: item.provider_id || '',
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
      is_featured: item.is_featured || false,
      external_link: item.external_link || '',
      booking_url: (item as any).booking_url || '',
      source_page_url: (item as any).source_page_url || '',
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
      const payload: any = {
        provider_id: formData.provider_id || null,
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
        is_featured: formData.is_featured,
        external_link: formData.external_link || null,
        booking_url: formData.booking_url || null,
        source_page_url: formData.source_page_url || null,
      };

      if (editingItem) {
        const { error } = await updateExperience(editingItem.id, payload);
        if (error) throw error;
        toast.success(isRu ? 'Обновлено' : 'Updated');
      } else {
        const { error } = await createExperience(payload);
        if (error) throw error;
        toast.success(isRu ? 'Создано' : 'Created');
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

  const handleRunMediaImport = async (expId: string) => {
    try {
      const result = await importMedia.mutateAsync(expId);
      toast.success(`Imported ${result.imported} images`);
    } catch (err) {
      toast.error(`Media import failed`);
    }
  };

  if (authLoading || adminLoading) {
    return (
      <>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-12 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <PageContainer>
          <div className="text-center py-12">
            <p className="text-muted-foreground">{isRu ? 'Доступ запрещён' : 'Access denied'}</p>
          </div>
        </PageContainer>
      </>
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

  // Find selected experience for detail panel
  const selectedExp = selectedExperienceId ? experiences.find(e => e.id === selectedExperienceId) : null;

  return (
    <>
      <PageContainer>
        <PageHeader
          title={isRu ? 'Туры и Активности' : 'Tours & Experiences'}
          subtitle={isRu ? `${stats.total} записей` : `${stats.total} items`}
          actions={
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              {isRu ? 'Добавить' : 'Add New'}
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 max-w-xs">
            <ProviderSelector value={filterProviderId} onChange={setFilterProviderId} />
          </div>
          <Tabs value={viewType} onValueChange={(v) => handleTypeChange(v as ViewType)}>
            <TabsList>
              <TabsTrigger value="all" className="gap-1.5">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="tour" className="gap-1.5">
                <Compass className="w-4 h-4" /> Tours ({stats.tours})
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-1.5">
                <Waves className="w-4 h-4" /> Activities ({stats.activities})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main content: list + detail panel */}
        <div className="flex gap-6">
          {/* List */}
          <div className={cn("flex-1", selectedExperienceId ? "max-w-[60%]" : "")}>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}
              </div>
            ) : experiences.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Compass className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No experiences yet</h3>
                  <Button onClick={openCreateDialog}><Plus className="w-4 h-4 mr-2" /> Add New</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {experiences.map((item) => (
                  <Card
                    key={item.id}
                    className={cn(
                      "overflow-hidden hover:shadow-md transition-all cursor-pointer",
                      selectedExperienceId === item.id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedExperienceId(item.id === selectedExperienceId ? null : item.id)}
                  >
                    <div className="relative h-32">
                      {item.cover_image ? (
                        <img src={item.cover_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          {item.experience_type === 'tour' ? <Compass className="w-8 h-8 text-muted-foreground" /> : <Waves className="w-8 h-8 text-muted-foreground" />}
                        </div>
                      )}

                      <Badge className={cn("absolute top-2 left-2", item.experience_type === 'tour' ? "bg-warning text-warning-foreground" : "bg-info text-info-foreground")}>
                        {item.experience_type === 'tour' ? <><Compass className="w-3 h-3 mr-1" />Tour</> : <><Waves className="w-3 h-3 mr-1" />Activity</>}
                      </Badge>

                      <div className="absolute top-2 right-2 flex gap-1">
                        {!item.is_active && <Badge variant="secondary">Inactive</Badge>}
                        {(item as any).source_page_url && (
                          <Badge variant="outline" className="bg-background/80">
                            <Globe className="w-3 h-3" />
                          </Badge>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="absolute bottom-2 right-2 bg-background/80 hover:bg-background" onClick={e => e.stopPropagation()}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(item); }}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          {(item as any).source_page_url && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRunMediaImport(item.id); }}>
                              <Image className="w-4 h-4 mr-2" /> Import Media
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(item.id); }} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-1 mb-1">{item.title_en}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDuration(item.duration_minutes)}</span>
                        {(item as any).pickup_included && (
                          <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" />Pickup</span>
                        )}
                        {item.category && <Badge variant="outline" className="text-xs">{item.category}</Badge>}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">
                          {item.price ? `฿${item.price.toLocaleString()}` : 'See pricing'}
                        </span>
                        {(item as any).booking_url && (
                          <a
                            href={(item as any).booking_url}
                            target="_blank"
                            rel="noopener"
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-primary underline flex items-center gap-1"
                          >
                            Book <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Detail/Pricing/Source panel */}
          {selectedExp && (
            <div className="w-[40%] space-y-4 hidden lg:block">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">{selectedExp.title_en}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {selectedExp.description_en}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(selectedExp)}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/experiences/${selectedExp.id}`)}>
                      <ExternalLink className="w-3 h-3 mr-1" /> Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <SourceVerificationPanel
                experienceId={selectedExp.id}
                sourcePageUrl={(selectedExp as any).source_page_url}
                bookingUrl={(selectedExp as any).booking_url}
                notes={(selectedExp as any).notes as Record<string, unknown> | null}
              />

              <Card>
                <CardContent className="p-4">
                  <ExperiencePricingEditor experienceId={selectedExp.id} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Experience' : 'New Experience'}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={formData.experience_type} onValueChange={(v) => setFormData(prev => ({ ...prev, experience_type: v as ExperienceType }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tour"><span className="flex items-center gap-2"><Compass className="w-4 h-4" />Tour</span></SelectItem>
                        <SelectItem value="activity"><span className="flex items-center gap-2"><Waves className="w-4 h-4" />Activity</span></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EXPERIENCE_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.labelEn}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div><Label>Provider</Label><ProviderSelector value={formData.provider_id} onChange={(v) => setFormData(prev => ({ ...prev, provider_id: v }))} /></div>

                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Title (EN) *</Label><Input value={formData.title_en} onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))} /></div>
                  <div><Label>Название (RU)</Label><Input value={formData.title_ru} onChange={(e) => setFormData(prev => ({ ...prev, title_ru: e.target.value }))} /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Description (EN)</Label><Textarea value={formData.description_en} onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))} rows={3} /></div>
                  <div><Label>Описание (RU)</Label><Textarea value={formData.description_ru} onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))} rows={3} /></div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Price (THB)</Label><Input type="number" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))} /></div>
                  <div><Label>Duration (min)</Label><Input type="number" value={formData.duration_minutes} onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))} /></div>
                  <div>
                    <Label>Difficulty</Label>
                    <Select value={formData.difficulty} onValueChange={(v) => setFormData(prev => ({ ...prev, difficulty: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {experienceDifficultyOptions.map(opt => (
                          <SelectItem key={opt.id} value={opt.id}>{typeof opt.icon === 'string' ? opt.icon : null} {opt.labelEn}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Source URLs */}
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Source Page URL</Label><Input value={formData.source_page_url} onChange={(e) => setFormData(prev => ({ ...prev, source_page_url: e.target.value }))} placeholder="https://provider.com/tour-page" /></div>
                  <div><Label>Booking URL</Label><Input value={formData.booking_url} onChange={(e) => setFormData(prev => ({ ...prev, booking_url: e.target.value }))} placeholder="https://provider.com/book" /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Meeting point</Label><Input value={formData.meeting_point} onChange={(e) => setFormData(prev => ({ ...prev, meeting_point: e.target.value }))} /></div>
                  <div><Label>Location name</Label><Input value={formData.location_name} onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))} /></div>
                </div>

                <div><Label>Cover image</Label><ImageUpload value={formData.cover_image} onChange={(url) => setFormData(prev => ({ ...prev, cover_image: url }))} folder="experiences" /></div>
                <div><Label>Gallery</Label><MultiImageUpload value={formData.images} onChange={(urls) => setFormData(prev => ({ ...prev, images: urls }))} folder="experiences" /></div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg"><Label className="cursor-pointer">Active</Label><Switch checked={formData.is_active} onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))} /></div>
                  <div className="flex items-center justify-between p-3 border rounded-lg"><Label className="cursor-pointer">Featured</Label><Switch checked={formData.is_featured} onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_featured: v }))} /></div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingItem ? 'Save' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete?</DialogTitle></DialogHeader>
            <p className="text-muted-foreground">This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
