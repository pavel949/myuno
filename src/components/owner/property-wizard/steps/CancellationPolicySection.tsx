import { memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { CancellationPolicySelector } from '@/components/property/CancellationPolicySelector';
import { PropertyFormData } from '@/hooks/usePropertyWizard';

interface CancellationPolicySectionProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
}

function CancellationPolicySectionInner({ formData, updateFormData }: CancellationPolicySectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4" />
          {isRu ? 'Политика отмены' : 'Cancellation Policy'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CancellationPolicySelector
          value={formData.cancellation_policy || 'flexible'}
          onChange={(value) => updateFormData({ cancellation_policy: value })}
        />
      </CardContent>
    </Card>
  );
}

export const CancellationPolicySection = memo(CancellationPolicySectionInner);
