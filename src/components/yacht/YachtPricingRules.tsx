import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useYachtPricingRules, YachtPricingRule, CreatePricingRuleInput } from '@/hooks/useYachtPricingRules';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  DollarSign, 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar,
  Percent,
  ChevronDown,
  Sun,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface YachtPricingRulesProps {
  yachtId: string;
  basePriceHalfDay: number;
  basePriceFullDay: number;
  currency?: string;
  className?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label_en: 'Sunday', label_ru: 'Воскресенье' },
  { value: 1, label_en: 'Monday', label_ru: 'Понедельник' },
  { value: 2, label_en: 'Tuesday', label_ru: 'Вторник' },
  { value: 3, label_en: 'Wednesday', label_ru: 'Среда' },
  { value: 4, label_en: 'Thursday', label_ru: 'Четверг' },
  { value: 5, label_en: 'Friday', label_ru: 'Пятница' },
  { value: 6, label_en: 'Saturday', label_ru: 'Суббота' },
];

export function YachtPricingRules({ 
  yachtId, 
  basePriceHalfDay,
  basePriceFullDay,
  currency = 'THB',
  className 
}: YachtPricingRulesProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const { rules, createRule, updateRule, deleteRule, isCreating, isDeleting } = useYachtPricingRules(yachtId);

  const [isOpen, setIsOpen] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<YachtPricingRule | null>(null);
  const [formData, setFormData] = useState<Partial<CreatePricingRuleInput>>({
    rule_type: 'season',
    name_en: '',
    name_ru: '',
    is_active: true,
    priority: 0,
  });

  const resetForm = () => {
    setFormData({
      rule_type: 'season',
      name_en: '',
      name_ru: '',
      is_active: true,
      priority: 0,
    });
    setEditingRule(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const handleOpenEdit = (rule: YachtPricingRule) => {
    setEditingRule(rule);
    setFormData({
      rule_type: rule.rule_type,
      name_en: rule.name_en,
      name_ru: rule.name_ru || '',
      start_date: rule.start_date || undefined,
      end_date: rule.end_date || undefined,
      days_of_week: rule.days_of_week || undefined,
      price_modifier_percent: rule.price_modifier_percent || undefined,
      price_override_half_day: rule.price_override_half_day || undefined,
      price_override_full_day: rule.price_override_full_day || undefined,
      priority: rule.priority,
      is_active: rule.is_active,
    });
    setShowAddDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name_en?.trim()) {
      toast.error(isRu ? 'Введите название' : 'Enter a name');
      return;
    }

    try {
      if (editingRule) {
        await updateRule({ id: editingRule.id, ...formData });
        toast.success(isRu ? 'Правило обновлено' : 'Rule updated');
      } else {
        await createRule({
          yacht_id: yachtId,
          ...formData,
        } as CreatePricingRuleInput);
        toast.success(isRu ? 'Правило добавлено' : 'Rule added');
      }
      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error(isRu ? 'Ошибка сохранения' : 'Error saving');
    }
  };

  const handleDelete = async (ruleId: string) => {
    try {
      await deleteRule(ruleId);
      toast.success(isRu ? 'Правило удалено' : 'Rule deleted');
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error(isRu ? 'Ошибка удаления' : 'Error deleting');
    }
  };

  const handleToggleActive = async (rule: YachtPricingRule) => {
    try {
      await updateRule({ id: rule.id, is_active: !rule.is_active });
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'season': return <Sun className="h-4 w-4" />;
      case 'day_of_week': return <Calendar className="h-4 w-4" />;
      case 'special_event': return <Sparkles className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const formatRuleDetails = (rule: YachtPricingRule) => {
    const parts: string[] = [];
    
    if (rule.rule_type === 'season' && rule.start_date && rule.end_date) {
      parts.push(`${format(new Date(rule.start_date), 'dd.MM')} - ${format(new Date(rule.end_date), 'dd.MM')}`);
    }
    
    if (rule.rule_type === 'day_of_week' && rule.days_of_week?.length) {
      const dayNames = rule.days_of_week.map(d => {
        const day = DAYS_OF_WEEK.find(dw => dw.value === d);
        return (isRu ? day?.label_ru : day?.label_en)?.slice(0, 3);
      });
      parts.push(dayNames.join(', '));
    }
    
    if (rule.price_modifier_percent) {
      const sign = rule.price_modifier_percent > 0 ? '+' : '';
      parts.push(`${sign}${rule.price_modifier_percent}%`);
    }
    
    if (rule.price_override_full_day) {
      parts.push(`฿${rule.price_override_full_day.toLocaleString()}/day`);
    }
    
    return parts.join(' • ');
  };

  return (
    <Card className={cn("", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <CardTitle className="text-base">
                {isRu ? 'Правила ценообразования' : 'Pricing Rules'}
              </CardTitle>
              {rules && rules.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {rules.length}
                </Badge>
              )}
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              isOpen && "rotate-180"
            )} />
          </CollapsibleTrigger>
          <CardDescription className="mt-1">
            {isRu 
              ? 'Сезонные цены, выходные надбавки, специальные даты' 
              : 'Seasonal prices, weekend premiums, special dates'}
          </CardDescription>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Base Prices */}
            <div className="p-3 rounded-lg bg-muted/50 space-y-1">
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Базовые цены' : 'Base Prices'}
              </p>
              <div className="flex gap-4 text-sm">
                <span>
                  <span className="text-muted-foreground">{isRu ? 'Полдня:' : 'Half day:'}</span>{' '}
                  <span className="font-semibold">฿{basePriceHalfDay.toLocaleString()}</span>
                </span>
                <span>
                  <span className="text-muted-foreground">{isRu ? 'Полный день:' : 'Full day:'}</span>{' '}
                  <span className="font-semibold">฿{basePriceFullDay.toLocaleString()}</span>
                </span>
              </div>
            </div>

            {/* Rules List */}
            {rules && rules.length > 0 ? (
              <div className="space-y-2">
                {rules.map((rule) => (
                  <div 
                    key={rule.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      rule.is_active ? "bg-background" : "bg-muted/30 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={cn(
                        "p-2 rounded-lg",
                        rule.rule_type === 'season' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                        rule.rule_type === 'day_of_week' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                        rule.rule_type === 'special_event' && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                      )}>
                        {getRuleIcon(rule.rule_type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {isRu ? (rule.name_ru || rule.name_en) : rule.name_en}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatRuleDetails(rule)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => handleToggleActive(rule)}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(rule)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(rule.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {isRu ? 'Нет правил ценообразования' : 'No pricing rules'}
                </p>
                <p className="text-xs mt-1">
                  {isRu 
                    ? 'Добавьте сезонные или выходные надбавки' 
                    : 'Add seasonal or weekend premiums'}
                </p>
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleOpenAdd}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isRu ? 'Добавить правило' : 'Add Rule'}
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* Add/Edit Rule Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRule 
                ? (isRu ? 'Редактировать правило' : 'Edit Rule')
                : (isRu ? 'Добавить правило' : 'Add Rule')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>{isRu ? 'Тип' : 'Type'}</Label>
              <Select 
                value={formData.rule_type} 
                onValueChange={(v) => setFormData(f => ({ ...f, rule_type: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="season">
                    {isRu ? '☀️ Сезон' : '☀️ Season'}
                  </SelectItem>
                  <SelectItem value="day_of_week">
                    {isRu ? '📅 Дни недели' : '📅 Days of Week'}
                  </SelectItem>
                  <SelectItem value="special_event">
                    {isRu ? '✨ Специальное событие' : '✨ Special Event'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isRu ? 'Название (EN)' : 'Name (EN)'}</Label>
                <Input
                  value={formData.name_en || ''}
                  onChange={(e) => setFormData(f => ({ ...f, name_en: e.target.value }))}
                  placeholder="High Season"
                />
              </div>
              <div>
                <Label>{isRu ? 'Название (RU)' : 'Name (RU)'}</Label>
                <Input
                  value={formData.name_ru || ''}
                  onChange={(e) => setFormData(f => ({ ...f, name_ru: e.target.value }))}
                  placeholder="Высокий сезон"
                />
              </div>
            </div>

            {(formData.rule_type === 'season' || formData.rule_type === 'special_event') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isRu ? 'Начало' : 'Start Date'}</Label>
                  <Input
                    type="date"
                    value={formData.start_date || ''}
                    onChange={(e) => setFormData(f => ({ ...f, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>{isRu ? 'Конец' : 'End Date'}</Label>
                  <Input
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => setFormData(f => ({ ...f, end_date: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {formData.rule_type === 'day_of_week' && (
              <div>
                <Label>{isRu ? 'Дни недели' : 'Days of Week'}</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = formData.days_of_week?.includes(day.value);
                    return (
                      <Button
                        key={day.value}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const current = formData.days_of_week || [];
                          const next = isSelected
                            ? current.filter(d => d !== day.value)
                            : [...current, day.value];
                          setFormData(f => ({ ...f, days_of_week: next }));
                        }}
                      >
                        {(isRu ? day.label_ru : day.label_en).slice(0, 3)}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <Label className="text-muted-foreground text-xs mb-2 block">
                {isRu ? 'Изменение цены' : 'Price Change'}
              </Label>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-xs flex items-center gap-1">
                    <Percent className="h-3 w-3" />
                    {isRu ? 'Модификатор (%)' : 'Modifier (%)'}
                  </Label>
                  <Input
                    type="number"
                    value={formData.price_modifier_percent ?? ''}
                    onChange={(e) => setFormData(f => ({ 
                      ...f, 
                      price_modifier_percent: e.target.value ? Number(e.target.value) : undefined 
                    }))}
                    placeholder="+20"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {isRu 
                      ? '+20 = увеличить на 20%, -10 = скидка 10%' 
                      : '+20 = increase by 20%, -10 = 10% discount'}
                  </p>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  {isRu ? '— или фиксированные цены —' : '— or fixed prices —'}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">{isRu ? 'Полдня (฿)' : 'Half Day (฿)'}</Label>
                    <Input
                      type="number"
                      value={formData.price_override_half_day ?? ''}
                      onChange={(e) => setFormData(f => ({ 
                        ...f, 
                        price_override_half_day: e.target.value ? Number(e.target.value) : undefined 
                      }))}
                      placeholder={basePriceHalfDay.toString()}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{isRu ? 'Полный день (฿)' : 'Full Day (฿)'}</Label>
                    <Input
                      type="number"
                      value={formData.price_override_full_day ?? ''}
                      onChange={(e) => setFormData(f => ({ 
                        ...f, 
                        price_override_full_day: e.target.value ? Number(e.target.value) : undefined 
                      }))}
                      placeholder={basePriceFullDay.toString()}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs">{isRu ? 'Приоритет' : 'Priority'}</Label>
              <Input
                type="number"
                value={formData.priority ?? 0}
                onChange={(e) => setFormData(f => ({ ...f, priority: Number(e.target.value) || 0 }))}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                {isRu 
                  ? 'Правила с большим приоритетом применяются первыми' 
                  : 'Higher priority rules are applied first'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={isCreating}>
              {isCreating 
                ? (isRu ? 'Сохранение...' : 'Saving...') 
                : (isRu ? 'Сохранить' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
