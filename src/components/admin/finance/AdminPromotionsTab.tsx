import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminPromotions } from '@/hooks/usePromotedListings';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, Clock } from 'lucide-react';
import { format } from 'date-fns';

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'active' ? 'default' : 'secondary';
  return <Badge variant={variant} className="text-xs">{status}</Badge>;
}

export function AdminPromotionsTab() {
  const { t } = useLanguage();
  const { data: promotions, isLoading } = useAdminPromotions();

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-8">{t('admin.finance.promotions.loading')}</p>;
  }

  if (!promotions?.length) {
    return (
      <div className="text-center py-12 space-y-2">
        <Rocket className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-muted-foreground">{t('admin.finance.promotions.empty')}</p>
      </div>
    );
  }

  const active = promotions.filter((p) => p.status === 'active' && new Date(p.expires_at) > new Date());
  const totalRevenue = promotions.reduce((s, p) => s + p.amount_paid, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{active.length}</p>
            <p className="text-xs text-muted-foreground">{t('admin.finance.promotions.active')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{promotions.length}</p>
            <p className="text-xs text-muted-foreground">{t('admin.finance.promotions.total')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">฿{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{t('admin.finance.promotions.revenue')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {promotions.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.status} />
                  <span className="text-xs text-muted-foreground">{p.listing_type}</span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(p.starts_at), 'dd.MM')} — {format(new Date(p.expires_at), 'dd.MM.yyyy')}
                </p>
              </div>
              <span className="font-semibold text-sm">฿{p.amount_paid.toLocaleString()}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
