/**
 * OnBehalfBanner - Visual indicator for admin-as-vendor context
 * 
 * Shows a clear banner when admin is creating content on behalf of a vendor,
 * making the authority context explicit and auditable.
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminProviders } from '@/hooks/useAdmin';
import { useOnBehalfContext } from '@/hooks/useAdminContentCreation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Building2 } from 'lucide-react';

interface OnBehalfBannerProps {
  className?: string;
}

export function OnBehalfBanner({ className }: OnBehalfBannerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { isOnBehalf, providerId } = useOnBehalfContext();
  const { providers } = useAdminProviders();

  // Don't render if not in on-behalf mode
  if (!isOnBehalf || !providerId) return null;

  const provider = providers.find(p => p.id === providerId);
  const providerName = provider?.name || 'Unknown Vendor';

  return (
    <Alert className={`border-primary/30 bg-primary/5 ${className}`}>
      <Shield className="h-4 w-4" />
      <AlertTitle>
        {isRu ? 'Создание от имени вендора' : 'Creating on behalf of vendor'}
      </AlertTitle>
      <AlertDescription className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1">
          <Building2 className="h-4 w-4" />
          <span className="font-semibold">{providerName}</span>
        </span>
        <Badge variant="outline" className="text-xs">
          {isRu ? 'Вендор сохраняет права' : 'Vendor retains ownership'}
        </Badge>
      </AlertDescription>
    </Alert>
  );
}
