import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Brain, Upload, Trash2, Search, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type KnowledgeDoc = {
  id: string;
  title: string;
  content: string;
  source: string | null;
  lang: string;
  tags: string[];
  is_active: boolean;
  chunk_index: number;
  parent_id: string | null;
  token_count: number | null;
  created_at: string;
};

type SearchMatch = {
  id: string;
  title: string;
  content: string;
  source: string | null;
  similarity: number;
};

export default function AdminAIKnowledge() {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [lang, setLang] = useState<'ru' | 'en'>('ru');
  const [uploading, setUploading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchMatch[] | null>(null);
  const [searching, setSearching] = useState(false);

  const { data: docs, isLoading } = useQuery({
    queryKey: ['ai-knowledge-docs'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('ai_knowledge_documents')
        .select('id,title,content,source,lang,tags,is_active,chunk_index,parent_id,token_count,created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as KnowledgeDoc[];
    },
  });

  // Group by parent_id (or self) — show parent rows only
  const parents = (docs ?? []).filter((d) => d.parent_id === null);
  const chunksByParent = (docs ?? []).reduce<Record<string, KnowledgeDoc[]>>((acc, d) => {
    const pid = d.parent_id ?? d.id;
    (acc[pid] ||= []).push(d);
    return acc;
  }, {});

  const handleFileRead = async (file: File) => {
    const text = await file.text();
    setContent(text);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
    if (!source) setSource(file.name);
  };

  const handleUpload = async () => {
    if (!title.trim() || content.trim().length < 10) {
      toast.error('Заполните название и содержимое (мин. 10 символов)');
      return;
    }
    setUploading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-knowledge-ingest', {
        body: {
          title: title.trim(),
          content: content.trim(),
          source: source.trim() || null,
          lang,
          tags: tagsStr.split(',').map((t) => t.trim()).filter(Boolean),
        },
      });
      if (error) throw error;
      toast.success(`Загружено: ${data.chunks} чанк(ов)`);
      setTitle(''); setContent(''); setSource(''); setTagsStr('');
      qc.invalidateQueries({ queryKey: ['ai-knowledge-docs'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (parentId: string) => {
      // Delete parent — children cascade via FK
      const ids = chunksByParent[parentId]?.map((d) => d.id) ?? [parentId];
      const { error } = await (supabase as any)
        .from('ai_knowledge_documents')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Документ удалён');
      qc.invalidateQueries({ queryKey: ['ai-knowledge-docs'] });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Ошибка удаления'),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ parentId, value }: { parentId: string; value: boolean }) => {
      const ids = chunksByParent[parentId]?.map((d) => d.id) ?? [parentId];
      const { error } = await (supabase as any)
        .from('ai_knowledge_documents')
        .update({ is_active: value })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-knowledge-docs'] }),
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-knowledge-search', {
        body: { query: searchQuery.trim(), match_count: 5, similarity_threshold: 0.35 },
      });
      if (error) throw error;
      setSearchResults(data?.matches ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка поиска');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <Brain className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">AI Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">
            Документы здесь автоматически используются AI-ассистентом для ответов (RAG)
          </p>
        </div>
      </div>

      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-2" />Загрузка</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="h-4 w-4 mr-2" />Документы ({parents.length})</TabsTrigger>
          <TabsTrigger value="test"><Search className="h-4 w-4 mr-2" />Тест поиска</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Новый документ</CardTitle>
              <CardDescription>
                Текст автоматически разобьётся на чанки (~1200 символов) и проиндексируется через embeddings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kb-title">Название *</Label>
                  <Input id="kb-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="FAQ по визам" />
                </div>
                <div>
                  <Label htmlFor="kb-source">Источник (URL/файл)</Label>
                  <Input id="kb-source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="https://myuno.app/visa или visa-faq.md" />
                </div>
                <div>
                  <Label htmlFor="kb-tags">Теги (через запятую)</Label>
                  <Input id="kb-tags" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="visa, legal, thailand" />
                </div>
                <div>
                  <Label htmlFor="kb-lang">Язык</Label>
                  <select
                    id="kb-lang"
                    value={lang}
                    onChange={(e) => setLang(e.target.value as 'ru' | 'en')}
                    className="w-full h-10 px-3 border rounded-md bg-background"
                  >
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="kb-file">Загрузить файл (.txt, .md)</Label>
                <Input
                  id="kb-file"
                  type="file"
                  accept=".txt,.md,.markdown,text/plain"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileRead(f);
                  }}
                />
              </div>

              <div>
                <Label htmlFor="kb-content">Содержимое *</Label>
                <Textarea
                  id="kb-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  placeholder="Вставьте текст или загрузите файл выше..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {content.length} символов · ~{Math.ceil(content.length / 1200)} чанк(ов)
                </p>
              </div>

              <Button onClick={handleUpload} disabled={uploading} className="w-full">
                {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Индексация...</> : <><Upload className="h-4 w-4 mr-2" />Загрузить и проиндексировать</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Загруженные документы</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : parents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Нет документов. Загрузите первый на вкладке «Загрузка».</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Язык</TableHead>
                      <TableHead>Теги</TableHead>
                      <TableHead>Чанков</TableHead>
                      <TableHead>Активен</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parents.map((doc) => {
                      const chunks = chunksByParent[doc.id] ?? [doc];
                      return (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div className="font-medium">{doc.title}</div>
                            {doc.source && <div className="text-xs text-muted-foreground">{doc.source}</div>}
                          </TableCell>
                          <TableCell><Badge variant="outline">{doc.lang}</Badge></TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {doc.tags.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                            </div>
                          </TableCell>
                          <TableCell>{chunks.length}</TableCell>
                          <TableCell>
                            <Switch
                              checked={doc.is_active}
                              onCheckedChange={(v) => toggleActive.mutate({ parentId: doc.id, value: v })}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Удалить "${doc.title}" и все ${chunks.length} чанков?`)) {
                                  deleteMutation.mutate(doc.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Тест семантического поиска</CardTitle>
              <CardDescription>Проверьте, какие чанки AI-ассистент найдёт для конкретного запроса</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Например: как продлить визу?"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              {searchResults !== null && (
                <div className="space-y-3">
                  {searchResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Совпадений не найдено (порог 0.35)</p>
                  ) : (
                    searchResults.map((m, i) => (
                      <Card key={m.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">[{i + 1}] {m.title}</div>
                            <Badge>{(m.similarity * 100).toFixed(1)}%</Badge>
                          </div>
                          {m.source && <div className="text-xs text-muted-foreground mb-2">{m.source}</div>}
                          <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
