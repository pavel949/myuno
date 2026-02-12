import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Globe, MapPin, ExternalLink, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import type { ProviderDetails } from '@/hooks/useProviderDetails';

interface Props {
  provider: ProviderDetails;
}

function formatCurrency(amount: number, currency = 'THB') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
}

export function ProviderOverviewTab({ provider }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Contact Info */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">{isRu ? 'Контактная информация' : 'Contact Information'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {provider.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{provider.email}</span>
            </div>
          )}
          {provider.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{provider.phone}</span>
            </div>
          )}
          {provider.website && (
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                {provider.website}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          {provider.address && (
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{provider.address}</span>
            </div>
          )}
          {provider.description_en && (
            <div className="pt-3 border-t">
              <p className="text-sm text-muted-foreground">
                {isRu ? provider.description_ru : provider.description_en}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {isRu ? 'Финансы' : 'Financials'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{isRu ? 'К выплате' : 'Pending Payout'}</span>
            <span className="font-semibold">{formatCurrency(provider.pending_payout || 0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{isRu ? 'Всего заработано' : 'Total Earnings'}</span>
            <span className="font-semibold">{formatCurrency(provider.total_earnings || 0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{isRu ? 'Комиссия' : 'Commission Rate'}</span>
            <span className="font-semibold">{provider.commission_rate ? `${provider.commission_rate}%` : '—'}</span>
          </div>
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Создан' : 'Created'}: {format(new Date(provider.created_at), 'dd MMM yyyy')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
