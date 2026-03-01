import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, ArrowRight, Sparkles, CalendarDays, BarChart3,
  Users, Home, Layers, Briefcase, BedDouble, FileText, Check,
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, subQuarters, startOfQuarter, endOfQuarter } from 'date-fns';
import type { ReportType } from '@/hooks/usePropertyReports';

type ReportScope = 'property' | 'complex' | 'owner' | 'portfolio';
type ReportGrouping = 'period' | 'per_booking';

export interface WizardResult {
  scope: ReportScope;
  propertyIds: string[];
  reportType: ReportType;
  grouping: ReportGrouping;
  periodStart: string;
  periodEnd: string;
  includeIncome: boolean;
  includeExpenses: boolean;
  includeGuestDetails: boolean;
  includeBookingSource: boolean;
  includeOccupancy: boolean;
  includeMaintenance: boolean;
  includeCommission: boolean;
}

interface ReportWizardProps {
  properties: Array<{ id: string; title: string; title_ru?: string | null; complex_id?: string }>;
  complexes: Array<{ id: string; name: string; name_ru?: string | null }>;
  ownerContacts: Array<{ id: string; first_name: string; last_name: string; propertyIds: string[] }>;
  onComplete: (result: WizardResult) => void;
  onCancel: () => void;
}

const STEPS = ['purpose', 'scope', 'period', 'content', 'confirm'] as const;
type Step = typeof STEPS[number];

