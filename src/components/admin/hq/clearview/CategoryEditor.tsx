/**
 * Centre pane of the ClearView review editor: category score, item-level risk
 * ledger (P · S · D · mitigation · confidence · evidence), public finding and
 * member detail written side by side.
 */
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { WorkflowStatus, type WorkflowTone } from '@/components/admin/hq/WorkflowStatus';
import { checkCopy } from '@/lib/content/copyCheck';
import type { ClearViewCategory } from '@/lib/clearview/methodology';
import { effectiveConfidence, type CategoryReview, type EvidenceType, type RiskItem } from '@/lib/clearview/reviewModel';

const EVIDENCE: Record<EvidenceType, { en: string; ru: string; tone: WorkflowTone }> = {
  document: { en: 'Doc', ru: 'Документ', tone: 'done' },
  registry: { en: 'Registry', ru: 'Реестр', tone: 'done' },
  site_visit: { en: 'Site visit', ru: 'Выезд', tone: 'active' },
  missing: { en: 'Missing', ru: 'Нет', tone: 'blocked' },
};

interface CategoryEditorProps {
  category: ClearViewCategory;
  review: CategoryReview;
  isRu: boolean;
  readOnly: boolean;
  onChange: (next: CategoryReview) => void;
}

const newItem = (): RiskItem => ({
  id: crypto.randomUUID(), title: '', probability: 1, severity: 1, detectability: 1, mitigation: 0, confidence: 1, evidence: 'missing',
});

function NumCell({ value, min, max, step, label, disabled, onChange }: { value: number; min: number; max: number; step: number; label: string; disabled: boolean; onChange: (v: number) => void }) {
  return (
    <Input
      type="number" inputMode="decimal" aria-label={label} value={value} min={min} max={max} step={step} disabled={disabled}
      className="h-9 w-16 px-2 font-mono tabular-nums"
      onChange={(e) => {
        const v = Number(e.target.value);
        if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v)));
      }}
    />
  );
}

