import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { MAINTENANCE_TEMPLATES, FREQUENCY_LABELS, type MaintenanceFrequency, type MaintenanceTemplate } from '@/config/maintenanceScheduleTemplates';
import { cn } from '@/lib/utils';
import { addMonths, addWeeks, addYears, format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  properties: { id: string; title: string }[];
  isRu: boolean;
  onAdd: (data: {
    property_id: string;
    category: string;
    title: string;
    title_ru: string;
    description: string;
    frequency: string;
    next_due_date: string;
    estimated_cost: number;
    currency: string;
  }) => void;
  isPending: boolean;
}

function calcNextDue(freq: MaintenanceFrequency): string {
  const now = new Date();
  switch (freq) {
    case 'weekly': return format(addWeeks(now, 1), 'yyyy-MM-dd');
    case 'biweekly': return format(addWeeks(now, 2), 'yyyy-MM-dd');
    case 'monthly': return format(addMonths(now, 1), 'yyyy-MM-dd');
    case 'quarterly': return format(addMonths(now, 3), 'yyyy-MM-dd');
    case 'biannual': return format(addMonths(now, 6), 'yyyy-MM-dd');
    case 'annual': return format(addYears(now, 1), 'yyyy-MM-dd');
    default: return format(addMonths(now, 3), 'yyyy-MM-dd');
  }
}

export function AddScheduleDialog({ open, onOpenChange, properties, isRu, onAdd, isPending }: Props) {
  const [propertyId, setPropertyId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<MaintenanceTemplate | null>(null);
  // Step 2 customizable fields
  const [frequency, setFrequency] = useState<MaintenanceFrequency>('quarterly');
  const [cost, setCost] = useState('');
  const [currency, setCurrency] = useState('THB');

  const step = selectedTemplate ? 2 : 1;

  const selectTemplate = (t: MaintenanceTemplate) => {
    setSelectedTemplate(t);
    setFrequency(t.defaultFrequency);
    setCost(String(t.estimatedCost));
    setCurrency(t.currency);
  };

  const handleAdd = () => {
    if (!selectedTemplate || !propertyId) return;
    onAdd({
      property_id: propertyId,
      category: selectedTemplate.category,
      title: selectedTemplate.titleEn,
      title_ru: selectedTemplate.titleRu,
      description: isRu ? selectedTemplate.descriptionRu : selectedTemplate.descriptionEn,
      frequency,
      next_due_date: calcNextDue(frequency),
      estimated_cost: Number(cost) || 0,
      currency,
    });
    reset();
    onOpenChange(false);
  };

  const reset = () => {
    setSelectedTemplate(null);
    setPropertyId('');
    setCost('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isRu ? 'Добавить плановое обслуживание' : 'Add Maintenance Schedule'}</DialogTitle>
          <DialogDescription>{isRu ? 'Выберите объект и тип обслуживания' : 'Select property and service type'}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Select value={propertyId} onValueChange={setPropertyId}>
            <SelectTrigger><SelectValue placeholder={isRu ? 'Выберите объект' : 'Select property'} /></SelectTrigger>
            <SelectContent>
              {properties.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {step === 1 && (
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {MAINTENANCE_TEMPLATES.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.category}
                    onClick={() => selectTemplate(t)}
                    className="flex items-center gap-2 p-3 rounded-xl border border-border text-left transition-all hover:border-primary/50"
                  >
                    <div className={cn("rounded-lg w-9 h-9 flex items-center justify-center shrink-0", t.bgColor)}>
                      <Icon className={cn("h-4 w-4", t.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{isRu ? t.titleRu : t.titleEn}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {FREQUENCY_LABELS[t.defaultFrequency][isRu ? 'ru' : 'en']} • ~{t.estimatedCost.toLocaleString()} {t.currency}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && selectedTemplate && (
            <>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                {isRu ? 'Назад к выбору' : 'Back to selection'}
              </button>

              <div className="flex items-center gap-2 p-3 rounded-xl border border-primary bg-primary/5">
                <div className={cn("rounded-lg w-9 h-9 flex items-center justify-center shrink-0", selectedTemplate.bgColor)}>
                  <selectedTemplate.icon className={cn("h-4 w-4", selectedTemplate.color)} />
                </div>
                <p className="text-sm font-medium">{isRu ? selectedTemplate.titleRu : selectedTemplate.titleEn}</p>
              </div>

              <div className="space-y-1.5">
                <Label>{isRu ? 'Частота' : 'Frequency'}</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as MaintenanceFrequency)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{isRu ? label.ru : label.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{isRu ? 'Стоимость' : 'Estimated cost'}</Label>
                  <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} min={0} />
                </div>
                <div className="space-y-1.5">
                  <Label>{isRu ? 'Валюта' : 'Currency'}</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="THB">THB</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="RUB">RUB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full"
                disabled={!propertyId || isPending}
                onClick={handleAdd}
              >
                {isRu ? 'Добавить' : 'Add Schedule'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
