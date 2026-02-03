import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePMCompanies, PMCompany, PMCompanyInsert } from '@/hooks/usePMCompanies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Building,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  Phone,
  Mail,
  Globe,
  Home,
  Shield,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { TranslatableInput } from '@/components/forms/TranslatableInput';
import { TranslatableTextarea } from '@/components/forms/TranslatableTextarea';

const SERVICE_TYPE_OPTIONS = [
  { value: 'rental_management', labelEn: 'Rental Management', labelRu: 'Управление арендой' },
  { value: 'maintenance', labelEn: 'Maintenance', labelRu: 'Техобслуживание' },
  { value: 'cleaning', labelEn: 'Cleaning', labelRu: 'Клининг' },
  { value: 'concierge', labelEn: 'Concierge', labelRu: 'Консьерж' },
  { value: 'guest_services', labelEn: 'Guest Services', labelRu: 'Сервис для гостей' },
  { value: 'accounting', labelEn: 'Accounting', labelRu: 'Бухгалтерия' },
];

const DISTRICT_OPTIONS = [
  'Patong', 'Kata', 'Karon', 'Kamala', 'Surin', 'Bang Tao', 
  'Laguna', 'Cherng Talay', 'Rawai', 'Chalong', 'Phuket Town'
];

export default function AdminPMCompanies() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { companies, isLoading, createCompany, updateCompany, deleteCompany } = usePMCompanies();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<PMCompany | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<PMCompanyInsert>>({
    name: '',
    name_ru: '',
    description: '',
    description_ru: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    license_number: '',
    service_districts: [],
    service_types: [],
    languages: ['en'],
    has_24_7_support: false,
    has_emergency_service: false,
    default_commission_rate: 10,
    min_contract_months: 12,
    is_active: true,
    is_verified: false,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      name_ru: '',
      description: '',
      description_ru: '',
      phone: '',
      email: '',
      website: '',
      address: '',
      license_number: '',
      service_districts: [],
      service_types: [],
      languages: ['en'],
      has_24_7_support: false,
      has_emergency_service: false,
      default_commission_rate: 10,
      min_contract_months: 12,
      is_active: true,
      is_verified: false,
    });
    setEditingCompany(null);
  };

  const openEditDialog = (company: PMCompany) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      name_ru: company.name_ru || '',
      description: company.description || '',
      description_ru: company.description_ru || '',
      phone: company.phone || '',
      email: company.email || '',
      website: company.website || '',
      address: company.address || '',
      license_number: company.license_number || '',
      service_districts: company.service_districts || [],
      service_types: company.service_types || [],
      languages: company.languages || ['en'],
      has_24_7_support: company.has_24_7_support,
      has_emergency_service: company.has_emergency_service,
      default_commission_rate: company.default_commission_rate,
      min_contract_months: company.min_contract_months,
      is_active: company.is_active,
      is_verified: company.is_verified,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error(isRu ? 'Введите название' : 'Enter company name');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCompany) {
        await updateCompany({ id: editingCompany.id, data: formData });
      } else {
        await createCompany(formData as PMCompanyInsert);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving PM company:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCompany(id);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting PM company:', error);
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name_ru?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">
            {isRu ? 'Управляющие компании' : 'Property Management Companies'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRu ? 'Справочник УК для управления объектами' : 'PM companies directory'}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Добавить УК' : 'Add PM Company'}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isRu ? 'Поиск...' : 'Search...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Companies List */}
      {filteredCompanies.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-1">
              {isRu ? 'Нет управляющих компаний' : 'No PM companies'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isRu ? 'Добавьте первую УК' : 'Add your first PM company'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className={!company.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">
                        {isRu ? (company.name_ru || company.name) : company.name}
                      </h3>
                      {company.is_verified && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {company.service_types?.slice(0, 3).map(type => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {SERVICE_TYPE_OPTIONS.find(s => s.value === type)?.[isRu ? 'labelRu' : 'labelEn'] || type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(company)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {isRu ? 'Редактировать' : 'Edit'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setDeleteConfirmId(company.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isRu ? 'Удалить' : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  {company.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {company.phone}
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {company.email}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Home className="h-3 w-3" />
                    {company.properties_managed} {isRu ? 'объектов' : 'properties'}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  {company.has_24_7_support && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      24/7
                    </Badge>
                  )}
                  {company.has_emergency_service && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      {isRu ? 'Экстренный' : 'Emergency'}
                    </Badge>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {company.default_commission_rate}% комиссия
                  </span>
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
              {editingCompany 
                ? (isRu ? 'Редактировать УК' : 'Edit PM Company')
                : (isRu ? 'Новая УК' : 'New PM Company')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <TranslatableInput
              label={isRu ? 'Название компании' : 'Company Name'}
              value={formData.name || ''}
              translatedValue={formData.name_ru || ''}
              onChange={(v) => setFormData(prev => ({ ...prev, name: v }))}
              onTranslatedChange={(v) => setFormData(prev => ({ ...prev, name_ru: v }))}
            />

            {/* Description */}
            <TranslatableTextarea
              label={isRu ? 'Описание' : 'Description'}
              value={formData.description || ''}
              translatedValue={formData.description_ru || ''}
              onChange={(v) => setFormData(prev => ({ ...prev, description: v }))}
              onTranslatedChange={(v) => setFormData(prev => ({ ...prev, description_ru: v }))}
            />

            {/* Contacts */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRu ? 'Телефон' : 'Phone'}</Label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+66..."
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRu ? 'Сайт' : 'Website'}</Label>
                <Input
                  value={formData.website || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                />
              </div>
              <div>
                <Label>{isRu ? 'Номер лицензии' : 'License Number'}</Label>
                <Input
                  value={formData.license_number || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <Label>{isRu ? 'Адрес' : 'Address'}</Label>
              <Input
                value={formData.address || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            {/* Service Types */}
            <div>
              <Label>{isRu ? 'Типы услуг' : 'Service Types'}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SERVICE_TYPE_OPTIONS.map(option => (
                  <Badge
                    key={option.value}
                    variant={formData.service_types?.includes(option.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const current = formData.service_types || [];
                      const updated = current.includes(option.value)
                        ? current.filter(t => t !== option.value)
                        : [...current, option.value];
                      setFormData(prev => ({ ...prev, service_types: updated }));
                    }}
                  >
                    {isRu ? option.labelRu : option.labelEn}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Districts */}
            <div>
              <Label>{isRu ? 'Районы обслуживания' : 'Service Districts'}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DISTRICT_OPTIONS.map(district => (
                  <Badge
                    key={district}
                    variant={formData.service_districts?.includes(district) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const current = formData.service_districts || [];
                      const updated = current.includes(district)
                        ? current.filter(d => d !== district)
                        : [...current, district];
                      setFormData(prev => ({ ...prev, service_districts: updated }));
                    }}
                  >
                    {district}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Commission & Contract */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRu ? 'Комиссия по умолчанию (%)' : 'Default Commission (%)'}</Label>
                <Input
                  type="number"
                  value={formData.default_commission_rate || 10}
                  onChange={(e) => setFormData(prev => ({ ...prev, default_commission_rate: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label>{isRu ? 'Мин. срок контракта (мес.)' : 'Min Contract (months)'}</Label>
                <Input
                  type="number"
                  value={formData.min_contract_months || 12}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_contract_months: Number(e.target.value) }))}
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.has_24_7_support}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, has_24_7_support: v }))}
                />
                <Label>{isRu ? 'Поддержка 24/7' : '24/7 Support'}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.has_emergency_service}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, has_emergency_service: v }))}
                />
                <Label>{isRu ? 'Экстренный сервис' : 'Emergency Service'}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_verified}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_verified: v }))}
                />
                <Label>{isRu ? 'Верифицирована' : 'Verified'}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
                />
                <Label>{isRu ? 'Активна' : 'Active'}</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '...' : (editingCompany ? (isRu ? 'Сохранить' : 'Save') : (isRu ? 'Создать' : 'Create'))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRu ? 'Удалить УК?' : 'Delete PM Company?'}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            {isRu ? 'Это действие нельзя отменить.' : 'This action cannot be undone.'}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              {isRu ? 'Удалить' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
