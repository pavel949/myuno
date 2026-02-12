import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Package, ShoppingCart, FileText, Star } from 'lucide-react';
import type { ProviderDetails, ProviderService, ProviderProduct, ProviderContract } from '@/hooks/useProviderDetails';

interface Props {
  provider: ProviderDetails;
  services: ProviderService[];
  products: ProviderProduct[];
  contracts: ProviderContract[];
}

const statCards = [
  { key: 'services', icon: Package, colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' },
  { key: 'products', icon: ShoppingCart, colorClass: 'bg-green-100 dark:bg-green-900/30 text-green-600' },
  { key: 'contracts', icon: FileText, colorClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' },
  { key: 'rating', icon: Star, colorClass: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' },
] as const;

export function ProviderQuickStats({ provider, services, products, contracts }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const activeServices = services.filter(s => s.is_active).length;
  const activeProducts = products.filter(p => p.is_active).length;
  const activeContracts = contracts.filter(c => c.status === 'active').length;

  const stats = [
    { value: activeServices, label: isRu ? 'Активных услуг' : 'Active Services' },
    { value: activeProducts, label: isRu ? 'Товаров' : 'Products' },
    { value: activeContracts, label: isRu ? 'Контрактов' : 'Contracts' },
    { value: provider.rating?.toFixed(1) || '—', label: `${provider.review_count || 0} ${isRu ? 'отзывов' : 'reviews'}` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statCards.map((card, i) => {
        const Icon = card.icon;
        return (
          <Card key={card.key}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats[i].value}</p>
                  <p className="text-xs text-muted-foreground">{stats[i].label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
