/**
 * Developer Portal — Project Workspace (tabbed editor)
 * Replaces the old 5-step wizard with a persistent tabbed workspace.
 * Tabs: Основное | Медиа | Описание | Инвентарь | Документы | Прогресс | Превью
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDeveloperProfile, useProjectUnitsForEditor, useUpsertProjectUnit, useDeleteProjectUnit, useProjectDocuments, useAddProjectDocument, useDeleteProjectDocument, useUpsertProjectUpdate, useDeleteProjectUpdate, DeveloperProjectUnit } from '@/hooks/useDeveloperPortal';
import { useNewbuildProject } from '@/hooks/useNewbuildProjects';
import { useProjectUpdates, ProjectUpdate } from '@/hooks/useProjectUpdates';
import { FloorPlanEditor } from '@/components/newbuilds/FloorPlanEditor';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { AirbnbStyleImageUpload } from '@/components/upload/AirbnbStyleImageUpload';
import { DocumentUpload } from '@/components/upload/DocumentUpload';
import { toast } from 'sonner';
import { ExternalLink, Plus, Pencil, Trash2, Lock, Unlock, Image as ImageIcon, FileText, TrendingUp, Map } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

const AREAS = ['Bang Tao', 'Rawai', 'Kamala', 'Laguna', 'Surin', 'Nai Harn', 'Nai Thon', 'Layan', 'Kata', 'Karon', 'Patong', 'Cherng Talay', 'Other'];
const UNIT_TYPES = ['studio', '1br', '2br', '3br', 'penthouse', 'villa'];
const CURRENCIES = ['THB', 'USD', 'EUR'];
const UNIT_STATUSES = ['available', 'reserved', 'sold'];
const DOC_TYPES = ['brochure', 'floorplan', 'permit', 'contract', 'presentation', 'other'];

const STATUS_BADGE: Record<string, string> = {
  available: 'bg-[hsl(var(--nb-gold)/0.15)] text-[hsl(var(--nb-gold))]',
  reserved: 'bg-amber-500/15 text-amber-400',
  sold: 'bg-[hsl(var(--nb-muted)/0.15)] text-[hsl(var(--nb-muted))]',
};

// ── Unit Modal ──────────────────────────────────────────────────────────────

function UnitModal({ initial, projectId, onClose }: {
  initial?: Partial<DeveloperProjectUnit>;
  projectId: string;
  onClose: () => void;
}) {
  const upsert = useUpsertProjectUnit();
  const [form, setForm] = useState<Partial<DeveloperProjectUnit>>({
    unit_type: 'studio',
    currency: 'THB',
    status: 'available',
    ...initial,
  });
  const u = (k: keyof DeveloperProjectUnit, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.unit_type) { toast.error('Выберите тип юнита'); return; }
    await upsert.mutateAsync({ ...form, project_id: projectId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-lg nb-glass rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="nb-display text-lg text-[hsl(var(--nb-text))]">{initial?.id ? 'Редактировать юнит' : 'Добавить юнит'}</h3>
          <button onClick={onClose} className="text-[hsl(var(--nb-muted))] hover:text-[hsl(var(--nb-text))]">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="nb-label mb-1.5 block">Тип *</label>
            <select value={form.unit_type || ''} onChange={e => u('unit_type', e.target.value)} className="w-full rounded-md bg-[hsl(var(--nb-bg))] border border-[hsl(var(--nb-glass-border))] px-3 py-2 text-sm text-[hsl(var(--nb-text))]">
              {UNIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="nb-label mb-1.5 block">Код юнита</label>
            <Input value={form.unit_code || ''} onChange={e => u('unit_code', e.target.value)} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" placeholder="A-101" />
          </div>
          <div>
            <label className="nb-label mb-1.5 block">Спальни</label>
            <Input type="number" value={form.bedrooms ?? ''} onChange={e => u('bedrooms', e.target.value ? Number(e.target.value) : null)} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" />
          </div>
          <div>
            <label className="nb-label mb-1.5 block">Ванные</label>
            <Input type="number" value={form.bathrooms ?? ''} onChange={e => u('bathrooms', e.target.value ? Number(e.target.value) : null)} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" />
          </div>
          <div>
            <label className="nb-label mb-1.5 block">Площадь (м²)</label>
            <Input type="number" value={form.area_sqm ?? ''} onChange={e => u('area_sqm', e.target.value ? Number(e.target.value) : null)} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" />
          </div>
          <div>
            <label className="nb-label mb-1.5 block">Этаж</label>
            <Input type="number" value={form.floor ?? ''} onChange={e => u('floor', e.target.value ? Number(e.target.value) : null)} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" />
          </div>
          <div>
            <label className="nb-label mb-1.5 block">Цена</label>
            <Input type="number" value={form.price ?? ''} onChange={e => u('price', e.target.value ? Number(e.target.value) : null)} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" />
          </div>
          <div>
            <label className="nb-label mb-1.5 block">Валюта</label>
            <select value={form.currency || 'THB'} onChange={e => u('currency', e.target.value)} className="w-full rounded-md bg-[hsl(var(--nb-bg))] border border-[hsl(var(--nb-glass-border))] px-3 py-2 text-sm text-[hsl(var(--nb-text))]">
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="nb-label mb-1.5 block">Вид</label>
            <Input value={form.view_type || ''} onChange={e => u('view_type', e.target.value)} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" placeholder="sea, garden..." />
          </div>
          <div>
            <label className="nb-label mb-1.5 block">Статус</label>
            <select value={form.status || 'available'} onChange={e => u('status', e.target.value)} className="w-full rounded-md bg-[hsl(var(--nb-bg))] border border-[hsl(var(--nb-glass-border))] px-3 py-2 text-sm text-[hsl(var(--nb-text))]">
              {UNIT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="nb-label mb-1.5 block">Планировка</label>
          <ImageUpload value={form.floor_plan_url || ''} onChange={url => u('floor_plan_url', url)} folder="developer-uploads/floorplans" />
        </div>

        <div>
          <label className="nb-label mb-1.5 block">Заметки</label>
          <textarea value={form.notes || ''} onChange={e => u('notes', e.target.value)} rows={2} className="w-full rounded-md bg-[hsl(var(--nb-bg))] border border-[hsl(var(--nb-glass-border))] px-3 py-2 text-sm text-[hsl(var(--nb-text))]" />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onClose} className="border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-muted))]">Отмена</Button>
          <button className="nb-btn-gold" disabled={upsert.isPending} onClick={save}>{upsert.isPending ? 'Сохранение...' : 'Сохранить'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Update Modal ─────────────────────────────────────────────────────────────

function UpdateModal({ initial, projectId, onClose }: {
  initial?: Partial<ProjectUpdate>;
  projectId: string;
  onClose: () => void;
}) {
  const upsert = useUpsertProjectUpdate();
  const [form, setForm] = useState<Partial<ProjectUpdate>>({
    title: '',
    content: null,
    photo_urls: [],
    progress_at_time: null,
    published_at: new Date().toISOString().slice(0, 10),
    ...initial,
  });
  const u = (k: keyof ProjectUpdate, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.title) { toast.error('Введите заголовок'); return; }
    await upsert.mutateAsync({ ...form, project_id: projectId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-lg nb-glass rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="nb-display text-lg text-[hsl(var(--nb-text))]">{initial?.id ? 'Редактировать обновление' : 'Новое обновление'}</h3>
          <button onClick={onClose} className="text-[hsl(var(--nb-muted))] hover:text-[hsl(var(--nb-text))]">✕</button>
        </div>

        <div>
          <label className="nb-label mb-1.5 block">Заголовок *</label>
          <Input value={form.title || ''} onChange={e => u('title', e.target.value)} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" placeholder="Прогресс строительства — Февраль 2026" />
        </div>
        <div>
          <label className="nb-label mb-1.5 block">Текст</label>
          <textarea value={form.content || ''} onChange={e => u('content', e.target.value)} rows={4} className="w-full rounded-md bg-[hsl(var(--nb-bg))] border border-[hsl(var(--nb-glass-border))] px-3 py-2 text-sm text-[hsl(var(--nb-text))]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="nb-label mb-1.5 block">Прогресс на момент (%)</label>
            <Input type="number" min={0} max={100} value={form.progress_at_time ?? ''} onChange={e => u('progress_at_time', e.target.value ? Number(e.target.value) : null)} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" />
          </div>
          <div>
            <label className="nb-label mb-1.5 block">Дата публикации</label>
            <Input type="date" value={form.published_at?.slice(0, 10) || ''} onChange={e => u('published_at', e.target.value)} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" />
          </div>
        </div>
        <div>
          <label className="nb-label mb-1.5 block">Фотографии</label>
          <AirbnbStyleImageUpload value={form.photo_urls ?? []} onChange={urls => u('photo_urls', urls)} folder="developer-uploads/updates" maxImages={10} />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onClose} className="border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-muted))]">Отмена</Button>
          <button className="nb-btn-gold" disabled={upsert.isPending} onClick={save}>{upsert.isPending ? 'Сохранение...' : 'Сохранить'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Document Row ─────────────────────────────────────────────────────────────

function DocRow({ doc, onDelete }: { doc: { id: string; title: string; document_type: string; file_name: string | null; is_sensitive: boolean | null; file_url: string | null }; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[hsl(var(--nb-glass-border))] last:border-0">
      <FileText className="w-4 h-4 text-[hsl(var(--nb-muted))] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[hsl(var(--nb-text))] truncate">{doc.title}</p>
        <p className="text-xs text-[hsl(var(--nb-muted))]">{doc.file_name || doc.document_type}</p>
      </div>
      <span className="text-xs px-2 py-0.5 rounded bg-[hsl(var(--nb-glass-bg))] text-[hsl(var(--nb-muted))]">{doc.document_type}</span>
      {doc.is_sensitive ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-[hsl(var(--nb-muted))]" />}
      {doc.file_url && <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--nb-gold))] hover:underline text-xs">Открыть</a>}
      <button onClick={onDelete} className="text-[hsl(var(--nb-muted))] hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DeveloperProjectEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: developer } = useDeveloperProfile();
  const { data: existing } = useNewbuildProject(id);

  // project_units for inventory tab
  const { data: units = [] } = useProjectUnitsForEditor(id);
  const deleteUnit = useDeleteProjectUnit();

  // property_documents for documents tab
  const { data: docs = [] } = useProjectDocuments(id);
  const addDoc = useAddProjectDocument();
  const deleteDoc = useDeleteProjectDocument();

  // nb_project_updates for progress tab
  const { data: updates = [] } = useProjectUpdates(id);
  const deleteUpdate = useDeleteProjectUpdate();

  const [saving, setSaving] = useState(false);
  const [unitModal, setUnitModal] = useState<{ open: boolean; initial?: Partial<DeveloperProjectUnit> }>({ open: false });
  const [updateModal, setUpdateModal] = useState<{ open: boolean; initial?: Partial<ProjectUpdate> }>({ open: false });

  // Document upload state
  const [pendingDoc, setPendingDoc] = useState<{ url: string; name: string } | null>(null);
  const [docForm, setDocForm] = useState({ title: '', document_type: 'brochure', is_sensitive: false });

  const [form, setForm] = useState({
    name_en: '',
    name_ru: '',
    tagline: '',
    location_area: '',
    price_from: '' as string | number,
    price_to: '' as string | number,
    total_units: '' as string | number,
    completion_date: '',
    project_status: 'under_construction',
    construction_progress: 0,
    description_en: '',
    description_ru: '',
    cover_image: '',
    video_url: '',
    unit_types: [] as string[],
    gallery_urls: [] as string[],
  });

  // Sync form when existing project loads
  useEffect(() => {
    if (existing) {
      setForm({
        name_en: existing.name_en || '',
        name_ru: existing.name_ru || '',
        tagline: existing.tagline || '',
        location_area: existing.location_area || '',
        price_from: existing.price_from ?? '',
        price_to: existing.price_to ?? '',
        total_units: existing.total_units ?? '',
        completion_date: existing.completion_date || '',
        project_status: existing.project_status || 'under_construction',
        construction_progress: existing.construction_progress || 0,
        description_en: existing.description_en || '',
        description_ru: existing.description_ru || '',
        cover_image: existing.cover_image || '',
        video_url: existing.video_url || '',
        unit_types: existing.unit_types || [],
        gallery_urls: (existing.gallery_urls as string[]) || [],
      });
    }
  }, [existing]);

  const update = (k: string, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!developer || !form.name_en) return;
    setSaving(true);
    try {
      const slug = form.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        name_en: form.name_en,
        name_ru: form.name_ru || form.name_en,
        tagline: form.tagline || null,
        location_area: form.location_area || null,
        district: form.location_area || null,
        price_from: form.price_from !== '' ? Number(form.price_from) : null,
        price_to: form.price_to !== '' ? Number(form.price_to) : null,
        total_units: form.total_units !== '' ? Number(form.total_units) : null,
        completion_date: form.completion_date || null,
        project_status: form.project_status,
        construction_progress: form.construction_progress,
        description_en: form.description_en || null,
        description_ru: form.description_ru || null,
        cover_image: form.cover_image || null,
        video_url: form.video_url || null,
        unit_types: form.unit_types,
        gallery_urls: form.gallery_urls,
        developer_id: developer.id,
        developer_name: developer.name_en,
        slug,
        is_approved: false,
        is_active: true,
      };

      if (id && existing) {
        const { error } = await supabase.from('property_projects').update(payload).eq('id', id);
        if (error) throw error;
        toast.success('Проект обновлён');
      } else {
        const { data: created, error } = await supabase.from('property_projects').insert(payload).select('id').single();
        if (error) throw error;
        toast.success('Проект создан и отправлен на проверку');
        navigate(`/developer-portal/projects/${created.id}`);
        return;
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUploaded = (url: string, fileName: string) => {
    setPendingDoc({ url, name: fileName });
    setDocForm({ title: fileName.replace(/\.[^.]+$/, ''), document_type: 'brochure', is_sensitive: false });
  };

  const saveDocument = async () => {
    if (!pendingDoc || !id) return;
    await addDoc.mutateAsync({
      property_id: id,
      title: docForm.title || pendingDoc.name,
      title_ru: null,
      document_type: docForm.document_type,
      file_url: pendingDoc.url,
      file_name: pendingDoc.name,
      is_sensitive: docForm.is_sensitive,
      description: null,
    });
    setPendingDoc(null);
  };

  const isNewProject = !id;

  return (
    <div className="p-6 lg:p-10 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="nb-display text-2xl text-[hsl(var(--nb-text))]">
          {id ? 'Редактировать проект' : 'Новый проект'}
        </h1>
        <button
          className="nb-btn-gold shrink-0"
          disabled={!form.name_en || saving}
          onClick={handleSave}
        >
          {saving ? 'Сохранение...' : id ? 'Сохранить' : 'Создать проект'}
        </button>
      </div>

      <Tabs defaultValue="основное">
        <TabsList className="flex flex-wrap gap-1 mb-6 bg-[hsl(var(--nb-surface))] border border-[hsl(var(--nb-glass-border))] p-1 rounded-xl h-auto">
          {(['основное', 'медиа', 'описание', 'инвентарь', 'мастер-план', 'документы', 'прогресс', 'превью'] as const).map(tab => (
            <TabsTrigger
              key={tab}
              value={tab}
              disabled={isNewProject && ['инвентарь', 'мастер-план', 'документы', 'прогресс', 'превью'].includes(tab)}
              className={cn(
                'capitalize text-sm px-3 py-1.5 rounded-lg transition-all',
                'data-[state=active]:bg-[hsl(var(--nb-gold)/0.15)] data-[state=active]:text-[hsl(var(--nb-gold))]',
                'text-[hsl(var(--nb-muted))] disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Основное ── */}
        <TabsContent value="основное">
          <div className="nb-glass p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="nb-label mb-2 block">Project Name (EN) *</label>
                <Input value={form.name_en} onChange={e => update('name_en', e.target.value)} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" />
              </div>
              <div>
                <label className="nb-label mb-2 block">Название (RU)</label>
                <Input value={form.name_ru} onChange={e => update('name_ru', e.target.value)} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" />
              </div>
            </div>
            <div>
              <label className="nb-label mb-2 block">Tagline</label>
              <Input value={form.tagline} onChange={e => update('tagline', e.target.value)} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" placeholder="Краткое описание одной строкой" />
            </div>
            <div>
              <label className="nb-label mb-2 block">Район</label>
              <select value={form.location_area} onChange={e => update('location_area', e.target.value)} className="w-full rounded-md bg-[hsl(var(--nb-bg))] border border-[hsl(var(--nb-glass-border))] px-3 py-2 text-sm text-[hsl(var(--nb-text))]">
                <option value="">Выберите район</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="nb-label mb-2 block">Цена от (THB)</label>
                <Input type="number" value={form.price_from} onChange={e => update('price_from', e.target.value)} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" />
              </div>
              <div>
                <label className="nb-label mb-2 block">Цена до (THB)</label>
                <Input type="number" value={form.price_to} onChange={e => update('price_to', e.target.value)} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="nb-label mb-2 block">Всего юнитов</label>
                <Input type="number" value={form.total_units} onChange={e => update('total_units', e.target.value)} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" />
              </div>
              <div>
                <label className="nb-label mb-2 block">Дата сдачи</label>
                <Input type="date" value={form.completion_date} onChange={e => update('completion_date', e.target.value)} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" />
              </div>
            </div>
            <div>
              <label className="nb-label mb-2 block">Типы юнитов</label>
              <div className="flex flex-wrap gap-2">
                {UNIT_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      const arr = form.unit_types.includes(t)
                        ? form.unit_types.filter(x => x !== t)
                        : [...form.unit_types, t];
                      update('unit_types', arr);
                    }}
                    className={cn('px-3 py-1.5 rounded-lg text-sm border transition-all', form.unit_types.includes(t)
                      ? 'bg-[hsl(var(--nb-gold)/0.15)] border-[hsl(var(--nb-gold)/0.4)] text-[hsl(var(--nb-gold))]'
                      : 'border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-muted))]')}
                  >{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="nb-label mb-2 block">Статус</label>
              <select value={form.project_status} onChange={e => update('project_status', e.target.value)} className="w-full rounded-md bg-[hsl(var(--nb-bg))] border border-[hsl(var(--nb-glass-border))] px-3 py-2 text-sm text-[hsl(var(--nb-text))]">
                <option value="under_construction">Строится</option>
                <option value="completed">Сдан</option>
                <option value="upcoming">Скоро</option>
              </select>
            </div>
          </div>
        </TabsContent>

        {/* ── Медиа ── */}
        <TabsContent value="медиа">
          <div className="nb-glass p-6 space-y-6">
            <div>
              <label className="nb-label mb-3 block">Обложка проекта</label>
              <ImageUpload value={form.cover_image} onChange={url => update('cover_image', url)} folder="developer-uploads/covers" />
            </div>
            <div>
              <label className="nb-label mb-3 block">Галерея (до 30 фото)</label>
              <AirbnbStyleImageUpload value={form.gallery_urls} onChange={urls => update('gallery_urls', urls)} folder="developer-uploads/gallery" maxImages={30} />
            </div>
            <div>
              <label className="nb-label mb-2 block">Видео (YouTube / Vimeo)</label>
              <Input value={form.video_url} onChange={e => update('video_url', e.target.value)} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" placeholder="https://youtube.com/watch?v=..." />
            </div>
          </div>
        </TabsContent>

        {/* ── Описание ── */}
        <TabsContent value="описание">
          <div className="nb-glass p-6 space-y-5">
            <div>
              <label className="nb-label mb-2 block">Description (EN)</label>
              <textarea value={form.description_en} onChange={e => update('description_en', e.target.value)} rows={7} className="w-full rounded-md bg-[hsl(var(--nb-bg))] border border-[hsl(var(--nb-glass-border))] px-3 py-2 text-sm text-[hsl(var(--nb-text))]" />
            </div>
            <div>
              <label className="nb-label mb-2 block">Описание (RU)</label>
              <textarea value={form.description_ru} onChange={e => update('description_ru', e.target.value)} rows={7} className="w-full rounded-md bg-[hsl(var(--nb-bg))] border border-[hsl(var(--nb-glass-border))] px-3 py-2 text-sm text-[hsl(var(--nb-text))]" />
            </div>
            <div>
              <label className="nb-label mb-2 block">Прогресс строительства: {form.construction_progress}%</label>
              <input type="range" min={0} max={100} value={form.construction_progress} onChange={e => update('construction_progress', Number(e.target.value))} className="w-full accent-[hsl(var(--nb-gold))]" />
            </div>
          </div>
        </TabsContent>

        {/* ── Инвентарь ── */}
        <TabsContent value="инвентарь">
          {isNewProject ? (
            <div className="nb-glass p-8 text-center text-[hsl(var(--nb-muted))]">
              <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Сохраните проект, чтобы управлять инвентарём</p>
            </div>
          ) : (
            <div className="nb-glass p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[hsl(var(--nb-text))]">Юниты проекта</h2>
                <button className="nb-btn-gold" onClick={() => setUnitModal({ open: true })}>
                  <Plus className="w-4 h-4 mr-1 inline" /> Добавить юнит
                </button>
              </div>

              {units.length === 0 ? (
                <div className="text-center py-10 text-[hsl(var(--nb-muted))]">
                  <p className="mb-3">Нет юнитов. Добавьте первый.</p>
                  <button className="nb-btn-gold" onClick={() => setUnitModal({ open: true })}>Добавить юнит</button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[hsl(var(--nb-glass-border))]">
                        {['Код', 'Тип', 'Спальни', 'Площадь', 'Цена', 'Статус', ''].map(h => (
                          <th key={h} className="text-left p-3 text-[hsl(var(--nb-muted))] font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {units.map(u => (
                        <tr key={u.id} className="border-b border-[hsl(var(--nb-glass-border))] last:border-0">
                          <td className="p-3 text-[hsl(var(--nb-muted))] font-mono text-xs">{u.unit_code || '—'}</td>
                          <td className="p-3 text-[hsl(var(--nb-text))]">{u.unit_type}</td>
                          <td className="p-3 text-[hsl(var(--nb-text-secondary))]">{u.bedrooms ?? '—'}</td>
                          <td className="p-3 text-[hsl(var(--nb-text-secondary))]">{u.area_sqm ? `${u.area_sqm} м²` : '—'}</td>
                          <td className="p-3 text-[hsl(var(--nb-text))] font-mono">{u.price ? `฿${u.price.toLocaleString()}` : '—'}</td>
                          <td className="p-3">
                            <span className={cn('text-xs px-2 py-0.5 rounded-full', STATUS_BADGE[u.status || 'available'] || STATUS_BADGE.available)}>{u.status || 'available'}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => setUnitModal({ open: true, initial: u })} className="text-[hsl(var(--nb-muted))] hover:text-[hsl(var(--nb-gold))]"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => deleteUnit.mutate(u.id)} className="text-[hsl(var(--nb-muted))] hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Мастер-план ── */}
        <TabsContent value="мастер-план">
          {isNewProject ? (
            <div className="nb-glass p-8 text-center text-[hsl(var(--nb-muted))]">
              <Map className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Сохраните проект, чтобы добавить интерактивный план</p>
            </div>
          ) : (
            <div className="nb-glass p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-[hsl(var(--nb-text))]">Digital Master Plan</h2>
                <p className="text-sm text-[hsl(var(--nb-muted))] mt-0.5">
                  Загрузите план этажа и разместите юниты. Покупатели увидят интерактивную карту доступности.
                </p>
              </div>
              <FloorPlanEditor projectId={id!} />
            </div>
          )}
        </TabsContent>

        {/* ── Документы ── */}
        <TabsContent value="документы">
          {isNewProject ? (
            <div className="nb-glass p-8 text-center text-[hsl(var(--nb-muted))]">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Сохраните проект, чтобы загрузить документы</p>
            </div>
          ) : (
            <div className="nb-glass p-6 space-y-5">
              <h2 className="text-lg font-semibold text-[hsl(var(--nb-text))]">Документы проекта</h2>

              {/* Upload */}
              {!pendingDoc ? (
                <DocumentUpload
                  onChange={(url) => {
                    const fileName = url.split('/').pop() ?? 'document';
                    handleDocumentUploaded(url, fileName);
                  }}
                  folder="developer-uploads/documents"
                  placeholder="Загрузить документ"
                />
              ) : (
                <div className="border border-[hsl(var(--nb-gold)/0.3)] rounded-xl p-4 space-y-3 bg-[hsl(var(--nb-gold)/0.05)]">
                  <p className="text-sm text-[hsl(var(--nb-text-secondary))]">Загружен: <span className="text-[hsl(var(--nb-text))]">{pendingDoc.name}</span></p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="nb-label mb-1.5 block">Название</label>
                      <Input value={docForm.title} onChange={e => setDocForm(p => ({ ...p, title: e.target.value }))} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" />
                    </div>
                    <div>
                      <label className="nb-label mb-1.5 block">Тип</label>
                      <select value={docForm.document_type} onChange={e => setDocForm(p => ({ ...p, document_type: e.target.value }))} className="w-full rounded-md bg-[hsl(var(--nb-bg))] border border-[hsl(var(--nb-glass-border))] px-3 py-2 text-sm text-[hsl(var(--nb-text))]">
                        {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-[hsl(var(--nb-text-secondary))] cursor-pointer">
                    <input type="checkbox" checked={docForm.is_sensitive} onChange={e => setDocForm(p => ({ ...p, is_sensitive: e.target.checked }))} className="accent-[hsl(var(--nb-gold))]" />
                    Конфиденциально (требует запроса доступа)
                  </label>
                  <div className="flex gap-2">
                    <button className="nb-btn-gold" disabled={addDoc.isPending} onClick={saveDocument}>
                      {addDoc.isPending ? 'Сохранение...' : 'Сохранить документ'}
                    </button>
                    <Button variant="outline" onClick={() => setPendingDoc(null)} className="border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-muted))]">Отмена</Button>
                  </div>
                </div>
              )}

              {/* List */}
              {docs.length > 0 && (
                <div>
                  {docs.map(doc => (
                    <DocRow
                      key={doc.id}
                      doc={doc}
                      onDelete={() => deleteDoc.mutate(doc.id)}
                    />
                  ))}
                </div>
              )}
              {docs.length === 0 && !pendingDoc && (
                <p className="text-center text-[hsl(var(--nb-muted))] py-6 text-sm">Нет загруженных документов</p>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Прогресс ── */}
        <TabsContent value="прогресс">
          {isNewProject ? (
            <div className="nb-glass p-8 text-center text-[hsl(var(--nb-muted))]">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Сохраните проект, чтобы добавлять обновления</p>
            </div>
          ) : (
            <div className="nb-glass p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[hsl(var(--nb-text))]">Ход строительства</h2>
                <button className="nb-btn-gold" onClick={() => setUpdateModal({ open: true })}>
                  <Plus className="w-4 h-4 mr-1 inline" /> Добавить обновление
                </button>
              </div>

              {/* Progress slider */}
              <div className="p-4 rounded-xl bg-[hsl(var(--nb-glass-bg))] border border-[hsl(var(--nb-glass-border))]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[hsl(var(--nb-text-secondary))]">Текущий прогресс</span>
                  <span className="nb-mono text-[hsl(var(--nb-gold))]">{form.construction_progress}%</span>
                </div>
                <input
                  type="range" min={0} max={100}
                  value={form.construction_progress}
                  onChange={e => update('construction_progress', Number(e.target.value))}
                  className="w-full accent-[hsl(var(--nb-gold))]"
                />
                <p className="text-xs text-[hsl(var(--nb-muted))] mt-1">Сохраните проект чтобы обновить значение</p>
              </div>

              {/* Timeline */}
              {updates.length === 0 ? (
                <p className="text-center text-[hsl(var(--nb-muted))] py-6 text-sm">Нет обновлений. Добавьте первое.</p>
              ) : (
                <div className="space-y-3">
                  {updates.map(upd => (
                    <div key={upd.id} className="p-4 rounded-xl border border-[hsl(var(--nb-glass-border))] bg-[hsl(var(--nb-glass-bg))]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-[hsl(var(--nb-text))] truncate">{upd.title}</h3>
                            {upd.progress_at_time != null && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--nb-gold)/0.15)] text-[hsl(var(--nb-gold))]">{upd.progress_at_time}%</span>
                            )}
                          </div>
                          {upd.content && <p className="text-xs text-[hsl(var(--nb-text-secondary))] line-clamp-2">{upd.content}</p>}
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-[hsl(var(--nb-muted))]">
                            {upd.published_at && <span>{new Date(upd.published_at).toLocaleDateString('ru-RU')}</span>}
                            {upd.photo_urls && upd.photo_urls.length > 0 && <span>{upd.photo_urls.length} фото</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => setUpdateModal({ open: true, initial: upd })} className="text-[hsl(var(--nb-muted))] hover:text-[hsl(var(--nb-gold))]"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => id && deleteUpdate.mutate({ id: upd.id, project_id: id })} className="text-[hsl(var(--nb-muted))] hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Превью ── */}
        <TabsContent value="превью">
          {isNewProject ? (
            <div className="nb-glass p-8 text-center text-[hsl(var(--nb-muted))]">
              <p>Сохраните проект для доступа к превью</p>
            </div>
          ) : (
            <div className="nb-glass p-8 text-center space-y-4">
              <p className="text-[hsl(var(--nb-text-secondary))]">Публичная страница проекта (открывается в новой вкладке)</p>
              <a
                href={APP_ROUTES.OFFPLAN_DETAIL(id!)}
                target="_blank"
                rel="noopener noreferrer"
                className="nb-btn-gold inline-flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Открыть публичную страницу
              </a>
              {existing && !existing.is_approved && (
                <p className="text-xs text-amber-400 mt-2">⏳ Проект ожидает проверки — пока недоступен в каталоге</p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {unitModal.open && id && (
        <UnitModal
          initial={unitModal.initial}
          projectId={id}
          onClose={() => setUnitModal({ open: false })}
        />
      )}
      {updateModal.open && id && (
        <UpdateModal
          initial={updateModal.initial}
          projectId={id}
          onClose={() => setUpdateModal({ open: false })}
        />
      )}
    </div>
  );
}
