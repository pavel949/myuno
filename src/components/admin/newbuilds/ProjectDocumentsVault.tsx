/**
 * Project Documents Vault — admin & developer view.
 * Per-category upload + visibility toggle + versioning.
 */
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileText, Trash2, Eye, Lock, Users, Shield } from 'lucide-react';
import {
  useProjectDocuments,
  useUploadProjectDocument,
  useDeleteProjectDocument,
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
  type DocumentVisibility,
  type ProjectDocument,
} from '@/hooks/useProjectDocuments';

const VISIBILITY_OPTIONS: { value: DocumentVisibility; label: string; icon: typeof Eye }[] = [
  { value: 'public', label: 'Публичный', icon: Eye },
  { value: 'kyc', label: 'После KYC', icon: Users },
  { value: 'buyer_only', label: 'Только покупателю', icon: Lock },
  { value: 'admin_only', label: 'Только админ', icon: Shield },
];

export function ProjectDocumentsVault({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = (value: LangValues) => pickLang(language, value);
  const { data: docs = [], isLoading, isError, isFetching, refetch } = useProjectDocuments(user?.id ? projectId : undefined, {
    onlyCurrent: false,
    viewerId: user?.id,
  });
  const upload = useUploadProjectDocument();
  const del = useDeleteProjectDocument();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<DocumentCategory>('land_title');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<DocumentVisibility>('kyc');
  const [file, setFile] = useState<File | null>(null);
  const [replacesId, setReplacesId] = useState<string | undefined>(undefined);

  const handleUpload = async () => {
    if (!file || !title) return;
    await upload.mutateAsync({
      projectId,
      category,
      title,
      description: description || undefined,
      visibility,
      file,
      replacesDocumentId: replacesId,
    });
    setOpen(false);
    setFile(null);
    setTitle('');
    setDescription('');
    setReplacesId(undefined);
  };

  const docsByCategory = DOCUMENT_CATEGORIES.map((cat) => ({
    ...cat,
    docs: docs.filter((d) => d.category === cat.value),
  }));
  const currentCount = docs.filter(document => document.is_current).length;
  const coveredCategoryCount = docsByCategory.filter(category => category.docs.some(document => document.is_current)).length;
  const evidenceCounts = [
    { label: t({ en: 'Current documents', ru: 'Актуальные документы', th: 'เอกสารฉบับปัจจุบัน' }), count: currentCount },
    { label: t({ en: 'Categories with current documents', ru: 'Категории с актуальными документами', th: 'หมวดหมู่ที่มีเอกสารฉบับปัจจุบัน' }), count: coveredCategoryCount },
    { label: t({ en: 'Previous versions', ru: 'Предыдущие версии', th: 'ฉบับก่อนหน้า' }), count: docs.length - currentCount },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-h3">{t({ en: 'Project evidence', ru: 'Подтверждающие документы', th: 'หลักฐานของโครงการ' })}</h2>
          <p className="text-sm text-muted-foreground">{t({ en: 'Documents, versions and access levels for this project.', ru: 'Документы, версии и уровни доступа для этого проекта.', th: 'เอกสาร ฉบับ และระดับการเข้าถึงของโครงการนี้' })}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setReplacesId(undefined); setOpen(true); }}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              {t({ en: 'Upload document', ru: 'Загрузить документ', th: 'อัปโหลดเอกสาร' })}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{replacesId ? 'Новая версия документа' : 'Новый документ'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Категория</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{language === 'ru' ? c.label_ru : c.label_en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Название</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Chanote 12345" />
              </div>
              <div>
                <Label>Описание (опц.)</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Уровень доступа</Label>
                <Select value={visibility} onValueChange={(v) => setVisibility(v as DocumentVisibility)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map((v) => (
                      <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Файл</Label>
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
              <Button onClick={handleUpload} disabled={!file || !title || upload.isPending} className="w-full">
                {upload.isPending ? 'Загрузка…' : 'Загрузить'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isError ? (
        <Card className="space-y-3 p-4">
          <p role="alert">{t({ en: 'Project documents could not be loaded.', ru: 'Не удалось загрузить документы проекта.', th: 'โหลดเอกสารโครงการไม่ได้' })}</p>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {t({ en: 'Try again', ru: 'Повторить', th: 'ลองอีกครั้ง' })}
          </Button>
        </Card>
      ) : isLoading ? (
        <p role="status" className="text-muted-foreground">
          {t({ en: 'Loading project documents…', ru: 'Загружаем документы проекта…', th: 'กำลังโหลดเอกสารโครงการ…' })}
        </p>
      ) : (
        <div className="space-y-4">
          <dl className="grid gap-2 sm:grid-cols-3">
            {evidenceCounts.map(({ label, count }) => (
              <div key={label} className="space-y-1 border bg-card p-3">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="text-h3 tabular-nums">{count}</dd>
              </div>
            ))}
          </dl>
          {docsByCategory.map((cat) => (
            <Card key={cat.value} className="p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">{language === 'ru' ? cat.label_ru : cat.label_en}</h3>
                <Badge variant={cat.docs.some(document => document.is_current) ? 'default' : 'outline'}>{cat.docs.length}</Badge>
              </div>
              {cat.docs.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t({ en: 'No documents recorded', ru: 'Документов пока нет', th: 'ยังไม่มีเอกสาร' })}</p>
              ) : (
                <div className="space-y-2">
                  {cat.docs.map((doc: ProjectDocument) => {
                    const VIcon = VISIBILITY_OPTIONS.find((v) => v.value === doc.visibility)?.icon || Eye;
                    return (
                      <div key={doc.id} className="flex items-center justify-between p-2 rounded-none bg-muted/30">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline truncate block">
                              {doc.title}
                            </a>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <VIcon className="h-3 w-3" aria-hidden="true" />
                              <span>v{doc.version}</span>
                              <span>{new Date(doc.uploaded_at).toLocaleDateString(language)}</span>
                              <Badge variant={doc.is_current ? 'outline' : 'secondary'}>
                                {doc.is_current
                                  ? t({ en: 'Current version', ru: 'Актуальная версия', th: 'ฉบับปัจจุบัน' })
                                  : t({ en: 'Previous version', ru: 'Предыдущая версия', th: 'ฉบับก่อนหน้า' })}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {doc.is_current && <div className="flex gap-1">
                          <Button size="icon" variant="ghost" aria-label={t({ en: 'Upload a new version', ru: 'Загрузить новую версию', th: 'อัปโหลดฉบับใหม่' })} onClick={() => { setCategory(doc.category); setTitle(doc.title); setVisibility(doc.visibility); setReplacesId(doc.id); setOpen(true); }}>
                            <Upload className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button size="icon" variant="ghost" aria-label={t({ en: 'Delete document', ru: 'Удалить документ', th: 'ลบเอกสาร' })} disabled={del.isPending} onClick={() => del.mutate({ id: doc.id, projectId })}>
                            <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                          </Button>
                        </div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
