import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
} from 'lucide-react';
import {
  useAllManagementTerms,
  ManagementTerms,
} from '@/hooks/usePropertyManagementTerms';
import { ManagementTermsForm } from '@/components/owner/management/ManagementTermsForm';
import { cn } from '@/lib/utils';

function statusBadge(status: ManagementTerms['status'], isRu: boolean) {
  if (status === 'active') {
    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        {isRu ? 'Активно' : 'Active'}
      </Badge>
    );
  }
  if (status === 'draft') {
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        {isRu ? 'Черновик' : 'Draft'}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <Archive className="h-3 w-3" />
      {isRu ? 'В архиве' : 'Archived'}
    </Badge>
  );
}

function expensePartyLabel(party: string, isRu: boolean) {
  if (party === 'owner') return isRu ? 'Собств.' : 'Owner';
  if (party === 'manager') return isRu ? 'УК' : 'Mgr';
  return isRu ? 'Пополам' : 'Split';
}

export default function ManagementPortfolio() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();

  const { data: allTerms, isLoading } = useAllManagementTerms();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
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
    draft: allTerms?.filter(t => t.status === 'draft').length ?? 0,
    total: allTerms?.length ?? 0,
  }), [allTerms]);

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Условия управления' : 'Management Terms'}
        subtitle={isRu ? 'Коммерческие условия по каждому объекту УК' : 'Commercial terms per property for managers'}
        showBack
        fallbackPath="/owner"
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          {
            label: isRu ? 'Всего' : 'Total',
            value: counts.total,
          color: 'text-foreground',
          },
          {
            label: isRu ? 'Активных' : 'Active',
            value: counts.active,
            color: 'text-primary',
          },
          {
            label: isRu ? 'Черновики' : 'Drafts',
            value: counts.draft,
            color: 'text-muted-foreground',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border bg-card p-3 text-center">
            <p className={cn('text-2xl font-bold', color)}>{isLoading ? '–' : value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={isRu ? 'Поиск по объекту...' : 'Search property...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('all')}
        >
          {isRu ? 'Все' : 'All'}
        </Button>
        <Button
          variant={filterStatus === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('active')}
        >
          {isRu ? 'Активные' : 'Active'}
        </Button>
        <Button
          variant={filterStatus === 'draft' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('draft')}
        >
          {isRu ? 'Черновики' : 'Drafts'}
        </Button>
        <Button
          variant={filterStatus === 'archived' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('archived')}
        >
          {isRu ? 'Архив' : 'Archived'}
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <AlertTriangle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">{isRu ? 'Условия не найдены' : 'No terms found'}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu
              ? 'Нет объектов с заданными условиями управления'
              : 'No properties have management terms configured'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRu ? 'Объект' : 'Property'}</TableHead>
                <TableHead className="hidden md:table-cell">{isRu ? 'Комиссия' : 'Commission'}</TableHead>
                <TableHead className="hidden md:table-cell">{isRu ? 'Уборка' : 'Cleaning'}</TableHead>
                <TableHead className="hidden md:table-cell">{isRu ? 'Ремонт' : 'Repairs'}</TableHead>
                <TableHead className="hidden md:table-cell">{isRu ? 'Выплата' : 'Payout'}</TableHead>
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
                  <TableRow key={terms.id}>
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
                    <TableCell className="hidden md:table-cell">
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
                    <TableCell className="hidden md:table-cell text-sm">
                      {expensePartyLabel(terms.expense_responsibility?.cleaning || 'owner', isRu)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {expensePartyLabel(terms.expense_responsibility?.repairs_major || 'owner', isRu)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
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

      {/* Empty state CTA — only when no data at all, not when filtered */}
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
