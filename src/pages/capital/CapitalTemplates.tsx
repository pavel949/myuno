import { useState } from 'react';
import { useCapitalTemplates } from '@/hooks/capital';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { BUYER_TYPE_LABELS, CHANNEL_LABELS } from '@/types/capital';

const EMPTY_FORM = {
  name: '', channel: 'whatsapp' as 'whatsapp' | 'telegram' | 'email',
  buyer_type: '', language: 'ru', subject: '', body: '',
};

export default function CapitalTemplates() {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } = useCapitalTemplates();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const resetForm = () => { setForm({ ...EMPTY_FORM }); setEditId(null); };

  const openEdit = (t: typeof templates[0]) => {
    setEditId(t.id);
    setForm({
      name: t.name, channel: t.channel || 'whatsapp',
      buyer_type: t.buyer_type || '', language: t.language,
      subject: t.subject || '', body: t.body,
    });
    setDialogOpen(true);
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    return [...new Set(matches.map((m) => m.replace(/[{}]/g, '')))];
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.body.trim()) {
      toast.error('Заполните название и текст');
      return;
    }
    const variables = extractVariables(form.body);
    const payload = {
      name: form.name,
      channel: form.channel,
      buyer_type: form.buyer_type || null,
      language: form.language,
      subject: form.subject || null,
      body: form.body,
      variables,
      is_active: true,
    };

    try {
      if (editId) {
        await updateTemplate.mutateAsync({ id: editId, ...payload });
        toast.success('Шаблон обновлён');
      } else {
        await createTemplate.mutateAsync(payload);
        toast.success('Шаблон создан');
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      toast.error('Ошибка сохранения');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id);
      toast.success('Шаблон удалён');
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Шаблоны сообщений</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-success hover:bg-success">
              <Plus className="w-4 h-4 mr-1" /> Добавить
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? 'Редактировать шаблон' : 'Новый шаблон'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div><Label>Название *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Канал</Label>
                  <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v as typeof form.channel })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="telegram">Telegram</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Тип покупателя</Label>
                  <Select value={form.buyer_type} onValueChange={(v) => setForm({ ...form, buyer_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Все" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все</SelectItem>
                      {Object.entries(BUYER_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.channel === 'email' && (
                <div><Label>Тема письма</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
              )}
              <div>
                <Label>Текст сообщения *</Label>
                <textarea
                  className="w-full rounded-none border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-y"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Используйте {{name}}, {{project_name}}, {{price_from}} и т.д."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Переменные: {'{{name}}, {{project_name}}, {{selling_point}}, {{price_from}}, {{yield}}'}
                </p>
              </div>
              <Button onClick={handleSave} className="bg-success hover:bg-success">
                {editId ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Шаблонов пока нет</div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-none border border-border/50 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-sm">{t.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {CHANNEL_LABELS[t.channel as keyof typeof CHANNEL_LABELS] || t.channel}
                    </Badge>
                    {t.buyer_type && <Badge variant="secondary" className="text-xs">{BUYER_TYPE_LABELS[t.buyer_type as keyof typeof BUYER_TYPE_LABELS] || t.buyer_type}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{t.body}</p>
                  {t.variables?.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {(t.variables as string[]).map((v) => (
                        <Badge key={v} variant="outline" className="text-xs font-mono">{`{{${v}}}`}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 ml-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
