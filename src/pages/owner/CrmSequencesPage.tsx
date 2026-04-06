import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useCrmSequences, useCreateSequence, useDeleteSequence } from '@/hooks/useCrmSequences';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Zap, Users, Trash2, Play, Pause } from 'lucide-react';
import { SequenceBuilder } from '@/components/owner/sequences/SequenceBuilder';
import { toast } from 'sonner';

export default function CrmSequencesPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;
  const { data: sequences = [], isLoading, isError, error, refetch } = useCrmSequences(companyId);
  const createSequence = useCreateSequence();
  const deleteSequence = useDeleteSequence();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const handleCreate = async () => {
    if (!companyId || !user) return;
    if (!form.name.trim()) {
      toast({ title: isRu ? 'Введите название' : 'Please enter a name', variant: 'destructive' });
      return;
    }
    try {
      const seq = await createSequence.mutateAsync({
        company_id: companyId,
        name: form.name.trim(),
        description: form.description || null,
        is_active: true,
        created_by: user.id,
      });
      setCreateOpen(false);
      setForm({ name: '', description: '' });
      setSelectedId(seq.id);
      toast({ title: isRu ? 'Последовательность создана' : 'Sequence created' });
    } catch (createError: any) {
      toast({
        title: isRu ? 'Ошибка создания последовательности' : 'Failed to create sequence',
        description: createError?.message || String(createError),
        variant: 'destructive',
      });
    }
  };

  const selected = sequences.find(s => s.id === selectedId);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1536px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isRu ? 'Последовательности' : 'Sequences'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Автоматизируйте цепочки действий с контактами' : 'Automate action chains with contacts'}
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />{isRu ? 'Создать' : 'Create'}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRu ? 'Новая последовательность' : 'New Sequence'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label>{isRu ? 'Название' : 'Name'}</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>{isRu ? 'Описание' : 'Description'}</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              </div>
              <Button onClick={handleCreate} disabled={!form.name || createSequence.isPending} className="w-full">
                {isRu ? 'Создать' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Sequence list */}
        <div className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</p>
          ) : isError ? (
            <Card className="p-6 text-center space-y-2">
              <p className="text-sm text-destructive">
                {isRu ? 'Не удалось загрузить последовательности' : 'Failed to load sequences'}
              </p>
              <p className="text-xs text-muted-foreground">
                {error instanceof Error ? error.message : String(error)}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                {isRu ? 'Повторить' : 'Retry'}
              </Button>
            </Card>
          ) : sequences.length === 0 ? (
            <Card className="p-8 text-center">
              <Zap className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Нет последовательностей' : 'No sequences yet'}
              </p>
            </Card>
          ) : sequences.map(seq => (
            <Card
              key={seq.id}
              className={`cursor-pointer transition-colors ${selectedId === seq.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
              onClick={() => setSelectedId(seq.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{seq.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={seq.is_active ? 'default' : 'secondary'} className="text-[10px] h-4">
                        {seq.is_active ? (isRu ? 'Активна' : 'Active') : (isRu ? 'Пауза' : 'Paused')}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {seq.steps.length} {isRu ? 'шагов' : 'steps'}
                      </span>
                      {(seq.enrollment_count || 0) > 0 && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Users className="h-3 w-3" /> {seq.enrollment_count}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={e => {
                      e.stopPropagation();
                      if (confirm(isRu ? 'Удалить последовательность?' : 'Delete sequence?')) {
                        deleteSequence.mutate(seq.id, {
                          onSuccess: () => {
                            toast({ title: isRu ? 'Последовательность удалена' : 'Sequence deleted' });
                          },
                          onError: (deleteError: any) => {
                            toast({
                              title: isRu ? 'Не удалось удалить последовательность' : 'Failed to delete sequence',
                              description: deleteError?.message || String(deleteError),
                              variant: 'destructive',
                            });
                          },
                        });
                        if (selectedId === seq.id) setSelectedId(null);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sequence builder */}
        <div className="md:col-span-2">
          {selected ? (
            <SequenceBuilder sequence={selected} />
          ) : (
            <Card className="p-12 text-center">
              <Zap className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">
                {isRu ? 'Выберите последовательность или создайте новую' : 'Select a sequence or create a new one'}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
