import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorDocuments, VENDOR_DOC_TYPES, type VendorDocType } from '@/hooks/useVendorDocuments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import { toast } from 'sonner';
import { Plus, FileText, Trash2, Eye, Calendar, AlertTriangle } from 'lucide-react';
import { format, isPast, isBefore, addDays } from 'date-fns';

interface VendorDocumentsTabProps {
  vendorId: string;
  /** Also works for staff docs */
  docSource?: 'vendor' | 'staff';
}

export function VendorDocumentsTab({ vendorId, docSource = 'vendor' }: VendorDocumentsTabProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  // Staff documents removed 2026-06-05 — vendor-only now
  const vendorDocs = useVendorDocuments(vendorId);
  const { documents, isLoading, addDocument, deleteDocument } = vendorDocs;
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ doc_type: 'other' as string, title: '', file_url: '', file_name: '', expiry_date: '', notes: '' });

  const handleAdd = async () => {
    if (!form.file_url && !form.title) {
      toast.error(isRu ? 'Прикрепите файл или укажите название' : 'Attach a file or enter a title');
      return;
    }
    try {
      const basePayload = {
        doc_type: form.doc_type,
        title: form.title || form.file_name || null,
        file_url: form.file_url || null,
        file_name: form.file_name || null,
        expiry_date: form.expiry_date || null,
        notes: form.notes || null,
      };
      await addDocument.mutateAsync({ vendor_id: vendorId, ...basePayload } as any);
      toast.success(isRu ? 'Документ добавлен' : 'Document added');
      setAddOpen(false);
      setForm({ doc_type: 'other', title: '', file_url: '', file_name: '', expiry_date: '', notes: '' });
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isRu ? 'Удалить документ?' : 'Delete document?')) return;
    await deleteDocument.mutateAsync(id);
    toast.success(isRu ? 'Удалено' : 'Deleted');
  };

  const getExpiryStatus = (d: string | null) => {
    if (!d) return null;
    const exp = new Date(d);
    if (isPast(exp)) return 'expired';
    if (isBefore(exp, addDays(new Date(), 30))) return 'expiring';
    return 'valid';
  };

  if (isLoading) return <div className="animate-pulse h-24 bg-muted rounded-none" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          {isRu ? 'Документы' : 'Documents'} ({documents?.length || 0})
        </p>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          {isRu ? 'Добавить' : 'Add'}
        </Button>
      </div>

      {(!documents || documents.length === 0) ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
          {isRu ? 'Нет документов' : 'No documents yet'}
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => {
            const status = getExpiryStatus(doc.expiry_date);
            const typeLabel = VENDOR_DOC_TYPES.find(t => t.value === doc.doc_type);
            return (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-none border">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{doc.title || doc.file_name || 'Document'}</p>
                      {typeLabel && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {isRu ? typeLabel.ru : typeLabel.en}
                        </Badge>
                      )}
                    </div>
                    {doc.expiry_date && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span className={`text-xs ${status === 'expired' ? 'text-destructive' : status === 'expiring' ? 'text-warning' : 'text-muted-foreground'}`}>
                          {format(new Date(doc.expiry_date), 'dd.MM.yyyy')}
                        </span>
                        {status === 'expired' && <AlertTriangle className="h-3 w-3 text-destructive" />}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {doc.file_url && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4" /></a>
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(doc.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Document Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isRu ? 'Добавить документ' : 'Add Document'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">{isRu ? 'Тип' : 'Type'}</Label>
              <Select value={form.doc_type} onValueChange={v => setForm(f => ({ ...f, doc_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VENDOR_DOC_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{isRu ? t.ru : t.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">{isRu ? 'Название' : 'Title'}</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-1.5 block">{isRu ? 'Файл' : 'File'}</Label>
              <UnifiedMediaUploader
                mode="document"
                value={form.file_url}
                onChange={(url) => {
                  const u = typeof url === 'string' ? url : '';
                  setForm(f => ({ ...f, file_url: u, file_name: u.split('/').pop() || '' }));
                }}
                folder={`vendors/${vendorId}`}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">{isRu ? 'Срок действия' : 'Expiry Date'}</Label>
              <Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
            </div>
            <Button onClick={handleAdd} disabled={addDocument.isPending} className="w-full">
              {addDocument.isPending ? (isRu ? 'Сохранение...' : 'Saving...') : (isRu ? 'Сохранить' : 'Save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
