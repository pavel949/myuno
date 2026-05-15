/**
 * MCCLandingBuilderTab — visual no-code builder for magnet landings.
 * - Pick magnet + slug → edit RU/EN copy + ordered blocks → upload PDF/hero → publish.
 * - Public route: /l/:slug
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Trash2, ExternalLink, Loader2, Globe, ArrowUp, ArrowDown,
  FileText, Image as ImageIcon, Eye, Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useMagnetLandings, useUpsertMagnetLanding, useDeleteMagnetLanding,
  uploadMagnetLandingAsset, emptyBlock,
  type MagnetLanding, type LandingBlock, type LandingBlockType,
} from '@/hooks/useMagnetLandings';
import { useLeadMagnets } from '@/hooks/useLeadMagnets';
import { MagnetLandingRenderer } from '@/components/magnets/MagnetLandingRenderer';

const BLOCK_TYPES: { type: LandingBlockType; label_ru: string; label_en: string }[] = [
  { type: 'hero', label_ru: 'Hero блок', label_en: 'Hero block' },
  { type: 'benefits', label_ru: 'Преимущества', label_en: 'Benefits' },
  { type: 'checklist', label_ru: 'Чеклист', label_en: 'Checklist' },
  { type: 'pdf_preview', label_ru: 'Превью PDF', label_en: 'PDF preview' },
  { type: 'testimonial', label_ru: 'Отзыв', label_en: 'Testimonial' },
  { type: 'faq', label_ru: 'FAQ', label_en: 'FAQ' },
  { type: 'rich_text', label_ru: 'Текст', label_en: 'Rich text' },
  { type: 'cta', label_ru: 'Финальный CTA', label_en: 'Final CTA' },
];

const emptyLanding = (): Partial<MagnetLanding> => ({
  slug: '',
  magnet_slug: null,
  status: 'draft',
  title_ru: '',
  title_en: '',
  subtitle_ru: '',
  subtitle_en: '',
  seo_title_ru: '',
  seo_title_en: '',
  seo_description_ru: '',
  seo_description_en: '',
  hero_image_url: '',
  pdf_url: '',
  blocks: [],
  theme: {},
});

export function MCCLandingBuilderTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: landings, isLoading } = useMagnetLandings();
  const { data: magnets } = useLeadMagnets();
  const upsert = useUpsertMagnetLanding();
  const del = useDeleteMagnetLanding();

  const [editing, setEditing] = React.useState<Partial<MagnetLanding> | null>(null);
  const [previewing, setPreviewing] = React.useState<MagnetLanding | null>(null);

  const save = async (publish = false) => {
    if (!editing) return;
    if (!editing.slug || !editing.title_ru) {
      toast.error(isRu ? 'Заполни slug и заголовок RU' : 'Slug and RU title required');
      return;
    }
    try {
      const payload = {
        ...editing,
        status: publish ? ('published' as const) : (editing.status as 'draft' | 'published' | 'archived'),
        slug: editing.slug.trim(),
      };
      const res = await upsert.mutateAsync(payload);
      toast.success(
        publish
          ? (isRu ? 'Лендинг опубликован' : 'Landing published')
          : (isRu ? 'Сохранено' : 'Saved'),
      );
      setEditing(res);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async (l: MagnetLanding) => {
    if (!confirm(isRu ? `Удалить «${l.title_ru || l.slug}»?` : `Delete "${l.title_en || l.slug}"?`)) return;
    try {
      await del.mutateAsync(l.id);
      toast.success(isRu ? 'Удалено' : 'Deleted');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {isRu ? 'Конструктор лендингов магнитов' : 'Magnet Landing Builder'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu
              ? 'Собирай страницы под каждый магнит без кода. Публичный URL: /l/:slug'
              : 'Build pages per magnet, no code. Public URL: /l/:slug'}
          </p>
        </div>
        <Button onClick={() => setEditing(emptyLanding())} size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> {isRu ? 'Новый лендинг' : 'New landing'}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground p-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> {isRu ? 'Загрузка…' : 'Loading…'}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(landings ?? []).map((l) => (
            <Card key={l.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm font-semibold truncate">
                      {l.title_ru || l.slug}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">/l/{l.slug}</p>
                  </div>
                  <Badge variant={l.status === 'published' ? 'default' : 'secondary'} className="text-[10px]">
                    {l.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {l.magnet_slug && <Badge variant="outline">→ {l.magnet_slug}</Badge>}
                  <Badge variant="outline">{(l.blocks ?? []).length} blocks</Badge>
                  {l.pdf_url && <Badge variant="outline">PDF</Badge>}
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                    onClick={() => setEditing(l)}>
                    {isRu ? 'Открыть' : 'Open'}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1"
                    onClick={() => setPreviewing(l)}>
                    <Eye className="h-3 w-3" />
                  </Button>
                  <a href={`/l/${l.slug}`} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                  <Button size="sm" variant="ghost"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDelete(l)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(landings ?? []).length === 0 && (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                {isRu ? 'Пока нет лендингов. Создай первый.' : 'No landings yet. Create one.'}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Builder sheet */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto p-0">
          <SheetHeader className="px-5 py-4 border-b sticky top-0 bg-background z-10">
            <SheetTitle className="flex items-center justify-between gap-2">
              <span>{editing?.id ? (isRu ? 'Редактор' : 'Editor') : (isRu ? 'Новый лендинг' : 'New landing')}</span>
              <div className="flex gap-2">
                {editing?.slug && (
                  <a href={`/l/${editing.slug}`} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="gap-1">
                      <ExternalLink className="h-3 w-3" /> {isRu ? 'Открыть' : 'Open'}
                    </Button>
                  </a>
                )}
                <Button size="sm" variant="outline" onClick={() => save(false)} disabled={upsert.isPending}>
                  {isRu ? 'Сохранить' : 'Save draft'}
                </Button>
                <Button size="sm" onClick={() => save(true)} disabled={upsert.isPending}>
                  {upsert.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                  {isRu ? 'Опубликовать' : 'Publish'}
                </Button>
              </div>
            </SheetTitle>
          </SheetHeader>

          {editing && (
            <Tabs defaultValue="basics" className="px-5 py-4">
              <TabsList>
                <TabsTrigger value="basics">{isRu ? 'Основное' : 'Basics'}</TabsTrigger>
                <TabsTrigger value="blocks">{isRu ? 'Блоки' : 'Blocks'} ({(editing.blocks ?? []).length})</TabsTrigger>
                <TabsTrigger value="assets">{isRu ? 'Файлы' : 'Assets'}</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
              </TabsList>

              <TabsContent value="basics" className="space-y-3 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Slug *</Label>
                    <Input
                      value={editing.slug ?? ''}
                      onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                      placeholder="phuket-buyer-guide"
                      className="font-mono"
                      disabled={!!editing.id}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">/l/{editing.slug || '...'}</p>
                  </div>
                  <div>
                    <Label className="text-xs">{isRu ? 'Лид-магнит' : 'Lead magnet'}</Label>
                    <Select
                      value={editing.magnet_slug ?? '__none'}
                      onValueChange={(v) => setEditing({ ...editing, magnet_slug: v === '__none' ? null : v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">— {isRu ? 'без магнита' : 'no magnet'} —</SelectItem>
                        {(magnets ?? []).filter((m) => m.is_active).map((m) => (
                          <SelectItem key={m.id} value={m.slug}>{m.title_ru} ({m.slug})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Title RU *" value={editing.title_ru ?? ''} onChange={(v) => setEditing({ ...editing, title_ru: v })} />
                  <Field label="Title EN" value={editing.title_en ?? ''} onChange={(v) => setEditing({ ...editing, title_en: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Subtitle RU" value={editing.subtitle_ru ?? ''} onChange={(v) => setEditing({ ...editing, subtitle_ru: v })} textarea />
                  <Field label="Subtitle EN" value={editing.subtitle_en ?? ''} onChange={(v) => setEditing({ ...editing, subtitle_en: v })} textarea />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    checked={editing.status === 'published'}
                    onCheckedChange={(v) => setEditing({ ...editing, status: v ? 'published' : 'draft' })}
                  />
                  <Label className="text-sm">{isRu ? 'Опубликован' : 'Published'}</Label>
                </div>
              </TabsContent>

              <TabsContent value="blocks" className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-1.5 p-3 border border-dashed rounded">
                  <span className="text-xs text-muted-foreground self-center mr-1">{isRu ? 'Добавить блок:' : 'Add block:'}</span>
                  {BLOCK_TYPES.map((bt) => (
                    <Button
                      key={bt.type}
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setEditing({
                        ...editing,
                        blocks: [...(editing.blocks ?? []), emptyBlock(bt.type)],
                      })}
                    >
                      <Plus className="h-3 w-3 mr-1" />{isRu ? bt.label_ru : bt.label_en}
                    </Button>
                  ))}
                </div>
                <div className="space-y-3">
                  {(editing.blocks ?? []).map((b, idx) => (
                    <BlockEditor
                      key={b.id}
                      block={b}
                      index={idx}
                      total={(editing.blocks ?? []).length}
                      onChange={(updated) => {
                        const next = [...(editing.blocks ?? [])];
                        next[idx] = updated;
                        setEditing({ ...editing, blocks: next });
                      }}
                      onMove={(dir) => {
                        const next = [...(editing.blocks ?? [])];
                        const j = idx + dir;
                        if (j < 0 || j >= next.length) return;
                        [next[idx], next[j]] = [next[j], next[idx]];
                        setEditing({ ...editing, blocks: next });
                      }}
                      onRemove={() => {
                        const next = (editing.blocks ?? []).filter((_, i) => i !== idx);
                        setEditing({ ...editing, blocks: next });
                      }}
                      isRu={isRu}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="assets" className="mt-4 space-y-4">
                <AssetField
                  label={isRu ? 'Hero изображение' : 'Hero image'}
                  icon={ImageIcon}
                  url={editing.hero_image_url ?? ''}
                  onUrlChange={(v) => setEditing({ ...editing, hero_image_url: v })}
                  accept="image/*"
                  slug={editing.slug ?? 'unsaved'}
                  isRu={isRu}
                />
                <AssetField
                  label="PDF"
                  icon={FileText}
                  url={editing.pdf_url ?? ''}
                  onUrlChange={(v) => setEditing({ ...editing, pdf_url: v })}
                  accept="application/pdf"
                  slug={editing.slug ?? 'unsaved'}
                  isRu={isRu}
                />
              </TabsContent>

              <TabsContent value="seo" className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="SEO title RU" value={editing.seo_title_ru ?? ''} onChange={(v) => setEditing({ ...editing, seo_title_ru: v })} />
                  <Field label="SEO title EN" value={editing.seo_title_en ?? ''} onChange={(v) => setEditing({ ...editing, seo_title_en: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="SEO description RU" value={editing.seo_description_ru ?? ''} onChange={(v) => setEditing({ ...editing, seo_description_ru: v })} textarea />
                  <Field label="SEO description EN" value={editing.seo_description_en ?? ''} onChange={(v) => setEditing({ ...editing, seo_description_en: v })} textarea />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>

      {/* Preview sheet */}
      <Sheet open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)}>
        <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto p-0">
          <SheetHeader className="px-5 py-3 border-b sticky top-0 bg-background z-10">
            <SheetTitle>{isRu ? 'Превью' : 'Preview'}: /l/{previewing?.slug}</SheetTitle>
          </SheetHeader>
          {previewing && <MagnetLandingRenderer landing={previewing} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({
  label, value, onChange, textarea,
}: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      {textarea ? (
        <Textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function AssetField({
  label, icon: Icon, url, onUrlChange, accept, slug, isRu,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
  onUrlChange: (v: string) => void;
  accept: string;
  slug: string;
  isRu: boolean;
}) {
  const [uploading, setUploading] = React.useState(false);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const publicUrl = await uploadMagnetLandingAsset(file, slug || 'unassigned');
      onUrlChange(publicUrl);
      toast.success(isRu ? 'Загружено' : 'Uploaded');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="space-y-2 border p-3">
      <Label className="text-sm flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</Label>
      <div className="flex gap-2">
        <Input value={url} onChange={(e) => onUrlChange(e.target.value)} placeholder="https://..." />
        <label className="inline-flex">
          <input type="file" accept={accept} hidden onChange={handleFile} />
          <Button asChild size="sm" variant="outline" disabled={uploading}>
            <span>
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : (isRu ? 'Загрузить' : 'Upload')}
            </span>
          </Button>
        </label>
        {url && (
          <a href={url} target="_blank" rel="noreferrer">
            <Button size="sm" variant="ghost"><ExternalLink className="h-3 w-3" /></Button>
          </a>
        )}
      </div>
    </div>
  );
}

function BlockEditor({
  block, index, total, onChange, onMove, onRemove, isRu,
}: {
  block: LandingBlock;
  index: number;
  total: number;
  onChange: (b: LandingBlock) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  isRu: boolean;
}) {
  const meta = BLOCK_TYPES.find((b) => b.type === block.type);
  const setProp = (key: string, value: unknown) =>
    onChange({ ...block, props: { ...block.props, [key]: value } });

  const setItem = (listKey: string, idx: number, patch: Record<string, unknown>) => {
    const list = (block.props[listKey] as Record<string, unknown>[]) ?? [];
    const next = [...list];
    next[idx] = { ...next[idx], ...patch };
    setProp(listKey, next);
  };
  const addItem = (listKey: string, item: Record<string, unknown>) => {
    const list = (block.props[listKey] as Record<string, unknown>[]) ?? [];
    setProp(listKey, [...list, item]);
  };
  const removeItem = (listKey: string, idx: number) => {
    const list = (block.props[listKey] as Record<string, unknown>[]) ?? [];
    setProp(listKey, list.filter((_, i) => i !== idx));
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">{index + 1}</Badge>
          <CardTitle className="text-sm">{isRu ? meta?.label_ru : meta?.label_en} <code className="text-[10px] text-muted-foreground ml-1">{block.type}</code></CardTitle>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" disabled={index === 0} onClick={() => onMove(-1)}>
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" disabled={index === total - 1} onClick={() => onMove(1)}>
            <ArrowDown className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={onRemove}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {block.type === 'hero' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Eyebrow RU" value={(block.props.eyebrow_ru as string) ?? ''} onChange={(v) => setProp('eyebrow_ru', v)} />
              <Field label="Eyebrow EN" value={(block.props.eyebrow_en as string) ?? ''} onChange={(v) => setProp('eyebrow_en', v)} />
              <Field label="Heading RU" value={(block.props.heading_ru as string) ?? ''} onChange={(v) => setProp('heading_ru', v)} />
              <Field label="Heading EN" value={(block.props.heading_en as string) ?? ''} onChange={(v) => setProp('heading_en', v)} />
              <Field label="CTA label RU" value={(block.props.cta_label_ru as string) ?? ''} onChange={(v) => setProp('cta_label_ru', v)} />
              <Field label="CTA label EN" value={(block.props.cta_label_en as string) ?? ''} onChange={(v) => setProp('cta_label_en', v)} />
            </div>
          </>
        )}

        {block.type === 'benefits' && (
          <ListEditor
            items={(block.props.items as Record<string, string>[]) ?? []}
            renderItem={(it, i) => (
              <div className="grid grid-cols-2 gap-2">
                <Field label="Title RU" value={it.title_ru ?? ''} onChange={(v) => setItem('items', i, { title_ru: v })} />
                <Field label="Title EN" value={it.title_en ?? ''} onChange={(v) => setItem('items', i, { title_en: v })} />
                <Field label="Desc RU" value={it.desc_ru ?? ''} onChange={(v) => setItem('items', i, { desc_ru: v })} textarea />
                <Field label="Desc EN" value={it.desc_en ?? ''} onChange={(v) => setItem('items', i, { desc_en: v })} textarea />
              </div>
            )}
            onAdd={() => addItem('items', { title_ru: '', title_en: '', desc_ru: '', desc_en: '' })}
            onRemove={(i) => removeItem('items', i)}
            addLabel={isRu ? 'Добавить пункт' : 'Add item'}
          />
        )}

        {block.type === 'checklist' && (
          <ListEditor
            items={(block.props.items as Record<string, string>[]) ?? []}
            renderItem={(it, i) => (
              <div className="grid grid-cols-2 gap-2">
                <Field label="RU" value={it.ru ?? ''} onChange={(v) => setItem('items', i, { ru: v })} />
                <Field label="EN" value={it.en ?? ''} onChange={(v) => setItem('items', i, { en: v })} />
              </div>
            )}
            onAdd={() => addItem('items', { ru: '', en: '' })}
            onRemove={(i) => removeItem('items', i)}
            addLabel={isRu ? 'Добавить' : 'Add'}
          />
        )}

        {block.type === 'pdf_preview' && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Caption RU" value={(block.props.caption_ru as string) ?? ''} onChange={(v) => setProp('caption_ru', v)} />
            <Field label="Caption EN" value={(block.props.caption_en as string) ?? ''} onChange={(v) => setProp('caption_en', v)} />
            <p className="text-xs text-muted-foreground col-span-2">
              {isRu ? 'Использует PDF из вкладки «Файлы».' : 'Uses PDF from Assets tab.'}
            </p>
          </div>
        )}

        {block.type === 'testimonial' && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Quote RU" value={(block.props.quote_ru as string) ?? ''} onChange={(v) => setProp('quote_ru', v)} textarea />
            <Field label="Quote EN" value={(block.props.quote_en as string) ?? ''} onChange={(v) => setProp('quote_en', v)} textarea />
            <Field label="Author" value={(block.props.author as string) ?? ''} onChange={(v) => setProp('author', v)} />
            <Field label="Role RU" value={(block.props.role_ru as string) ?? ''} onChange={(v) => setProp('role_ru', v)} />
            <Field label="Role EN" value={(block.props.role_en as string) ?? ''} onChange={(v) => setProp('role_en', v)} />
          </div>
        )}

        {block.type === 'faq' && (
          <ListEditor
            items={(block.props.items as Record<string, string>[]) ?? []}
            renderItem={(it, i) => (
              <div className="grid grid-cols-2 gap-2">
                <Field label="Q RU" value={it.q_ru ?? ''} onChange={(v) => setItem('items', i, { q_ru: v })} />
                <Field label="Q EN" value={it.q_en ?? ''} onChange={(v) => setItem('items', i, { q_en: v })} />
                <Field label="A RU" value={it.a_ru ?? ''} onChange={(v) => setItem('items', i, { a_ru: v })} textarea />
                <Field label="A EN" value={it.a_en ?? ''} onChange={(v) => setItem('items', i, { a_en: v })} textarea />
              </div>
            )}
            onAdd={() => addItem('items', { q_ru: '', q_en: '', a_ru: '', a_en: '' })}
            onRemove={(i) => removeItem('items', i)}
            addLabel={isRu ? 'Добавить вопрос' : 'Add question'}
          />
        )}

        {block.type === 'rich_text' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Body RU</Label>
              <Textarea rows={6} value={(block.props.body_ru as string) ?? ''} onChange={(e) => setProp('body_ru', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Body EN</Label>
              <Textarea rows={6} value={(block.props.body_en as string) ?? ''} onChange={(e) => setProp('body_en', e.target.value)} />
            </div>
          </div>
        )}

        {block.type === 'cta' && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Heading RU" value={(block.props.heading_ru as string) ?? ''} onChange={(v) => setProp('heading_ru', v)} />
            <Field label="Heading EN" value={(block.props.heading_en as string) ?? ''} onChange={(v) => setProp('heading_en', v)} />
            <Field label="Label RU" value={(block.props.label_ru as string) ?? ''} onChange={(v) => setProp('label_ru', v)} />
            <Field label="Label EN" value={(block.props.label_en as string) ?? ''} onChange={(v) => setProp('label_en', v)} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ListEditor<T extends Record<string, unknown>>({
  items, renderItem, onAdd, onRemove, addLabel,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onAdd: () => void;
  onRemove: (index: number) => void;
  addLabel: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="border p-2 relative">
          <Button size="sm" variant="ghost" className="absolute top-1 right-1 h-6 w-6 p-0 text-destructive"
            onClick={() => onRemove(i)}>
            <Trash2 className="h-3 w-3" />
          </Button>
          {renderItem(it, i)}
        </div>
      ))}
      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onAdd}>
        <Plus className="h-3 w-3" /> {addLabel}
      </Button>
    </div>
  );
}
