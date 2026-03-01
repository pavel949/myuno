/**
 * PortalUtilitiesTab — Read-only view of PEA/CAM/water/internet bills from property_financials.
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Droplets, Wifi, Building } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Props {
  propertyId: string;
}

const UTILITY_CATEGORIES = ['electricity', 'water', 'cam_fees', 'internet'];

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; labelEn: string; labelRu: string }> = {
  electricity: { icon: Zap, labelEn: 'Electricity (PEA)', labelRu: 'Электричество (PEA)' },
  water: { icon: Droplets, labelEn: 'Water', labelRu: 'Вода' },
  cam_fees: { icon: Building, labelEn: 'CAM Fees', labelRu: 'CAM (обслуживание)' },
  internet: { icon: Wifi, labelEn: 'Internet', labelRu: 'Интернет' },
};

export function PortalUtilitiesTab({ propertyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: bills, isLoading } = useQuery({
    queryKey: ['portal-utilities', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_financials')
        .select('id, category, amount, currency, transaction_date, due_date, status, description, description_ru, paid_date, vendor_name')
        .eq('property_id', propertyId)
        .in('category', UTILITY_CATEGORIES)
        .order('transaction_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!propertyId,
  });

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground text-sm">{isRu ? 'Загрузка...' : 'Loading...'}</div>;
  }

  if (!bills || bills.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        <Zap className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p>{isRu ? 'Нет записей по коммунальным платежам' : 'No utility bills found'}</p>
      </div>
    );
  }

  // Group by category
  const grouped = UTILITY_CATEGORIES.reduce<Record<string, typeof bills>>((acc, cat) => {
    const items = bills.filter(b => b.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  const statusBadge = (status: string | null) => {
    if (status === 'paid') return <Badge variant="secondary" className="text-[10px]">{isRu ? 'Оплачено' : 'Paid'}</Badge>;
    if (status === 'overdue') return <Badge variant="destructive" className="text-[10px]">{isRu ? 'Просрочено' : 'Overdue'}</Badge>;
    return <Badge variant="outline" className="text-[10px]">{isRu ? 'Ожидает' : 'Pending'}</Badge>;
  };

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([cat, items]) => {
        const config = CATEGORY_CONFIG[cat];
        const Icon = config?.icon || Zap;
        return (
          <div key={cat} className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Icon className="w-4 h-4 text-primary" />
              {isRu ? config?.labelRu : config?.labelEn}
            </h3>
            {items.map(bill => (
              <Card key={bill.id}>
                <CardContent className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {bill.amount.toLocaleString()} {bill.currency || '฿'}
                      </p>
                      {statusBadge(bill.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(bill.transaction_date), 'dd MMM yyyy')}
                      {bill.vendor_name && ` · ${bill.vendor_name}`}
                    </p>
                    {(isRu ? bill.description_ru : bill.description) && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {isRu ? bill.description_ru : bill.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
}
