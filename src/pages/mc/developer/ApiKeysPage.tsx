/**
 * MC Developer / API Keys page — manage programmatic access tokens.
 * Route: /mc/developer/api-keys
 */
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/hooks/useApiKeys';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Key, Plus, Copy, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ApiKeysPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: keys = [], isLoading } = useApiKeys();
  const createMutation = useCreateApiKey();
  const revokeMutation = useRevokeApiKey();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const result = await createMutation.mutateAsync({ name: name.trim(), scopes: ['read', 'write'] });
    setNewKey(result.plaintext);
    setName('');
  };

  const copyKey = (k: string) => {
    navigator.clipboard.writeText(k);
    toast.success(isRu ? 'Скопировано' : 'Copied');
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold">{isRu ? 'API ключи' : 'API Keys'}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Программный доступ к данным компании. Ключи показываются один раз.' : 'Programmatic access to company data. Keys are shown only once.'}
          </p>
        </div>
        <Button onClick={() => { setNewKey(null); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> {isRu ? 'Создать' : 'New key'}
        </Button>
      </div>

      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="p-3 flex gap-2 text-xs">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p>{isRu
            ? 'Никогда не публикуйте ключи в frontend-коде или git. Используйте их только в серверных интеграциях.'
            : 'Never expose keys in frontend code or git. Use them in server-side integrations only.'}</p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {keys.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">
            <Key className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{isRu ? 'Нет ключей. Создайте первый, чтобы подключить интеграции.' : 'No keys yet. Create one to connect integrations.'}</p>
          </CardContent></Card>
        ) : keys.map((k) => (
          <Card key={k.id} className={cn(k.revoked_at && 'opacity-60')}>
            <CardContent className="p-4 flex items-center gap-3">
              <Key className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold truncate">{k.name}</p>
                  {k.revoked_at && <Badge variant="outline" className="bg-destructive/10 text-destructive text-xs">{isRu ? 'Отозван' : 'Revoked'}</Badge>}
                  {k.scopes.map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{k.key_prefix}…</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isRu ? 'Создан' : 'Created'} {new Date(k.created_at).toLocaleDateString()}
                  {k.last_used_at && ` · ${isRu ? 'Использован' : 'Last used'} ${new Date(k.last_used_at).toLocaleDateString()}`}
                </p>
              </div>
              {!k.revoked_at && (
                <Button size="sm" variant="ghost" onClick={() => revokeMutation.mutate(k.id)} className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader><SheetTitle>{newKey ? (isRu ? 'Сохраните ключ' : 'Save your key') : (isRu ? 'Новый API ключ' : 'New API key')}</SheetTitle></SheetHeader>
          <div className="space-y-4 py-4">
            {newKey ? (
              <>
                <Card className="border-warning/30 bg-warning/5">
                  <CardContent className="p-3 text-xs">
                    {isRu ? 'Скопируйте ключ сейчас — после закрытия он больше не будет показан.' : 'Copy now — once closed it cannot be retrieved.'}
                  </CardContent>
                </Card>
                <div className="flex gap-2">
                  <Input readOnly value={newKey} className="font-mono text-xs" />
                  <Button onClick={() => copyKey(newKey)}><Copy className="w-4 h-4" /></Button>
                </div>
                <Button className="w-full" onClick={() => { setOpen(false); setNewKey(null); }}>
                  {isRu ? 'Готово' : 'Done'}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">{isRu ? 'Название' : 'Name'}</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={isRu ? 'Например: Production server' : 'e.g. Production server'} />
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={!name.trim() || createMutation.isPending}>
                  {createMutation.isPending ? (isRu ? 'Создание…' : 'Creating…') : (isRu ? 'Создать ключ' : 'Create key')}
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
