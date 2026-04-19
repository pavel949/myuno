import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrustAccounts, useUpsertTrustAccount, useRecordTrustMovement, TrustAccountType, TrustAccount } from '@/hooks/useTrustAccounts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Plus, ArrowDown, ArrowUp, Lock } from 'lucide-react';

const TYPE_LABEL_RU: Record<TrustAccountType, string> = {
  guest_deposit: 'Депозиты гостей',
  owner_funds: 'Средства собственников',
  reserve: 'Резерв',
  operating: 'Операционный',
};
const TYPE_LABEL_EN: Record<TrustAccountType, string> = {
  guest_deposit: 'Guest deposits', owner_funds: 'Owner funds', reserve: 'Reserve', operating: 'Operating',
};

export default function TrustAccountsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: accounts, isLoading } = useTrustAccounts();
  const upsert = useUpsertTrustAccount();
  const move = useRecordTrustMovement();

  const [createOpen, setCreateOpen] = useState(false);
  const [moveSheet, setMoveSheet] = useState<{ open: boolean; account?: TrustAccount }>({ open: false });
  const [form, setForm] = useState({ account_type: 'guest_deposit' as TrustAccountType, account_name: '', bank_name: '', bank_account_last4: '', currency: 'THB' });
  const [moveForm, setMoveForm] = useState({ direction: 'in' as 'in'|'out'|'reserve'|'release', amount: 0, description: '' });

  const fmt = (n: number) => Number(n).toLocaleString('en-US');

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary" />
            {isRu ? 'Эскроу-счета' : 'Trust Accounts'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Сегрегированные счета: депозиты гостей, средства собственников, резервы (Thai DBD)' : 'Segregated accounts: guest deposits, owner funds, reserves'}
          </p>
        </div>
        <Sheet open={createOpen} onOpenChange={setCreateOpen}>
          <SheetTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />{isRu ? 'Новый счёт' : 'New account'}</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>{isRu ? 'Новый эскроу-счёт' : 'New trust account'}</SheetTitle></SheetHeader>
            <div className="space-y-3 mt-4">
              <div>
                <Label>{isRu ? 'Тип счёта' : 'Account type'}</Label>
                <Select value={form.account_type} onValueChange={(v) => setForm({ ...form, account_type: v as TrustAccountType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['guest_deposit','owner_funds','reserve','operating'] as TrustAccountType[]).map(t => (
                      <SelectItem key={t} value={t}>{isRu ? TYPE_LABEL_RU[t] : TYPE_LABEL_EN[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{isRu ? 'Название' : 'Name'}</Label><Input value={form.account_name} onChange={e => setForm({ ...form, account_name: e.target.value })} /></div>
              <div><Label>{isRu ? 'Банк' : 'Bank'}</Label><Input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} /></div>
              <div><Label>{isRu ? 'Последние 4 цифры' : 'Last 4'}</Label><Input maxLength={4} value={form.bank_account_last4} onChange={e => setForm({ ...form, bank_account_last4: e.target.value })} /></div>
              <Button className="w-full" onClick={async () => { await upsert.mutateAsync(form); setCreateOpen(false); }}>
                {isRu ? 'Создать' : 'Create'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="p-3 bg-info/5 border-info/20">
        <div className="flex items-start gap-2 text-sm">
          <Lock className="w-4 h-4 text-info mt-0.5" />
          <div className="text-muted-foreground">{isRu ? 'Депозиты гостей и средства собственников храните на отдельных счетах — обязательное требование Thai DBD для PM-агентств с >10 объектами.' : 'Keep guest deposits and owner funds on separate accounts — required by Thai DBD.'}</div>
        </div>
      </Card>

      {isLoading ? <Skeleton className="h-40" /> : !accounts || accounts.length === 0 ? (
        <Card className="p-10 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">{isRu ? 'Эскроу-счета не настроены' : 'No trust accounts yet'}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map(a => (
            <Card key={a.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground uppercase">{isRu ? TYPE_LABEL_RU[a.account_type] : TYPE_LABEL_EN[a.account_type]}</div>
                  <div className="font-semibold">{a.account_name}</div>
                  {a.bank_name && <div className="text-xs text-muted-foreground">{a.bank_name} ····{a.bank_account_last4}</div>}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold tabular-nums">{fmt(a.available_balance)} {a.currency}</div>
                  <div className="text-xs text-muted-foreground">{isRu ? 'доступно' : 'available'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/40 rounded p-2"><div className="text-muted-foreground">{isRu ? 'Баланс' : 'Balance'}</div><div className="font-mono font-semibold">{fmt(a.current_balance)}</div></div>
                <div className="bg-muted/40 rounded p-2"><div className="text-muted-foreground">{isRu ? 'Зарезервировано' : 'Reserved'}</div><div className="font-mono font-semibold">{fmt(a.reserved_balance)}</div></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setMoveForm({ direction: 'in', amount: 0, description: '' }); setMoveSheet({ open: true, account: a }); }}>
                  <ArrowDown className="w-3 h-3 mr-1" />{isRu ? 'Приход' : 'In'}
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setMoveForm({ direction: 'out', amount: 0, description: '' }); setMoveSheet({ open: true, account: a }); }}>
                  <ArrowUp className="w-3 h-3 mr-1" />{isRu ? 'Расход' : 'Out'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={moveSheet.open} onOpenChange={(o) => setMoveSheet({ open: o, account: moveSheet.account })}>
        <SheetContent>
          <SheetHeader><SheetTitle>{isRu ? 'Записать движение' : 'Record movement'}</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-4">
            <div>
              <Label>{isRu ? 'Тип' : 'Direction'}</Label>
              <Select value={moveForm.direction} onValueChange={(v) => setMoveForm({ ...moveForm, direction: v as 'in'|'out'|'reserve'|'release' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">{isRu ? 'Приход' : 'In'}</SelectItem>
                  <SelectItem value="out">{isRu ? 'Расход' : 'Out'}</SelectItem>
                  <SelectItem value="reserve">{isRu ? 'Резервировать' : 'Reserve'}</SelectItem>
                  <SelectItem value="release">{isRu ? 'Освободить' : 'Release'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>{isRu ? 'Сумма' : 'Amount'}</Label><Input type="number" value={moveForm.amount} onChange={e => setMoveForm({ ...moveForm, amount: Number(e.target.value) })} /></div>
            <div><Label>{isRu ? 'Описание' : 'Description'}</Label><Input value={moveForm.description} onChange={e => setMoveForm({ ...moveForm, description: e.target.value })} /></div>
            <Button className="w-full" disabled={!moveForm.amount || !moveSheet.account} onClick={async () => {
              if (!moveSheet.account) return;
              await move.mutateAsync({ trust_account_id: moveSheet.account.id, ...moveForm });
              setMoveSheet({ open: false });
            }}>{isRu ? 'Записать' : 'Record'}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
