/**
 * @module verticalGroups
 * @description **Adapter over the catalog SSOT** (`src/lib/catalog/taxonomy.ts`).
 *
 * Historical note (2026-04-24):
 *   Until the SSOT migration this file owned its own 8-group taxonomy
 *   (arrive · live · enjoy · health · settle · invest · maintain · help).
 *   Now it re-derives `VERTICAL_GROUPS` from the 6 canonical clusters in
 *   the SSOT so footer, /discover and the vendor onboarding `CategoryPicker`
 *   all stay consistent with the home grid (`ClusterHub`) and the database
 *   (`category_groups` / `categories`).
 *
 * Public API (`VerticalGroup`, `VerticalGroupItem`, `VERTICAL_GROUPS`,
 * `getVerticalGroupTitle`, `getVerticalGroupItemLabel`) is preserved.
 *
 * **Rule:** never edit cluster/category/service data here.
 * Add or move services in `src/lib/catalog/taxonomy.ts` only.
 */
import { CLUSTERS, CATEGORIES, type ClusterEntry } from '@/lib/catalog';
import { pickTriplet } from '@/lib/ecosystemGlossary';
import type { Language } from '@/i18n';

export interface VerticalGroupItem {
  /** References VERTICALS[x].id — if set, icon/label come from verticals.ts */
  verticalId?: string;
  /** Direct route for standalone screens (not in VERTICALS) */
  route?: string;
  /** Override icon (emoji) for standalone screens */
  icon?: string;
  /** EN label for standalone screens */
  labelEn?: string;
  /** RU label for standalone screens */
  labelRu?: string;
  /** TH label for standalone screens */
  labelTh?: string;
}

export interface VerticalGroup {
  id: string;
  labelEn: string;
  labelRu: string;
  labelTh: string;
  icon: string;
  items: VerticalGroupItem[];
}

// Cluster-level Lucide icon names (kebab-case, see lucide-react/dynamic)
const CLUSTER_ICON: Record<string, string> = {
  arrive: 'plane-landing',
  live: 'home',
  manage: 'building',
  invest: 'building-2',
  legal: 'scale',
  build: 'hard-hat',
};

function buildGroup(cluster: ClusterEntry): VerticalGroup {
  const cats = CATEGORIES.filter((c) => c.clusterId === cluster.id);
  const items: VerticalGroupItem[] = cats.flatMap((cat) =>
    cat.services
      .filter((s) => s.status !== 'soon')
      .map<VerticalGroupItem>((svc) =>
        svc.verticalId
          ? { verticalId: svc.verticalId }
          : {
              route: svc.path,
              icon: 'boxes',
              labelEn: svc.labelEn,
              labelRu: svc.labelRu,
              labelTh: svc.labelTh ?? svc.labelEn,
            }
      )
  );

  // Deduplicate by verticalId or route
  const seen = new Set<string>();
  const dedup = items.filter((it) => {
    const key = it.verticalId ?? it.route ?? '';
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    id: cluster.id,
    labelEn: cluster.labelEn,
    labelRu: cluster.labelRu,
    labelTh: cluster.labelTh ?? cluster.labelEn,
    icon: CLUSTER_ICON[cluster.id] ?? 'boxes',
    items: dedup,
  };
}

/**
 * Canonical group list — derived from the 6 SSOT clusters, ordered by
 * cluster `sortOrder`. Empty clusters are still emitted (they get
 * filtered downstream by consumer-side `items.length` checks).
 */
export const VERTICAL_GROUPS: VerticalGroup[] = [...CLUSTERS]
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map(buildGroup);

/** Footer / marketing — localized section title. */
export function getVerticalGroupTitle(group: VerticalGroup, lang: Language): string {
  return pickTriplet(
    { ru: group.labelRu, en: group.labelEn, th: group.labelTh },
    lang
  );
}

/** Item label: registry vertical, or RU/EN/TH on the item. */
export function getVerticalGroupItemLabel(
  item: VerticalGroupItem,
  opts: { labelRu: string; labelEn: string; labelTh: string } | null,
  lang: Language
): string {
  if (opts) {
    return pickTriplet(
      { ru: opts.labelRu, en: opts.labelEn, th: opts.labelTh },
      lang
    );
  }
  if (item.labelRu && item.labelEn) {
    return pickTriplet(
      { ru: item.labelRu, en: item.labelEn, th: item.labelTh ?? item.labelEn },
      lang
    );
  }
  return '';
}
