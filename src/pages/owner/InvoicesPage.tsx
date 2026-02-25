import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { useOwnerInvoices, useCreateInvoice, useUpdateInvoiceStatus, useDeleteInvoice, InvoiceItem } from '@/hooks/useOwnerInvoices';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FileText, Trash2, Send, Check, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { generateInvoicePdf } from '@/lib/invoicePdf';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-info/10 text-info',
  paid: 'bg-success/10 text-success',
  overdue: 'bg-destructive/10 text-destructive',
  cancelled: 'bg-muted text-muted-foreground line-through',
};

export default function InvoicesPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const [filter, setFilter] = useState('all');
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: company } = useMyCompanyId();
  const companyId = company?.company_id;
  const { data: invoices, isLoading } = useOwnerInvoices(filter);
  const createInvoice = useCreateInvoice();
  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();

  // Form state
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [invoiceType, setInvoiceType] = useState<string>('tenant_billing');
  const [currency, setCurrency] = useState('THB');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, amount: 0 },
  ]);

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0, amount: 0 }]);

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].amount = Number(updated[index].quantity) * Number(updated[index].unit_price);
    }
    setItems(updated);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((s, i) => s + i.amount, 0);

  const handleCreate = async () => {
    if (!companyId || !user) return;
    if (!recipientName.trim()) {
      toast.error(isRu ? 'Укажите получателя' : 'Recipient name required');
      return;
    }
    if (items.some(i => !i.description.trim())) {
      toast.error(isRu ? 'Заполните описание всех позиций' : 'Fill in all item descriptions');
      return;
    }

    try {
      await createInvoice.mutateAsync({
        company_id: companyId,
        invoice_type: invoiceType,
        recipient_name: recipientName,
        recipient_email: recipientEmail || undefined,
        items,
        subtotal,
        tax_rate: 0,
        tax_amount: 0,
        total: subtotal,
        currency,
        due_date: dueDate || undefined,
        notes: notes || undefined,
        created_by: user.id,
      });
      toast.success(isRu ? 'Инвойс создан' : 'Invoice created');
      setSheetOpen(false);
      resetForm();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const resetForm = () => {
    setRecipientName('');
    setRecipientEmail('');
    setInvoiceType('tenant_billing');
    setCurrency('THB');
    setDueDate('');
    setNotes('');
    setItems([{ description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const handleMarkPaid = (id: string) => {
    updateStatus.mutate(
      { id, status: 'paid', paid_date: new Date().toISOString().split('T')[0] },
      { onSuccess: () => toast.success(isRu ? 'Отмечен как оплачен' : 'Marked as paid') }
    );
  };

  const handleMarkSent = (id: string) => {
    updateStatus.mutate(
      { id, status: 'sent' },
      { onSuccess: () => toast.success(isRu ? 'Отмечен как отправлен' : 'Marked as sent') }
    );
  };

  const handleCancel = (id: string) => {
    updateStatus.mutate(
      { id, status: 'cancelled' },
      { onSuccess: () => toast.success(isRu ? 'Инвойс отменён' : 'Invoice cancelled') }
    );
  };

  const handleDelete = (id: string) => {
    deleteInvoice.mutate(id, {
      onSuccess: () => toast.success(isRu ? 'Удалено' : 'Deleted'),
    });
  };

  const handleDownloadPdf = (inv: any) => {
    try {
      const doc = generateInvoicePdf({
        invoice_number: inv.invoice_number,
        recipient_name: inv.recipient_name,
        recipient_email: inv.recipient_email,
        issued_date: inv.issued_date,
        due_date: inv.due_date,
        items: inv.items || [],
        subtotal: Number(inv.subtotal),
        tax_rate: Number(inv.tax_rate || 0),
        tax_amount: Number(inv.tax_amount || 0),
        total: Number(inv.total),
        currency: inv.currency,
        notes: inv.notes,
        status: inv.status,
      });
      doc.save(`invoice-${inv.invoice_number}.pdf`);
      toast.success(isRu ? 'PDF скачан' : 'PDF downloaded');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{isRu ? 'Инвойсы' : 'Invoices'}</h1>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {isRu ? 'Новый' : 'New'}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{isRu ? 'Новый инвойс' : 'New Invoice'}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isRu ? 'Тип' : 'Type'}</Label>
                  <Select value={invoiceType} onValueChange={setInvoiceType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant_billing">{isRu ? 'Арендатору' : 'Tenant Billing'}</SelectItem>
                      <SelectItem value="owner_report">{isRu ? 'Собственнику' : 'Owner Report'}</SelectItem>
                      <SelectItem value="service_fee">{isRu ? 'Сервисный сбор' : 'Service Fee'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isRu ? 'Валюта' : 'Currency'}</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="THB">THB</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="RUB">RUB</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>{isRu ? 'Получатель' : 'Recipient'} *</Label>
                <Input value={recipientName} onChange={e => setRecipientName(e.target.value)} />
              </div>

              <div>
                <Label>Email</Label>
                <Input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} />
              </div>

              <div>
                <Label>{isRu ? 'Срок оплаты' : 'Due Date'}</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>

              <div>
                <Label>{isRu ? 'Позиции' : 'Line Items'}</Label>
                <div className="space-y-2 mt-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Input
                          placeholder={isRu ? 'Описание' : 'Description'}
                          value={item.description}
                          onChange={e => updateItem(idx, 'description', e.target.value)}
                        />
                      </div>
                      <div className="w-16">
                        <Input
                          type="number"
                          min={1}
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          min={0}
                          placeholder={isRu ? 'Цена' : 'Price'}
                          value={item.unit_price || ''}
                          onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))}
                        />
                      </div>
                      <div className="w-20 text-right text-sm font-medium pt-2">
                        {item.amount.toLocaleString()}
                      </div>
                      {items.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(idx)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="mt-2" onClick={addItem}>
                  <Plus className="h-3 w-3 mr-1" /> {isRu ? 'Добавить' : 'Add Item'}
                </Button>
              </div>

              <div className="flex justify-between items-center py-3 border-t border-border">
                <span className="font-semibold">{isRu ? 'Итого' : 'Total'}:</span>
                <span className="text-lg font-bold">{subtotal.toLocaleString()} {currency}</span>
              </div>

              <div>
                <Label>{isRu ? 'Заметки' : 'Notes'}</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
              </div>

              <Button className="w-full" onClick={handleCreate} disabled={createInvoice.isPending}>
                {isRu ? 'Создать инвойс' : 'Create Invoice'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'draft', 'sent', 'paid', 'overdue'].map(s => (
          <Button
            key={s}
            variant={filter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(s)}
            className="flex-shrink-0"
          >
            {s === 'all' ? (isRu ? 'Все' : 'All') :
             s === 'draft' ? (isRu ? 'Черновик' : 'Draft') :
             s === 'sent' ? (isRu ? 'Отправлен' : 'Sent') :
             s === 'paid' ? (isRu ? 'Оплачен' : 'Paid') :
             isRu ? 'Просрочен' : 'Overdue'}
          </Button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : !invoices?.length ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">
            {isRu ? 'Нет инвойсов' : 'No invoices yet'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <Card key={inv.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{inv.invoice_number}</p>
                  <p className="text-xs text-muted-foreground">{inv.recipient_name}</p>
                </div>
                <Badge className={STATUS_COLORS[inv.status] || ''}>
                  {inv.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {format(new Date(inv.issued_date), 'dd.MM.yyyy')}
                  {inv.due_date && ` → ${format(new Date(inv.due_date), 'dd.MM.yyyy')}`}
                </span>
                <span className="font-bold">
                  {Number(inv.total).toLocaleString()} {inv.currency}
                </span>
              </div>

              {inv.status === 'draft' && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleMarkSent(inv.id)}>
                    <Send className="h-3 w-3 mr-1" />
                    {isRu ? 'Отправить' : 'Send'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(inv)}>
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(inv.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {inv.status === 'sent' && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="default" className="flex-1" onClick={() => handleMarkPaid(inv.id)}>
                    <Check className="h-3 w-3 mr-1" />
                    {isRu ? 'Оплачен' : 'Paid'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(inv)}>
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleCancel(inv.id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {inv.status === 'overdue' && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="default" className="flex-1" onClick={() => handleMarkPaid(inv.id)}>
                    <Check className="h-3 w-3 mr-1" />
                    {isRu ? 'Отметить оплату' : 'Mark Paid'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(inv)}>
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {inv.status === 'paid' && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(inv)}>
                    <Download className="h-3 w-3 mr-1" />
                    PDF
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
