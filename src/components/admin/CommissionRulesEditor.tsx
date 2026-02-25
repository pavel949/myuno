import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Plus, Trash2, Percent, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCommissionRules, TieredRate } from '@/hooks/useCommissionRules';
import { getVerticalLabel } from '@/hooks/useAdminFinance';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface TierEditorProps {
  tiers: TieredRate[];
  onChange: (tiers: TieredRate[]) => void;
}

function TierEditor({ tiers, onChange }: TierEditorProps) {
  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMinGmv = lastTier ? (lastTier.max_gmv || lastTier.min_gmv + 10000) : 0;
    onChange([...tiers, { min_gmv: newMinGmv, max_gmv: newMinGmv + 10000, rate: 10 }]);
  };

  const updateTier = (index: number, field: keyof TieredRate, value: number | null) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    onChange(newTiers);
  };

  const removeTier = (index: number) => {
    onChange(tiers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Тиеры по GMV</Label>
        <Button type="button" variant="outline" size="sm" onClick={addTier}>
          <Plus className="w-4 h-4 mr-1" />
          Добавить тиер
        </Button>
      </div>

      {tiers.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          Нет тиеров. Будет использоваться базовая ставка.
        </p>
      ) : (
        <div className="space-y-2">
          {tiers.map((tier, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">От GMV</Label>
                  <Input
                    type="number"
                    value={tier.min_gmv}
                    onChange={(e) => updateTier(index, 'min_gmv', Number(e.target.value))}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">До GMV</Label>
                  <Input
                    type="number"
                    value={tier.max_gmv || ''}
                    placeholder="∞"
                    onChange={(e) => updateTier(index, 'max_gmv', e.target.value ? Number(e.target.value) : null)}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Ставка %</Label>
                  <Input
                    type="number"
                    value={tier.rate}
                    onChange={(e) => updateTier(index, 'rate', Number(e.target.value))}
                    className="h-8"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeTier(index)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CommissionRulesEditor() {
  const { rules, isLoading, updateRule } = useCommissionRules();
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, {
    base_commission: number;
    min_commission_amount: number | null;
    max_commission_amount: number | null;
    tiered_rates: TieredRate[];
    is_active: boolean;
  }>>({});

  const initFormData = (vertical: string) => {
    const rule = rules.find(r => r.vertical === vertical);
    if (rule && !formData[vertical]) {
      setFormData(prev => ({
        ...prev,
        [vertical]: {
          base_commission: rule.base_commission,
          min_commission_amount: rule.min_commission_amount,
          max_commission_amount: rule.max_commission_amount,
          tiered_rates: rule.tiered_rates?.tiers || [],
          is_active: rule.is_active,
        },
      }));
    }
  };

  const handleSave = async (vertical: string) => {
    const data = formData[vertical];
    if (!data) return;

    await updateRule.mutateAsync({
      vertical,
      data: {
        base_commission: data.base_commission,
        min_commission_amount: data.min_commission_amount,
        max_commission_amount: data.max_commission_amount,
        tiered_rates: data.tiered_rates.length > 0 ? { tiers: data.tiered_rates } : null,
        is_active: data.is_active,
      },
    });
    setEditingRule(null);
  };

  const updateFormField = (vertical: string, field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [vertical]: {
        ...prev[vertical],
        [field]: value,
      },
    }));
  };

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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Настройка комиссий по вертикалям
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="space-y-2">
          {rules.map((rule, index) => {
            const data = formData[rule.vertical] || {
              base_commission: rule.base_commission,
              min_commission_amount: rule.min_commission_amount,
              max_commission_amount: rule.max_commission_amount,
              tiered_rates: rule.tiered_rates?.tiers || [],
              is_active: rule.is_active,
            };

            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <AccordionItem value={rule.vertical} className="border rounded-lg px-4">
                  <AccordionTrigger 
                    className="hover:no-underline"
                    onClick={() => initFormData(rule.vertical)}
                  >
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${rule.is_active ? 'bg-success' : 'bg-muted-foreground'}`} />
                        <span className="font-medium">{getVerticalLabel(rule.vertical)}</span>
                        <span className="text-muted-foreground text-sm">({rule.vertical})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium">
                          {rule.base_commission}%
                        </span>
                        {rule.tiered_rates?.tiers && rule.tiered_rates.tiers.length > 0 && (
                          <span className="px-2 py-1 bg-info/10 text-info rounded-md text-xs">
                            {rule.tiered_rates.tiers.length} тиеров
                          </span>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`base-${rule.vertical}`}>Базовая комиссия (%)</Label>
                        <div className="relative mt-1">
                          <Input
                            id={`base-${rule.vertical}`}
                            type="number"
                            step="0.1"
                            value={data.base_commission}
                            onChange={(e) => updateFormField(rule.vertical, 'base_commission', Number(e.target.value))}
                          />
                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`min-${rule.vertical}`}>Мин. комиссия (THB)</Label>
                        <div className="relative mt-1">
                          <Input
                            id={`min-${rule.vertical}`}
                            type="number"
                            placeholder="Не ограничено"
                            value={data.min_commission_amount || ''}
                            onChange={(e) => updateFormField(rule.vertical, 'min_commission_amount', e.target.value ? Number(e.target.value) : null)}
                          />
                          <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`max-${rule.vertical}`}>Макс. комиссия (THB)</Label>
                        <div className="relative mt-1">
                          <Input
                            id={`max-${rule.vertical}`}
                            type="number"
                            placeholder="Не ограничено"
                            value={data.max_commission_amount || ''}
                            onChange={(e) => updateFormField(rule.vertical, 'max_commission_amount', e.target.value ? Number(e.target.value) : null)}
                          />
                          <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>

                    <TierEditor
                      tiers={data.tiered_rates}
                      onChange={(tiers) => updateFormField(rule.vertical, 'tiered_rates', tiers)}
                    />

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={data.is_active}
                          onCheckedChange={(checked) => updateFormField(rule.vertical, 'is_active', checked)}
                        />
                        <Label>Активно</Label>
                      </div>
                      <Button 
                        onClick={() => handleSave(rule.vertical)}
                        disabled={updateRule.isPending}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Сохранить
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
