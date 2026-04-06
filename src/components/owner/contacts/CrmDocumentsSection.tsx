/**
 * CrmDocumentsSection — Upload, list, download documents for a contact/property/deal.
 */
import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useCrmDocuments,
  useUploadCrmDocument,
  useDeleteCrmDocument,
  getDocumentUrl,
  DOCUMENT_TYPE_LABELS,
} from '@/hooks/useCrmDocuments';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Upload, Download, Trash2, FileText, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  companyId: string;
  contactId?: string;
  propertyId?: string;
  dealId?: string;
  className?: string;
}

export function CrmDocumentsSection({ companyId, contactId, propertyId, dealId, className }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;

  const { data: docs = [], isLoading } = useCrmDocuments(companyId, { contactId, propertyId, dealId });
  const uploadDoc = useUploadCrmDocument();
  const deleteDoc = useDeleteCrmDocument();

  const [showUpload, setShowUpload] = useState(false);
  const [docType, setDocType] = useState('other');
  const [title, setTitle] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) return;
    try {
      await uploadDoc.mutateAsync({
        file: selectedFile,
        companyId,
        documentType: docType,
        title: title.trim(),
        contactId,
        propertyId,
        dealId,
      });
      setShowUpload(false);
      setTitle('');
      setSelectedFile(null);
      setDocType('other');
    } catch {
      // ignored — mutation error is handled by react-query and displayed by toast
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const url = await getDocumentUrl(fileUrl);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.target = '_blank';
      a.click();
    } catch {
      toast.error(isRu ? 'Ошибка загрузки' : 'Download error');
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          {isRu ? 'Документы' : 'Documents'}
          {docs.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">{docs.length}</Badge>
          )}
        </p>
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setShowUpload(!showUpload)}>
          {showUpload ? <X className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
          {showUpload ? (isRu ? 'Отмена' : 'Cancel') : (isRu ? 'Добавить' : 'Add')}
        </Button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <Input
            placeholder={isRu ? 'Название документа...' : 'Document title...'}
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="h-8 text-sm"
          />
          <div className="flex gap-2">
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, val]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {val.icon} {isRu ? val.ru : val.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
            />
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-3 w-3 mr-1" />
              {selectedFile ? selectedFile.name : (isRu ? 'Выбрать файл' : 'Choose file')}
            </Button>
            <Button
              size="sm"
              className="text-xs h-8"
              disabled={!selectedFile || !title.trim() || uploadDoc.isPending}
              onClick={handleUpload}
            >
              {uploadDoc.isPending ? '...' : (isRu ? 'Загрузить' : 'Upload')}
            </Button>
          </div>
        </div>
      )}

      {/* Document list */}
      {isLoading ? (
        <div className="text-xs text-muted-foreground py-4 text-center">{isRu ? 'Загрузка...' : 'Loading...'}</div>
      ) : docs.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          {isRu ? 'Нет документов' : 'No documents yet'}
        </p>
      ) : (
        <div className="space-y-1.5">
          {docs.map(doc => {
            const typeLabel = DOCUMENT_TYPE_LABELS[doc.document_type] || DOCUMENT_TYPE_LABELS.other;
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-accent/30 transition-colors group"
              >
                <span className="text-lg shrink-0">{typeLabel.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{isRu ? typeLabel.ru : typeLabel.en}</span>
                    {doc.file_size && <span>· {formatSize(doc.file_size)}</span>}
                    <span>· {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale })}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 shrink-0"
                  onClick={() => handleDownload(doc.file_url, doc.file_name)}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 shrink-0 opacity-0 group-hover:opacity-100 text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{isRu ? 'Удалить документ?' : 'Delete document?'}</AlertDialogTitle>
                      <AlertDialogDescription>{doc.title}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteDoc.mutate({ id: doc.id, file_url: doc.file_url })}
                        className="bg-destructive text-destructive-foreground"
                      >
                        {isRu ? 'Удалить' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
