import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { MAINTENANCE_TEMPLATES, FREQUENCY_LABELS, type MaintenanceFrequency } from '@/config/maintenanceScheduleTemplates';
import { cn } from '@/lib/utils';
import { addMonths, addWeeks, addYears, format } from 'date-fns';

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
  const [selectedCat, setSelectedCat] = useState('');

  const template = MAINTENANCE_TEMPLATES.find(t => t.category === selectedCat);

  const handleAdd = () => {
    if (!template || !propertyId) return;
    onAdd({
      property_id: propertyId,
      category: template.category,
      title: template.titleEn,
      title_ru: template.titleRu,
      description: isRu ? template.descriptionRu : template.descriptionEn,
      frequency: template.defaultFrequency,
      next_due_date: calcNextDue(template.defaultFrequency),
      estimated_cost: template.estimatedCost,
      currency: template.currency,
    });
    setSelectedCat('');
    setPropertyId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {MAINTENANCE_TEMPLATES.map(t => {
              const Icon = t.icon;
              const isSelected = selectedCat === t.category;
              return (
                <button
                  key={t.category}
                  onClick={() => setSelectedCat(t.category)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/50"
                  )}
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

          <Button
            className="w-full"
            disabled={!propertyId || !selectedCat || isPending}
            onClick={handleAdd}
          >
            {isRu ? 'Добавить' : 'Add Schedule'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
