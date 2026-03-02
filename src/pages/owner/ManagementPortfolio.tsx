import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Archive,
  Pencil,
  Percent,
  DollarSign,
  Building2,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  Zap,
  CheckSquare,
  X,
} from 'lucide-react';
import {
  useAllManagementTerms,
  useUpdateManagementTerms,
  ManagementTerms,
  ExpenseResponsibility,
  DEFAULT_EXPENSES,
} from '@/hooks/usePropertyManagementTerms';
import { ManagementTermsForm } from '@/components/owner/management/ManagementTermsForm';
import { TermsActivityLog } from '@/components/owner/management/TermsActivityLog';
import { InlineStatusSelect } from '@/components/owner/management/InlineStatusSelect';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

type FilterStatus = 'all' | 'active' | 'draft' | 'pending_approval' | 'archived';

function statusBadge(status: ManagementTerms['status'], isRu: boolean) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          {isRu ? 'Активно' : 'Active'}
        </Badge>
      );
    case 'pending_approval':
      return (
        <Badge className="gap-1 bg-warning/15 text-warning border-warning/20 hover:bg-warning/20">
          <ShieldCheck className="h-3 w-3" />
          {isRu ? 'На согласовании' : 'Pending'}
        </Badge>
      );
    case 'draft':
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          {isRu ? 'Черновик' : 'Draft'}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1">
          <Archive className="h-3 w-3" />
          {isRu ? 'В архиве' : 'Archived'}
        </Badge>
      );
  }
}

function expensePartyLabel(party: string, isRu: boolean) {
  if (party === 'owner') return isRu ? 'Собств.' : 'Owner';
  if (party === 'manager') return isRu ? 'УК' : 'Mgr';
  return isRu ? 'Пополам' : 'Split';
}

const FILTER_TABS: { value: FilterStatus; labelEn: string; labelRu: string }[] = [
  { value: 'all', labelEn: 'All', labelRu: 'Все' },
  { value: 'active', labelEn: 'Active', labelRu: 'Активные' },
  { value: 'pending_approval', labelEn: 'Pending', labelRu: 'Ожидают' },
  { value: 'draft', labelEn: 'Drafts', labelRu: 'Черновики' },
  { value: 'archived', labelEn: 'Archived', labelRu: 'Архив' },
];

/** Bulk presets — same as ManagementTermsForm */
interface BulkPreset {
  id: string;
  labelEn: string;
  labelRu: string;
  descEn: string;
  descRu: string;
  commission_rate: number;
  commission_type: 'percent' | 'fixed';
  commission_base: 'gross' | 'net';
  expenses: ExpenseResponsibility;
}

const BULK_PRESETS: BulkPreset[] = [
  {
    id: 'standard_70_30',
    labelEn: 'Standard 70/30',
    labelRu: 'Стандарт 70/30',
    descEn: 'Owner 70% / Manager 30% of gross',
    descRu: 'Собственник 70% / УК 30% от валовой',
    commission_rate: 30,
    commission_type: 'percent',
    commission_base: 'gross',
    expenses: { cleaning: 'manager', electricity: 'owner', water: 'owner', internet: 'owner', repairs_minor: 'manager', repairs_major: 'owner', cam_fees: 'owner', insurance: 'owner', marketing: 'manager' },
  },
  {
    id: 'premium_80_20',
    labelEn: 'Premium 80/20',
    labelRu: 'Премиум 80/20',
    descEn: 'Owner 80% / Manager 20% of gross',
    descRu: 'Собственник 80% / УК 20% от валовой',
    commission_rate: 20,
    commission_type: 'percent',
    commission_base: 'gross',
    expenses: { cleaning: 'owner', electricity: 'owner', water: 'owner', internet: 'owner', repairs_minor: 'split', repairs_major: 'owner', cam_fees: 'owner', insurance: 'owner', marketing: 'split' },
  },
  {
    id: 'full_service',
    labelEn: 'Full Service',
    labelRu: 'Полный сервис',
    descEn: 'Owner 60% / Manager 40% net',
    descRu: 'Собственник 60% / УК 40% от чистого',
    commission_rate: 40,
    commission_type: 'percent',
    commission_base: 'net',
    expenses: { cleaning: 'manager', electricity: 'manager', water: 'manager', internet: 'manager', repairs_minor: 'manager', repairs_major: 'split', cam_fees: 'owner', insurance: 'owner', marketing: 'manager' },
  },
];

