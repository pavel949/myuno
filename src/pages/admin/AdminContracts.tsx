import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProviderContracts, ProviderContract, ContractInsert } from '@/hooks/useProviderContracts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Play,
  Pause,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const ENTITY_TYPE_OPTIONS = [
  { value: 'provider', labelEn: 'Provider', labelRu: 'Провайдер' },
  { value: 'vendor', labelEn: 'Vendor', labelRu: 'Вендор' },
  { value: 'pm_company', labelEn: 'PM Company', labelRu: 'УК' },
  { value: 'project', labelEn: 'Project', labelRu: 'Проект' },
];

const CONTRACT_TYPE_OPTIONS = [
  { value: 'standard', labelEn: 'Standard', labelRu: 'Стандартный' },
  { value: 'exclusive', labelEn: 'Exclusive', labelRu: 'Эксклюзивный' },
  { value: 'trial', labelEn: 'Trial', labelRu: 'Пробный' },
  { value: 'custom', labelEn: 'Custom', labelRu: 'Особый' },
];

const STATUS_OPTIONS = [
  { value: 'draft', labelEn: 'Draft', labelRu: 'Черновик', icon: FileText, color: 'bg-gray-100 text-gray-800' },
  { value: 'pending_approval', labelEn: 'Pending', labelRu: 'На согласовании', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'active', labelEn: 'Active', labelRu: 'Активен', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { value: 'suspended', labelEn: 'Suspended', labelRu: 'Приостановлен', icon: Pause, color: 'bg-orange-100 text-orange-800' },
  { value: 'terminated', labelEn: 'Terminated', labelRu: 'Расторгнут', icon: XCircle, color: 'bg-red-100 text-red-800' },
  { value: 'expired', labelEn: 'Expired', labelRu: 'Истёк', icon: AlertCircle, color: 'bg-gray-100 text-gray-600' },
];

const PAYMENT_TERMS_OPTIONS = [
  { value: 'per_transaction', labelEn: 'Per Transaction', labelRu: 'За транзакцию' },
  { value: 'weekly', labelEn: 'Weekly', labelRu: 'Еженедельно' },
  { value: 'monthly', labelEn: 'Monthly', labelRu: 'Ежемесячно' },
];

export default function AdminContracts() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { contracts, isLoading, createContract, updateContract, deleteContract, activateContract } = useProviderContracts();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ProviderContract | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<ContractInsert>>({
    entity_type: 'provider',
    entity_id: '',
    contract_number: '',
    contract_type: 'standard',
    commission_rate: 10,
    commission_type: 'percentage',
    payment_terms: 'monthly',
    valid_from: new Date().toISOString().split('T')[0],
    auto_renew: true,
    notice_period_days: 30,
    status: 'draft',
    special_terms: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      entity_type: 'provider',
      entity_id: '',
      contract_number: '',
      contract_type: 'standard',
      commission_rate: 10,
      commission_type: 'percentage',
      payment_terms: 'monthly',
      valid_from: new Date().toISOString().split('T')[0],
      auto_renew: true,
      notice_period_days: 30,
      status: 'draft',
      special_terms: '',
      notes: '',
    });
    setEditingContract(null);
  };

  const openEditDialog = (contract: ProviderContract) => {
    setEditingContract(contract);
    setFormData({
      entity_type: contract.entity_type,
      entity_id: contract.entity_id,
      contract_number: contract.contract_number || '',
      contract_type: contract.contract_type,
      commission_rate: contract.commission_rate,
      commission_type: contract.commission_type,
      min_commission_amount: contract.min_commission_amount,
      max_commission_amount: contract.max_commission_amount,
      payment_terms: contract.payment_terms,
      payment_method: contract.payment_method,
      bank_name: contract.bank_name,
      bank_account_number: contract.bank_account_number,
      bank_account_name: contract.bank_account_name,
      valid_from: contract.valid_from,
      valid_until: contract.valid_until,
      auto_renew: contract.auto_renew,
      notice_period_days: contract.notice_period_days,
      status: contract.status,
      special_terms: contract.special_terms || '',
      notes: contract.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.entity_type || !formData.entity_id) {
      toast.error(isRu ? 'Выберите тип и ID сущности' : 'Select entity type and ID');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingContract) {
        await updateContract({ id: editingContract.id, data: formData });
      } else {
        await createContract(formData as ContractInsert);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving contract:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await activateContract(id);
    } catch (error) {
      console.error('Error activating contract:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    if (!option) return null;
    const Icon = option.icon;
    return (
      <Badge className={`${option.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {isRu ? option.labelRu : option.labelEn}
      </Badge>
    );
  };

  const filteredContracts = contracts.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (entityTypeFilter !== 'all' && c.entity_type !== entityTypeFilter) return false;
    if (searchQuery) {
      return c.contract_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             c.entity_id.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Group by status for tabs
  const statusCounts = {
    all: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    pending_approval: contracts.filter(c => c.status === 'pending_approval').length,
    draft: contracts.filter(c => c.status === 'draft').length,
    other: contracts.filter(c => ['suspended', 'terminated', 'expired'].includes(c.status)).length,
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
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
            {isRu ? 'Контракты' : 'Contracts'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRu ? 'Договоры с поставщиками, вендорами, УК' : 'Contracts with providers, vendors, PM companies'}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Новый контракт' : 'New Contract'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isRu ? 'Поиск по номеру...' : 'Search by number...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={isRu ? 'Тип сущности' : 'Entity Type'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRu ? 'Все типы' : 'All types'}</SelectItem>
            {ENTITY_TYPE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {isRu ? opt.labelRu : opt.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">
            {isRu ? 'Все' : 'All'} ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="active">
            {isRu ? 'Активные' : 'Active'} ({statusCounts.active})
          </TabsTrigger>
          <TabsTrigger value="pending_approval">
            {isRu ? 'На согласовании' : 'Pending'} ({statusCounts.pending_approval})
          </TabsTrigger>
          <TabsTrigger value="draft">
            {isRu ? 'Черновики' : 'Drafts'} ({statusCounts.draft})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Contracts List */}
      {filteredContracts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-1">
              {isRu ? 'Нет контрактов' : 'No contracts'}
            </h3>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredContracts.map((contract) => (
            <Card key={contract.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">
                        {contract.contract_number || `#${contract.id.slice(0, 8)}`}
                      </span>
                      {getStatusBadge(contract.status)}
                      <Badge variant="outline">
                        {ENTITY_TYPE_OPTIONS.find(t => t.value === contract.entity_type)?.[isRu ? 'labelRu' : 'labelEn']}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">{isRu ? 'Комиссия:' : 'Commission:'}</span>
                        <span className="ml-1 font-medium">{contract.commission_rate}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{isRu ? 'Начало:' : 'Start:'}</span>
                        <span className="ml-1">{format(new Date(contract.valid_from), 'dd.MM.yyyy')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{isRu ? 'Окончание:' : 'End:'}</span>
                        <span className="ml-1">
                          {contract.valid_until 
                            ? format(new Date(contract.valid_until), 'dd.MM.yyyy')
                            : (isRu ? 'Бессрочно' : 'Indefinite')}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{isRu ? 'Оплата:' : 'Payment:'}</span>
                        <span className="ml-1">
                          {PAYMENT_TERMS_OPTIONS.find(p => p.value === contract.payment_terms)?.[isRu ? 'labelRu' : 'labelEn']}
                        </span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {contract.status === 'draft' && (
                        <DropdownMenuItem onClick={() => handleActivate(contract.id)}>
                          <Play className="h-4 w-4 mr-2" />
                          {isRu ? 'Активировать' : 'Activate'}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => openEditDialog(contract)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {isRu ? 'Редактировать' : 'Edit'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => deleteContract(contract.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isRu ? 'Удалить' : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
              {editingContract 
                ? (isRu ? 'Редактировать контракт' : 'Edit Contract')
                : (isRu ? 'Новый контракт' : 'New Contract')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Entity Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRu ? 'Тип сущности' : 'Entity Type'}</Label>
                <Select 
                  value={formData.entity_type} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, entity_type: v as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {isRu ? opt.labelRu : opt.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Entity ID *</Label>
                <Input
                  value={formData.entity_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, entity_id: e.target.value }))}
                  placeholder="UUID"
                />
              </div>
            </div>

            {/* Contract Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRu ? 'Номер контракта' : 'Contract Number'}</Label>
                <Input
                  value={formData.contract_number || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, contract_number: e.target.value }))}
                  placeholder="UNO-2024-001"
                />
              </div>
              <div>
                <Label>{isRu ? 'Тип контракта' : 'Contract Type'}</Label>
                <Select 
                  value={formData.contract_type} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, contract_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {isRu ? opt.labelRu : opt.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Commission */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>{isRu ? 'Комиссия (%)' : 'Commission (%)'}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.commission_rate || 10}
                    onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: Number(e.target.value) }))}
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <Label>{isRu ? 'Мин. комиссия' : 'Min Commission'}</Label>
                <Input
                  type="number"
                  value={formData.min_commission_amount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_commission_amount: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="THB"
                />
              </div>
              <div>
                <Label>{isRu ? 'Макс. комиссия' : 'Max Commission'}</Label>
                <Input
                  type="number"
                  value={formData.max_commission_amount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_commission_amount: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="THB"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRu ? 'Дата начала' : 'Start Date'} *</Label>
                <Input
                  type="date"
                  value={formData.valid_from || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, valid_from: e.target.value }))}
                />
              </div>
              <div>
                <Label>{isRu ? 'Дата окончания' : 'End Date'}</Label>
                <Input
                  type="date"
                  value={formData.valid_until || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value || undefined }))}
                />
              </div>
            </div>

            {/* Payment */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRu ? 'Условия оплаты' : 'Payment Terms'}</Label>
                <Select 
                  value={formData.payment_terms} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, payment_terms: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {isRu ? opt.labelRu : opt.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isRu ? 'Срок уведомления (дни)' : 'Notice Period (days)'}</Label>
                <Input
                  type="number"
                  value={formData.notice_period_days || 30}
                  onChange={(e) => setFormData(prev => ({ ...prev, notice_period_days: Number(e.target.value) }))}
                />
              </div>
            </div>

            {/* Bank Details */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>{isRu ? 'Банк' : 'Bank'}</Label>
                <Input
                  value={formData.bank_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>{isRu ? 'Номер счёта' : 'Account Number'}</Label>
                <Input
                  value={formData.bank_account_number || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_account_number: e.target.value }))}
                />
              </div>
              <div>
                <Label>{isRu ? 'Имя владельца счёта' : 'Account Name'}</Label>
                <Input
                  value={formData.bank_account_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_account_name: e.target.value }))}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>{isRu ? 'Особые условия' : 'Special Terms'}</Label>
              <Textarea
                value={formData.special_terms || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, special_terms: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.auto_renew}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, auto_renew: v }))}
                />
                <Label>{isRu ? 'Автопродление' : 'Auto-renew'}</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '...' : (editingContract ? (isRu ? 'Сохранить' : 'Save') : (isRu ? 'Создать' : 'Create'))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
