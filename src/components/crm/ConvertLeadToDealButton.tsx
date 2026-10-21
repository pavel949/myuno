/**
 * ConvertLeadToDealButton — turns a platform inbound lead (consultation_requests
 * row) into an MC agent_deal via the convert_lead_to_deal RPC, then opens the deal.
 *
 * Reused across the acquisition surfaces: /admin/consultations, AdminInbox, nb_leads.
 *
 * - If the lead already has a converted deal, shows "Open deal" instead.
 * - Routes the deal into the user's active company (useMyCompanyId). When the user
 *   has no company yet (admin without a house MC), the button is disabled with a hint.
 */
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { useConvertLeadToDeal } from '@/hooks/useConvertLeadToDeal';

interface Props {
  leadId: string;
  convertedDealId?: string | null;
  /** Pre-select a deal type when known from the lead context. Defaults to 'sale'. */
  defaultDealType?: string;
  size?: 'sm' | 'default';
  variant?: 'default' | 'outline' | 'secondary';
}

export function ConvertLeadToDealButton({
  leadId,
  convertedDealId,
  defaultDealType = 'sale',
  size = 'sm',
  variant = 'outline',
}: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { data: company } = useMyCompanyId();
  const convert = useConvertLeadToDeal();

  if (convertedDealId) {
    return (
      <Button
        size={size}
        variant="secondary"
        className="gap-1.5"
        onClick={() => navigate(`/mc/sales/${convertedDealId}`)}
      >
        <ExternalLink className="w-3.5 h-3.5" />
        {isRu ? 'Открыть сделку' : 'Open deal'}
      </Button>
    );
  }

  const companyId = company?.company_id;

  return (
    <Button
      size={size}
      variant={variant}
      className="gap-1.5"
      disabled={!companyId || convert.isPending}
      title={!companyId ? (isRu ? 'Сначала выберите компанию' : 'Select a company first') : undefined}
      onClick={() => {
        if (!companyId) return;
        convert.mutate(
          { leadId, companyId, dealType: defaultDealType },
          { onSuccess: (dealId) => { if (dealId) navigate(`/mc/sales/${dealId}`); } },
        );
      }}
    >
      <ArrowRightLeft className="w-3.5 h-3.5" />
      {convert.isPending ? (isRu ? 'Создаю…' : 'Converting…') : (isRu ? 'В сделку' : 'To deal')}
    </Button>
  );
}
