import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { 
  useAdminPropertyProjects, 
  useCreatePropertyProject, 
  useUpdatePropertyProject,
  PropertyProject,
  CreatePropertyProjectData,
  ProjectStatus
} from '@/hooks/usePropertyProjects';
import { useAdminDevelopers } from '@/hooks/useAdminDevelopers';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Building2, 
  Plus, 
  Loader2,
  Search,
  MapPin,
  Calendar,
  Users,
  Edit,
  Sparkles,
  Building,
  Phone,
  Mail,
  CreditCard,
  FileText,
  HardHat,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { TranslatableInput } from '@/components/forms/TranslatableInput';
import { TranslatableTextarea } from '@/components/forms/TranslatableTextarea';
import { AirbnbStyleImageUpload } from '@/components/upload/AirbnbStyleImageUpload';
import { AIIntakeDialog } from '@/components/admin/intake/AIIntakeDialog';
import { ProjectUnitsTab } from '@/components/admin/projects/ProjectUnitsTab';
import { PHUKET_DISTRICTS, ALL_AMENITIES } from '@/lib/taxonomies';

const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string; labelRu: string; icon: React.ReactNode }[] = [
  { value: 'offplan', label: 'Off-Plan', labelRu: 'Офф-план', icon: <Building2 className="h-4 w-4" /> },
  { value: 'under_construction', label: 'Under Construction', labelRu: 'Строится', icon: <HardHat className="h-4 w-4" /> },
  { value: 'completed', label: 'Completed', labelRu: 'Сдан', icon: <CheckCircle className="h-4 w-4" /> },
];

// Initial empty project form
const getEmptyProject = (): Partial<CreatePropertyProjectData> => ({
  name_en: '',
  name_ru: '',
  description_en: '',
  description_ru: '',
  address: '',
  district: '',
  developer_name: '',
  year_built: undefined,
  total_units: undefined,
  cover_image: '',
  images: [],
  video_url: '',
  amenities: [],
  infrastructure: [],
});

