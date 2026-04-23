import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVaultFiles, useUploadVaultFile, useDeleteVaultFile, useShareVaultFile, useGetSignedUrl, DOC_TYPES, VaultFile } from '@/hooks/useOwnerVault';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Upload, FolderOpen, FileText, Image, File, Trash2, Share2, Download,
  Search, Plus, Copy, Check, Building2, Filter,
} from 'lucide-react';

function formatFileSize(bytes: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mime: string | null) {
  if (!mime) return File;
  if (mime.startsWith('image/')) return Image;
  if (mime.includes('pdf') || mime.includes('document')) return FileText;
  return File;
}

export default function OwnerVaultPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [selectedDocType, setSelectedDocType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('other');
  const [uploadPropertyId, setUploadPropertyId] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: properties } = useQuery({
    queryKey: ['owner-properties-list', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('properties')
        .select('id, title')
        .eq('owner_id', user!.id)
        .order('title');
      return data || [];
    },
    enabled: !!user,
  });

  const { data: files = [], isLoading } = useVaultFiles(
    selectedProperty !== 'all' ? selectedProperty : undefined,
    selectedDocType,
  );

  const uploadMut = useUploadVaultFile();
  const deleteMut = useDeleteVaultFile();
  const shareMut = useShareVaultFile();
  const signedUrlMut = useGetSignedUrl();

  const filteredFiles = files.filter((f) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return f.file_name.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q);
  });

  // Group by property
  const grouped = new Map<string, VaultFile[]>();
  for (const f of filteredFiles) {
    const key = f.property_id || '__general';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(f);
  }

  const propertyName = (id: string) => properties?.find((p) => p.id === id)?.title || (isRu ? 'Без объекта' : 'General');

  const handleUpload = async () => {
    const input = fileRef.current;
    if (!input?.files?.length) {
      toast.error(isRu ? 'Выберите файлы' : 'Select files');
      return;
    }
    for (const file of Array.from(input.files)) {
      try {
        await uploadMut.mutateAsync({
          file,
          propertyId: uploadPropertyId || undefined,
          docType: uploadDocType,
          description: uploadDescription,
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Upload failed';
        toast.error(`${file.name}: ${msg}`);
      }
    }
    toast.success(isRu ? 'Файлы загружены' : 'Files uploaded');
    setUploadOpen(false);
    setUploadDescription('');
    if (input) input.value = '';
  };

  const handleShare = async (file: VaultFile) => {
    try {
      const token = await shareMut.mutateAsync({ fileId: file.id });
      const shareUrl = `${window.location.origin}/mc/vault/shared/${token}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedToken(file.id);
      toast.success(isRu ? 'Ссылка скопирована (7 дней)' : 'Share link copied (7 days)');
      setTimeout(() => setCopiedToken(null), 3000);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const handleDownload = async (file: VaultFile) => {
    try {
      const url = await signedUrlMut.mutateAsync(file.file_path);
      window.open(url, '_blank');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const handleDelete = async (file: VaultFile) => {
    if (!confirm(isRu ? `Удалить ${file.file_name}?` : `Delete ${file.file_name}?`)) return;
    try {
      await deleteMut.mutateAsync(file);
      toast.success(isRu ? 'Удалено' : 'Deleted');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{isRu ? 'Хранилище файлов' : 'File Vault'}</h2>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Документы, презентации, DBD — всё в одном месте' : 'Documents, presentations, DBD — all in one place'}
          </p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              {isRu ? 'Загрузить' : 'Upload'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRu ? 'Загрузить файлы' : 'Upload Files'}</DialogTitle>
              <DialogDescription>{isRu ? 'Выберите файлы и укажите категорию' : 'Choose files and select category'}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>{isRu ? 'Файлы' : 'Files'}</Label>
                <Input ref={fileRef} type="file" multiple className="mt-1" />
              </div>
              <div>
                <Label>{isRu ? 'Тип документа' : 'Document type'}</Label>
                <Select value={uploadDocType} onValueChange={setUploadDocType}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((dt) => (
                      <SelectItem key={dt.value} value={dt.value}>
                        {isRu ? dt.labelRu : dt.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isRu ? 'Объект (опционально)' : 'Property (optional)'}</Label>
                <Select value={uploadPropertyId} onValueChange={setUploadPropertyId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={isRu ? 'Общие' : 'General'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{isRu ? 'Без объекта' : 'General'}</SelectItem>
                    {properties?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isRu ? 'Описание' : 'Description'}</Label>
                <Textarea
                  className="mt-1"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder={isRu ? 'Комментарий к файлу...' : 'File notes...'}
                  rows={2}
                />
              </div>
              <Button onClick={handleUpload} disabled={uploadMut.isPending} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                {uploadMut.isPending
                  ? (isRu ? 'Загрузка...' : 'Uploading...')
                  : (isRu ? 'Загрузить' : 'Upload')
                }
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={isRu ? 'Поиск...' : 'Search...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
          <SelectTrigger className="w-[140px]">
            <Building2 className="h-4 w-4 mr-1 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRu ? 'Все объекты' : 'All properties'}</SelectItem>
            {properties?.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Doc type pills */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          <Button
            variant={selectedDocType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDocType('all')}
          >
            {isRu ? 'Все' : 'All'}
          </Button>
          {DOC_TYPES.map((dt) => (
            <Button
              key={dt.value}
              variant={selectedDocType === dt.value ? 'default' : 'outline'}
              size="sm"
              className="whitespace-nowrap"
              onClick={() => setSelectedDocType(dt.value)}
            >
              {isRu ? dt.labelRu : dt.labelEn}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* File list grouped by property */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-none animate-pulse" />
          ))}
        </div>
      ) : filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">{isRu ? 'Нет файлов' : 'No files yet'}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              {isRu ? 'Загрузить первый файл' : 'Upload your first file'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        Array.from(grouped.entries()).map(([propId, propFiles]) => (
          <div key={propId} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">
                {propId === '__general' ? (isRu ? 'Общие документы' : 'General Documents') : propertyName(propId)}
              </h3>
              <Badge variant="secondary" className="text-[10px]">{propFiles.length}</Badge>
            </div>
            <div className="space-y-1.5">
              {propFiles.map((file) => {
                const FileIcon = getFileIcon(file.mime_type);
                const docLabel = DOC_TYPES.find((d) => d.value === file.doc_type);
                return (
                  <Card key={file.id} className="group">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="p-2 rounded-none bg-muted/80">
                        <FileIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.file_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(file.file_size)}</span>
                          {docLabel && <Badge variant="outline" className="text-[10px] py-0">{isRu ? docLabel.labelRu : docLabel.labelEn}</Badge>}
                          {file.share_token && <Badge variant="secondary" className="text-[10px] py-0">🔗 {isRu ? 'Расшарен' : 'Shared'}</Badge>}
                        </div>
                        {file.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{file.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(file)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleShare(file)}>
                          {copiedToken === file.id ? <Check className="h-4 w-4 text-success" /> : <Share2 className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(file)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
