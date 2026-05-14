/**
 * MCCMagnetsTab — Admin CRUD for lead magnets + submissions browser.
 * No-code interface for managing the lead-generation catalog (replaces SQL migrations).
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Pencil, Trash2, Copy, ExternalLink, Eye, Loader2, Magnet, FileText, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useLeadMagnets, useUpsertLeadMagnet, useToggleLeadMagnet, useDeleteLeadMagnet,
  useLeadMagnetSubmissions, useUpdateSubmissionStatus,
  MAGNET_TYPES, type LeadMagnet, type MagnetType,
} from '@/hooks/useLeadMagnets';

const TYPE_LABELS_RU: Record<MagnetType, string> = {
  clearview_report: 'ClearView отчёт',
  calculator_save: 'Сохранение калькулятора',
  guide_pdf: 'Гайд (PDF)',
  area_report: 'Отчёт по району',
  watchlist: 'Watchlist',
  prelaunch_alert: 'Pre-launch alert',
  viewing_request: 'Запрос на показ',
  resale_weekly: 'Weekly resale',
  offmarket_access: 'Off-market доступ',
  market_report: 'Market Report',
  newsletter: 'Newsletter',
  other: 'Другое',
};

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'won', 'lost', 'spam'] as const;

const emptyMagnet = (): Partial<LeadMagnet> => ({
  slug: '',
  magnet_type: 'guide_pdf',
  title_ru: '',
  title_en: '',
  description_ru: '',
  description_en: '',
  asset_url: '',
  default_score: 20,
  is_active: true,
});

export function MCCMagnetsTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: magnets, isLoading } = useLeadMagnets();
  const upsert = useUpsertLeadMagnet();
  const toggle = useToggleLeadMagnet();
  const del = useDeleteLeadMagnet();

  const [editing, setEditing] = React.useState<Partial<LeadMagnet> | null>(null);
  const [submissionsFor, setSubmissionsFor] = React.useState<string | null>(null);

  const openNew = () => setEditing(emptyMagnet());
  const openEdit = (m: LeadMagnet) => setEditing({ ...m });

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.slug || !editing.title_ru || !editing.title_en || !editing.magnet_type) {
      toast.error(isRu ? 'Заполни slug, тип и оба заголовка' : 'Slug, type and both titles required');
      return;
    }
    try {
      await upsert.mutateAsync({
        id: editing.id,
        slug: editing.slug.trim(),
        magnet_type: editing.magnet_type as MagnetType,
        title_ru: editing.title_ru.trim(),
        title_en: editing.title_en.trim(),
        description_ru: editing.description_ru || null,
        description_en: editing.description_en || null,
        asset_url: editing.asset_url || null,
        default_score: editing.default_score ?? 20,
        is_active: editing.is_active ?? true,
      });
      toast.success(isRu ? 'Магнит сохранён' : 'Magnet saved');
      setEditing(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async (m: LeadMagnet) => {
    if (!confirm(isRu ? `Удалить «${m.title_ru}»?` : `Delete "${m.title_en}"?`)) return;
    try {
      await del.mutateAsync(m.id);
      toast.success(isRu ? 'Удалено' : 'Deleted');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const copySnippet = (slug: string) => {
    const code = `<MagnetCTA magnetSlug="${slug}" />`;
    navigator.clipboard.writeText(code);
    toast.success(isRu ? 'Сниппет скопирован' : 'Snippet copied');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Magnet className="h-5 w-5 text-primary" />
            {isRu ? 'Лид-магниты' : 'Lead Magnets'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu
              ? 'Каталог магнитов для всей платформы. Используй <MagnetCTA magnetSlug="…" /> для размещения.'
              : 'Platform-wide magnet catalog. Use <MagnetCTA magnetSlug="…" /> to embed.'}
          </p>
        </div>
        <Button onClick={openNew} size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> {isRu ? 'Новый магнит' : 'New magnet'}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground p-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> {isRu ? 'Загрузка…' : 'Loading…'}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(magnets ?? []).map((m) => (
            <Card key={m.id} className={m.is_active ? '' : 'opacity-60'}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm font-semibold truncate">
                      {isRu ? m.title_ru : m.title_en}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                      {m.slug}
                    </p>
                  </div>
                  <Switch
                    checked={m.is_active}
                    onCheckedChange={(v) => toggle.mutate({ id: m.id, is_active: v })}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {TYPE_LABELS_RU[m.magnet_type] ?? m.magnet_type}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    +{m.default_score} pts
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                  {(isRu ? m.description_ru : m.description_en) || '—'}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1"
                    onClick={() => openEdit(m)}>
                    <Pencil className="h-3 w-3" /> {isRu ? 'Изменить' : 'Edit'}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1"
                    onClick={() => copySnippet(m.slug)}>
                    <Copy className="h-3 w-3" /> JSX
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1"
                    onClick={() => setSubmissionsFor(m.slug)}>
                    <Users className="h-3 w-3" /> {isRu ? 'Лиды' : 'Leads'}
                  </Button>
                  {m.asset_url && (
                    <a href={m.asset_url} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1">
                        <ExternalLink className="h-3 w-3" /> PDF
                      </Button>
                    </a>
                  )}
                  <Button size="sm" variant="ghost"
                    className="h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(m)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(magnets ?? []).length === 0 && (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                {isRu ? 'Пока нет магнитов. Создай первый.' : 'No magnets yet. Create one.'}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing?.id
                ? (isRu ? 'Редактировать магнит' : 'Edit magnet')
                : (isRu ? 'Новый магнит' : 'New magnet')}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Slug *</Label>
                  <Input
                    value={editing.slug ?? ''}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    placeholder="clearview-report"
                    className="font-mono"
                    disabled={!!editing.id}
                  />
                </div>
                <div>
                  <Label className="text-xs">{isRu ? 'Тип' : 'Type'} *</Label>
                  <Select
                    value={editing.magnet_type}
                    onValueChange={(v) => setEditing({ ...editing, magnet_type: v as MagnetType })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MAGNET_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{TYPE_LABELS_RU[t]} ({t})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Title RU *</Label>
                  <Input
                    value={editing.title_ru ?? ''}
                    onChange={(e) => setEditing({ ...editing, title_ru: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Title EN *</Label>
                  <Input
                    value={editing.title_en ?? ''}
                    onChange={(e) => setEditing({ ...editing, title_en: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Description RU</Label>
                  <Textarea rows={3}
                    value={editing.description_ru ?? ''}
                    onChange={(e) => setEditing({ ...editing, description_ru: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Description EN</Label>
                  <Textarea rows={3}
                    value={editing.description_en ?? ''}
                    onChange={(e) => setEditing({ ...editing, description_en: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Asset URL (PDF / link)</Label>
                  <Input
                    value={editing.asset_url ?? ''}
                    onChange={(e) => setEditing({ ...editing, asset_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label className="text-xs">Score</Label>
                  <Input type="number"
                    value={editing.default_score ?? 20}
                    onChange={(e) => setEditing({ ...editing, default_score: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={editing.is_active ?? true}
                  onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                />
                <Label className="text-sm">{isRu ? 'Активный' : 'Active'}</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isRu ? 'Сохранить' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submissions dialog */}
      <Dialog open={!!submissionsFor} onOpenChange={(o) => !o && setSubmissionsFor(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isRu ? 'Лиды по магниту' : 'Submissions'}: <code className="text-sm">{submissionsFor}</code>
            </DialogTitle>
          </DialogHeader>
          {submissionsFor && <SubmissionsList magnetSlug={submissionsFor} isRu={isRu} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubmissionsList({ magnetSlug, isRu }: { magnetSlug: string; isRu: boolean }) {
  const { data, isLoading } = useLeadMagnetSubmissions(magnetSlug);
  const updateStatus = useUpdateSubmissionStatus();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-8 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> {isRu ? 'Загрузка…' : 'Loading…'}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground p-8">
        {isRu ? 'Заявок пока нет' : 'No submissions yet'}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((s) => (
        <Card key={s.id}>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <div className="font-medium text-sm">{s.full_name || s.email || s.phone || '—'}</div>
                <div className="text-xs text-muted-foreground space-x-2">
                  {s.email && <span>{s.email}</span>}
                  {s.phone && <span>{s.phone}</span>}
                  {s.whatsapp && <span>WA: {s.whatsapp}</span>}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {new Date(s.created_at).toLocaleString(isRu ? 'ru' : 'en')}
                  {s.utm_source && ` • ${s.utm_source}/${s.utm_medium ?? '-'}`}
                  {s.context_type && ` • ctx: ${s.context_type}/${s.context_slug ?? '-'}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">+{s.score}</Badge>
                <Select
                  value={s.status}
                  onValueChange={(v) => updateStatus.mutate({ id: s.id, status: v })}
                >
                  <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((st) => (
                      <SelectItem key={st} value={st}>{st}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