/** Mobile card for a single management terms entry */
function TermsMobileCard({
  terms,
  isRu,
  onEdit,
  onNavigate,
  selected,
  onToggleSelect,
  bulkMode,
}: {
  terms: ManagementTerms;
  isRu: boolean;
  onEdit: () => void;
  onNavigate: (path: string) => void;
  selected: boolean;
  onToggleSelect: () => void;
  bulkMode: boolean;
}) {
  const title = isRu
    ? (terms.property?.title_ru || terms.property?.title_en || '—')
    : (terms.property?.title_en || terms.property?.title_ru || '—');
  const isExpired = terms.valid_until && new Date(terms.valid_until) < new Date();

  return (
    <Card className={cn('transition-all', isExpired && 'border-destructive/30', selected && 'ring-2 ring-primary border-primary')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {bulkMode && (
              <Checkbox checked={selected} onCheckedChange={onToggleSelect} className="mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {isExpired && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
                <button
                  onClick={() => onNavigate(`/mc/properties/${terms.property_id}`)}
                  className="font-semibold text-sm truncate text-left hover:text-primary transition-colors hover:underline"
                >
                  {title}
                </button>
              </div>
              {terms.property?.address && (
                <p className="text-xs text-muted-foreground truncate">{terms.property.address}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <InlineStatusSelect terms={terms} />
          {isExpired && (
            <span className="text-xs text-destructive font-medium">
              {isRu ? 'Истёк' : 'Expired'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-0.5">{isRu ? 'Комиссия' : 'Commission'}</p>
            <div className="flex items-center gap-1 font-medium">
              {terms.commission_type === 'percent' ? (
                <>
                  <Percent className="h-3 w-3 text-primary" />
                  {terms.commission_rate ?? '—'}%
                  <span className="text-xs text-muted-foreground">({terms.commission_base})</span>
                </>
              ) : (
                <>
                  <DollarSign className="h-3 w-3 text-primary" />
                  {terms.commission_amount?.toLocaleString() ?? '—'} {terms.payment_currency}
                </>
              )}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-0.5">{isRu ? 'Выплата' : 'Payout'}</p>
            <p className="font-medium">
              {terms.payment_day ? (isRu ? `${terms.payment_day}-е число` : `${terms.payment_day}th`) : '—'}{' '}
              {terms.payment_currency}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-0.5">{isRu ? 'Уборка' : 'Cleaning'}</p>
            <p className="font-medium">{expensePartyLabel(terms.expense_responsibility?.cleaning || 'owner', isRu)}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-0.5">{isRu ? 'Ремонт' : 'Repairs'}</p>
            <p className="font-medium">{expensePartyLabel(terms.expense_responsibility?.repairs_major || 'owner', isRu)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ManagementPortfolio() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: allTerms, isLoading } = useAllManagementTerms();
  const updateTerms = useUpdateManagementTerms();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedTerms, setSelectedTerms] = useState<ManagementTerms | undefined>(undefined);

  // Bulk selection state
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkApplying, setBulkApplying] = useState(false);

  const filtered = useMemo(() => {
    if (!allTerms) return [];
    return allTerms.filter(t => {
      const title = t.property?.title_en || t.property?.title_ru || '';
      const matchSearch = !search || title.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [allTerms, search, filterStatus]);

  const openSheet = (propertyId: string, existing?: ManagementTerms) => {
    setSelectedPropertyId(propertyId);
    setSelectedTerms(existing);
    setSheetOpen(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(t => t.id)));
    }
  };

  const exitBulkMode = () => {
    setBulkMode(false);
    setSelectedIds(new Set());
  };

  const applyBulkPreset = async (preset: BulkPreset) => {
    if (selectedIds.size === 0) {
      toast.warning(isRu ? 'Выберите объекты' : 'Select properties first');
      return;
    }

    setBulkApplying(true);
    let successCount = 0;
    let errorCount = 0;

    const termsToUpdate = (allTerms || []).filter(t => selectedIds.has(t.id));

    for (const terms of termsToUpdate) {
      try {
        await updateTerms.mutateAsync({
          id: terms.id,
          updates: {
            commission_type: preset.commission_type,
            commission_rate: preset.commission_rate,
            commission_base: preset.commission_base,
            revenue_split_owner: 100 - preset.commission_rate,
            revenue_split_manager: preset.commission_rate,
            expense_responsibility: { ...preset.expenses },
          },
        });
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setBulkApplying(false);

    if (successCount > 0) {
      toast.success(
        isRu
          ? `Шаблон "${preset.labelRu}" применён к ${successCount} объектам`
          : `"${preset.labelEn}" applied to ${successCount} properties`
      );
    }
    if (errorCount > 0) {
      toast.error(
        isRu
          ? `Ошибка для ${errorCount} объектов`
          : `Failed for ${errorCount} properties`
      );
    }

    exitBulkMode();
  };

  const counts = useMemo(() => ({
    active: allTerms?.filter(t => t.status === 'active').length ?? 0,
    pending: allTerms?.filter(t => t.status === 'pending_approval').length ?? 0,
    draft: allTerms?.filter(t => t.status === 'draft').length ?? 0,
    total: allTerms?.length ?? 0,
    avgCommission: allTerms?.length
      ? Math.round(
          (allTerms
            .filter(t => t.commission_type === 'percent' && t.commission_rate)
            .reduce((sum, t) => sum + (t.commission_rate || 0), 0) /
            Math.max(allTerms.filter(t => t.commission_type === 'percent' && t.commission_rate).length, 1))
        )
      : 0,
    expiredCount: allTerms?.filter(t => t.valid_until && new Date(t.valid_until) < new Date()).length ?? 0,
  }), [allTerms]);

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Условия управления' : 'Management Terms'}
        subtitle={isRu ? 'Коммерческие условия по каждому объекту УК' : 'Commercial terms per property for managers'}
        showBack
        fallbackPath="/owner"
      />

      {/* ── Hub KPI Metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { icon: Building2, label: isRu ? 'Всего объектов' : 'Total Properties', value: counts.total, color: 'text-foreground', bg: 'bg-muted/50' },
          { icon: CheckCircle2, label: isRu ? 'Активных' : 'Active', value: counts.active, color: 'text-primary', bg: 'bg-primary/8' },
          { icon: TrendingUp, label: isRu ? 'Ср. комиссия' : 'Avg Commission', value: `${counts.avgCommission}%`, color: 'text-primary', bg: 'bg-primary/8' },
          { icon: AlertTriangle, label: isRu ? 'Истекают' : 'Expiring', value: counts.expiredCount, color: counts.expiredCount > 0 ? 'text-destructive' : 'text-muted-foreground', bg: counts.expiredCount > 0 ? 'bg-destructive/8' : 'bg-muted/50' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={cn('rounded-xl border p-3', bg)}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={cn('h-4 w-4', color)} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className={cn('text-xl font-bold', color)}>{isLoading ? '–' : value}</p>
          </div>
        ))}
      </div>

      {/* ── Tab Filters + Bulk Mode Toggle ── */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilterStatus(tab.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0',
                filterStatus === tab.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              )}
            >
              <span>{isRu ? tab.labelRu : tab.labelEn}</span>
              {tab.value === 'pending_approval' && counts.pending > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-warning text-warning-foreground text-[10px] font-bold leading-none">
                  {counts.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {!bulkMode ? (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => setBulkMode(true)}
            disabled={!allTerms || allTerms.length === 0}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            {isRu ? 'Массово' : 'Bulk'}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={exitBulkMode}
          >
            <X className="h-3.5 w-3.5" />
            {isRu ? 'Отмена' : 'Cancel'}
          </Button>
        )}
      </div>

      {/* ── Bulk Action Bar ── */}
      {bulkMode && (
        <div className="mb-4 p-3 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedIds.size === filtered.length && filtered.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedIds.size > 0
                  ? (isRu ? `Выбрано: ${selectedIds.size}` : `Selected: ${selectedIds.size}`)
                  : (isRu ? 'Выберите объекты' : 'Select properties')}
              </span>
            </div>
            {selectedIds.size > 0 && (
              <Badge variant="secondary">{selectedIds.size}</Badge>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {isRu ? 'Применить шаблон ко всем выбранным:' : 'Apply preset to all selected:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {BULK_PRESETS.map(preset => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={bulkApplying}
                    onClick={() => applyBulkPreset(preset)}
                  >
                    <Zap className="h-3 w-3" />
                    {isRu ? preset.labelRu : preset.labelEn}
                    <span className="text-xs text-muted-foreground">
                      ({100 - preset.commission_rate}/{preset.commission_rate})
                    </span>
                  </Button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isRu ? preset_desc_ru() : preset_desc_en()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={isRu ? 'Поиск по объекту...' : 'Search property...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileCheck className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">{isRu ? 'Условия не найдены' : 'No terms found'}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Нет объектов с заданными условиями управления' : 'No properties have management terms configured'}
          </p>
        </div>
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.map(terms => (
            <TermsMobileCard
              key={terms.id}
              terms={terms}
              isRu={isRu}
              onEdit={() => openSheet(terms.property_id, terms)}
              onNavigate={navigate}
              selected={selectedIds.has(terms.id)}
              onToggleSelect={() => toggleSelect(terms.id)}
              bulkMode={bulkMode}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {bulkMode && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead>{isRu ? 'Объект' : 'Property'}</TableHead>
                <TableHead>{isRu ? 'Комиссия' : 'Commission'}</TableHead>
                <TableHead>{isRu ? 'Уборка' : 'Cleaning'}</TableHead>
                <TableHead>{isRu ? 'Ремонт' : 'Repairs'}</TableHead>
                <TableHead>{isRu ? 'Выплата' : 'Payout'}</TableHead>
                <TableHead>{isRu ? 'Статус' : 'Status'}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(terms => {
                const title = isRu
                  ? (terms.property?.title_ru || terms.property?.title_en || '—')
                  : (terms.property?.title_en || terms.property?.title_ru || '—');
                const isExpired = terms.valid_until && new Date(terms.valid_until) < new Date();
                const isSelected = selectedIds.has(terms.id);
                return (
                  <TableRow key={terms.id} className={cn(isExpired && 'bg-destructive/5', isSelected && 'bg-primary/5')}>
                    {bulkMode && (
                      <TableCell>
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(terms.id)} />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isExpired && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
                        <div>
                          <button
                            onClick={() => navigate(`/mc/properties/${terms.property_id}`)}
                            className="font-medium text-sm line-clamp-1 text-left hover:text-primary hover:underline transition-colors"
                          >
                            {title}
                          </button>
                          {terms.property?.address && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{terms.property.address}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        {terms.commission_type === 'percent' ? (
                          <>
                            <Percent className="h-3 w-3" />
                            {terms.commission_rate ?? '—'}%
                            <span className="text-xs text-muted-foreground">({terms.commission_base})</span>
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-3 w-3" />
                            {terms.commission_amount?.toLocaleString() ?? '—'}
                            <span className="text-xs text-muted-foreground">{terms.payment_currency}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {expensePartyLabel(terms.expense_responsibility?.cleaning || 'owner', isRu)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {expensePartyLabel(terms.expense_responsibility?.repairs_major || 'owner', isRu)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {terms.payment_day ? (isRu ? `${terms.payment_day}-е` : `${terms.payment_day}th`) : '—'}
                      {' '}{terms.payment_currency}
                    </TableCell>
                    <TableCell>
                      <InlineStatusSelect terms={terms} />
                      {isExpired && (
                        <p className="text-xs text-destructive mt-0.5">{isRu ? 'Истёк' : 'Expired'}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openSheet(terms.property_id, terms)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Empty state CTA */}
      {!isLoading && (allTerms?.length ?? 0) === 0 && (
        <div className="text-center mt-4">
          <Button variant="outline" onClick={() => navigate('/mc/properties')}>
            <Plus className="h-4 w-4 mr-2" />
            {isRu ? 'Перейти к объектам' : 'Go to properties'}
          </Button>
        </div>
      )}

      {/* Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>
              {selectedTerms
                ? (isRu ? 'Редактировать условия' : 'Edit Terms')
                : (isRu ? 'Новые условия' : 'New Terms')}
            </SheetTitle>
          </SheetHeader>
          {selectedPropertyId && (
            <>
              <ManagementTermsForm
                propertyId={selectedPropertyId}
                existing={selectedTerms}
                onSaved={() => setSheetOpen(false)}
              />
              {selectedTerms && (
                <>
                  <Separator className="my-6" />
                  <TermsActivityLog termsId={selectedTerms.id} />
                </>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}

function preset_desc_ru() {
  return 'Шаблон обновит комиссию, базу расчёта и распределение расходов для всех выбранных объектов';
}

function preset_desc_en() {
  return 'Preset will update commission, calculation base and expense distribution for all selected properties';
}
