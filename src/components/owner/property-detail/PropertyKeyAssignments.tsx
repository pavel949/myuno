import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyKeys, type CreateKeyAssignment } from '@/hooks/usePropertyKeys';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { KeyRound, Plus, RotateCcw, User, Phone } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_LABELS: Record<string, { en: string; ru: string; emoji: string }> = {
  staff: { en: 'Staff', ru: 'Сотрудник', emoji: '👤' },
  guest: { en: 'Guest', ru: 'Гость', emoji: '🏖️' },
  owner: { en: 'Owner', ru: 'Собственник', emoji: '🏠' },
  lockbox: { en: 'Lockbox', ru: 'Сейф', emoji: '🔒' },
  security: { en: 'Security', ru: 'Охрана', emoji: '🛡️' },
};

export function PropertyKeyAssignments({ propertyId }: { propertyId: string }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { keys, isLoading, assignKey, returnKey } = usePropertyKeys(propertyId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<CreateKeyAssignment>>({ assigned_to_type: 'staff', key_set_label: 'Main' });

  const handleAssign = async () => {
    if (!form.assigned_to_name) {
      toast.error(isRu ? 'Укажите имя' : 'Enter name');
      return;
    }
    try {
      await assignKey.mutateAsync({
        property_id: propertyId,
        key_set_label: form.key_set_label || 'Main',
        assigned_to_name: form.assigned_to_name,
        assigned_to_phone: form.assigned_to_phone,
        assigned_to_type: form.assigned_to_type || 'staff',
        notes: form.notes,
      });
      toast.success(isRu ? 'Ключи переданы' : 'Keys assigned');
      setOpen(false);
      setForm({ assigned_to_type: 'staff', key_set_label: 'Main' });
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const handleReturn = async (keyId: string) => {
    try {
      await returnKey.mutateAsync(keyId);
      toast.success(isRu ? 'Ключи возвращены' : 'Keys returned');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            {isRu ? 'Ключи' : 'Keys'}
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" />
                {isRu ? 'Передать' : 'Assign'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isRu ? 'Передать ключи' : 'Assign Keys'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder={isRu ? 'Комплект (напр. Основной)' : 'Key set (e.g. Main)'}
                  value={form.key_set_label || ''}
                  onChange={(e) => setForm(f => ({ ...f, key_set_label: e.target.value }))}
                />
                <Input
                  placeholder={isRu ? 'Кому *' : 'Assigned to *'}
                  value={form.assigned_to_name || ''}
                  onChange={(e) => setForm(f => ({ ...f, assigned_to_name: e.target.value }))}
                />
                <Input
                  placeholder={isRu ? 'Телефон' : 'Phone'}
                  value={form.assigned_to_phone || ''}
                  onChange={(e) => setForm(f => ({ ...f, assigned_to_phone: e.target.value }))}
                />
                <Select
                  value={form.assigned_to_type}
                  onValueChange={(v) => setForm(f => ({ ...f, assigned_to_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.emoji} {isRu ? v.ru : v.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder={isRu ? 'Заметка' : 'Notes'}
                  value={form.notes || ''}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                />
                <Button className="w-full" onClick={handleAssign} disabled={assignKey.isPending}>
                  {isRu ? 'Передать ключи' : 'Assign Keys'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">{isRu ? 'Нет активных передач' : 'No active assignments'}</p>
        ) : (
          <div className="space-y-2">
            {keys.map(k => {
              const typeInfo = TYPE_LABELS[k.assigned_to_type] || TYPE_LABELS.staff;
              return (
                <div key={k.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{typeInfo.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{k.assigned_to_name}</p>
                      <p className="text-xs text-muted-foreground">{k.key_set_label}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => handleReturn(k.id)}
                    disabled={returnKey.isPending}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {isRu ? 'Вернуть' : 'Return'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
