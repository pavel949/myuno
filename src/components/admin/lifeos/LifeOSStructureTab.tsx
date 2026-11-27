import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { buildSituationListUrl } from '@/lib/navigation/situationUrls';
import { buildLifeOSStructure, lifeOSLabel, type LifeOSNode, type LifeOSScenarioNode, type LifeOSTaskNode } from '@/lib/lifeOsStructure';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

const nodeColumns = 'id, code, title_en, title_ru, is_active, priority';
type StructureTable = 'life_situations' | 'life_scenarios' | 'life_tasks' | 'catalog_life_map';

async function readAll<T>(table: StructureTable, columns: string, signal: AbortSignal) {
  const rows: T[] = [];
  const pageSize = 1000;
  for (let start = 0; ; start += pageSize) {
    const { data, error } = await supabase.from(table).select(columns)
      .order('id').range(start, start + pageSize - 1).abortSignal(signal);
    if (error) throw error;
    const page = (data ?? []) as unknown as T[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function readStructure(signal: AbortSignal) {
  const [situations, scenarios, tasks, mappings] = await Promise.all([
    readAll<LifeOSNode>('life_situations', nodeColumns + ', title_th', signal),
    readAll<LifeOSScenarioNode>('life_scenarios', nodeColumns + ', life_situation_id', signal),
    readAll<LifeOSTaskNode>('life_tasks', nodeColumns + ', life_scenario_id', signal),
    readAll<{ life_situation_id: string | null }>('catalog_life_map', 'life_situation_id', signal),
  ]);
  const counts: Record<string, number> = {};
  for (const { life_situation_id: id } of mappings) {
    if (id) counts[id] = (counts[id] ?? 0) + 1;
  }
  return buildLifeOSStructure(situations, scenarios, tasks, counts);
}

export function LifeOSStructureTab() {
  const { user, isLoading } = useAuth();
  const { language } = useLanguage();
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  return user?.id ? <LifeOSStructure key={user.id} actorId={user.id} /> : (
    <p role="status" className="text-sm text-muted-foreground">
      {pickLang(language, { ru: 'Войдите, чтобы открыть структуру.', en: 'Sign in to view the structure.', th: 'เข้าสู่ระบบเพื่อดูโครงสร้าง' })}
    </p>
  );
}

function LifeOSStructure({ actorId }: { actorId: string }) {
  const { language } = useLanguage();
  const t = (copy: LangValues) => pickLang(language, copy);
  const [search, setSearch] = useState('');
  const [gapsOnly, setGapsOnly] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const needle = search.trim().toLocaleLowerCase();
  const title = (row: LifeOSNode) => lifeOSLabel(row, language) ?? row.code;
  const query = useQuery({
    queryKey: ['admin-lifeos-structure', actorId],
    queryFn: ({ signal }) => readStructure(signal),
    gcTime: 0,
  });

  if (query.isPending) return <Skeleton className="h-64 w-full" />;
  if (query.isError) {
    return <div role="alert" className="space-y-2">
      <p className="text-sm text-destructive">{t({ ru: 'Не удалось загрузить структуру.', en: 'Could not load the structure.', th: 'โหลดโครงสร้างไม่สำเร็จ' })}</p>
      <Button variant="outline" onClick={() => void query.refetch()}>{t({ ru: 'Попробовать ещё раз', en: 'Try again', th: 'ลองอีกครั้ง' })}</Button>
    </div>;
  }

  const { rows, totals } = query.data;
  const filtered = rows.filter(row => (!gapsOnly || row.gaps.length > 0) && row.searchText.includes(needle));
  const stats = [
    [t({ ru: 'Активные ситуации', en: 'Active situations', th: 'สถานการณ์ที่เปิดใช้งาน' }), totals.situations],
    [t({ ru: 'Сценарии на сайте', en: 'Public scenarios', th: 'แผนบนเว็บไซต์' }), totals.scenarios],
    [t({ ru: 'Шаги на сайте', en: 'Public steps', th: 'ขั้นตอนบนเว็บไซต์' }), totals.tasks],
    [t({ ru: 'Ситуации с пробелами', en: 'Situations with gaps', th: 'สถานการณ์ที่ยังไม่ครบ' }), totals.gaps],
  ] as const;
  const hidden = t({ ru: 'Скрыто на сайте', en: 'Hidden on site', th: 'ซ่อนบนเว็บไซต์' });
  const gapLabels = {
    scenarios: t({ ru: 'Нет активных сценариев', en: 'No active scenarios', th: 'ไม่มีแผนที่เปิดใช้งาน' }),
    tasks: t({ ru: 'Сценарий без активных шагов', en: 'Scenario without active steps', th: 'แผนไม่มีขั้นตอนที่เปิดใช้งาน' }),
    mappings: t({ ru: 'Нет связей с каталогом', en: 'No catalogue links', th: 'ไม่มีการเชื่อมโยงกับแค็ตตาล็อก' }),
  };
  const searchLabel = t({ ru: 'Поиск по ситуациям, сценариям и шагам', en: 'Search situations, scenarios and steps', th: 'ค้นหาสถานการณ์ แผน และขั้นตอน' });

  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">{t({
      ru: 'Связи с каталогом относятся ко всей ситуации. Они не подтверждают наличие предложений для конкретного шага.',
      en: 'Catalogue links are for the whole situation. They do not confirm available offers for an individual step.',
      th: 'การเชื่อมโยงแค็ตตาล็อกครอบคลุมทั้งสถานการณ์ จึงไม่ยืนยันว่ามีข้อเสนอสำหรับแต่ละขั้นตอน',
    })}</p>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map(([label, count]) => <Card key={label}><CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-mono text-xl">{count}</div>
      </CardContent></Card>)}
    </div>
    <div className="flex flex-wrap items-center gap-4">
      <Input value={search} onChange={event => setSearch(event.target.value)} placeholder={searchLabel} aria-label={searchLabel} />
      <div className="flex items-center gap-2">
        <Switch id="gaps-only" checked={gapsOnly} onCheckedChange={setGapsOnly} />
        <Label htmlFor="gaps-only">{t({ ru: 'Только с пробелами', en: 'Gaps only', th: 'แสดงเฉพาะที่ยังไม่ครบ' })}</Label>
      </div>
    </div>
    {!filtered.length && <p role="status" className="text-sm text-muted-foreground">
      {rows.length === 0
        ? t({ ru: 'В структуре пока нет ситуаций.', en: 'There are no situations yet.', th: 'ยังไม่มีสถานการณ์ในโครงสร้าง' })
        : t({ ru: 'По этим условиям ничего не найдено.', en: 'Nothing matched these filters.', th: 'ไม่พบผลลัพธ์ตามตัวกรอง' })}
    </p>}
    <div className="space-y-2">
      {filtered.map(({ situation, publicActive, scenarios, activeScenarios, mappingCount, gaps }) => {
        const isOpen = open[situation.id] ?? Boolean(needle);
        return <Card key={situation.id}><CardContent className="p-3">
          <button type="button" className="ds-focus flex min-h-11 w-full flex-wrap items-center gap-2 text-left"
            onClick={() => setOpen(previous => ({ ...previous, [situation.id]: !isOpen }))} aria-expanded={isOpen}>
            {isOpen ? <ChevronDown aria-hidden="true" className="size-4 shrink-0" /> : <ChevronRight aria-hidden="true" className="size-4 shrink-0" />}
            <span className="min-w-0 break-words font-medium">{title(situation)}</span>
            {!publicActive && <Badge variant="outline">{hidden}</Badge>}
            <span className="flex flex-wrap gap-1">
              <Badge variant="secondary">{activeScenarios.length} {t({ ru: 'сцен. на сайте', en: 'public scenarios', th: 'แผนบนเว็บไซต์' })}</Badge>
              <Badge variant="secondary">{mappingCount} {t({ ru: 'зап. связей', en: 'catalogue link rows', th: 'รายการเชื่อมโยง' })}</Badge>
              {gaps.map(gap => <Badge key={gap} variant="destructive" className="gap-1"><AlertTriangle aria-hidden="true" className="size-3" />{gapLabels[gap]}</Badge>)}
            </span>
          </button>
          {isOpen && <div className="mt-2 space-y-2 border-l border-border pl-4">
            {publicActive && <Link to={buildSituationListUrl(situation.code)} className="ds-focus inline-flex min-h-11 items-center gap-1 text-sm text-primary underline">
              {t({ ru: 'Открыть на сайте', en: 'Open on site', th: 'เปิดบนเว็บไซต์' })} <ExternalLink aria-hidden="true" className="size-3" />
            </Link>}
            {!scenarios.length && <p className="text-sm text-muted-foreground">{t({ ru: 'Сценариев пока нет.', en: 'There are no scenarios yet.', th: 'ยังไม่มีแผน' })}</p>}
            {scenarios.map(scenario => <div key={scenario.id}>
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                {title(scenario)}
                {!scenario.publicActive && <Badge variant="outline">{hidden}</Badge>}
              </div>
              {scenario.tasks.length > 0 ? <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
                {scenario.tasks.map(task => <li key={task.id}>{title(task)} {!task.publicActive && <Badge variant="outline">{hidden}</Badge>}</li>)}
              </ul> : <p className="text-sm text-muted-foreground">{t({ ru: 'Шагов пока нет.', en: 'There are no steps yet.', th: 'ยังไม่มีขั้นตอน' })}</p>}
            </div>)}
          </div>}
        </CardContent></Card>;
      })}
    </div>
  </div>;
}
