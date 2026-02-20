import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  useAllManagementTerms,
  ManagementTerms,
} from '@/hooks/usePropertyManagementTerms';
import { ManagementTermsForm } from '@/components/owner/management/ManagementTermsForm';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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

/** Mobile card for a single management terms entry */
function TermsMobileCard({
  terms,
  isRu,
  onEdit,
}: {
  terms: ManagementTerms;
  isRu: boolean;
  onEdit: () => void;
}) {
  const title = isRu
    ? (terms.property?.title_ru || terms.property?.title || '—')
    : (terms.property?.title || terms.property?.title_ru || '—');
  const isExpired = terms.valid_until && new Date(terms.valid_until) < new Date();

  return (
    <Card className={cn('transition-all', isExpired && 'border-destructive/30')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isExpired && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
              <p className="font-semibold text-sm truncate">{title}</p>
            </div>
            {terms.property?.address && (
              <p className="text-xs text-muted-foreground truncate">{terms.property.address}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          {statusBadge(terms.status, isRu)}
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
              {terms.payment_day
                ? (isRu ? `${terms.payment_day}-е число` : `${terms.payment_day}th`)
                : '—'}{' '}
              {terms.payment_currency}
            </p>
          </div>

          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-0.5">{isRu ? 'Уборка' : 'Cleaning'}</p>
            <p className="font-medium">
              {expensePartyLabel(terms.expense_responsibility?.cleaning || 'owner', isRu)}
            </p>
          </div>

          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-0.5">{isRu ? 'Ремонт' : 'Repairs'}</p>
            <p className="font-medium">
              {expensePartyLabel(terms.expense_responsibility?.repairs_major || 'owner', isRu)}
            </p>
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

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedTerms, setSelectedTerms] = useState<ManagementTerms | undefined>(undefined);

  const filtered = React.useMemo(() => {
    if (!allTerms) return [];
    return allTerms.filter(t => {
      const title = t.property?.title || t.property?.title_ru || '';
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

  const counts = React.useMemo(() => ({
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
          {
            icon: Building2,
            label: isRu ? 'Всего объектов' : 'Total Properties',
            value: counts.total,
            color: 'text-foreground',
            bg: 'bg-muted/50',
          },
          {
            icon: CheckCircle2,
            label: isRu ? 'Активных' : 'Active',
            value: counts.active,
            color: 'text-primary',
            bg: 'bg-primary/8',
          },
          {
            icon: TrendingUp,
            label: isRu ? 'Ср. комиссия' : 'Avg Commission',
            value: `${counts.avgCommission}%`,
            color: 'text-primary',
            bg: 'bg-primary/8',
          },
          {
            icon: AlertTriangle,
            label: isRu ? 'Истекают' : 'Expiring',
            value: counts.expiredCount,
            color: counts.expiredCount > 0 ? 'text-destructive' : 'text-muted-foreground',
            bg: counts.expiredCount > 0 ? 'bg-destructive/8' : 'bg-muted/50',
          },
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

      {/* ── Tab Filters (Segmented Control) ── */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-4 scrollbar-hide -mx-1 px-1">
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
            {isRu
              ? 'Нет объектов с заданными условиями управления'
              : 'No properties have management terms configured'}
          </p>
        </div>
      ) : isMobile ? (
        /* ── Mobile: Card-based layout ── */
        <div className="space-y-3">
          {filtered.map(terms => (
            <TermsMobileCard
              key={terms.id}
              terms={terms}
              isRu={isRu}
              onEdit={() => openSheet(terms.property_id, terms)}
            />
          ))}
        </div>
      ) : (
        /* ── Desktop: Table ── */
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
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
                  ? (terms.property?.title_ru || terms.property?.title || '—')
                  : (terms.property?.title || terms.property?.title_ru || '—');
                const isExpired =
                  terms.valid_until && new Date(terms.valid_until) < new Date();
                return (
                  <TableRow key={terms.id} className={isExpired ? 'bg-destructive/5' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isExpired && (
                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-sm line-clamp-1">{title}</p>
                          {terms.property?.address && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {terms.property.address}
                            </p>
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
                            <span className="text-xs text-muted-foreground">
                              ({terms.commission_base})
                            </span>
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-3 w-3" />
                            {terms.commission_amount?.toLocaleString() ?? '—'}
                            <span className="text-xs text-muted-foreground">
                              {terms.payment_currency}
                            </span>
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
                      {terms.payment_day
                        ? (isRu ? `${terms.payment_day}-е` : `${terms.payment_day}th`)
                        : '—'}
                      {' '}{terms.payment_currency}
                    </TableCell>
                    <TableCell>
                      {statusBadge(terms.status, isRu)}
                      {isExpired && (
                        <p className="text-xs text-destructive mt-0.5">
                          {isRu ? 'Истёк' : 'Expired'}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openSheet(terms.property_id, terms)}
                      >
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

      {/* Empty state CTA — only when no data at all */}
      {!isLoading && (allTerms?.length ?? 0) === 0 && (
        <div className="text-center mt-4">
          <Button
            variant="outline"
            onClick={() => navigate('/owner/properties')}
          >
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
            <ManagementTermsForm
              propertyId={selectedPropertyId}
              existing={selectedTerms}
              onSaved={() => setSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
