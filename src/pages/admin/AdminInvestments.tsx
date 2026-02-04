/**
 * Admin Investment Projects Management
 * Full CRUD for investment_projects table with MuUNO scoring editor
 */
import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  useAdminInvestmentProjects, 
  useCreateInvestmentProject, 
  useUpdateInvestmentProject,
  useDeleteInvestmentProject,
  InvestmentProjectFormData
} from '@/hooks/useAdminInvestments';
import { useAdminDevelopers } from '@/hooks/useAdminDevelopers';
import { INVESTMENT_CATEGORIES } from '@/hooks/useInvestmentProjects';
import type { InvestmentProject } from '@/hooks/useInvestmentProjects';
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
import { Slider } from '@/components/ui/slider';
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
  TrendingUp, 
  Plus, 
  Loader2,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Target,
  AlertTriangle,
  Star,
  Flame,
  CheckCircle,
  Building2,
} from 'lucide-react';
import { TranslatableInput } from '@/components/forms/TranslatableInput';
import { AirbnbStyleImageUpload } from '@/components/upload/AirbnbStyleImageUpload';
import { PHUKET_DISTRICTS } from '@/lib/taxonomies';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', labelRu: 'Черновик' },
  { value: 'active', label: 'Active', labelRu: 'Активный' },
  { value: 'funded', label: 'Funded', labelRu: 'Профинансирован' },
  { value: 'closed', label: 'Closed', labelRu: 'Закрыт' },
];

const RISK_LEVELS = [
  { value: 'low', label: 'Low', labelRu: 'Низкий', color: 'success' },
  { value: 'medium', label: 'Medium', labelRu: 'Средний', color: 'warning' },
  { value: 'high', label: 'High', labelRu: 'Высокий', color: 'destructive' },
];

const getEmptyForm = (): InvestmentProjectFormData => ({
  title_en: '',
  title_ru: '',
  project_type: 'real_estate_offplan',
  status: 'draft',
  currency: 'USD',
  images: [],
  risk_factors: [],
});

