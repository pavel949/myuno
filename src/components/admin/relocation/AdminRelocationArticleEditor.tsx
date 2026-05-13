import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AdminRelocationArticleRow,
  RelocationArticleInput,
  useUpsertRelocationArticle,
} from '@/hooks/admin/useAdminRelocationArticles';
import { RELOCATION_ARTICLE_CATEGORIES } from '@/data/relocationArticles.seed';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: AdminRelocationArticleRow | null;
  knownCategories: string[];
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const empty: RelocationArticleInput = {
  slug: '',
  category: 'visa',
  title_en: '',
  title_ru: '',
  summary_en: '',
  summary_ru: '',
  content_en: '',
  content_ru: '',
  related_route: '',
  sort_order: 0,
  is_published: true,
};

export function AdminRelocationArticleEditor({
  open,
  onOpenChange,
  initial,
  knownCategories,
}: Props) {
  const [form, setForm] = useState<RelocationArticleInput>(empty);
  const [slugTouched, setSlugTouched] = useState(false);
  const upsert = useUpsertRelocationArticle();

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          id: initial.id,
          slug: initial.slug,
          category: initial.category,
          title_en: initial.title_en,
          title_ru: initial.title_ru,
          summary_en: initial.summary_en ?? '',
          summary_ru: initial.summary_ru ?? '',
          content_en: initial.content_en ?? '',
          content_ru: initial.content_ru ?? '',
          related_route: initial.related_route ?? '',
          sort_order: initial.sort_order ?? 0,
          is_published: initial.is_published,
        });
        setSlugTouched(true);
      } else {
        setForm(empty);
        setSlugTouched(false);
      }
    }
  }, [open, initial]);

  const update = <K extends keyof RelocationArticleInput>(k: K, v: RelocationArticleInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onTitleEnChange = (v: string) => {
    update('title_en', v);
    if (!slugTouched && !initial) update('slug', slugify(v));
  };

  const allCategories = Array.from(
    new Set([
      ...RELOCATION_ARTICLE_CATEGORIES.map((c) => c.id),
      ...knownCategories,
    ])
  );

  const handleSave = async () => {
    if (!form.slug || !form.title_en || !form.title_ru || !form.category) return;
    await upsert.mutateAsync({
      ...form,
      related_route: form.related_route?.trim() || null,
    } as RelocationArticleInput);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{initial ? 'Редактировать статью' : 'Новая статья'}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Категория</Label>
              <Select value={form.category} onValueChange={(v) => update('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allCategories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="mt-1"
                placeholder="или новая категория…"
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
              />
            </div>
            <div>
              <Label>Sort order</Label>
              <Input
                type="number"
                value={form.sort_order ?? 0}
                onChange={(e) => update('sort_order', Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update('slug', e.target.value);
              }}
              placeholder="visa-overview"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Title EN</Label>
              <Input value={form.title_en} onChange={(e) => onTitleEnChange(e.target.value)} />
            </div>
            <div>
              <Label>Title RU</Label>
              <Input value={form.title_ru} onChange={(e) => update('title_ru', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Summary EN</Label>
              <Textarea
                rows={3}
                value={form.summary_en ?? ''}
                onChange={(e) => update('summary_en', e.target.value)}
              />
            </div>
            <div>
              <Label>Summary RU</Label>
              <Textarea
                rows={3}
                value={form.summary_ru ?? ''}
                onChange={(e) => update('summary_ru', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Content EN (markdown)</Label>
            <Textarea
              rows={10}
              className="font-mono text-xs"
              value={form.content_en ?? ''}
              onChange={(e) => update('content_en', e.target.value)}
            />
          </div>

          <div>
            <Label>Content RU (markdown)</Label>
            <Textarea
              rows={10}
              className="font-mono text-xs"
              value={form.content_ru ?? ''}
              onChange={(e) => update('content_ru', e.target.value)}
            />
          </div>

          <div>
            <Label>Related route</Label>
            <Input
              value={form.related_route ?? ''}
              onChange={(e) => update('related_route', e.target.value)}
              placeholder="/legal/visa"
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="published" className="cursor-pointer">Опубликовано</Label>
            <Switch
              id="published"
              checked={form.is_published}
              onCheckedChange={(v) => update('is_published', v)}
            />
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={handleSave} disabled={upsert.isPending}>
            {upsert.isPending ? 'Сохраняем…' : 'Сохранить'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
