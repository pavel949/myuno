import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Save, FileText, BedDouble, CalendarDays } from 'lucide-react';
import {
  useSaveAccountingPolicy,
  type AccountingPolicy,
} from '@/hooks/useAccountingPolicies';

interface AccountingPolicyEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyTitle: string;
  ownerContactId?: string | null;
  existing?: AccountingPolicy | null;
}

export function AccountingPolicyEditor({
  open, onOpenChange, propertyId, propertyTitle, ownerContactId, existing,
}: AccountingPolicyEditorProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const save = useSaveAccountingPolicy();

  const [policyName, setPolicyName] = useState('');
  const [grouping, setGrouping] = useState<'period' | 'per_booking'>('period');
  const [reportType, setReportType] = useState('monthly');
  const [defaultPeriod, setDefaultPeriod] = useState('last_month');
  const [includeIncome, setIncludeIncome] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [includeGuestDetails, setIncludeGuestDetails] = useState(true);
  const [includeBookingSource, setIncludeBookingSource] = useState(true);
  const [includeOccupancy, setIncludeOccupancy] = useState(true);
  const [includeMaintenance, setIncludeMaintenance] = useState(false);
  const [includeCommission, setIncludeCommission] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existing) {
      setPolicyName(existing.policy_name || '');
      setGrouping(existing.report_grouping);
      setReportType(existing.default_report_type);
      setDefaultPeriod(existing.default_period);
      setIncludeIncome(existing.include_income);
      setIncludeExpenses(existing.include_expenses);
      setIncludeGuestDetails(existing.include_guest_details);
      setIncludeBookingSource(existing.include_booking_source);
      setIncludeOccupancy(existing.include_occupancy);
      setIncludeMaintenance(existing.include_maintenance);
      setIncludeCommission(existing.include_commission);
      setNotes(existing.notes || '');
    }
  }, [existing]);

  const handleSave = () => {
    save.mutate({
      ...(existing?.id ? { id: existing.id } : {}),
      property_id: propertyId,
      owner_contact_id: ownerContactId || null,
      policy_name: policyName || null,
      report_grouping: grouping,
      default_report_type: grouping === 'per_booking' ? 'per_booking' : reportType,
      default_period: defaultPeriod,
      include_income: includeIncome,
      include_expenses: includeExpenses,
      include_guest_details: includeGuestDetails,
      include_booking_source: includeBookingSource,
      include_occupancy: includeOccupancy,
      include_maintenance: includeMaintenance,
      include_commission: includeCommission,
      notes: notes || null,
    }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isRu ? 'Учётная политика' : 'Accounting Policy'}</SheetTitle>
          <SheetDescription>
            {propertyTitle}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          {/* Policy name */}
          <div className="space-y-2">
            <Label>{isRu ? 'Название политики' : 'Policy name'}</Label>
            <Input
              value={policyName}
              onChange={e => setPolicyName(e.target.value)}
              placeholder={isRu ? 'Например: Ежемесячный отчёт владельцу' : 'e.g. Monthly owner report'}
            />
          </div>

          {/* Grouping */}
          <div className="space-y-2">
            <Label>{isRu ? 'Логика формирования' : 'Report logic'}</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setGrouping('period')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  grouping === 'period' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                <div className="text-left">
                  <div className="text-sm font-medium">{isRu ? 'За период' : 'By period'}</div>
                  <div className="text-xs text-muted-foreground">{isRu ? 'Сводка' : 'Summary'}</div>
                </div>
              </button>
              <button
                onClick={() => setGrouping('per_booking')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  grouping === 'per_booking' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <BedDouble className="h-4 w-4" />
                <div className="text-left">
                  <div className="text-sm font-medium">{isRu ? 'По заездам' : 'Per booking'}</div>
                  <div className="text-xs text-muted-foreground">{isRu ? 'Детали' : 'Details'}</div>
                </div>
              </button>
            </div>
          </div>

          {/* Report type (only for period mode) */}
          {grouping === 'period' && (
            <div className="space-y-2">
              <Label>{isRu ? 'Тип отчёта по умолчанию' : 'Default report type'}</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{isRu ? 'Ежемесячный' : 'Monthly'}</SelectItem>
                  <SelectItem value="owner_statement">{isRu ? 'Отчёт собственнику' : 'Owner Statement'}</SelectItem>
                  <SelectItem value="pnl">{isRu ? 'P&L' : 'P&L'}</SelectItem>
                  <SelectItem value="management">{isRu ? 'Управленческий' : 'Management'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Default period */}
          <div className="space-y-2">
            <Label>{isRu ? 'Период по умолчанию' : 'Default period'}</Label>
            <Select value={defaultPeriod} onValueChange={setDefaultPeriod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="last_month">{isRu ? 'Прошлый месяц' : 'Last month'}</SelectItem>
                <SelectItem value="last_quarter">{isRu ? 'Прошлый квартал' : 'Last quarter'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content toggles */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{isRu ? 'Разделы отчёта' : 'Report sections'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: isRu ? 'Доходы' : 'Income', value: includeIncome, set: setIncludeIncome },
                { label: isRu ? 'Расходы' : 'Expenses', value: includeExpenses, set: setIncludeExpenses },
                { label: isRu ? 'Данные гостей' : 'Guest details', value: includeGuestDetails, set: setIncludeGuestDetails },
                { label: isRu ? 'Источник бронирования' : 'Booking source', value: includeBookingSource, set: setIncludeBookingSource },
                { label: isRu ? 'Заполняемость' : 'Occupancy', value: includeOccupancy, set: setIncludeOccupancy },
                { label: isRu ? 'Обслуживание' : 'Maintenance', value: includeMaintenance, set: setIncludeMaintenance },
                { label: isRu ? 'Комиссия УК' : 'MC Commission', value: includeCommission, set: setIncludeCommission },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm">{item.label}</span>
                  <Switch checked={item.value} onCheckedChange={item.set} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{isRu ? 'Заметки' : 'Notes'}</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={isRu ? 'Особенности учёта для этого объекта...' : 'Accounting specifics for this property...'}
              rows={3}
            />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={save.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {save.isPending
              ? (isRu ? 'Сохранение...' : 'Saving...')
              : (isRu ? 'Сохранить политику' : 'Save Policy')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
