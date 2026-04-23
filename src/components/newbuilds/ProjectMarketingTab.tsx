import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink, CreditCard, Percent } from 'lucide-react';

interface PaymentPlanStep {
  label?: string;
  percent: number;
  description?: string;
}

interface Props {
  commissionPct: number | null;
  paymentPlan: PaymentPlanStep[] | null;
  marketingMaterials: string[] | null;
  ownershipTypes: string[] | null;
  exclusive: boolean;
}

export function ProjectMarketingTab({ commissionPct, paymentPlan, marketingMaterials, ownershipTypes, exclusive }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const plans = Array.isArray(paymentPlan) ? paymentPlan : [];

  return (
    <div className="space-y-6">
      {/* Commission & Exclusivity */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Percent className="h-4 w-4 text-primary" />
          {isRu ? 'Условия' : 'Terms'}
        </h3>
        <div className="flex items-center gap-3 flex-wrap">
          {commissionPct != null && (
            <Badge variant="outline" className="text-xs">
              {isRu ? 'Комиссия' : 'Commission'}: {commissionPct}%
            </Badge>
          )}
          {exclusive && (
            <Badge className="bg-accent/10 text-accent border-accent/40 text-xs">
              {isRu ? 'Эксклюзив' : 'Exclusive'}
            </Badge>
          )}
          {ownershipTypes && ownershipTypes.length > 0 && ownershipTypes.map(t => (
            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
          ))}
        </div>
      </div>

      {/* Payment Plan */}
      {plans.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            {isRu ? 'План рассрочки' : 'Payment Plan'}
          </h3>
          <div className="space-y-2">
            {plans.map((step, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-none border bg-card">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {step.percent}%
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{step.label || `${isRu ? 'Этап' : 'Step'} ${i + 1}`}</p>
                  {step.description && <p className="text-xs text-muted-foreground">{step.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Marketing Materials */}
      {marketingMaterials && marketingMaterials.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {isRu ? 'Материалы' : 'Materials'}
          </h3>
          <div className="space-y-1">
            {marketingMaterials.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-none border bg-card hover:bg-accent/50 transition-colors text-sm"
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">{url.split('/').pop() || url}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {!commissionPct && plans.length === 0 && (!marketingMaterials || marketingMaterials.length === 0) && (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {isRu ? 'Маркетинговые данные не заполнены' : 'No marketing data available'}
        </p>
      )}
    </div>
  );
}
