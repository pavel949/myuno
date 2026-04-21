/**
 * AddVaultDocumentDialog — upload a document into the personal vault.
 *
 * Writes the file into the private `user-documents` storage bucket
 * (path `${userId}/vault/...`) and inserts a row in `user_documents_vault`.
 * On success it invalidates the `me-documents` query so /me/documents refreshes.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { generateFileName } from '@/lib/fileId';
import { validateDocumentFile } from '@/components/upload/shared/ImageCompressor';
import { toast } from 'sonner';
import type { DocCategory } from '@/hooks/useMyDocuments';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function AddVaultDocumentDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const qc = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocCategory>('other');
  const [title, setTitle] = useState('');
  const [expiry, setExpiry] = useState('');

  const reset = () => {
    setFile(null);
    setCategory('other');
    setTitle('');
    setExpiry('');
  };

  const upload = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      if (!file) throw new Error(isRu ? 'Выберите файл' : 'Pick a file');
      if (!title.trim()) throw new Error(isRu ? 'Укажите название' : 'Enter a title');

      const v = validateDocumentFile(file, 10);
      if (!v.valid) throw new Error(v.error);

      const ext = file.name.split('.').pop() ?? 'bin';
      const path = `${user.id}/vault/${generateFileName(ext)}`;

      const { error: upErr } = await supabase.storage
        .from('user-documents')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from('user_documents_vault').insert({
        user_id: user.id,
        category,
        title: title.trim(),
        file_url: path,
        file_mime: file.type,
        file_size_bytes: file.size,
        expiry_date: expiry || null,
        is_encrypted: false,
      });
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me-documents'] });
      toast.success(isRu ? 'Документ добавлен' : 'Document added');
      reset();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isRu ? 'Добавить документ' : 'Add document'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="vault-file">{isRu ? 'Файл (PDF / JPG / PNG, до 10 МБ)' : 'File (PDF / JPG / PNG, up to 10 MB)'}</Label>
            <Input
              id="vault-file"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

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
            <Label htmlFor="vault-title">{isRu ? 'Название' : 'Title'}</Label>
            <Input
              id="vault-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isRu ? 'Напр. Договор аренды 2026' : 'e.g. Lease agreement 2026'}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vault-expiry">{isRu ? 'Срок действия (необязательно)' : 'Expiry date (optional)'}</Label>
            <Input
              id="vault-expiry"
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={upload.isPending}>
            {isRu ? 'Отмена' : 'Cancel'}
          </Button>
          <Button onClick={() => upload.mutate()} disabled={upload.isPending || !file}>
            {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isRu ? 'Загрузить' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
