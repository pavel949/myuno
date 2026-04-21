/**
 * EditVaultDocumentDialog — inline edit of vault doc metadata
 * (category, title, expiry_date). File itself is not replaced here.
 */
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import type { DocCategory, MyDocument } from '@/hooks/useMyDocuments';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: MyDocument | null;
}

const CATEGORIES: { value: DocCategory; ru: string; en: string }[] = [
  { value: 'tm30',           ru: 'TM30',                en: 'TM30' },
  { value: 'work_permit',    ru: 'Разрешение на работу', en: 'Work permit' },
  { value: 'contract',       ru: 'Договор',             en: 'Contract' },
  { value: 'title_deed',     ru: 'Чанот / Title deed',  en: 'Title deed' },
  { value: 'tax_filing',     ru: 'Налоговая декларация', en: 'Tax filing' },
  { value: 'bank_statement', ru: 'Выписка банка',       en: 'Bank statement' },
  { value: 'medical',        ru: 'Медицинский документ', en: 'Medical' },
  { value: 'insurance',      ru: 'Страховка',           en: 'Insurance' },
  { value: 'poa',            ru: 'Доверенность',        en: 'Power of attorney' },
  { value: 'other',          ru: 'Другое',              en: 'Other' },
];

export function EditVaultDocumentDialog({ open, onOpenChange, doc }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const qc = useQueryClient();

  const [category, setCategory] = useState<DocCategory>('other');
  const [title, setTitle] = useState('');
  const [expiry, setExpiry] = useState('');

  // Hydrate when dialog opens with a new doc
  useEffect(() => {
    if (open && doc) {
      setCategory(doc.category);
      setTitle(doc.title);
      setExpiry(doc.expiryDate ?? '');
    }
  }, [open, doc]);

  // Real DB id is stored after the `vault-` prefix
  const dbId = doc?.id.startsWith('vault-') ? doc.id.slice('vault-'.length) : null;

  // Reset fields back to the document's saved values (used by Cancel)
  const resetFields = () => {
    if (doc) {
      setCategory(doc.category);
      setTitle(doc.title);
      setExpiry(doc.expiryDate ?? '');
    }
  };

  const handleCancel = () => {
    resetFields();
    onOpenChange(false);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!dbId) throw new Error('Invalid document');
      if (!title.trim()) throw new Error(isRu ? 'Укажите название' : 'Enter a title');

      const { error } = await supabase
        .from('user_documents_vault')
        .update({
          category,
          title: title.trim(),
          expiry_date: expiry || null,
        })
        .eq('id', dbId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me-documents'] });
      toast.success(isRu ? 'Сохранено' : 'Saved');
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isRu ? 'Редактировать документ' : 'Edit document'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{isRu ? 'Категория' : 'Category'}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as DocCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{isRu ? c.ru : c.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-title">{isRu ? 'Название' : 'Title'}</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-expiry">{isRu ? 'Срок действия' : 'Expiry date'}</Label>
            <Input
              id="edit-expiry"
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            {isRu ? 'Отмена' : 'Cancel'}
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isRu ? 'Сохранить' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
