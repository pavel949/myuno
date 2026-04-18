/**
 * Project Documents Vault — admin & developer view.
 * Per-category upload + visibility toggle + versioning.
 */
import { useState } from 'react';
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
  const { data: docs = [], isLoading } = useProjectDocuments(projectId);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Документы проекта</h2>
          <p className="text-sm text-muted-foreground">ClearView checklist · версионирование · уровни доступа</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setReplacesId(undefined); setOpen(true); }}>
              <Upload className="w-4 h-4 mr-1" /> Загрузить
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
                      <SelectItem key={c.value} value={c.value}>{c.label_ru}</SelectItem>
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

      {isLoading ? (
        <div className="text-muted-foreground">Загрузка…</div>
      ) : (
        <div className="space-y-4">
          {docsByCategory.map((cat) => (
            <Card key={cat.value} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{cat.label_ru}</h3>
                <Badge variant={cat.docs.length ? 'default' : 'outline'}>{cat.docs.length}</Badge>
              </div>
              {cat.docs.length === 0 ? (
                <div className="text-xs text-muted-foreground">Нет документов</div>
              ) : (
                <div className="space-y-2">
                  {cat.docs.map((doc: ProjectDocument) => {
                    const VIcon = VISIBILITY_OPTIONS.find((v) => v.value === doc.visibility)?.icon || Eye;
                    return (
                      <div key={doc.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline truncate block">
                              {doc.title}
                            </a>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <VIcon className="w-3 h-3" />
                              <span>v{doc.version}</span>
                              <span>·</span>
                              <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => { setCategory(doc.category); setTitle(doc.title); setVisibility(doc.visibility); setReplacesId(doc.id); setOpen(true); }}>
                            <Upload className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => del.mutate({ id: doc.id, projectId })}>
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
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
