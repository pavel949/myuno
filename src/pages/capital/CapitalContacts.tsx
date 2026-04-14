import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCapitalContacts } from '@/hooks/capital';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Upload, Search } from 'lucide-react';
import Papa from 'papaparse';
import {
  WARMTH_LABELS, WARMTH_COLORS, BUYER_TYPE_LABELS,
  type Warmth, type BuyerType, type PreferredChannel,
} from '@/types/capital';

export default function CapitalContacts() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [warmthFilter, setWarmthFilter] = useState<string>('all');
  const [buyerFilter, setBuyerFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filters = {
    search: search || undefined,
    warmth: warmthFilter !== 'all' ? warmthFilter : undefined,
    buyer_type: buyerFilter !== 'all' ? buyerFilter : undefined,
  };

  const { contacts, isLoading, createContact, updateContact } = useCapitalContacts(filters);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', telegram_id: '', whatsapp_phone: '',
    preferred_channel: 'whatsapp' as PreferredChannel,
    budget_min: '', budget_max: '', budget_currency: 'USD',
    buyer_type: '' as BuyerType | '', warmth: 'cold' as Warmth,
    source: '', notes: '',
  });

  const resetForm = () => setForm({
    name: '', phone: '', email: '', telegram_id: '', whatsapp_phone: '',
    preferred_channel: 'whatsapp', budget_min: '', budget_max: '', budget_currency: 'USD',
    buyer_type: '', warmth: 'cold', source: '', notes: '',
  });

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Введите имя'); return; }
    try {
      await createContact.mutateAsync({
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        telegram_id: form.telegram_id || null,
        whatsapp_phone: form.whatsapp_phone || null,
        preferred_channel: form.preferred_channel,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        budget_currency: form.budget_currency,
        buyer_type: (form.buyer_type as BuyerType) || null,
        warmth: form.warmth,
        source: form.source || null,
        tags: [],
        notes: form.notes || null,
        last_contact_at: null,
      });
      toast.success('Контакт создан');
      setDialogOpen(false);
      resetForm();
    } catch {
      toast.error('Ошибка создания контакта');
    }
  };

  const handleWarmthChange = async (contactId: string, warmth: Warmth) => {
    try {
      await updateContact.mutateAsync({ id: contactId, warmth });
    } catch {
      toast.error('Ошибка обновления');
    }
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let imported = 0;
        for (const row of results.data as Record<string, string>[]) {
          try {
            await createContact.mutateAsync({
              name: row.name || row['Имя'] || 'Без имени',
              phone: row.phone || row['Телефон'] || null,
              email: row.email || row['Email'] || null,
              telegram_id: row.telegram_id || row.telegram || null,
              whatsapp_phone: row.whatsapp_phone || row.whatsapp || null,
              preferred_channel: 'whatsapp',
              budget_min: row.budget_min ? Number(row.budget_min) : null,
              budget_max: row.budget_max ? Number(row.budget_max) : null,
              budget_currency: row.budget_currency || 'USD',
              buyer_type: (row.buyer_type as BuyerType) || null,
              warmth: (row.warmth as Warmth) || 'cold',
              source: row.source || 'csv_import',
              tags: [],
              notes: row.notes || null,
              last_contact_at: null,
            });
            imported++;
          } catch { /* skip invalid rows */ }
        }
        toast.success(`Импортировано ${imported} контактов`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Контакты</h1>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-1" /> Добавить
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Новый контакт</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div>
                  <Label>Имя *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Телефон</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+7..." />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>WhatsApp</Label>
                    <Input value={form.whatsapp_phone} onChange={(e) => setForm({ ...form, whatsapp_phone: e.target.value })} placeholder="+7..." />
                  </div>
                  <div>
                    <Label>Telegram</Label>
                    <Input value={form.telegram_id} onChange={(e) => setForm({ ...form, telegram_id: e.target.value })} placeholder="@username" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Канал</Label>
                    <Select value={form.preferred_channel} onValueChange={(v) => setForm({ ...form, preferred_channel: v as PreferredChannel })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="telegram">Telegram</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Звонок</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Тип покупателя</Label>
                    <Select value={form.buyer_type} onValueChange={(v) => setForm({ ...form, buyer_type: v as BuyerType })}>
                      <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(BUYER_TYPE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Бюджет от</Label>
                    <Input type="number" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} />
                  </div>
                  <div>
                    <Label>Бюджет до</Label>
                    <Input type="number" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} />
                  </div>
                  <div>
                    <Label>Валюта</Label>
                    <Select value={form.budget_currency} onValueChange={(v) => setForm({ ...form, budget_currency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="THB">THB</SelectItem>
                        <SelectItem value="RUB">RUB</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Теплота</Label>
                    <Select value={form.warmth} onValueChange={(v) => setForm({ ...form, warmth: v as Warmth })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(WARMTH_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Источник</Label>
                    <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="referral, instagram..." />
                  </div>
                </div>
                <div>
                  <Label>Заметки</Label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700" disabled={createContact.isPending}>
                  {createContact.isPending ? 'Сохранение...' : 'Создать'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени, телефону, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={warmthFilter} onValueChange={setWarmthFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Теплота" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            {Object.entries(WARMTH_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={buyerFilter} onValueChange={setBuyerFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Тип" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            {Object.entries(BUYER_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Контактов пока нет. Добавьте первого!
        </div>
      ) : (
        <div className="rounded-lg border border-border/50 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left p-3 font-medium">Имя</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Контакт</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Бюджет</th>
                <th className="text-left p-3 font-medium">Тип</th>
                <th className="text-left p-3 font-medium">Теплота</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border/30 hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => navigate(`/capital/contacts/${c.id}`)}
                >
                  <td className="p-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground md:hidden">{c.phone || c.email}</div>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <div>{c.phone}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </td>
                  <td className="p-3 hidden lg:table-cell">
                    {c.budget_min || c.budget_max ? (
                      <span className="text-xs">
                        {c.budget_min?.toLocaleString()}–{c.budget_max?.toLocaleString()} {c.budget_currency}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="p-3">
                    {c.buyer_type ? (
                      <span className="text-xs">{BUYER_TYPE_LABELS[c.buyer_type as BuyerType] ?? c.buyer_type}</span>
                    ) : '—'}
                  </td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={c.warmth}
                      onValueChange={(v) => handleWarmthChange(c.id, v as Warmth)}
                    >
                      <SelectTrigger className="h-7 w-[110px] border-0 p-0">
                        <Badge className={WARMTH_COLORS[c.warmth as Warmth]}>
                          {WARMTH_LABELS[c.warmth as Warmth]}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(WARMTH_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
