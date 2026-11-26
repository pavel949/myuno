/**
 * AccessMatrix — Design Bible Round 4A · H4 role editor view.
 * Read-only view / edit / approve matrix per HQ role, from hqAccessPolicy.
 */
import { useState } from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getRoleMetadata, type AppRole } from '@/types/auth';
import { HQ_AREAS, HQ_ROLES, permissionFor, type HqPermission } from '@/lib/access/hqAccessPolicy';
import { cn } from '@/lib/utils';

const COLS: (keyof HqPermission)[] = ['view', 'edit', 'approve'];

export function AccessMatrix() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const tr = (en: string, ru: string) => (isRu ? ru : en);
  const [role, setRole] = useState<AppRole>(HQ_ROLES[0]);
  const colLabel: Record<keyof HqPermission, string> = { view: tr('View', 'Просмотр'), edit: tr('Edit', 'Правка'), approve: tr('Approve', 'Одобрение') };
  const roleLabel = (r: AppRole) => (isRu ? getRoleMetadata(r).labelRu : getRoleMetadata(r).labelEn);

  return (
    <section className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]" aria-labelledby="access-matrix-title">
      <div role="tablist" aria-orientation="vertical" className="flex flex-row flex-wrap gap-1 border border-border bg-card p-2 lg:flex-col">
        {HQ_ROLES.map((r) => (
          <button
            key={r} type="button" role="tab" aria-selected={role === r} onClick={() => setRole(r)}
            className={cn('min-h-11 px-3 text-left text-sm font-semibold', role === r ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted')}
          >
            {roleLabel(r)}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3 border border-border bg-card p-4">
        <span className="text-caption font-semibold uppercase tracking-wide text-accent">{tr('Role', 'Роль')} · {roleLabel(role)}</span>
        <h2 id="access-matrix-title" className="sr-only">{tr('Access matrix', 'Матрица доступа')}</h2>
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[360px] text-sm">
            <thead className="bg-muted text-left text-caption uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">{tr('Area', 'Раздел')}</th>
                {COLS.map((c) => <th key={c} className="w-20 px-3 py-2 text-center">{colLabel[c]}</th>)}
              </tr>
            </thead>
            <tbody>
              {HQ_AREAS.map((a) => {
                const p = permissionFor(role, a.id);
                return (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-3 py-2 text-foreground">{isRu ? a.labelRu : a.labelEn}</td>
                    {COLS.map((c) => (
                      <td key={c} className="px-3 py-2 text-center">
                        <span
                          role="img" aria-label={`${colLabel[c]}: ${p[c] ? tr('yes', 'да') : tr('no', 'нет')}`}
                          className={cn('inline-flex h-5 w-5 items-center justify-center rounded-sm border-2 border-primary', p[c] ? 'bg-primary text-primary-foreground' : 'bg-card')}
                        >
                          {p[c] && <Check className="h-3 w-3" aria-hidden="true" />}
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-caption text-muted-foreground">
          {tr('Money and ClearView approvals always need two people; every approval is logged. Server rules (RLS and approval functions) enforce this matrix.', 'Одобрение выплат и ClearView всегда требует двух людей; каждое одобрение логируется. Матрицу обеспечивают серверные правила (RLS и функции одобрения).')}
        </p>
      </div>
    </section>
  );
}
