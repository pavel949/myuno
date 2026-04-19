/**
 * MC Procurement page — purchase orders with 3-way match (PO → Receipt → Invoice).
 * Route: /mc/procurement
 */
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  usePurchaseOrders, useCreatePurchaseOrder, usePurchaseOrderDetail,
  useReceiveGoods, useUpdatePOStatus,
} from '@/hooks/usePurchaseOrders';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import {
  PackageOpen, Plus, Truck, FileCheck, ChevronRight, X, Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function ProcurementPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [creating, setCreating] = useState(false);
  const [openPO, setOpenPO] = useState<string | null>(null);

  const { data: orders = [], isLoading } = usePurchaseOrders();

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

  const stats = {
    draft: orders.filter(o => o.status === 'draft').length,
    sent: orders.filter(o => o.status === 'sent' || o.status === 'partially_received').length,
    received: orders.filter(o => o.status === 'received').length,
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-24">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <PackageOpen className="w-5 h-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold">{isRu ? 'Закупки' : 'Procurement'}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Заказ → Получение → Инвойс (3-way match).' : 'PO → Goods Receipt → Invoice (3-way match).'}
          </p>
        </div>
        <Sheet open={creating} onOpenChange={setCreating}>
          <SheetTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1.5" />{isRu ? 'Заказ' : 'PO'}</Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>{isRu ? 'Новый заказ' : 'New purchase order'}</SheetTitle></SheetHeader>
            <CreatePOForm onClose={() => setCreating(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label={isRu ? 'Черновики' : 'Draft'} value={stats.draft} cls="text-muted-foreground" />
        <StatCard label={isRu ? 'В пути' : 'In transit'} value={stats.sent} cls="text-warning" />
        <StatCard label={isRu ? 'Получено' : 'Received'} value={stats.received} cls="text-success" />
      </div>

      <div className="space-y-2">
        {orders.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">
            <PackageOpen className="w-10 h-10 mx-auto opacity-30 mb-3" />
            <p className="text-sm">{isRu ? 'Заказов пока нет.' : 'No purchase orders yet.'}</p>
          </CardContent></Card>
        ) : orders.map(po => {
          const cfg = STATUS_CFG[po.status];
          return (
            <Card key={po.id} className="cursor-pointer hover:bg-accent/30 transition" onClick={() => setOpenPO(po.id)}>
              <CardContent className="p-4 flex items-center gap-3">
                <Badge variant="outline" className={cn('text-xs', cfg.cls)}>{isRu ? cfg.ru : cfg.en}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{po.po_number} · {po.vendor_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(po.created_at), 'd MMM', { locale: isRu ? ru : undefined })}
                    {po.expected_date && ` · ${isRu ? 'ожид.' : 'expected'} ${po.expected_date}`}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {Number(po.total_amount).toLocaleString()} {po.currency}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Sheet open={!!openPO} onOpenChange={(o) => !o && setOpenPO(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {openPO && <PODetail poId={openPO} onClose={() => setOpenPO(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

const STATUS_CFG: Record<string, { ru: string; en: string; cls: string }> = {
  draft: { ru: 'Черновик', en: 'Draft', cls: 'bg-muted text-muted-foreground' },
  sent: { ru: 'Отправлен', en: 'Sent', cls: 'bg-primary/15 text-primary' },
  partially_received: { ru: 'Частично', en: 'Partial', cls: 'bg-warning/15 text-warning' },
  received: { ru: 'Получен', en: 'Received', cls: 'bg-success/15 text-success' },
  invoiced: { ru: 'С инвойсом', en: 'Invoiced', cls: 'bg-success/15 text-success' },
  closed: { ru: 'Закрыт', en: 'Closed', cls: 'bg-muted text-muted-foreground' },
  cancelled: { ru: 'Отменён', en: 'Cancelled', cls: 'bg-destructive/15 text-destructive' },
};

function StatCard({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <Card><CardContent className="p-3">
      <p className={cn('text-xs', cls)}>{label}</p>
      <p className="text-2xl font-bold tabular-nums mt-0.5">{value}</p>
    </CardContent></Card>
  );
}

function PODetail({ poId, onClose }: { poId: string; onClose: () => void }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data, isLoading } = usePurchaseOrderDetail(poId);
  const updateStatus = useUpdatePOStatus();
  const receive = useReceiveGoods();
  const [receiveQty, setReceiveQty] = useState<Record<string, string>>({});

  if (isLoading || !data) return <div className="py-12 flex justify-center"><LoadingSpinner /></div>;
  const { po, items, receipts } = data;

  return (
    <div className="space-y-5 mt-4">
      <SheetHeader>
        <SheetTitle>{po.po_number}</SheetTitle>
      </SheetHeader>
      <div>
        <p className="text-sm text-muted-foreground">{po.vendor_name}</p>
        <p className="text-xl font-bold tabular-nums mt-1">{Number(po.total_amount).toLocaleString()} {po.currency}</p>
        <Badge variant="outline" className="mt-2 text-xs">{po.status}</Badge>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">{isRu ? 'Позиции' : 'Items'}</p>
        {items.map(it => (
          <div key={it.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/20">
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{it.description}</p>
              <p className="text-xs text-muted-foreground">
                {it.quantity} × {Number(it.unit_price).toLocaleString()} · {isRu ? 'получено' : 'received'} {it.received_quantity}
              </p>
            </div>
            {po.status !== 'received' && po.status !== 'closed' && po.status !== 'cancelled' && (
              <Input
                type="number"
                className="w-20 h-8"
                placeholder={String(Math.max(0, it.quantity - it.received_quantity))}
                value={receiveQty[it.id] || ''}
                onChange={(e) => setReceiveQty({ ...receiveQty, [it.id]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>

      {po.status !== 'received' && po.status !== 'closed' && po.status !== 'cancelled' && (
        <div className="grid grid-cols-2 gap-2">
          {po.status === 'draft' && (
            <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: po.id, status: 'sent' })}>
              <Truck className="w-3.5 h-3.5 mr-1.5" />{isRu ? 'Отправить' : 'Send'}
            </Button>
          )}
          <Button size="sm" className="col-span-1"
            onClick={async () => {
              const itemsToReceive = items
                .map(it => ({ item_id: it.id, received_quantity: Number(receiveQty[it.id] || 0) }))
                .filter(x => x.received_quantity > 0);
              if (!itemsToReceive.length) return;
              await receive.mutateAsync({ po_id: po.id, items: itemsToReceive });
              setReceiveQty({});
            }}
            disabled={receive.isPending}>
            <FileCheck className="w-3.5 h-3.5 mr-1.5" />{isRu ? 'Принять' : 'Receive'}
          </Button>
        </div>
      )}

      {receipts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">{isRu ? 'Получения' : 'Receipts'}</p>
          {receipts.map(r => (
            <div key={r.id} className="p-2 rounded-md border text-xs space-y-0.5">
              <p>{format(new Date(r.received_at), 'd MMM HH:mm', { locale: isRu ? ru : undefined })}</p>
              {r.notes && <p className="text-muted-foreground">{r.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreatePOForm({ onClose }: { onClose: () => void }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const create = useCreatePurchaseOrder();
  const [vendor, setVendor] = useState('');
  const [expected, setExpected] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ description: string; quantity: number; unit_price: number }[]>([
    { description: '', quantity: 1, unit_price: 0 },
  ]);

  const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  return (
    <form className="space-y-4 mt-4" onSubmit={async (e) => {
      e.preventDefault();
      await create.mutateAsync({
        vendor_name: vendor,
        expected_date: expected || undefined,
        notes: notes || undefined,
        items: items.filter(i => i.description.trim()),
      });
      onClose();
    }}>
      <div className="space-y-1.5">
        <Label>{isRu ? 'Поставщик' : 'Vendor'}</Label>
        <Input value={vendor} onChange={(e) => setVendor(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label>{isRu ? 'Ожидаемая дата' : 'Expected date'}</Label>
        <Input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{isRu ? 'Позиции' : 'Items'}</Label>
          <Button type="button" size="sm" variant="ghost" onClick={() => setItems([...items, { description: '', quantity: 1, unit_price: 0 }])}>
            <Plus className="w-3 h-3 mr-1" />{isRu ? 'Добавить' : 'Add'}
          </Button>
        </div>
        {items.map((it, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
            <Input className="col-span-6" placeholder={isRu ? 'Описание' : 'Description'} value={it.description}
              onChange={(e) => {
                const next = [...items]; next[idx].description = e.target.value; setItems(next);
              }} />
            <Input className="col-span-2" type="number" min={0} value={it.quantity}
              onChange={(e) => { const next = [...items]; next[idx].quantity = Number(e.target.value); setItems(next); }} />
            <Input className="col-span-3" type="number" min={0} step={0.01} value={it.unit_price}
              onChange={(e) => { const next = [...items]; next[idx].unit_price = Number(e.target.value); setItems(next); }} />
            <Button type="button" size="icon" variant="ghost" className="col-span-1 h-8 w-8"
              onClick={() => setItems(items.filter((_, i) => i !== idx))}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label>{isRu ? 'Заметки' : 'Notes'}</Label>
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex items-center justify-between p-2 rounded-md bg-muted/40">
        <span className="text-sm font-medium">{isRu ? 'Итого' : 'Total'}</span>
        <span className="text-base font-bold tabular-nums">{total.toLocaleString()} THB</span>
      </div>
      <Button type="submit" className="w-full" disabled={create.isPending}>
        <Check className="w-4 h-4 mr-1.5" />
        {create.isPending ? (isRu ? 'Создание…' : 'Creating…') : (isRu ? 'Создать заказ' : 'Create PO')}
      </Button>
    </form>
  );
}
