import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVisaRecords, type VisaRecord } from '@/hooks/useVisaRecords';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Calendar, AlertTriangle, CheckCircle2, Clock, FileText } from 'lucide-react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const VISA_TYPES_OPTIONS = [
  { value: 'tourist_60', label: 'Tourist Visa (60 days)', labelRu: 'Туристическая (60 дней)' },
  { value: 'tourist_ext', label: 'Tourist + Extension (90 days)', labelRu: 'Туристическая + продление (90 дней)' },
  { value: 'dtv', label: 'DTV / Digital Nomad', labelRu: 'DTV / Цифровой кочевник' },
  { value: 'ed_visa', label: 'Education Visa', labelRu: 'Учебная виза' },
  { value: 'non_b', label: 'Non-B (Work)', labelRu: 'Non-B (Рабочая)' },
  { value: 'non_o', label: 'Non-O (Family/Retirement)', labelRu: 'Non-O (Семья/Пенсия)' },
  { value: 'elite', label: 'Thailand Elite', labelRu: 'Thailand Elite' },
  { value: 'other', label: 'Other', labelRu: 'Другая' },
];

function getDaysRemaining(expiryDate: string): number {
  return differenceInDays(parseISO(expiryDate), new Date());
}

function getUrgencyColor(days: number): string {
  if (days < 0) return 'text-destructive';
  if (days <= 7) return 'text-destructive';
  if (days <= 14) return 'text-accent';
  if (days <= 30) return 'text-accent';
  return 'text-success';
}

function getUrgencyBg(days: number): string {
  if (days < 0) return 'bg-destructive/10 border-destructive/30';
  if (days <= 7) return 'bg-destructive/10 border-destructive/30';
  if (days <= 14) return 'bg-accent/10 border-accent/40';
  if (days <= 30) return 'bg-accent/10 border-accent/40';
  return 'bg-success/10 border-success/40';
}

export function VisaTracker() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = language === 'ru';
  const { records, isLoading, create, remove } = useVisaRecords();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ visa_type: '', entry_date: '', expiry_date: '', notes: '' });

  if (!user) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {t ? 'Войдите, чтобы отслеживать визу' : 'Sign in to track your visa'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.visa_type || !formData.expiry_date) return;
    create.mutate({
      visa_type: formData.visa_type,
      entry_date: formData.entry_date || undefined,
      expiry_date: formData.expiry_date,
      notes: formData.notes || undefined,
    }, {
      onSuccess: () => {
        setShowForm(false);
        setFormData({ visa_type: '', entry_date: '', expiry_date: '', notes: '' });
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Records list */}
      {records.length > 0 ? (
        <div className="space-y-3">
          {records.map((rec: VisaRecord) => {
            const days = getDaysRemaining(rec.expiry_date);
            const visaLabel = VISA_TYPES_OPTIONS.find(v => v.value === rec.visa_type);
            return (
              <Card key={rec.id} className={cn('border', getUrgencyBg(days))}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">
                        {t ? visaLabel?.labelRu || rec.visa_type : visaLabel?.label || rec.visa_type}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {t ? 'Истекает:' : 'Expires:'} {format(parseISO(rec.expiry_date), 'dd.MM.yyyy')}
                        </span>
                      </div>
                      {rec.entry_date && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {t ? 'Въезд:' : 'Entry:'} {format(parseISO(rec.entry_date), 'dd.MM.yyyy')}
                        </div>
                      )}
                      {rec.notes && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rec.notes}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={cn('text-2xl font-bold tabular-nums', getUrgencyColor(days))}>
                        {days < 0 ? (
                          <span className="flex items-center gap-1 text-base">
                            <AlertTriangle className="w-4 h-4" />
                            {t ? 'Просрочена' : 'Expired'}
                          </span>
                        ) : (
                          <>
                            {days}
                            <span className="text-xs font-normal ml-0.5">{t ? 'дн.' : 'd'}</span>
                          </>
                        )}
                      </div>
                      {days >= 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {days <= 7 ? (t ? `Истекает через ${days} дн.` : `Expires in ${days} days`) : days <= 30 ? (t ? 'В течение месяца' : 'Within a month') : (t ? 'В сроке' : 'On track')}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 mt-1"
                        onClick={() => remove.mutate(rec.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : !showForm ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Clock className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">{t ? 'Нет записей о визе' : 'No visa records yet'}</p>
            <p className="text-xs text-muted-foreground mb-3">
              {t ? 'Добавьте визу, чтобы отслеживать сроки' : 'Add your visa to track deadlines'}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Add form */}
      {showForm ? (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label className="text-xs">{t ? 'Тип визы' : 'Visa Type'}</Label>
                <Select value={formData.visa_type} onValueChange={v => setFormData(p => ({ ...p, visa_type: v }))}>
                  <SelectTrigger><SelectValue placeholder={t ? 'Выберите тип' : 'Select type'} /></SelectTrigger>
                  <SelectContent>
                    {VISA_TYPES_OPTIONS.map(v => (
                      <SelectItem key={v.value} value={v.value}>{t ? v.labelRu : v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{t ? 'Дата въезда' : 'Entry Date'}</Label>
                  <Input type="date" value={formData.entry_date} onChange={e => setFormData(p => ({ ...p, entry_date: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">{t ? 'Дата истечения' : 'Expiry Date'} *</Label>
                  <Input type="date" required value={formData.expiry_date} onChange={e => setFormData(p => ({ ...p, expiry_date: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs">{t ? 'Заметки' : 'Notes'}</Label>
                <Textarea rows={2} value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder={t ? 'Номер визы, примечания...' : 'Visa number, notes...'} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={create.isPending}>
                  {create.isPending ? (t ? 'Сохранение...' : 'Saving...') : (t ? 'Сохранить' : 'Save')}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  {t ? 'Отмена' : 'Cancel'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" className="w-full gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          {t ? 'Добавить визу' : 'Add Visa Record'}
        </Button>
      )}
    </div>
  );
}
