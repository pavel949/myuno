import { LandingLeadForm } from '@/components/landings/LandingLeadForm';
import type { ProjectUnit } from '@/hooks/useProjectUnits';
import { OFFPLAN_BUYER_ENTRY } from '@/lib/consultationIntake';

interface OffplanBuyerEnquiryProps {
  projectId: string;
  unit?: Pick<ProjectUnit, 'id' | 'property_id'> | null;
  intent?: 'consultation' | 'documents';
}

export function OffplanBuyerEnquiry({ projectId, unit, intent = 'consultation' }: OffplanBuyerEnquiryProps) {
  return (
    <LandingLeadForm
      key={`${projectId}:${unit?.id ?? 'project'}:${intent}`}
      variant="universal"
      verticalId="properties"
      entryPoint={OFFPLAN_BUYER_ENTRY}
      leadSource="cta"
      universalRequestType="property_consultation"
      contextMetadata={{
        schema_version: 1,
        project_id: projectId,
        intent,
        request_only: true,
        offer_id: null,
        ...(unit ? { unit_id: unit.id, property_id: unit.property_id } : {}),
      }}
    />
  );
}
