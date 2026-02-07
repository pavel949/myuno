import { Shield, Fuel, FileText, Banknote, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface YachtPoliciesProps {
  cancellationPolicy?: string | null;
  fuelPolicy?: string | null;
  insuranceIncluded?: string | null;
  insuranceNotes?: string | null;
  depositPercent?: number | null;
}

const POLICY_LABELS: Record<string, { en: string; ru: string }> = {
  flexible: { en: 'Free cancellation up to 24h before', ru: 'Бесплатная отмена за 24ч' },
  moderate: { en: 'Free cancellation up to 48h before', ru: 'Бесплатная отмена за 48ч' },
  strict: { en: '50% refund if cancelled 7+ days before', ru: '50% возврат при отмене за 7+ дней' },
  non_refundable: { en: 'Non-refundable', ru: 'Невозвратный' },
};

const FUEL_LABELS: Record<string, { en: string; ru: string }> = {
  included: { en: 'Fuel included in price', ru: 'Топливо включено в стоимость' },
  excluded: { en: 'Fuel charged separately', ru: 'Топливо оплачивается отдельно' },
  unknown: { en: 'Fuel — ask operator', ru: 'Топливо — уточняйте у оператора' },
};

export function YachtPolicies({
  cancellationPolicy,
  fuelPolicy,
  insuranceIncluded,
  insuranceNotes,
  depositPercent,
}: YachtPoliciesProps) {
  const { language } = useLanguage();
  const t = language === 'ru';

  const cancelLabel = POLICY_LABELS[cancellationPolicy || 'moderate'] || { en: cancellationPolicy || 'Contact operator', ru: cancellationPolicy || 'Уточняйте' };
  const fuelLabel = FUEL_LABELS[fuelPolicy || 'unknown'] || { en: fuelPolicy || 'Ask operator', ru: fuelPolicy || 'Уточняйте' };

  const insuranceLabel = insuranceIncluded === 'true' || insuranceIncluded === 'yes'
    ? (t ? 'Страховка включена' : 'Insurance included')
    : insuranceIncluded === 'false' || insuranceIncluded === 'no'
      ? (t ? 'Страховка не включена' : 'Insurance not included')
      : (t ? 'Уточняйте у оператора' : 'Ask operator');

  return (
    <div>
      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground" />
        {t ? 'Условия и политики' : 'Policies & Terms'}
      </h4>

      <div className="space-y-2">
        <PolicyItem
          icon={<FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          label={t ? 'Отмена' : 'Cancellation'}
          value={t ? cancelLabel.ru : cancelLabel.en}
        />
        <PolicyItem
          icon={<Fuel className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
          label={t ? 'Топливо' : 'Fuel'}
          value={t ? fuelLabel.ru : fuelLabel.en}
        />
        <PolicyItem
          icon={<Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          label={t ? 'Страховка' : 'Insurance'}
          value={insuranceLabel}
          note={insuranceNotes || undefined}
        />
        {depositPercent != null && depositPercent > 0 && (
          <PolicyItem
            icon={<Banknote className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
            label={t ? 'Депозит' : 'Deposit'}
            value={`${depositPercent}% ${t ? 'при бронировании' : 'at booking'}`}
          />
        )}
      </div>
    </div>
  );
}

function PolicyItem({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note?: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
        </div>
        <p className="text-sm font-medium mt-0.5">{value}</p>
        {note && (
          <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            {note}
          </p>
        )}
      </div>
    </div>
  );
}