export function CategoryEditor({ category, review, isRu, readOnly, onChange }: CategoryEditorProps) {
  const tr = (en: string, ru: string) => (isRu ? ru : en);
  const setItem = (id: string, patch: Partial<RiskItem>) =>
    onChange({ ...review, items: review.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const publicIssues = checkCopy(review.public_finding);
  const scoreOutOf100 = review.score == null ? '—' : Math.round(review.score * 10);

  return (
    <section className="flex min-w-0 flex-col gap-4 border border-border bg-card p-4 sm:p-5" aria-labelledby="cv-cat-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="cv-cat-title" className="font-display text-xl text-foreground">
          {isRu ? category.nameRu : category.nameEn} · {Math.round(category.weight * 100)}%
        </h2>
        <span className="font-display text-2xl tabular-nums text-accent">{scoreOutOf100}</span>
      </div>

      <div className="flex items-center gap-3">
        <Label htmlFor="cv-score" className="text-sm text-muted-foreground">{tr('Category score (0–10)', 'Оценка категории (0–10)')}</Label>
        <Input
          id="cv-score" type="number" min={0} max={10} step={0.1} disabled={readOnly} className="h-10 w-24 font-mono tabular-nums"
          value={review.score ?? ''}
          onChange={(e) => onChange({ ...review, score: e.target.value === '' ? null : Math.min(10, Math.max(0, Number(e.target.value))) })}
        />
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-muted text-left text-caption uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">{tr('Risk item', 'Риск')}</th>
              <th className="px-2 py-2" title={tr('Probability 1–5', 'Вероятность 1–5')}>P</th>
              <th className="px-2 py-2" title={tr('Severity 1–5', 'Тяжесть 1–5')}>S</th>
              <th className="px-2 py-2" title={tr('Detectability 1–5', 'Обнаружимость 1–5')}>D</th>
              <th className="px-2 py-2">{tr('Mitig.', 'Смягч.')}</th>
              <th className="px-2 py-2">{tr('Conf.', 'Увер.')}</th>
              <th className="px-2 py-2">{tr('Evidence', 'Основание')}</th>
              <th className="px-2 py-2"><span className="sr-only">{tr('Remove', 'Удалить')}</span></th>
            </tr>
          </thead>
          <tbody>
            {review.items.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-4 text-muted-foreground">{tr('No risk items yet. Add the first one below.', 'Рисков пока нет. Добавьте первый ниже.')}</td></tr>
            )}
            {review.items.map((it) => {
              const conf = effectiveConfidence(it);
              return (
                <tr key={it.id} className="border-t border-border align-middle">
                  <td className="px-3 py-2">
                    <Input aria-label={tr('Risk item', 'Риск')} value={it.title} disabled={readOnly} className="h-9" onChange={(e) => setItem(it.id, { title: e.target.value })} />
                  </td>
                  <td className="px-2 py-2"><NumCell label="P" value={it.probability} min={1} max={5} step={1} disabled={readOnly} onChange={(v) => setItem(it.id, { probability: v })} /></td>
                  <td className="px-2 py-2"><NumCell label="S" value={it.severity} min={1} max={5} step={1} disabled={readOnly} onChange={(v) => setItem(it.id, { severity: v })} /></td>
                  <td className="px-2 py-2"><NumCell label="D" value={it.detectability} min={1} max={5} step={1} disabled={readOnly} onChange={(v) => setItem(it.id, { detectability: v })} /></td>
                  <td className="px-2 py-2"><NumCell label={tr('Mitigation', 'Смягчение')} value={it.mitigation} min={0} max={1} step={0.05} disabled={readOnly} onChange={(v) => setItem(it.id, { mitigation: v })} /></td>
                  <td className="px-2 py-2">
                    <span className={conf < it.confidence ? 'font-mono font-semibold text-danger' : 'font-mono font-semibold text-foreground'} title={conf < it.confidence ? tr('Capped: evidence missing', 'Снижено: нет основания') : undefined}>
                      {conf.toFixed(2)}
                    </span>
                    {!readOnly && <NumCell label={tr('Confidence', 'Уверенность')} value={it.confidence} min={0} max={1} step={0.05} disabled={readOnly} onChange={(v) => setItem(it.id, { confidence: v })} />}
                  </td>
                  <td className="px-2 py-2">
                    {readOnly ? (
                      <WorkflowStatus tone={EVIDENCE[it.evidence].tone}>{isRu ? EVIDENCE[it.evidence].ru : EVIDENCE[it.evidence].en}</WorkflowStatus>
                    ) : (
                      <select
                        aria-label={tr('Evidence type', 'Тип основания')} value={it.evidence}
                        className="h-9 border border-input bg-background px-2 text-sm"
                        onChange={(e) => setItem(it.id, { evidence: e.target.value as EvidenceType })}
                      >
                        {(Object.keys(EVIDENCE) as EvidenceType[]).map((k) => (
                          <option key={k} value={k}>{isRu ? EVIDENCE[k].ru : EVIDENCE[k].en}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {!readOnly && (
                      <Button variant="ghost" size="icon" aria-label={tr('Remove item', 'Удалить риск')} onClick={() => onChange({ ...review, items: review.items.filter((i) => i.id !== it.id) })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <Button variant="outline" className="self-start" onClick={() => onChange({ ...review, items: [...review.items, newItem()] })}>
          <Plus className="mr-1 h-4 w-4" />{tr('Add risk item', 'Добавить риск')}
        </Button>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cv-public">{tr('Public finding (plain words)', 'Публичный вывод (простыми словами)')}</Label>
          <Textarea id="cv-public" rows={4} disabled={readOnly} value={review.public_finding} onChange={(e) => onChange({ ...review, public_finding: e.target.value })} />
          {publicIssues.length > 0 && (
            <p className="text-sm text-warning" role="status">
              {tr('Copy check:', 'Проверка текста:')} {publicIssues.map((i) => `«${i.term}»`).join(', ')}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cv-member">{tr('Member detail and mitigation', 'Детали для участников и смягчение')}</Label>
          <Textarea id="cv-member" rows={4} disabled={readOnly} value={review.member_detail} onChange={(e) => onChange({ ...review, member_detail: e.target.value })} />
        </div>
      </div>

      {(review.findings.length > 0 || review.evidence_gaps.length > 0) && (
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          {review.findings.length > 0 && (
            <div><p className="mb-1 font-semibold text-foreground">{tr('Draft findings', 'Находки черновика')}</p><ul className="list-disc pl-5 text-muted-foreground">{review.findings.map((f) => <li key={f}>{f}</li>)}</ul></div>
          )}
          {review.evidence_gaps.length > 0 && (
            <div><p className="mb-1 font-semibold text-foreground">{tr('Evidence gaps', 'Пробелы в основаниях')}</p><ul className="space-y-1 text-muted-foreground">{review.evidence_gaps.map((f) => (
              <li key={f} className="flex items-start justify-between gap-2">
                <span>{f}</span>
                {!readOnly && (
                  <Button variant="ghost" size="sm" className="shrink-0" onClick={() => onChange({ ...review, evidence_gaps: review.evidence_gaps.filter((g) => g !== f) })}>
                    {tr('Resolved', 'Закрыто')}
                  </Button>
                )}
              </li>
            ))}</ul></div>
          )}
        </div>
      )}
    </section>
  );
}