export function ReportWizard({ properties, complexes, ownerContacts, onComplete, onCancel }: ReportWizardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [step, setStep] = useState<Step>('purpose');
  // Purpose
  const [grouping, setGrouping] = useState<ReportGrouping>('period');
  const [reportType, setReportType] = useState<ReportType>('monthly');
  // Scope
  const [scope, setScope] = useState<ReportScope>('property');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedComplexId, setSelectedComplexId] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  // Period
  const [periodPreset, setPeriodPreset] = useState<'last_month' | 'last_quarter' | 'custom'>('last_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  // Content
  const [includeIncome, setIncludeIncome] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [includeGuestDetails, setIncludeGuestDetails] = useState(true);
  const [includeBookingSource, setIncludeBookingSource] = useState(true);
  const [includeOccupancy, setIncludeOccupancy] = useState(true);
  const [includeMaintenance, setIncludeMaintenance] = useState(false);
  const [includeCommission, setIncludeCommission] = useState(true);

  const stepIndex = STEPS.indexOf(step);

  const resolvedPropertyIds = useMemo(() => {
    if (scope === 'property') return selectedPropertyId ? [selectedPropertyId] : [];
    if (scope === 'portfolio') return properties.map(p => p.id);
    if (scope === 'complex' && selectedComplexId) {
      return properties.filter(p => p.complex_id === selectedComplexId).map(p => p.id);
    }
    if (scope === 'owner' && selectedOwnerId) {
      const owner = ownerContacts.find(o => o.id === selectedOwnerId);
      return owner?.propertyIds || [];
    }
    return [];
  }, [scope, selectedPropertyId, selectedComplexId, selectedOwnerId, properties, ownerContacts]);

  const { periodStart, periodEnd } = useMemo(() => {
    const now = new Date();
    if (periodPreset === 'last_month') {
      const m = subMonths(now, 1);
      return { periodStart: format(startOfMonth(m), 'yyyy-MM-dd'), periodEnd: format(endOfMonth(m), 'yyyy-MM-dd') };
    }
    if (periodPreset === 'last_quarter') {
      const q = subQuarters(now, 1);
      return { periodStart: format(startOfQuarter(q), 'yyyy-MM-dd'), periodEnd: format(endOfQuarter(q), 'yyyy-MM-dd') };
    }
    return { periodStart: customStart, periodEnd: customEnd };
  }, [periodPreset, customStart, customEnd]);

  const canProceed = () => {
    if (step === 'scope') return resolvedPropertyIds.length > 0;
    if (step === 'period') return !!periodStart && !!periodEnd;
    return true;
  };

  const goNext = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };
  const goBack = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const handleComplete = () => {
    const effectiveType = grouping === 'per_booking' ? 'per_booking' as ReportType : reportType;
    onComplete({
      scope,
      propertyIds: resolvedPropertyIds,
      reportType: effectiveType,
      grouping,
      periodStart,
      periodEnd,
      includeIncome,
      includeExpenses,
      includeGuestDetails,
      includeBookingSource,
      includeOccupancy,
      includeMaintenance,
      includeCommission,
    });
  };

  const purposeOptions = [
    {
      value: 'period' as ReportGrouping,
      icon: CalendarDays,
      title: isRu ? 'Отчёт за период' : 'Period Report',
      desc: isRu ? 'Сводка доходов и расходов за выбранный месяц/квартал' : 'Income & expenses summary for a chosen month/quarter',
    },
    {
      value: 'per_booking' as ReportGrouping,
      icon: BedDouble,
      title: isRu ? 'По заездам (бронированиям)' : 'Per Booking (Stay)',
      desc: isRu ? 'Экономика по каждому заезду: гости, источник, доход, расходы' : 'Economics per stay: guests, source, income, expenses',
    },
  ];

  const reportTypeOptions = [
    { value: 'monthly' as ReportType, label: isRu ? 'Ежемесячный' : 'Monthly' },
    { value: 'owner_statement' as ReportType, label: isRu ? 'Отчёт собственнику' : 'Owner Statement' },
    { value: 'pnl' as ReportType, label: isRu ? 'P&L (Прибыли и убытки)' : 'P&L Report' },
    { value: 'management' as ReportType, label: isRu ? 'Управленческий' : 'Management' },
  ];

  const scopeOptions = [
    { value: 'property' as ReportScope, icon: Home, label: isRu ? 'Один объект' : 'Single property' },
    { value: 'complex' as ReportScope, icon: Layers, label: isRu ? 'Комплекс' : 'Complex', disabled: complexes.length === 0 },
    { value: 'owner' as ReportScope, icon: Users, label: isRu ? 'Собственник' : 'Owner', disabled: ownerContacts.length === 0 },
    { value: 'portfolio' as ReportScope, icon: Briefcase, label: isRu ? 'Весь портфель' : 'Full Portfolio' },
  ];

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= stepIndex ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Step: Purpose */}
      {step === 'purpose' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            {isRu ? 'Какой отчёт вам нужен?' : 'What kind of report do you need?'}
          </div>
          <p className="text-sm text-muted-foreground">
            {isRu
              ? 'Выберите логику формирования — мы настроим всё остальное'
              : 'Choose the report logic — we\'ll configure the rest'}
          </p>

          <div className="space-y-3">
            {purposeOptions.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setGrouping(opt.value)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    grouping === opt.value
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${grouping === opt.value ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{opt.title}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{opt.desc}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {grouping === 'period' && (
            <div className="space-y-2 pt-2">
              <Label className="text-sm">{isRu ? 'Формат отчёта' : 'Report format'}</Label>
              <div className="grid grid-cols-2 gap-2">
                {reportTypeOptions.map(rt => (
                  <button
                    key={rt.value}
                    onClick={() => setReportType(rt.value)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      reportType === rt.value
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {rt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step: Scope */}
      {step === 'scope' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <BarChart3 className="h-5 w-5 text-primary" />
            {isRu ? 'Для какого объекта?' : 'For which property?'}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {scopeOptions.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => !opt.disabled && setScope(opt.value)}
                  disabled={opt.disabled}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                    opt.disabled ? 'opacity-40 cursor-not-allowed' : ''
                  } ${
                    scope === opt.value
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>

          {scope === 'property' && (
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger><SelectValue placeholder={isRu ? 'Выберите объект' : 'Select property'} /></SelectTrigger>
              <SelectContent>
                {properties.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {isRu ? p.title_ru || p.title : p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {scope === 'complex' && (
            <Select value={selectedComplexId} onValueChange={setSelectedComplexId}>
              <SelectTrigger><SelectValue placeholder={isRu ? 'Выберите комплекс' : 'Select complex'} /></SelectTrigger>
              <SelectContent>
                {complexes.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {isRu ? c.name_ru || c.name : c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {scope === 'owner' && (
            <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId}>
              <SelectTrigger><SelectValue placeholder={isRu ? 'Выберите собственника' : 'Select owner'} /></SelectTrigger>
              <SelectContent>
                {ownerContacts.map(o => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.first_name} {o.last_name} ({o.propertyIds.length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {resolvedPropertyIds.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {isRu ? `Выбрано объектов: ${resolvedPropertyIds.length}` : `${resolvedPropertyIds.length} properties selected`}
            </p>
          )}
        </div>
      )}

      {/* Step: Period */}
      {step === 'period' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="h-5 w-5 text-primary" />
            {isRu ? 'За какой период?' : 'For what period?'}
          </div>

          <div className="space-y-2">
            {[
              { value: 'last_month' as const, label: isRu ? 'Прошлый месяц' : 'Last month' },
              { value: 'last_quarter' as const, label: isRu ? 'Прошлый квартал' : 'Last quarter' },
              { value: 'custom' as const, label: isRu ? 'Свой период' : 'Custom period' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setPeriodPreset(opt.value)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  periodPreset === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <span className="text-sm font-medium">{opt.label}</span>
                {periodPreset === opt.value && opt.value !== 'custom' && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {periodStart} — {periodEnd}
                  </span>
                )}
              </button>
            ))}
          </div>

          {periodPreset === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{isRu ? 'С' : 'From'}</Label>
                <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isRu ? 'По' : 'To'}</Label>
                <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step: Content */}
      {step === 'content' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-primary" />
            {isRu ? 'Что включить в отчёт?' : 'What to include?'}
          </div>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Настройте содержание — можно изменить позже' : 'Configure content — you can change it later'}
          </p>

          <div className="space-y-3">
            {[
              { key: 'income', label: isRu ? 'Доходы' : 'Income', value: includeIncome, set: setIncludeIncome },
              { key: 'expenses', label: isRu ? 'Расходы' : 'Expenses', value: includeExpenses, set: setIncludeExpenses },
              { key: 'guests', label: isRu ? 'Данные гостей (имя)' : 'Guest details (name)', value: includeGuestDetails, set: setIncludeGuestDetails },
              { key: 'source', label: isRu ? 'Источник бронирования' : 'Booking source', value: includeBookingSource, set: setIncludeBookingSource },
              { key: 'occupancy', label: isRu ? 'Заполняемость' : 'Occupancy', value: includeOccupancy, set: setIncludeOccupancy },
              { key: 'maintenance', label: isRu ? 'Обслуживание и ремонт' : 'Maintenance & repairs', value: includeMaintenance, set: setIncludeMaintenance },
              { key: 'commission', label: isRu ? 'Комиссия УК' : 'Management commission', value: includeCommission, set: setIncludeCommission },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm font-medium">{item.label}</span>
                <Switch checked={item.value} onCheckedChange={item.set} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Check className="h-5 w-5 text-primary" />
            {isRu ? 'Подтвердите параметры' : 'Confirm settings'}
          </div>

          <Card>
            <CardContent className="p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isRu ? 'Логика' : 'Logic'}</span>
                <Badge variant="secondary">
                  {grouping === 'per_booking'
                    ? (isRu ? 'По заездам' : 'Per Booking')
                    : (isRu ? 'За период' : 'Period')}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isRu ? 'Объекты' : 'Properties'}</span>
                <span className="font-medium">{resolvedPropertyIds.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isRu ? 'Период' : 'Period'}</span>
                <span className="font-medium">{periodStart} — {periodEnd}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {includeIncome && <Badge variant="outline">{isRu ? 'Доходы' : 'Income'}</Badge>}
                {includeExpenses && <Badge variant="outline">{isRu ? 'Расходы' : 'Expenses'}</Badge>}
                {includeGuestDetails && <Badge variant="outline">{isRu ? 'Гости' : 'Guests'}</Badge>}
                {includeBookingSource && <Badge variant="outline">{isRu ? 'Источник' : 'Source'}</Badge>}
                {includeOccupancy && <Badge variant="outline">{isRu ? 'Заполняемость' : 'Occupancy'}</Badge>}
                {includeMaintenance && <Badge variant="outline">{isRu ? 'Обслуживание' : 'Maintenance'}</Badge>}
                {includeCommission && <Badge variant="outline">{isRu ? 'Комиссия' : 'Commission'}</Badge>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={stepIndex === 0 ? onCancel : goBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {stepIndex === 0 ? (isRu ? 'Отмена' : 'Cancel') : (isRu ? 'Назад' : 'Back')}
        </Button>

        {step === 'confirm' ? (
          <Button size="sm" onClick={handleComplete} disabled={resolvedPropertyIds.length === 0}>
            <Sparkles className="h-4 w-4 mr-1" />
            {resolvedPropertyIds.length > 1
              ? (isRu ? `Создать ${resolvedPropertyIds.length} отчётов` : `Generate ${resolvedPropertyIds.length} Reports`)
              : (isRu ? 'Создать отчёт' : 'Generate Report')}
          </Button>
        ) : (
          <Button size="sm" onClick={goNext} disabled={!canProceed()}>
            {isRu ? 'Далее' : 'Next'}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
