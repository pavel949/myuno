/**
 * Right pane of the ClearView review editor: live rating, publish checklist,
 * overrides log (modifiers with reason codes) and two-person review actions.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ClearViewGrade } from '@/lib/clearview/methodology';
import type { PublishCheck, ReviewModifier } from '@/lib/clearview/reviewModel';
import type { DualApprovalRow } from '@/hooks/useDualApproval';

const CHECK_COPY: Record<PublishCheck['id'], { en: (n: number) => string; ru: (n: number) => string }> = {
  scores: { en: (n) => (n ? `${n} categories not scored` : 'All 8 categories scored'), ru: (n) => (n ? `Без оценки: ${n} категорий` : 'Все 8 категорий оценены') },
  evidence: { en: (n) => (n ? `${n} items missing evidence` : 'All items have evidence'), ru: (n) => (n ? `Нет основания: ${n}` : 'У всех пунктов есть основание') },
  copy: { en: (n) => (n ? `${n} copy issues in public text` : 'Public text has no banned words'), ru: (n) => (n ? `Проблем в публичном тексте: ${n}` : 'В публичном тексте нет запрещённых слов') },
  public_text: { en: (n) => (n ? `${n} categories without a public finding` : 'Every category has a public finding'), ru: (n) => (n ? `Без публичного вывода: ${n}` : 'У каждой категории есть публичный вывод') },
  second_review: { en: (n) => `Reviewer sign-off · ${n}/2`, ru: (n) => `Подписи проверяющих · ${n}/2` },
};

const ICON: Record<PublishCheck['level'], { glyph: string; cls: string }> = {
  ok: { glyph: '✓', cls: 'text-success' },
  warn: { glyph: '!', cls: 'text-warning' },
  todo: { glyph: '○', cls: 'text-muted-foreground' },
};

interface RatingPanelProps {
  isRu: boolean;
  score: number;
  grade: ClearViewGrade | null;
  confidence: number;
  checks: PublishCheck[];
  modifiers: ReviewModifier[];
  approvals: DualApprovalRow[];
  isPublished: boolean;
  publicHref: string;
  canApprove: boolean;
  hasApproved: boolean;
  isDirty: boolean;
  busy: boolean;
  onModifiersChange: (m: ReviewModifier[]) => void;
  onSave: () => void;
  onApprove: () => void;
  onPublish: () => void;
}

export function RatingPanel(p: RatingPanelProps) {
  const tr = (en: string, ru: string) => (p.isRu ? ru : en);
  const [draft, setDraft] = useState<ReviewModifier>({ type: '', delta: 0, reason: '' });
  const blocking = p.checks.filter((c) => c.id !== 'second_review' && !c.ok).length;
  const approvalsCount = p.checks.find((c) => c.id === 'second_review')?.count ?? 0;
  const canPublish = !p.isPublished && blocking === 0 && approvalsCount >= 2 && !p.isDirty;
  const readOnly = p.isPublished;

  return (
    <aside className="flex flex-col gap-3" aria-label={tr('Rating and publishing', 'Рейтинг и публикация')}>
      <div className="flex flex-col gap-2 bg-primary p-4 text-primary-foreground">
        <span className="text-caption font-semibold uppercase tracking-wider text-accent">{tr('Live rating', 'Текущий рейтинг')}</span>
        <div className="flex items-baseline gap-3">
          <span className="font-display text-5xl">{p.grade ?? '—'}</span>
          <span className="font-display text-2xl tabular-nums opacity-80">{p.score.toFixed(1)}</span>
        </div>
        <span className="text-sm opacity-80">
          {tr('Confidence', 'Уверенность')} {Math.round(p.confidence * 100)}% · {p.modifiers.length} {tr('overrides', 'поправок')}
        </span>
      </div>

      <div className="flex flex-col gap-2 border border-border bg-card p-4">
        <span className="text-sm font-semibold text-foreground">{tr('Before publishing', 'Перед публикацией')}</span>
        <ul className="flex flex-col gap-1.5 text-sm">
          {p.checks.map((c) => (
            <li key={c.id} className="flex gap-2 text-muted-foreground">
              <span className={`font-semibold ${ICON[c.level].cls}`} aria-hidden="true">{ICON[c.level].glyph}</span>
              {(p.isRu ? CHECK_COPY[c.id].ru : CHECK_COPY[c.id].en)(c.count ?? 0)}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2 border border-border bg-card p-4">
        <span className="text-sm font-semibold text-foreground">{tr('Overrides log', 'Журнал поправок')}</span>
        {p.modifiers.length === 0 && <span className="text-sm text-muted-foreground">{tr('No overrides.', 'Поправок нет.')}</span>}
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          {p.modifiers.map((m, i) => (
            <li key={`${m.type}-${i}`} className="flex items-start justify-between gap-2">
              <span><span className="font-mono tabular-nums text-foreground">{m.delta > 0 ? `+${m.delta}` : m.delta}</span> · {m.type} · {m.reason || tr('no reason', 'без причины')}</span>
              {!readOnly && (
                <Button variant="ghost" size="sm" onClick={() => p.onModifiersChange(p.modifiers.filter((_, j) => j !== i))}>{tr('Remove', 'Убрать')}</Button>
              )}
            </li>
          ))}
        </ul>
        {!readOnly && (
          <div className="grid grid-cols-[1fr_72px] gap-2">
            <Input aria-label={tr('Reason code', 'Код причины')} placeholder={tr('reason code, e.g. verified_structure', 'код причины, напр. verified_structure')} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} />
            <Input aria-label={tr('Points', 'Баллы')} type="number" min={-5} max={5} step={0.5} value={draft.delta} onChange={(e) => setDraft({ ...draft, delta: Number(e.target.value) || 0 })} />
            <Input className="col-span-2" aria-label={tr('Why', 'Почему')} placeholder={tr('Why (required)', 'Почему (обязательно)')} value={draft.reason} onChange={(e) => setDraft({ ...draft, reason: e.target.value })} />
            <Button
              variant="outline" className="col-span-2"
              disabled={!draft.type.trim() || !draft.reason.trim() || draft.delta === 0}
              onClick={() => { p.onModifiersChange([...p.modifiers, { ...draft, type: draft.type.trim(), reason: draft.reason.trim() }]); setDraft({ type: '', delta: 0, reason: '' }); }}
            >
              {tr('Add override', 'Добавить поправку')}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 border border-border bg-card p-4 text-sm">
        <span className="font-semibold text-foreground">{tr('Reviewers', 'Проверяющие')}</span>
        {p.approvals.length === 0 && <span className="text-muted-foreground">{tr('No sign-offs yet.', 'Подписей пока нет.')}</span>}
        {p.approvals.map((a, i) => (
          <span key={a.id} className="text-muted-foreground">
            {i + 1}. <span className="font-mono">{a.approver_id.slice(0, 8)}</span> · {new Date(a.created_at).toLocaleString(p.isRu ? 'ru-RU' : 'en-GB')}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline" className="min-h-11"><Link to={p.publicHref}>{tr('Preview public', 'Публичный вид')}</Link></Button>
        {!readOnly && (
          <Button variant="outline" className="min-h-11" disabled={!p.isDirty || p.busy} onClick={p.onSave}>{tr('Save draft', 'Сохранить')}</Button>
        )}
        {!readOnly && (
          <Button
            className="col-span-2 min-h-11"
            disabled={!p.canApprove || p.hasApproved || p.isDirty || p.busy}
            onClick={p.onApprove}
          >
            {p.hasApproved ? tr('You signed off', 'Вы подписали') : approvalsCount === 0 ? tr('Sign off and send for 2nd review', 'Подписать и отправить на 2-ю проверку') : tr('Sign off as 2nd reviewer', 'Подписать как 2-й проверяющий')}
          </Button>
        )}
        {!readOnly && (
          <Button className="col-span-2 min-h-11" variant="default" disabled={!canPublish || p.busy} onClick={p.onPublish}>
            {tr('Publish rating', 'Опубликовать рейтинг')}
          </Button>
        )}
      </div>
      <p className="text-caption text-muted-foreground">
        {p.isPublished
          ? tr('Published ratings are read-only. Generate a new version to change them.', 'Опубликованный рейтинг только для чтения. Для изменений создайте новую версию.')
          : tr('Save before signing off. Publishing needs two different reviewers and a clean checklist; it is logged.', 'Сохраните перед подписью. Публикация требует двух разных проверяющих и чистого чек-листа; всё логируется.')}
      </p>
    </aside>
  );
}
