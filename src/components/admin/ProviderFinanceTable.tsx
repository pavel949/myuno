import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Search, ArrowUpDown, Pencil, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProviderFinancials, getVerticalLabel } from '@/hooks/useAdminFinance';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProviderFinanceTableProps {
  providers: ProviderFinancials[];
  isLoading: boolean;
  onRefresh?: () => void;
}

function formatCurrency(amount: number, currency = 'THB'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type SortField = 'gmv' | 'platformRevenue' | 'pendingPayout' | 'orderCount';
type SortDirection = 'asc' | 'desc';

export function ProviderFinanceTable({ providers, isLoading, onRefresh }: ProviderFinanceTableProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('gmv');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const filteredProviders = providers.filter(p => 
    p.providerName.toLowerCase().includes(search.toLowerCase())
  );

  const sortedProviders = [...filteredProviders].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleEditClick = (providerId: string, currentRate: number) => {
    setEditingProvider(providerId);
    setEditingRate(currentRate.toString());
  };

  const handleCancelEdit = () => {
    setEditingProvider(null);
    setEditingRate('');
  };

  const handleSaveCommission = async (providerId: string) => {
    const rate = parseFloat(editingRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Комиссия должна быть от 0 до 100%');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('providers')
        .update({ 
          commission_rate: rate,
          updated_at: new Date().toISOString()
        })
        .eq('id', providerId);

      if (error) throw error;

      toast.success(`Комиссия обновлена: ${rate}%`);
      setEditingProvider(null);
      setEditingRate('');
      onRefresh?.();
    } catch (error) {
      console.error('Error updating commission:', error);
      toast.error('Ошибка при сохранении комиссии');
    } finally {
      setSaving(false);
    }
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-primary' : ''}`} />
    </button>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Финансы по провайдерам</CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск провайдера..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {sortedProviders.length === 0 ? (
          <div className="text-center py-10">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {search ? 'Провайдеры не найдены' : 'Нет данных за выбранный период'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Провайдер</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Вертикаль</th>
                  <th className="text-right py-3 px-4">
                    <SortButton field="gmv" label="GMV" />
                  </th>
                  <th className="text-right py-3 px-4">
                    <SortButton field="platformRevenue" label="Наш доход" />
                  </th>
                  <th className="text-right py-3 px-4">
                    <SortButton field="pendingPayout" label="К выплате" />
                  </th>
                  <th className="text-right py-3 px-4">
                    <SortButton field="orderCount" label="Заказов" />
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Комиссия</th>
                </tr>
              </thead>
              <tbody>
                {sortedProviders.map((provider, index) => (
                  <motion.tr
                    key={provider.providerId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-border/50 hover:bg-muted/50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{provider.providerName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="text-xs">
                        {getVerticalLabel(provider.vertical)}
                      </Badge>
                    </td>
                    <td className="text-right py-3 px-4 font-medium">
                      {formatCurrency(provider.gmv)}
                    </td>
                    <td className="text-right py-3 px-4 text-emerald-600 font-medium">
                      {formatCurrency(provider.platformRevenue)}
                    </td>
                    <td className="text-right py-3 px-4">
                      {provider.pendingPayout > 0 ? (
                        <span className="text-amber-600 font-medium">
                          {formatCurrency(provider.pendingPayout)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="text-right py-3 px-4 text-muted-foreground">
                      {provider.orderCount}
                    </td>
                    <td className="text-right py-3 px-4">
                      {editingProvider === provider.providerId ? (
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            type="number"
                            value={editingRate}
                            onChange={(e) => setEditingRate(e.target.value)}
                            className="w-16 h-7 text-sm text-right"
                            min="0"
                            max="100"
                            step="0.5"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveCommission(provider.providerId);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-emerald-600"
                            onClick={() => handleSaveCommission(provider.providerId)}
                            disabled={saving}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={handleCancelEdit}
                            disabled={saving}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(provider.providerId, provider.commissionRate)}
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 text-blue-600 rounded-md text-sm hover:bg-blue-500/20 transition-colors group"
                        >
                          {provider.commissionRate}%
                          <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sortedProviders.length > 0 && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
            <span>Показано {sortedProviders.length} из {providers.length} провайдеров</span>
            <div className="flex items-center gap-4">
              <span>
                Суммарный GMV: <strong className="text-foreground">{formatCurrency(sortedProviders.reduce((sum, p) => sum + p.gmv, 0))}</strong>
              </span>
              <span>
                Суммарный доход: <strong className="text-emerald-600">{formatCurrency(sortedProviders.reduce((sum, p) => sum + p.platformRevenue, 0))}</strong>
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
