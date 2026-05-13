import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  AdminRelocationArticleRow,
  useAdminRelocationArticlesList,
  useDeleteRelocationArticle,
  useTogglePublishRelocationArticle,
} from '@/hooks/admin/useAdminRelocationArticles';
import { Surface } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { AdminRelocationArticleEditor } from '@/components/admin/relocation/AdminRelocationArticleEditor';
import { AdminRelocationCategoriesPanel } from '@/components/admin/relocation/AdminRelocationCategoriesPanel';

export default function AdminRelocationArticles() {
  const { data: articles = [], isLoading } = useAdminRelocationArticlesList();
  const togglePublish = useTogglePublishRelocationArticle();
  const del = useDeleteRelocationArticle();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRelocationArticleRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminRelocationArticleRow | null>(null);

  const knownCategories = useMemo(
    () => Array.from(new Set(articles.map((a) => a.category))).sort(),
    [articles]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      if (category !== 'all' && a.category !== category) return false;
      if (!q) return true;
      return (
        a.slug.toLowerCase().includes(q) ||
        a.title_ru.toLowerCase().includes(q) ||
        a.title_en.toLowerCase().includes(q)
      );
    });
  }, [articles, search, category]);

  const openCreate = () => { setEditing(null); setEditorOpen(true); };
  const openEdit = (a: AdminRelocationArticleRow) => { setEditing(a); setEditorOpen(true); };

  return (
    <div className="container mx-auto px-4 py-6 space-y-4 max-w-6xl">
      <Helmet><title>Relocation Articles · Admin</title></Helmet>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Relocation Articles</h1>
          <p className="text-sm text-muted-foreground">CMS для гайдов по переезду</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Новая статья
        </Button>
      </div>

      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles">Статьи ({articles.length})</TabsTrigger>
          <TabsTrigger value="categories">Категории</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-3">
          <Surface variant="card" padding="md" radius="xl">
            <div className="flex gap-2 flex-wrap">
              <Input
                placeholder="Поиск по slug или заголовку…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  {knownCategories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Surface>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Surface variant="card" padding="md" radius="xl" className="text-center text-muted-foreground">
              Статей не найдено
            </Surface>
          ) : (
            <div className="space-y-2">
              {filtered.map((a) => (
                <Surface key={a.id} variant="card" padding="md" radius="xl">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{a.title_ru}</span>
                        <Badge variant="outline">{a.category}</Badge>
                        {!a.is_published && <Badge variant="secondary">draft</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                        <code>{a.slug}</code>
                        <span>·</span>
                        <span>sort {a.sort_order ?? 0}</span>
                        {a.related_route && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              {a.related_route}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Pub</span>
                        <Switch
                          checked={a.is_published}
                          disabled={togglePublish.isPending}
                          onCheckedChange={(v) =>
                            togglePublish.mutate({ id: a.id, is_published: v })
                          }
                        />
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDelete(a)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Surface>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories">
          <AdminRelocationCategoriesPanel articles={articles} />
        </TabsContent>
      </Tabs>

      <AdminRelocationArticleEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initial={editing}
        knownCategories={knownCategories}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить статью?</AlertDialogTitle>
            <AlertDialogDescription>
              «{confirmDelete?.title_ru}» ({confirmDelete?.slug}) будет удалена безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmDelete) {
                  await del.mutateAsync(confirmDelete.id);
                  setConfirmDelete(null);
                }
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
