import type { Language } from '@/i18n';

type Localized = {
  title_en: string | null;
  title_ru: string | null;
  title_th?: string | null;
  description_en?: string | null;
  description_ru?: string | null;
  description_th?: string | null;
};

export function lifeOSLabel(row: Localized, language: Language, field: 'title' | 'description' = 'title') {
  const order = language === 'th' ? ['th', 'en', 'ru'] as const
    : language === 'ru' ? ['ru', 'en'] as const : ['en', 'ru'] as const;
  for (const locale of order) {
    const label = row[field + '_' + locale as keyof Localized]?.trim();
    if (label) return label;
  }
  return null;
}

export type LifeOSNode = Localized & {
  id: string;
  code: string;
  priority: number | null;
  is_active: boolean | null;
};

export type LifeOSScenarioNode = LifeOSNode & { life_situation_id: string | null };
export type LifeOSTaskNode = LifeOSNode & { life_scenario_id: string | null };
type Gap = 'scenarios' | 'tasks' | 'mappings';

function ordered<T extends LifeOSNode>(nodes: readonly T[]) {
  return [...nodes].sort((left, right) =>
    (left.priority ?? Number.MAX_SAFE_INTEGER) - (right.priority ?? Number.MAX_SAFE_INTEGER)
      || left.code.localeCompare(right.code) || left.id.localeCompare(right.id),
  );
}

function byParent<T>(rows: readonly T[], parent: (row: T) => string | null) {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const id = parent(row);
    if (!id) continue;
    const children = groups.get(id);
    if (children) children.push(row);
    else groups.set(id, [row]);
  }
  return groups;
}

export function buildLifeOSStructure(
  situations: readonly LifeOSNode[],
  scenarios: readonly LifeOSScenarioNode[],
  tasks: readonly LifeOSTaskNode[],
  mappings: Record<string, number>,
) {
  const scenarioGroups = byParent(scenarios, row => row.life_situation_id);
  const taskGroups = byParent(tasks, row => row.life_scenario_id);
  const rows = ordered(situations).map(situation => {
    const publicActive = situation.is_active === true;
    const children = ordered(scenarioGroups.get(situation.id) ?? []).map(scenario => {
      const visible = publicActive && scenario.is_active === true;
      const steps = ordered(taskGroups.get(scenario.id) ?? []).map(task => ({
        ...task, publicActive: visible && task.is_active === true,
      }));
      return { ...scenario, publicActive: visible, tasks: steps };
    });
    const activeScenarios = children.filter(scenario => scenario.publicActive);
    const mappingCount = mappings[situation.id] ?? 0;
    const gaps: Gap[] = [];
    if (publicActive) {
      if (activeScenarios.length === 0) gaps.push('scenarios');
      if (activeScenarios.some(scenario => !scenario.tasks.some(task => task.publicActive))) gaps.push('tasks');
      if (mappingCount === 0) gaps.push('mappings');
    }
    const searchText = [situation, ...children, ...children.flatMap(scenario => scenario.tasks)]
      .flatMap(node => [node.code, node.title_ru, node.title_en, node.title_th])
      .join(' ').toLocaleLowerCase();
    return { situation, publicActive, scenarios: children, activeScenarios, mappingCount, gaps, searchText };
  });

  return {
    rows,
    totals: {
      situations: rows.filter(row => row.publicActive).length,
      scenarios: rows.reduce((count, row) => count + row.activeScenarios.length, 0),
      tasks: rows.reduce((count, row) => count + row.activeScenarios.reduce(
        (steps, scenario) => steps + scenario.tasks.filter(task => task.publicActive).length, 0), 0),
      gaps: rows.filter(row => row.gaps.length > 0).length,
    },
  };
}
