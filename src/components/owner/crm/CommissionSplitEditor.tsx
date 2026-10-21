/**
 * CommissionSplitEditor — three-way split: agent / firm / referral, plus an
 * optional referral source contact. Live-validates that the splits sum to
 * ≤100% (mirrors the DB `agent_deals_splits_total_check` constraint) and
 * shows the resulting net amounts derived from the deal's gross commission.
 *
 * Wire-up: mount inside a deal-detail panel; controlled via props.
 */
import { useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatValue } from '@/hooks/useAgentDeals';
import { AlertTriangle, Check } from 'lucide-react';

export interface CommissionSplitValue {
  agent_split_percent: number | null;
  firm_split_percent: number | null;
  referral_fee_percent: number | null;
  referral_contact_id: string | null;
}

interface CommissionSplitEditorProps {
  /** Gross commission for the deal (deal_value × commission_percent ÷ 100). */
  gross: number;
  value: CommissionSplitValue;
  onSave: (v: CommissionSplitValue) => Promise<void> | void;
  /** Optional referral contact picker — typically `<ContactPicker />`. */
  referralPicker?: React.ReactNode;
  className?: string;
}

function clampPercent(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, n));
}

export function CommissionSplitEditor({
  gross,
  value,
  onSave,
  referralPicker,
  className,
}: CommissionSplitEditorProps) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState<CommissionSplitValue>(value);
  const [saving, setSaving] = useState(false);

  const total = useMemo(() => {
    return (
      (draft.agent_split_percent ?? 0) +
      (draft.firm_split_percent ?? 0) +
      (draft.referral_fee_percent ?? 0)
    );
  }, [draft]);

  const totalError = total > 100;
  const dirty =
    draft.agent_split_percent !== value.agent_split_percent ||
    draft.firm_split_percent !== value.firm_split_percent ||
    draft.referral_fee_percent !== value.referral_fee_percent ||
    draft.referral_contact_id !== value.referral_contact_id;

  const netAgent = gross * ((draft.agent_split_percent ?? 0) / 100);
  const netFirm = gross * ((draft.firm_split_percent ?? 0) / 100);
  const netRef = gross * ((draft.referral_fee_percent ?? 0) / 100);

  const handleSave = async () => {
    if (totalError || !dirty) return;
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn('border border-border bg-card p-4', className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground">{t('crm.split.title')}</h3>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {t('crm.split.grossLabel')}: <span className="text-foreground">{formatValue(gross)}</span>
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SplitField
          label={t('crm.split.agent')}
          value={draft.agent_split_percent}
          net={netAgent}
          onChange={(v) => setDraft((d) => ({ ...d, agent_split_percent: v }))}
        />
        <SplitField
          label={t('crm.split.firm')}
          value={draft.firm_split_percent}
          net={netFirm}
          onChange={(v) => setDraft((d) => ({ ...d, firm_split_percent: v }))}
        />
        <SplitField
          label={t('crm.split.referral')}
          value={draft.referral_fee_percent}
          net={netRef}
          onChange={(v) => setDraft((d) => ({ ...d, referral_fee_percent: v }))}
        />
      </div>

      {(draft.referral_fee_percent ?? 0) > 0 && (
        <div className="mt-3 space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t('crm.split.referralContact')}</Label>
          {referralPicker ?? (
            <Input
              value={draft.referral_contact_id ?? ''}
              onChange={(e) =>
                setDraft((d) => ({ ...d, referral_contact_id: e.target.value || null }))
              }
              placeholder={t('crm.split.referralContactPlaceholder')}
              className="rounded-none"
            />
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className={cn('flex items-center gap-2 font-mono text-sm tabular-nums', totalError ? 'text-destructive' : 'text-foreground')}>
          {totalError ? <AlertTriangle className="h-4 w-4" /> : <Check className="h-4 w-4 text-muted-foreground" />}
          <span className="text-muted-foreground">{t('crm.split.totalLabel')}:</span>
          <span>{total.toFixed(1)}%</span>
          {totalError && <span className="ml-2 text-xs">{t('crm.split.totalError')}</span>}
        </div>
        <Button
          size="sm"
          disabled={totalError || !dirty || saving}
          onClick={handleSave}
          className="rounded-none"
        >
          {saving ? '…' : t('crm.activity.compose.save')}
        </Button>
      </div>
    </div>
  );
}

interface SplitFieldProps {
  label: string;
  value: number | null;
  net: number;
  onChange: (v: number | null) => void;
}

function SplitField({ label, value, net, onChange }: SplitFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={value ?? ''}
          onChange={(e) => onChange(clampPercent(e.target.value))}
          className="rounded-none pr-7 font-mono tabular-nums"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          %
        </span>
      </div>
      <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
        {formatValue(net)}
      </p>
    </div>
  );
}