export default function AdminInvestments() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const { data: projects, isLoading } = useAdminInvestmentProjects();
  const { data: developers } = useAdminDevelopers();
  const createProject = useCreateInvestmentProject();
  const updateProject = useUpdateInvestmentProject();
  const deleteProject = useDeleteInvestmentProject();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<InvestmentProject | null>(null);
  const [formData, setFormData] = useState<InvestmentProjectFormData>(getEmptyForm());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    return projects.filter(p => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!p.title_en.toLowerCase().includes(q) && 
            !p.title_ru.toLowerCase().includes(q)) {
          return false;
        }
      }
      
      // Type filter
      if (filterType !== 'all' && p.project_type !== filterType) return false;
      
      // Status filter
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      
      return true;
    });
  }, [projects, searchQuery, filterType, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    if (!projects) return { total: 0, active: 0, funded: 0, totalFunding: 0 };
    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      funded: projects.filter(p => p.status === 'funded').length,
      totalFunding: projects.reduce((sum, p) => sum + (p.funding_goal || 0), 0),
    };
  }, [projects]);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormData(getEmptyForm());
    setIsFormOpen(true);
  };

  const handleOpenEdit = (project: InvestmentProject) => {
    setEditingProject(project);
    setFormData({
      title_en: project.title_en,
      title_ru: project.title_ru,
      slug: project.slug || undefined,
      description_en: project.description_en || undefined,
      description_ru: project.description_ru || undefined,
      cover_image: project.cover_image || undefined,
      images: project.images || [],
      project_type: project.project_type,
      industry: project.industry || undefined,
      status: project.status,
      currency: project.currency,
      funding_goal: project.funding_goal || undefined,
      amount_raised: project.amount_raised || undefined,
      min_investment: project.min_investment || undefined,
      max_investment: project.max_investment || undefined,
      roi_projected: project.roi_projected || undefined,
      investment_term_months: project.investment_term_months || undefined,
      exit_strategy: project.exit_strategy || undefined,
      muuno_score: project.muuno_score || undefined,
      risk_level: project.risk_level || undefined,
      score_breakdown: project.score_breakdown || undefined,
      risk_factors: project.risk_factors || [],
      property_project_id: project.property_project_id || undefined,
      founder_id: project.founder_id || undefined,
      developer_id: project.developer_id || undefined,
      district: project.district || undefined,
      address: project.address || undefined,
      is_featured: project.is_featured,
      is_hot: project.is_hot,
      is_verified: project.is_verified,
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title_en?.trim()) {
      toast.error(isRu ? 'Введите название проекта' : 'Enter project title');
      return;
    }

    try {
      if (editingProject) {
        await updateProject.mutateAsync({ id: editingProject.id, ...formData });
      } else {
        await createProject.mutateAsync(formData);
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteProject.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const updateField = (field: keyof InvestmentProjectFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getRiskBadgeVariant = (level?: string | null) => {
    switch (level) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatCurrency = (amount?: number | null, currency = 'USD') => {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={isRu ? 'Инвестиционные проекты' : 'Investment Projects'}
        subtitle={isRu ? 'Управление проектами и скорингом muUNO' : 'Manage projects and muUNO scoring'}
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {isRu ? 'Новый проект' : 'New Project'}
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
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
              <div className="p-2 rounded-lg bg-success/10">
                <Target className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.active}</div>
                <div className="text-sm text-muted-foreground">
                  {isRu ? 'Активных' : 'Active'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <CheckCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.funded}</div>
                <div className="text-sm text-muted-foreground">
                  {isRu ? 'Закрытых' : 'Funded'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <DollarSign className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.totalFunding)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isRu ? 'Объём' : 'Volume'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRu ? 'Поиск проектов...' : 'Search projects...'}
            className="pl-10"
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={isRu ? 'Тип' : 'Type'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRu ? 'Все типы' : 'All types'}</SelectItem>
            {INVESTMENT_CATEGORIES.map(cat => (
              <SelectItem key={cat.key} value={cat.key}>
                {cat.icon} {isRu ? cat.ru : cat.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={isRu ? 'Статус' : 'Status'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRu ? 'Все' : 'All'}</SelectItem>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s.value} value={s.value}>
                {isRu ? s.labelRu : s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Projects Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery 
                ? (isRu ? 'Проекты не найдены' : 'No projects found')
                : (isRu ? 'Нет проектов. Создайте первый!' : 'No projects yet. Create your first!')
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">{isRu ? 'Проект' : 'Project'}</th>
                    <th className="text-left p-4 font-medium">{isRu ? 'Тип' : 'Type'}</th>
                    <th className="text-left p-4 font-medium">{isRu ? 'Цель' : 'Goal'}</th>
                    <th className="text-left p-4 font-medium">ROI</th>
                    <th className="text-left p-4 font-medium">{isRu ? 'Скоринг' : 'Score'}</th>
                    <th className="text-left p-4 font-medium">{isRu ? 'Риск' : 'Risk'}</th>
                    <th className="text-left p-4 font-medium">{isRu ? 'Статус' : 'Status'}</th>
                    <th className="text-right p-4 font-medium">{isRu ? 'Действия' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => {
                    const category = INVESTMENT_CATEGORIES.find(c => c.key === project.project_type);
                    return (
                      <tr key={project.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {project.cover_image ? (
                              <img 
                                src={project.cover_image} 
                                alt="" 
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {isRu ? project.title_ru : project.title_en}
                                {project.is_featured && <Star className="h-4 w-4 text-amber-500" />}
                                {project.is_hot && <Flame className="h-4 w-4 text-orange-500" />}
                              </div>
                              {project.district && (
                                <div className="text-sm text-muted-foreground">{project.district}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">
                            {category?.icon} {isRu ? category?.ru : category?.en}
                          </Badge>
                        </td>
                        <td className="p-4 font-medium">
                          {formatCurrency(project.funding_goal, project.currency)}
                        </td>
                        <td className="p-4">
                          {project.roi_projected ? `${project.roi_projected}%` : '—'}
                        </td>
                        <td className="p-4">
                          {project.muuno_score ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                {project.muuno_score}
                              </div>
                            </div>
                          ) : '—'}
                        </td>
                        <td className="p-4">
                          <Badge variant={getRiskBadgeVariant(project.risk_level) as any}>
                            {project.risk_level || 'N/A'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                            {STATUS_OPTIONS.find(s => s.value === project.status)?.[isRu ? 'labelRu' : 'label'] || project.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleOpenEdit(project)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteConfirmId(project.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit/Create Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {editingProject 
                ? (isRu ? 'Редактировать проект' : 'Edit Project')
                : (isRu ? 'Новый проект' : 'New Project')
              }
            </SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="basic" className="p-6 pt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">{isRu ? 'Основное' : 'Basic'}</TabsTrigger>
              <TabsTrigger value="financial">{isRu ? 'Финансы' : 'Financial'}</TabsTrigger>
              <TabsTrigger value="scoring">{isRu ? 'Скоринг' : 'Scoring'}</TabsTrigger>
              <TabsTrigger value="media">{isRu ? 'Медиа' : 'Media'}</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <TranslatableInput
                label={isRu ? 'Название *' : 'Title *'}
                value={formData.title_en || ''}
                translatedValue={formData.title_ru || ''}
                onChange={(val) => updateField('title_en', val)}
                onTranslatedChange={(val) => updateField('title_ru', val)}
                placeholder="Hotel investment..."
              />

              <TranslatableInput
                label={isRu ? 'Описание' : 'Description'}
                value={formData.description_en || ''}
                translatedValue={formData.description_ru || ''}
                onChange={(val) => updateField('description_en', val)}
                onTranslatedChange={(val) => updateField('description_ru', val)}
                placeholder="Detailed description..."
                multiline
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Тип проекта' : 'Project Type'}</Label>
                  <Select 
                    value={formData.project_type} 
                    onValueChange={(val) => updateField('project_type', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INVESTMENT_CATEGORIES.map(cat => (
                        <SelectItem key={cat.key} value={cat.key}>
                          {cat.icon} {isRu ? cat.ru : cat.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{isRu ? 'Статус' : 'Status'}</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(val) => updateField('status', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          {isRu ? s.labelRu : s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Район' : 'District'}</Label>
                  <Select 
                    value={formData.district || ''} 
                    onValueChange={(val) => updateField('district', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isRu ? 'Выберите район' : 'Select district'} />
                    </SelectTrigger>
                    <SelectContent>
                      {PHUKET_DISTRICTS.map(d => (
                        <SelectItem key={d.id} value={d.id}>
                          {isRu ? d.labelRu : d.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{isRu ? 'Девелопер' : 'Developer'}</Label>
                  <Select 
                    value={formData.developer_id || ''} 
                    onValueChange={(val) => updateField('developer_id', val || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isRu ? 'Выберите' : 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{isRu ? 'Не указан' : 'Not specified'}</SelectItem>
                      {developers?.map(d => (
                        <SelectItem key={d.id} value={d.id}>
                          {isRu ? d.name_ru : d.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Адрес' : 'Address'}</Label>
                <Input
                  value={formData.address || ''}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder={isRu ? 'Точный адрес' : 'Exact address'}
                />
              </div>

              {/* Flags */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    Featured
                  </Label>
                  <Switch
                    checked={formData.is_featured || false}
                    onCheckedChange={(val) => updateField('is_featured', val)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Hot
                  </Label>
                  <Switch
                    checked={formData.is_hot || false}
                    onCheckedChange={(val) => updateField('is_hot', val)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Verified
                  </Label>
                  <Switch
                    checked={formData.is_verified || false}
                    onCheckedChange={(val) => updateField('is_verified', val)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Валюта' : 'Currency'}</Label>
                  <Select 
                    value={formData.currency} 
                    onValueChange={(val) => updateField('currency', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="THB">THB</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="RUB">RUB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{isRu ? 'Цель сбора' : 'Funding Goal'}</Label>
                  <Input
                    type="number"
                    value={formData.funding_goal || ''}
                    onChange={(e) => updateField('funding_goal', parseFloat(e.target.value) || undefined)}
                    placeholder="1000000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Мин. инвестиция' : 'Min Investment'}</Label>
                  <Input
                    type="number"
                    value={formData.min_investment || ''}
                    onChange={(e) => updateField('min_investment', parseFloat(e.target.value) || undefined)}
                    placeholder="10000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{isRu ? 'Макс. инвестиция' : 'Max Investment'}</Label>
                  <Input
                    type="number"
                    value={formData.max_investment || ''}
                    onChange={(e) => updateField('max_investment', parseFloat(e.target.value) || undefined)}
                    placeholder="500000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Прогноз ROI (%)' : 'Projected ROI (%)'}</Label>
                  <Input
                    type="number"
                    value={formData.roi_projected || ''}
                    onChange={(e) => updateField('roi_projected', parseFloat(e.target.value) || undefined)}
                    placeholder="15"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{isRu ? 'Срок (месяцев)' : 'Term (months)'}</Label>
                  <Input
                    type="number"
                    value={formData.investment_term_months || ''}
                    onChange={(e) => updateField('investment_term_months', parseInt(e.target.value) || undefined)}
                    placeholder="24"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Стратегия выхода' : 'Exit Strategy'}</Label>
                <Input
                  value={formData.exit_strategy || ''}
                  onChange={(e) => updateField('exit_strategy', e.target.value)}
                  placeholder={isRu ? 'Продажа актива через 3 года' : 'Asset sale after 3 years'}
                />
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Уже собрано' : 'Amount Raised'}</Label>
                <Input
                  type="number"
                  value={formData.amount_raised || ''}
                  onChange={(e) => updateField('amount_raised', parseFloat(e.target.value) || undefined)}
                  placeholder="0"
                />
              </div>
            </TabsContent>

            {/* Scoring Tab */}
            <TabsContent value="scoring" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    muUNO Scoring™
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>{isRu ? 'Общий скоринг' : 'Overall Score'}</Label>
                      <span className="font-bold text-primary">{formData.muuno_score || 0}</span>
                    </div>
                    <Slider
                      value={[formData.muuno_score || 0]}
                      onValueChange={([val]) => updateField('muuno_score', val)}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{isRu ? 'Уровень риска' : 'Risk Level'}</Label>
                    <Select 
                      value={formData.risk_level || ''} 
                      onValueChange={(val) => updateField('risk_level', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isRu ? 'Выберите' : 'Select'} />
                      </SelectTrigger>
                      <SelectContent>
                        {RISK_LEVELS.map(r => (
                          <SelectItem key={r.value} value={r.value}>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={`h-4 w-4 ${
                                r.value === 'low' ? 'text-success' : 
                                r.value === 'medium' ? 'text-warning' : 'text-destructive'
                              }`} />
                              {isRu ? r.labelRu : r.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Score breakdown by category */}
                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-sm font-medium">{isRu ? 'Разбивка по категориям' : 'Score Breakdown'}</Label>
                    
                    {['location', 'developer', 'financials', 'demand'].map((key) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{key}</span>
                          <span>{formData.score_breakdown?.[key] || 0}</span>
                        </div>
                        <Slider
                          value={[formData.score_breakdown?.[key] || 0]}
                          onValueChange={([val]) => {
                            const breakdown = { ...formData.score_breakdown, [key]: val };
                            updateField('score_breakdown', breakdown);
                          }}
                          max={100}
                          step={1}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Обложка' : 'Cover Image'}</Label>
                <AirbnbStyleImageUpload
                  value={formData.cover_image ? [formData.cover_image] : []}
                  onChange={(imgs) => updateField('cover_image', imgs[0] || undefined)}
                  maxImages={1}
                  folder="investment-images"
                />
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Галерея' : 'Gallery'}</Label>
                <AirbnbStyleImageUpload
                  value={formData.images || []}
                  onChange={(imgs) => updateField('images', imgs)}
                  maxImages={10}
                  folder="investment-images"
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
              disabled={createProject.isPending || updateProject.isPending}
              className="flex-1"
            >
              {(createProject.isPending || updateProject.isPending) && (
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
              {isRu ? 'Удалить проект?' : 'Delete project?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRu 
                ? 'Это действие нельзя отменить. Проект будет удалён навсегда.'
                : 'This action cannot be undone. The project will be permanently deleted.'}
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
