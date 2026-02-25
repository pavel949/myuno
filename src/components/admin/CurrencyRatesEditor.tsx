import React, { useState, useEffect } from 'react';
import { RefreshCw, Save, TrendingUp, AlertCircle, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface CurrencyRate {
  code: string;
  rate: number;
  updated_at: string;
}

const CURRENCY_META: Record<string, { symbol: string; name: string; nameRu: string; flag: string }> = {
  THB: { symbol: '฿', name: 'Thai Baht', nameRu: 'Тайский бат', flag: '🇹🇭' },
  USD: { symbol: '$', name: 'US Dollar', nameRu: 'Доллар США', flag: '🇺🇸' },
  EUR: { symbol: '€', name: 'Euro', nameRu: 'Евро', flag: '🇪🇺' },
  RUB: { symbol: '₽', name: 'Russian Ruble', nameRu: 'Российский рубль', flag: '🇷🇺' },
};

export function CurrencyRatesEditor() {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [editedRates, setEditedRates] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const loadRates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_all_currency_rates');
      
      if (error) throw error;
      
      if (data && typeof data === 'object') {
        const ratesData = data as Record<string, { rate: number; updated_at: string }>;
        const ratesArray: CurrencyRate[] = Object.entries(ratesData).map(([currencyCode, info]) => ({
          code: currencyCode,
          rate: info.rate,
          updated_at: info.updated_at,
        }));
        setRates(ratesArray);
        
        // Initialize edited rates
        const initial: Record<string, string> = {};
        ratesArray.forEach(r => {
          initial[r.code] = r.rate.toString();
        });
        setEditedRates(initial);
      }
    } catch (error) {
      console.error('Failed to load rates:', error);
      toast.error('Не удалось загрузить курсы валют');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  const handleRateChange = (code: string, value: string) => {
    setEditedRates(prev => ({ ...prev, [code]: value }));
    setHasChanges(true);
  };

  const saveRates = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(editedRates).map(([code, rateStr]) => {
        const rate = parseFloat(rateStr);
        if (isNaN(rate) || rate <= 0) {
          throw new Error(`Некорректный курс для ${code}`);
        }
        return { code, rate };
      });

      // Update each rate
      for (const { code, rate } of updates) {
        const { error } = await supabase
          .from('currency_rates')
          .upsert({ 
            target_currency: code, 
            base_currency: 'THB',
            rate, 
            updated_at: new Date().toISOString() 
          }, { 
            onConflict: 'target_currency' 
          });
        
        if (error) throw error;
      }

      toast.success('Курсы валют обновлены');
      setHasChanges(false);
      loadRates();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  const getExampleConversion = (code: string, rate: number) => {
    if (code === 'THB') return null;
    const thbAmount = 1000;
    const converted = Math.round(thbAmount * rate);
    return `฿${thbAmount.toLocaleString()} = ${CURRENCY_META[code]?.symbol}${converted.toLocaleString()}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Курсы валют
            </CardTitle>
            <CardDescription>
              Базовая валюта: THB (฿). Укажите курс конвертации из THB.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadRates}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
            {hasChanges && (
              <Button 
                size="sm" 
                onClick={saveRates}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(CURRENCY_META).map(([code, meta], index) => {
            const currentRate = rates.find(r => r.code === code);
            const isBase = code === 'THB';
            const example = !isBase && editedRates[code] 
              ? getExampleConversion(code, parseFloat(editedRates[code]) || 0)
              : null;

            return (
              <motion.div
                key={code}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-xl border ${isBase ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{meta.flag}</span>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {code}
                        {isBase && (
                          <Badge variant="secondary" className="text-xs">
                            Базовая
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{meta.nameRu}</div>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-primary">{meta.symbol}</span>
                </div>

                {isBase ? (
                  <div className="text-sm text-muted-foreground">
                    Все цены в системе хранятся в THB
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Курс (1 THB = X {code})
                      </Label>
                      <Input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={editedRates[code] || ''}
                        onChange={(e) => handleRateChange(code, e.target.value)}
                        className="mt-1"
                        placeholder="0.0000"
                      />
                    </div>
                    
                    {example && (
                      <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                        {example}
                      </div>
                    )}

                    {currentRate?.updated_at && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="w-3 h-3 text-success" />
                        Обновлено: {format(new Date(currentRate.updated_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-warning/10 border border-warning/20">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-warning">Как работает конвертация:</p>
              <ul className="mt-1 text-warning/80 space-y-1">
                <li>• Все цены в каталоге хранятся в THB</li>
                <li>• При отображении пользователю цены конвертируются по текущему курсу</li>
                <li>• Пользователь выбирает валюту отображения в настройках</li>
                <li>• Оплата всегда происходит в THB</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
