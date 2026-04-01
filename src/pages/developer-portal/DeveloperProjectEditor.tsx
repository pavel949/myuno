/**
 * Developer Portal — Create/Edit Project (multi-step wizard)
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDeveloperProfile } from '@/hooks/useDeveloperPortal';
import { useNewbuildProject } from '@/hooks/useNewbuildProjects';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const STEPS = ['Основное', 'Медиа', 'Описание', 'Инвентарь', 'Условия'];
const AREAS = ['Bang Tao', 'Rawai', 'Kamala', 'Laguna', 'Surin', 'Nai Harn', 'Nai Thon', 'Layan', 'Kata', 'Karon', 'Patong', 'Cherng Talay', 'Other'];
const UNIT_TYPES = ['studio', '1br', '2br', '3br', 'penthouse', 'villa'];

export default function DeveloperProjectEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: developer } = useDeveloperProfile();
  const { data: existing } = useNewbuildProject(id);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    name_en: existing?.name_en || '',
    name_ru: existing?.name_ru || '',
    tagline: existing?.tagline || '',
    location_area: existing?.location_area || '',
    price_from: existing?.price_from || '',
    price_to: existing?.price_to || '',
    total_units: existing?.total_units || '',
    completion_date: existing?.completion_date || '',
    project_status: existing?.project_status || 'under_construction',
    construction_progress: existing?.construction_progress || 0,
    description_en: existing?.description_en || '',
    description_ru: existing?.description_ru || '',
    cover_image: existing?.cover_image || '',
    video_url: existing?.video_url || '',
    unit_types: existing?.unit_types || [],
  });

  const update = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!developer) return;
    setSaving(true);
    try {
      const slug = form.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        name_en: form.name_en,
        name_ru: form.name_ru || form.name_en,
        tagline: form.tagline || null,
        location_area: form.location_area || null,
        district: form.location_area || null,
        price_from: form.price_from ? Number(form.price_from) : null,
        price_to: form.price_to ? Number(form.price_to) : null,
        total_units: form.total_units ? Number(form.total_units) : null,
        completion_date: form.completion_date || null,
        project_status: form.project_status,
        construction_progress: form.construction_progress,
        description_en: form.description_en || null,
        description_ru: form.description_ru || null,
        cover_image: form.cover_image || null,
        video_url: form.video_url || null,
        unit_types: form.unit_types,
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
        const { error } = await supabase.from('property_projects').insert(payload);
        if (error) throw error;
        toast.success('Проект создан и отправлен на проверку');
      }
      navigate('/developer-portal/projects');
    } catch (e: any) {
      toast.error(e.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-3xl">
      <h1 className="nb-display text-2xl text-[hsl(var(--nb-text))] mb-6">
        {id ? 'Редактировать проект' : 'Новый проект'}
      </h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
              i === step
                ? 'bg-[hsl(var(--nb-gold)/0.15)] text-[hsl(var(--nb-gold))] font-medium'
                : i < step
                ? 'text-[hsl(var(--nb-gold)/0.6)]'
                : 'text-[hsl(var(--nb-muted))]'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
              i < step ? 'bg-[hsl(var(--nb-gold))] text-black border-transparent' : 
              i === step ? 'border-[hsl(var(--nb-gold))]' : 'border-[hsl(var(--nb-muted)/0.3)]'
            }`}>
              {i < step ? <Check className="w-3 h-3" /> : i + 1}
            </span>
            <span className="hidden sm:inline">{s}</span>
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="nb-glass p-6 space-y-5">
        {step === 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="nb-label mb-2 block">Project Name (EN)</label>
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
              <select
                value={form.location_area}
                onChange={e => update('location_area', e.target.value)}
                className="w-full rounded-md bg-[hsl(var(--nb-bg))] border border-[hsl(var(--nb-glass-border))] px-3 py-2 text-sm text-[hsl(var(--nb-text))]"
              >
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
                      const arr = form.unit_types.includes(t) ? form.unit_types.filter((x: string) => x !== t) : [...form.unit_types, t];
                      update('unit_types', arr);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                      form.unit_types.includes(t)
                        ? 'bg-[hsl(var(--nb-gold)/0.15)] border-[hsl(var(--nb-gold)/0.4)] text-[hsl(var(--nb-gold))]'
                        : 'border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-muted))]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="nb-label mb-2 block">Статус</label>
              <select
                value={form.project_status}
                onChange={e => update('project_status', e.target.value)}
                className="w-full rounded-md bg-[hsl(var(--nb-bg))] border border-[hsl(var(--nb-glass-border))] px-3 py-2 text-sm text-[hsl(var(--nb-text))]"
              >
                <option value="under_construction">Строится</option>
                <option value="completed">Сдан</option>
                <option value="upcoming">Скоро</option>
              </select>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className="nb-label mb-2 block">Обложка (URL)</label>
              <Input value={form.cover_image} onChange={e => update('cover_image', e.target.value)} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" placeholder="https://..." />
            </div>
            <div>
              <label className="nb-label mb-2 block">Видео (YouTube/Vimeo)</label>
              <Input value={form.video_url} onChange={e => update('video_url', e.target.value)} className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))]" placeholder="https://..." />
            </div>
            <p className="text-sm text-[hsl(var(--nb-muted))]">Загрузка галереи изображений будет доступна в следующей версии.</p>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="nb-label mb-2 block">Description (EN)</label>
              <textarea
                value={form.description_en}
                onChange={e => update('description_en', e.target.value)}
                rows={6}
                className="w-full rounded-md bg-[hsl(var(--nb-bg))] border border-[hsl(var(--nb-glass-border))] px-3 py-2 text-sm text-[hsl(var(--nb-text))]"
              />
            </div>
            <div>
              <label className="nb-label mb-2 block">Описание (RU)</label>
              <textarea
                value={form.description_ru}
                onChange={e => update('description_ru', e.target.value)}
                rows={6}
                className="w-full rounded-md bg-[hsl(var(--nb-bg))] border border-[hsl(var(--nb-glass-border))] px-3 py-2 text-sm text-[hsl(var(--nb-text))]"
              />
            </div>
            <div>
              <label className="nb-label mb-2 block">Прогресс строительства: {form.construction_progress}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={form.construction_progress}
                onChange={e => update('construction_progress', Number(e.target.value))}
                className="w-full accent-[hsl(var(--nb-gold))]"
              />
            </div>
          </>
        )}

        {step === 3 && (
          <div className="text-center py-8 text-[hsl(var(--nb-muted))]">
            <p className="mb-2">Управление юнитами и планировками</p>
            <p className="text-sm">Добавьте проект сначала, затем управляйте инвентарём в режиме редактирования.</p>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-8 text-[hsl(var(--nb-muted))]">
            <p className="mb-2">Условия оплаты и спецпредложения</p>
            <p className="text-sm">Будут доступны после создания проекта.</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className="border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-text-secondary))]"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Назад
        </Button>
        
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep(s => s + 1)}
            className="bg-[hsl(var(--nb-gold))] text-black hover:bg-[hsl(var(--nb-gold-bright))]"
          >
            Далее <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <button className="nb-btn-gold" disabled={!form.name_en || saving} onClick={handleSave}>
            {saving ? 'Сохранение...' : id ? 'Сохранить' : 'Создать проект'}
          </button>
        )}
      </div>
    </div>
  );
}
