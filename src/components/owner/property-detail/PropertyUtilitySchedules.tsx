import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUtilitySchedules, type CreateUtilitySchedule, type UtilityType } from '@/hooks/useUtilitySchedules';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Zap, Droplets, Wifi, Building2, Shield, Flame, HelpCircle, Plus, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const UTILITY_META: Record<UtilityType, { en: string; ru: string; icon: React.ElementType; color: string }> = {
  electricity: { en: 'Electricity (PEA)', ru: 'Электричество (PEA)', icon: Zap, color: 'text-warning' },
  water: { en: 'Water', ru: 'Вода', icon: Droplets, color: 'text-info' },
  internet: { en: 'Internet', ru: 'Интернет', icon: Wifi, color: 'text-primary' },
  cam: { en: 'CAM Fee', ru: 'CAM Fee', icon: Building2, color: 'text-muted-foreground' },
  insurance: { en: 'Insurance', ru: 'Страховка', icon: Shield, color: 'text-success' },
  gas: { en: 'Gas', ru: 'Газ', icon: Flame, color: 'text-destructive' },
  other: { en: 'Other', ru: 'Другое', icon: HelpCircle, color: 'text-muted-foreground' },
};

function isDueThisMonth(dueDay: number | null, lastPaidDate: string | null): 'paid' | 'due' | 'overdue' | 'unknown' {
  if (!dueDay) return 'unknown';
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (lastPaidDate && lastPaidDate.startsWith(currentMonth)) return 'paid';
  if (now.getDate() > dueDay) return 'overdue';
  return 'due';
}

export function PropertyUtilitySchedules({ propertyId }: { propertyId: string }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { schedules, isLoading, addSchedule, markPaid } = useUtilitySchedules(propertyId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<CreateUtilitySchedule>>({ utility_type: 'electricity', currency: 'THB' });

  const handleAdd = async () => {
    try {
      await addSchedule.mutateAsync({
        property_id: propertyId,
        utility_type: (form.utility_type || 'electricity') as UtilityType,
        provider_name: form.provider_name,
        account_number: form.account_number,
        due_day: form.due_day,
        amount_estimate: form.amount_estimate,
        currency: form.currency || 'THB',
      });
      toast.success(isRu ? 'Добавлено' : 'Added');
      setOpen(false);
      setForm({ utility_type: 'electricity', currency: 'THB' });
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await markPaid.mutateAsync({ scheduleId: id });
      toast.success(isRu ? 'Отмечено как оплачено' : 'Marked as paid');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning" />
            {isRu ? 'Коммунальные платежи' : 'Utilities'}
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" />
                {isRu ? 'Добавить' : 'Add'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isRu ? 'Добавить платёж' : 'Add Utility'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Select
                  value={form.utility_type}
                  onValueChange={(v) => setForm(f => ({ ...f, utility_type: v as UtilityType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(UTILITY_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {isRu ? v.ru : v.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder={isRu ? 'Провайдер' : 'Provider'}
                  value={form.provider_name || ''}
                  onChange={(e) => setForm(f => ({ ...f, provider_name: e.target.value }))}
                />
                <Input
                  placeholder={isRu ? 'Номер аккаунта' : 'Account #'}
                  value={form.account_number || ''}
                  onChange={(e) => setForm(f => ({ ...f, account_number: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder={isRu ? 'День оплаты (1-31)' : 'Due day (1-31)'}
                    value={form.due_day || ''}
                    onChange={(e) => setForm(f => ({ ...f, due_day: parseInt(e.target.value) || undefined }))}
                  />
                  <Input
                    type="number"
                    placeholder={isRu ? 'Примерная сумма' : 'Est. amount'}
                    value={form.amount_estimate || ''}
                    onChange={(e) => setForm(f => ({ ...f, amount_estimate: parseFloat(e.target.value) || undefined }))}
                  />
                </div>
                <Button className="w-full" onClick={handleAdd} disabled={addSchedule.isPending}>
                  {isRu ? 'Добавить' : 'Add'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</p>
        ) : schedules.length === 0 ? (
          <p className="text-sm text-muted-foreground">{isRu ? 'Нет настроенных платежей' : 'No utilities configured'}</p>
        ) : (
          <div className="space-y-2">
            {schedules.map(s => {
              const meta = UTILITY_META[s.utility_type as UtilityType] || UTILITY_META.other;
              const Icon = meta.icon;
              const status = isDueThisMonth(s.due_day, s.last_paid_date);

              return (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={`h-4 w-4 ${meta.color} flex-shrink-0`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{isRu ? meta.ru : meta.en}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.due_day ? `${isRu ? 'До' : 'Due'} ${s.due_day}-${isRu ? 'го' : 'th'}` : ''}
                        {s.amount_estimate ? ` · ~${Number(s.amount_estimate).toLocaleString()} ${s.currency}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {status === 'paid' && (
                      <Badge variant="outline" className="text-success border-success/30 text-[10px]">
                        <Check className="h-3 w-3 mr-0.5" />
                        {isRu ? 'Оплачено' : 'Paid'}
                      </Badge>
                    )}
                    {status === 'overdue' && (
                      <Badge variant="destructive" className="text-[10px]">
                        <AlertTriangle className="h-3 w-3 mr-0.5" />
                        {isRu ? 'Просрочено' : 'Overdue'}
                      </Badge>
                    )}
                    {(status === 'due' || status === 'overdue') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleMarkPaid(s.id)}
                        disabled={markPaid.isPending}
                      >
                        <Check className="h-3.5 w-3.5 mr-0.5" />
                        {isRu ? 'Оплатил' : 'Paid'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