export default function AdminProjects() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { data: projects, isLoading } = useAdminPropertyProjects();
  const { data: developers } = useAdminDevelopers();
  const createProject = useCreatePropertyProject();
  const updateProject = useUpdatePropertyProject();
  const queryClient = useQueryClient();

  const handleEnrichAll = async () => {
    setIsEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-projects', {
        body: { mode: 'batch' },
      });
      if (error) throw error;
      toast.success(
        isRu 
          ? `AI обогатил ${data.enriched} из ${data.total} проектов` 
          : `AI enriched ${data.enriched} of ${data.total} projects`
      );
      queryClient.invalidateQueries({ queryKey: ['admin-property-projects'] });
      queryClient.invalidateQueries({ queryKey: ['offplan-projects'] });
    } catch (err: any) {
      console.error('Enrich error:', err);
      toast.error(isRu ? 'Ошибка обогащения данных' : 'Enrichment failed');
    } finally {
      setIsEnriching(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [moderationFilter, setModerationFilter] = useState<'all' | 'orphan' | 'needs_review' | 'pending' | 'approved'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeveloperId, setBulkDeveloperId] = useState<string>('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<PropertyProject | null>(null);
  const [formData, setFormData] = useState<Partial<CreatePropertyProjectData>>(getEmptyProject());
  const [isAIIntakeOpen, setIsAIIntakeOpen] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);

  const UNASSIGNED_DEV_ID = '00000000-0000-0000-0000-000000000001';

  // Filter projects by status, moderation and search
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    return projects.filter(p => {
      if (statusFilter !== 'all' && p.project_status !== statusFilter) return false;

      // Moderation filter
      if (moderationFilter === 'orphan' && p.developer_id !== UNASSIGNED_DEV_ID) return false;
      if (moderationFilter === 'needs_review' && !p.needs_review) return false;
      if (moderationFilter === 'pending' && p.is_approved !== false) return false;
      if (moderationFilter === 'approved' && p.is_approved !== true) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name_en.toLowerCase().includes(q) ||
          p.name_ru.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q) ||
          p.district?.toLowerCase().includes(q) ||
          p.developer_name?.toLowerCase().includes(q)
        );
      }
      
      return true;
    });
  }, [projects, searchQuery, statusFilter, moderationFilter]);

  const moderationCounts = useMemo(() => {
    const list = projects || [];
    return {
      orphan: list.filter(p => p.developer_id === UNASSIGNED_DEV_ID).length,
      needs_review: list.filter(p => p.needs_review).length,
      pending: list.filter(p => p.is_approved === false).length,
    };
  }, [projects]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkAssignDeveloper = async () => {
    if (!bulkDeveloperId || selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    try {
      const { error } = await supabase
        .from('property_projects')
        .update({ developer_id: bulkDeveloperId, needs_review: false } as any)
        .in('id', Array.from(selectedIds));
      if (error) throw error;
      toast.success(isRu ? `Назначен застройщик: ${selectedIds.size}` : `Developer assigned: ${selectedIds.size}`);
      queryClient.invalidateQueries({ queryKey: ['admin-property-projects'] });
      clearSelection();
      setBulkDeveloperId('');
    } catch (e: any) {
      toast.error(e.message || 'Bulk assign failed');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    try {
      const { error } = await supabase
        .from('property_projects')
        .update({ is_approved: true, needs_review: false } as any)
        .in('id', Array.from(selectedIds));
      if (error) throw error;
      toast.success(isRu ? `Одобрено: ${selectedIds.size}` : `Approved: ${selectedIds.size}`);
      queryClient.invalidateQueries({ queryKey: ['admin-property-projects'] });
      clearSelection();
    } catch (e: any) {
      toast.error(e.message || 'Bulk approve failed');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Stats by status
  const stats = useMemo(() => {
    if (!projects) return { total: 0, offplan: 0, construction: 0, completed: 0 };
    return {
      total: projects.length,
      offplan: projects.filter(p => p.project_status === 'offplan').length,
      construction: projects.filter(p => p.project_status === 'under_construction').length,
      completed: projects.filter(p => p.project_status === 'completed').length,
    };
  }, [projects]);
  
  // Juristic person fields (extended)
  const [juristicData, setJuristicData] = useState({
    juristic_person_name: '',
    juristic_person_name_ru: '',
    juristic_email: '',
    juristic_phone: '',
    juristic_line_id: '',
    juristic_whatsapp: '',
    juristic_address: '',
    juristic_office_hours: '',
    juristic_contact_person: '',
    juristic_contact_position: '',
    juristic_bank_name: '',
    juristic_bank_account_name: '',
    juristic_bank_account_number: '',
    juristic_promptpay_id: '',
    cam_fee_per_sqm: '',
    cam_payment_day: '',
    cam_includes: [] as string[],
  });


  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormData(getEmptyProject());
    setJuristicData({
      juristic_person_name: '',
      juristic_person_name_ru: '',
      juristic_email: '',
      juristic_phone: '',
      juristic_line_id: '',
      juristic_whatsapp: '',
      juristic_address: '',
      juristic_office_hours: '',
      juristic_contact_person: '',
      juristic_contact_position: '',
      juristic_bank_name: '',
      juristic_bank_account_name: '',
      juristic_bank_account_number: '',
      juristic_promptpay_id: '',
      cam_fee_per_sqm: '',
      cam_payment_day: '',
      cam_includes: [],
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (project: PropertyProject) => {
    setEditingProject(project);
    setFormData({
      name_en: project.name_en,
      name_ru: project.name_ru,
      description_en: project.description_en || '',
      description_ru: project.description_ru || '',
      address: project.address || '',
      district: project.district || '',
      developer_name: project.developer_name || '',
      year_built: project.year_built,
      total_units: project.total_units,
      cover_image: project.cover_image || '',
      images: project.images || [],
      video_url: project.video_url || '',
      amenities: project.amenities || [],
      infrastructure: project.infrastructure || [],
    });
    // Load juristic data from project (if extended type exists)
    const p = project as any;
    setJuristicData({
      juristic_person_name: p.juristic_person_name || '',
      juristic_person_name_ru: p.juristic_person_name_ru || '',
      juristic_email: p.juristic_email || '',
      juristic_phone: p.juristic_phone || '',
      juristic_line_id: p.juristic_line_id || '',
      juristic_whatsapp: p.juristic_whatsapp || '',
      juristic_address: p.juristic_address || '',
      juristic_office_hours: p.juristic_office_hours || '',
      juristic_contact_person: p.juristic_contact_person || '',
      juristic_contact_position: p.juristic_contact_position || '',
      juristic_bank_name: p.juristic_bank_name || '',
      juristic_bank_account_name: p.juristic_bank_account_name || '',
      juristic_bank_account_number: p.juristic_bank_account_number || '',
      juristic_promptpay_id: p.juristic_promptpay_id || '',
      cam_fee_per_sqm: p.cam_fee_per_sqm?.toString() || '',
      cam_payment_day: p.cam_payment_day?.toString() || '',
      cam_includes: p.cam_includes || [],
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name_en?.trim()) {
      toast.error(isRu ? 'Введите название проекта' : 'Enter project name');
      return;
    }

    const payload = {
      ...formData,
      ...juristicData,
      cam_fee_per_sqm: juristicData.cam_fee_per_sqm ? parseFloat(juristicData.cam_fee_per_sqm) : null,
      cam_payment_day: juristicData.cam_payment_day ? parseInt(juristicData.cam_payment_day) : null,
    };

    try {
      if (editingProject) {
        await updateProject.mutateAsync({ id: editingProject.id, ...payload } as any);
        toast.success(isRu ? 'Проект обновлён' : 'Project updated');
      } else {
        await createProject.mutateAsync(payload as CreatePropertyProjectData);
        toast.success(isRu ? 'Проект создан' : 'Project created');
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error(isRu ? 'Ошибка сохранения' : 'Save failed');
    }
  };

  const handleAIIntakeComplete = (extractedData: any) => {
    // Map AI extracted data to form
    setFormData(prev => ({
      ...prev,
      name_en: extractedData.name_en || prev.name_en,
      name_ru: extractedData.name_ru || prev.name_ru,
      description_en: extractedData.description_en || prev.description_en,
      description_ru: extractedData.description_ru || prev.description_ru,
      address: extractedData.address || prev.address,
      district: extractedData.district || prev.district,
      developer_name: extractedData.developer_name || prev.developer_name,
      year_built: extractedData.year_built || prev.year_built,
      total_units: extractedData.total_units || prev.total_units,
      amenities: extractedData.amenities || prev.amenities,
      infrastructure: extractedData.infrastructure || prev.infrastructure,
    }));
    setIsAIIntakeOpen(false);
    toast.success(isRu ? 'Данные заполнены из AI' : 'Data populated from AI');
  };

  const updateFormField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (adminLoading) {
    return (
      <>
        <PageContainer>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
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
            <p className="text-muted-foreground">
              {isRu ? 'Доступ запрещён' : 'Access denied'}
            </p>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <PageContainer>
        <PageHeader
          title={isRu ? 'Проекты / ЖК' : 'Projects / Complexes'}
          subtitle={isRu ? 'Управление жилыми комплексами и проектами' : 'Manage residential complexes and projects'}
          actions={
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={handleEnrichAll} disabled={isEnriching}>
                {isEnriching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {isRu ? 'AI Обогащение' : 'AI Enrich'}
              </Button>
              <Button variant="outline" onClick={() => setIsAIIntakeOpen(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                AI Intake
              </Button>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                {isRu ? 'Новый проект' : 'New Project'}
              </Button>
            </div>
          }
        />

        {/* Search + Moderation filter */}
        <div className="mb-4 space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRu ? 'Поиск проектов...' : 'Search projects...'}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {([
              { id: 'all', label: isRu ? 'Все' : 'All', count: projects?.length || 0 },
              { id: 'orphan', label: isRu ? 'Orphan' : 'Orphan', count: moderationCounts.orphan },
              { id: 'needs_review', label: isRu ? 'Нужна ревизия' : 'Needs review', count: moderationCounts.needs_review },
              { id: 'pending', label: isRu ? 'На модерации' : 'Pending', count: moderationCounts.pending },
              { id: 'approved', label: isRu ? 'Одобрено' : 'Approved' },
            ] as const).map(f => (
              <Button
                key={f.id}
                size="sm"
                variant={moderationFilter === f.id ? 'default' : 'outline'}
                onClick={() => setModerationFilter(f.id as any)}
              >
                {f.label}
                {'count' in f && f.count !== undefined && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">{f.count}</Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Bulk actions toolbar */}
        {selectedIds.size > 0 && (
          <Card className="mb-4 border-primary/40">
            <CardContent className="p-3 flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium">
                {isRu ? `Выбрано: ${selectedIds.size}` : `Selected: ${selectedIds.size}`}
              </span>
              <div className="flex items-center gap-2 flex-1 min-w-[260px]">
                <Select value={bulkDeveloperId} onValueChange={setBulkDeveloperId}>
                  <SelectTrigger className="h-9 w-[260px]">
                    <SelectValue placeholder={isRu ? 'Назначить застройщика…' : 'Assign developer…'} />
                  </SelectTrigger>
                  <SelectContent>
                    {developers?.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name_en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" disabled={!bulkDeveloperId || isBulkProcessing} onClick={handleBulkAssignDeveloper}>
                  {isRu ? 'Применить' : 'Apply'}
                </Button>
              </div>
              <Button size="sm" variant="outline" disabled={isBulkProcessing} onClick={handleBulkApprove}>
                <ShieldCheck className="h-4 w-4 mr-1" />
                {isRu ? 'Одобрить' : 'Approve'}
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                {isRu ? 'Очистить' : 'Clear'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{projects?.length || 0}</div>
              <div className="text-sm text-muted-foreground">
                {isRu ? 'Всего проектов' : 'Total Projects'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {projects?.filter(p => p.is_featured).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                {isRu ? 'Избранные' : 'Featured'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {projects?.filter(p => !p.address).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                {isRu ? 'Без адреса' : 'Missing Address'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {projects?.reduce((sum, p) => sum + (p.total_units || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">
                {isRu ? 'Всего юнитов' : 'Total Units'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery 
                  ? (isRu ? 'Проекты не найдены' : 'No projects found')
                  : (isRu ? 'Нет проектов. Создайте первый!' : 'No projects yet. Create your first!')
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => {
              const isOrphan = project.developer_id === UNASSIGNED_DEV_ID;
              const isSelected = selectedIds.has(project.id);
              return (
              <Card 
                key={project.id} 
                className={`overflow-hidden hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}
              >
                {/* Cover Image */}
                <div className="aspect-video bg-muted relative">
                  {/* Selection checkbox */}
                  <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(project.id)}
                      className="bg-background/80 backdrop-blur"
                    />
                  </div>
                  <div className="cursor-pointer w-full h-full" onClick={() => handleOpenEdit(project)}>
                    {project.cover_image ? (
                      <img
                        src={project.cover_image}
                        alt={project.name_en}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    {project.is_featured && <Badge>Featured</Badge>}
                    {isOrphan && (
                      <Badge variant="destructive" className="text-[10px]">
                        <AlertTriangle className="h-3 w-3 mr-1" />Orphan
                      </Badge>
                    )}
                    {project.needs_review && (
                      <Badge className="text-[10px] bg-warning text-warning-foreground border-0">
                        Review
                      </Badge>
                    )}
                    {project.is_approved === false && (
                      <Badge variant="outline" className="text-[10px] bg-background">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
                
                <CardContent className="p-4 cursor-pointer" onClick={() => handleOpenEdit(project)}>
                  <h3 className="font-semibold truncate">
                    {isRu ? project.name_ru : project.name_en}
                  </h3>
                  
                  {project.address ? (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {project.address}
                    </p>
                  ) : (
                    <p className="text-sm text-accent mt-1">
                      {isRu ? 'Адрес не указан' : 'Address missing'}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3">
                    {project.developer_name && (
                      <Badge variant="secondary" className="text-xs">
                        {project.developer_name}
                      </Badge>
                    )}
                    {project.year_built && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {project.year_built}
                      </Badge>
                    )}
                    {project.total_units && (
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {project.total_units}
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <div className="px-4 pb-3 flex gap-2 border-t pt-2">
                  <Button asChild size="sm" variant="ghost" className="flex-1" onClick={(e) => e.stopPropagation()}>
                    <Link to={`/admin/newbuilds/projects/${project.id}/documents`}>
                      <FileText className="h-3.5 w-3.5 mr-1" />
                      {isRu ? 'Документы' : 'Documents'}
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" className="flex-1" onClick={(e) => { e.stopPropagation(); handleOpenEdit(project); }}>
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    {isRu ? 'Изменить' : 'Edit'}
                  </Button>
                </div>
              </Card>
            );})}
          </div>
        )}

        {/* Edit/Create Sheet */}
        <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
            <SheetHeader className="p-6 pb-0">
              <SheetTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {editingProject 
                  ? (isRu ? 'Редактировать проект' : 'Edit Project')
                  : (isRu ? 'Новый проект' : 'New Project')
                }
              </SheetTitle>
            </SheetHeader>

            <Tabs defaultValue="basic" className="p-6 pt-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">
                  {isRu ? 'Основное' : 'Basic'}
                </TabsTrigger>
                <TabsTrigger value="units">
                  {isRu ? 'Юниты' : 'Units'}
                </TabsTrigger>
                <TabsTrigger value="media">
                  {isRu ? 'Медиа' : 'Media'}
                </TabsTrigger>
                <TabsTrigger value="amenities">
                  {isRu ? 'Удобства' : 'Amenities'}
                </TabsTrigger>
                <TabsTrigger value="juristic">
                  {isRu ? 'УК' : 'Mgmt'}
                </TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsAIIntakeOpen(true)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Intake
                  </Button>
                </div>

                <TranslatableInput
                  label={isRu ? 'Название *' : 'Name *'}
                  value={isRu ? (formData.name_ru || '') : (formData.name_en || '')}
                  translatedValue={isRu ? (formData.name_en || '') : (formData.name_ru || '')}
                  onChange={(val) => updateFormField(isRu ? 'name_ru' : 'name_en', val)}
                  onTranslatedChange={(val) => updateFormField(isRu ? 'name_en' : 'name_ru', val)}
                  placeholder={isRu ? 'Laguna Beach Resort' : 'Laguna Beach Resort'}
                />

                <TranslatableTextarea
                  label={isRu ? 'Описание' : 'Description'}
                  value={isRu ? (formData.description_ru || '') : (formData.description_en || '')}
                  translatedValue={isRu ? (formData.description_en || '') : (formData.description_ru || '')}
                  onChange={(val) => updateFormField(isRu ? 'description_ru' : 'description_en', val)}
                  onTranslatedChange={(val) => updateFormField(isRu ? 'description_en' : 'description_ru', val)}
                  placeholder={isRu ? 'Описание проекта...' : 'Project description...'}
                  rows={4}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRu ? 'Адрес' : 'Address'}</Label>
                    <Input
                      value={formData.address || ''}
                      onChange={(e) => updateFormField('address', e.target.value)}
                      placeholder="123 Beach Road"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRu ? 'Район' : 'District'}</Label>
                    <Input
                      value={formData.district || ''}
                      onChange={(e) => updateFormField('district', e.target.value)}
                      placeholder="Bang Tao"
                      list="districts"
                    />
                    <datalist id="districts">
                      {PHUKET_DISTRICTS.map(d => (
                        <option key={d.id} value={d.labelEn} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{isRu ? 'Застройщик' : 'Developer'}</Label>
                    <Input
                      value={formData.developer_name || ''}
                      onChange={(e) => updateFormField('developer_name', e.target.value)}
                      placeholder="Sansiri"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRu ? 'Год постройки' : 'Year Built'}</Label>
                    <Input
                      type="number"
                      value={formData.year_built || ''}
                      onChange={(e) => updateFormField('year_built', parseInt(e.target.value) || undefined)}
                      placeholder="2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRu ? 'Кол-во юнитов' : 'Total Units'}</Label>
                    <Input
                      type="number"
                      value={formData.total_units || ''}
                      onChange={(e) => updateFormField('total_units', parseInt(e.target.value) || undefined)}
                      placeholder="250"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{isRu ? 'Видео URL' : 'Video URL'}</Label>
                  <Input
                    value={formData.video_url || ''}
                    onChange={(e) => updateFormField('video_url', e.target.value)}
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </TabsContent>

              {/* Units Tab */}
              <TabsContent value="units" className="mt-4">
                {editingProject ? (
                  <ProjectUnitsTab projectId={editingProject.id} />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {isRu ? 'Сначала сохраните проект' : 'Save the project first'}
                  </p>
                )}
              </TabsContent>

              {/* Media Tab */}
              <TabsContent value="media" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Обложка' : 'Cover Image'}</Label>
                  <AirbnbStyleImageUpload
                    value={formData.cover_image ? [formData.cover_image] : []}
                    onChange={(imgs) => updateFormField('cover_image', imgs[0] || '')}
                    maxImages={1}
                    folder="projects"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{isRu ? 'Галерея' : 'Gallery'}</Label>
                  <AirbnbStyleImageUpload
                    value={formData.images || []}
                    onChange={(imgs) => updateFormField('images', imgs)}
                    maxImages={20}
                    folder="projects"
                  />
                </div>
              </TabsContent>

              {/* Amenities Tab */}
              <TabsContent value="amenities" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Удобства территории' : 'Project Amenities'}</Label>
                  <ScrollArea className="h-64 border rounded-none p-3">
                    <div className="grid grid-cols-2 gap-2">
                      {ALL_AMENITIES.map((amenity) => (
                        <label 
                          key={amenity.id}
                          className="flex items-center gap-2 p-2 hover:bg-muted rounded-none cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.amenities?.includes(amenity.id) || false}
                            onChange={(e) => {
                              const current = formData.amenities || [];
                              if (e.target.checked) {
                                updateFormField('amenities', [...current, amenity.id]);
                              } else {
                                updateFormField('amenities', current.filter(a => a !== amenity.id));
                              }
                            }}
                            className="rounded-none"
                          />
                          <span className="text-sm">
                            {isRu ? amenity.labelRu : amenity.labelEn}
                          </span>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-2">
                  <Label>{isRu ? 'Инфраструктура рядом' : 'Nearby Infrastructure'}</Label>
                  <Input
                    value={formData.infrastructure?.join(', ') || ''}
                    onChange={(e) => updateFormField('infrastructure', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder={isRu ? 'Школа, Магазин, Пляж...' : 'School, Shop, Beach...'}
                  />
                  <p className="text-xs text-muted-foreground">
                    {isRu ? 'Через запятую' : 'Comma-separated'}
                  </p>
                </div>
              </TabsContent>

              {/* Juristic / Management Tab */}
              <TabsContent value="juristic" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      {isRu ? 'Управляющая компания' : 'Management Company'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <TranslatableInput
                      label={isRu ? 'Название УК' : 'Company Name'}
                      value={isRu ? juristicData.juristic_person_name_ru : juristicData.juristic_person_name}
                      translatedValue={isRu ? juristicData.juristic_person_name : juristicData.juristic_person_name_ru}
                      onChange={(val) => setJuristicData(prev => ({ 
                        ...prev, 
                        [isRu ? 'juristic_person_name_ru' : 'juristic_person_name']: val 
                      }))}
                      onTranslatedChange={(val) => setJuristicData(prev => ({ 
                        ...prev, 
                        [isRu ? 'juristic_person_name' : 'juristic_person_name_ru']: val 
                      }))}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> Email
                        </Label>
                        <Input
                          type="email"
                          value={juristicData.juristic_email}
                          onChange={(e) => setJuristicData(prev => ({ ...prev, juristic_email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {isRu ? 'Телефон' : 'Phone'}
                        </Label>
                        <Input
                          value={juristicData.juristic_phone}
                          onChange={(e) => setJuristicData(prev => ({ ...prev, juristic_phone: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Line ID</Label>
                        <Input
                          value={juristicData.juristic_line_id}
                          onChange={(e) => setJuristicData(prev => ({ ...prev, juristic_line_id: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>WhatsApp</Label>
                        <Input
                          value={juristicData.juristic_whatsapp}
                          onChange={(e) => setJuristicData(prev => ({ ...prev, juristic_whatsapp: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{isRu ? 'Адрес офиса' : 'Office Address'}</Label>
                      <Input
                        value={juristicData.juristic_address}
                        onChange={(e) => setJuristicData(prev => ({ ...prev, juristic_address: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{isRu ? 'Контактное лицо' : 'Contact Person'}</Label>
                        <Input
                          value={juristicData.juristic_contact_person}
                          onChange={(e) => setJuristicData(prev => ({ ...prev, juristic_contact_person: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{isRu ? 'Должность' : 'Position'}</Label>
                        <Input
                          value={juristicData.juristic_contact_position}
                          onChange={(e) => setJuristicData(prev => ({ ...prev, juristic_contact_position: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{isRu ? 'Часы работы' : 'Office Hours'}</Label>
                      <Input
                        value={juristicData.juristic_office_hours}
                        onChange={(e) => setJuristicData(prev => ({ ...prev, juristic_office_hours: e.target.value }))}
                        placeholder="Mon-Fri 9:00-18:00"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {isRu ? 'Банковские реквизиты' : 'Bank Details'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{isRu ? 'Банк' : 'Bank Name'}</Label>
                        <Input
                          value={juristicData.juristic_bank_name}
                          onChange={(e) => setJuristicData(prev => ({ ...prev, juristic_bank_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{isRu ? 'Имя счёта' : 'Account Name'}</Label>
                        <Input
                          value={juristicData.juristic_bank_account_name}
                          onChange={(e) => setJuristicData(prev => ({ ...prev, juristic_bank_account_name: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{isRu ? 'Номер счёта' : 'Account Number'}</Label>
                        <Input
                          value={juristicData.juristic_bank_account_number}
                          onChange={(e) => setJuristicData(prev => ({ ...prev, juristic_bank_account_number: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>PromptPay ID</Label>
                        <Input
                          value={juristicData.juristic_promptpay_id}
                          onChange={(e) => setJuristicData(prev => ({ ...prev, juristic_promptpay_id: e.target.value }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      CAM Fee
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{isRu ? 'Ставка за м²' : 'Fee per sqm'} (THB)</Label>
                        <Input
                          type="number"
                          value={juristicData.cam_fee_per_sqm}
                          onChange={(e) => setJuristicData(prev => ({ ...prev, cam_fee_per_sqm: e.target.value }))}
                          placeholder="50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{isRu ? 'День оплаты' : 'Payment Day'}</Label>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          value={juristicData.cam_payment_day}
                          onChange={(e) => setJuristicData(prev => ({ ...prev, cam_payment_day: e.target.value }))}
                          placeholder="5"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{isRu ? 'CAM включает' : 'CAM Includes'}</Label>
                      <Input
                        value={juristicData.cam_includes.join(', ')}
                        onChange={(e) => setJuristicData(prev => ({ 
                          ...prev, 
                          cam_includes: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        }))}
                        placeholder={isRu ? 'Охрана, Уборка, Бассейн...' : 'Security, Cleaning, Pool...'}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Footer Actions */}
            <div className="sticky bottom-0 border-t bg-background p-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
              <Button 
                onClick={handleSave}
                disabled={createProject.isPending || updateProject.isPending}
              >
                {(createProject.isPending || updateProject.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isRu ? 'Сохранить' : 'Save'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* AI Intake Dialog */}
        <AIIntakeDialog
          open={isAIIntakeOpen}
          onOpenChange={setIsAIIntakeOpen}
          entityType="property_project"
          onComplete={handleAIIntakeComplete}
        />
      </PageContainer>
    </>
  );
}
