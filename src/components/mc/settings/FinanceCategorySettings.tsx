import { useLanguage } from '@/contexts/LanguageContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/hooks/usePropertyFinancials';
import { useCompanyCategorySettings, useToggleCategorySetting, useInitCategorySettings } from '@/hooks/useCompanyCategorySettings';
import { useFinancialCategories, useCreateFinancialCategory } from '@/hooks/useFinancialCategories';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

function CategorySection({ type }: { type: 'expense' | 'income' }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const standardCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const { enabledCodes, hasSettings, isLoading } = useCompanyCategorySettings(type);
  const toggleMutation = useToggleCategorySetting();
  const initMutation = useInitCategorySettings();
  const { categories } = useFinancialCategories(type);
  const createCategory = useCreateFinancialCategory();

  const [showAdd, setShowAdd] = useState(false);
  const [newNameEn, setNewNameEn] = useState('');
  const [newNameRu, setNewNameRu] = useState('');

  // Initialize settings if none exist yet
  const handleInit = () => initMutation.mutate(type);

  const handleToggle = (code: string, currentEnabled: boolean) => {
    toggleMutation.mutate({
      category_type: type,
      category_code: code,
      is_enabled: !currentEnabled,
    });
  };

  const handleAddCustom = async () => {
    if (!newNameEn.trim()) return;
    const code = newNameEn.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    await createCategory.mutateAsync({
      category_type: type,
      code,
      name_en: newNameEn.trim(),
      name_ru: newNameRu.trim() || newNameEn.trim(),
    });
    setShowAdd(false);
    setNewNameEn('');
    setNewNameRu('');
  };

  if (isLoading) {
    return <div className="flex items-center gap-2 py-4 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {isRu ? 'Загрузка...' : 'Loading...'}</div>;
  }

  const customCategories = categories.filter(c => c.isCustom);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {type === 'expense' 
            ? (isRu ? 'Категории расходов' : 'Expense Categories')
            : (isRu ? 'Категории доходов' : 'Income Categories')
          }
        </h3>
        {!hasSettings && (
          <Button variant="outline" size="sm" onClick={handleInit} disabled={initMutation.isPending}>
            {initMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : (isRu ? 'Настроить' : 'Configure')}
          </Button>
        )}
      </div>

      {!hasSettings && (
        <p className="text-xs text-muted-foreground">
          {isRu
            ? 'Все категории активны по умолчанию. Нажмите "Настроить", чтобы выбрать нужные.'
            : 'All categories are active by default. Click "Configure" to customize.'}
        </p>
      )}

      {hasSettings && (
        <div className="space-y-1">
          {standardCategories.map(cat => {
            const isEnabled = enabledCodes ? enabledCodes.has(cat.value) : true;
            return (
              <div key={cat.value} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="text-sm text-foreground">
                  {isRu ? cat.labelRu : cat.labelEn}
                </span>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={() => handleToggle(cat.value, isEnabled)}
                  disabled={toggleMutation.isPending}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Custom categories */}
      {customCategories.length > 0 && (
        <div className="pt-2 border-t border-border">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            {isRu ? 'Кастомные категории' : 'Custom Categories'}
          </h4>
          {customCategories.map(cat => (
            <div key={cat.code} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
              <span className="text-sm text-foreground">
                {isRu ? cat.name_ru : cat.name_en}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        {isRu ? 'Добавить свою' : 'Add custom'}
      </Button>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>
              {isRu
                ? type === 'expense' ? 'Новая статья расхода' : 'Новая статья дохода'
                : type === 'expense' ? 'New expense category' : 'New income category'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">{isRu ? 'Название (EN)' : 'Name (EN)'}</Label>
              <Input value={newNameEn} onChange={e => setNewNameEn(e.target.value)} placeholder="e.g. Pool Maintenance" className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">{isRu ? 'Название (RU)' : 'Name (RU)'}</Label>
              <Input value={newNameRu} onChange={e => setNewNameRu(e.target.value)} placeholder="напр. Обслуживание бассейна" className="h-9 mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>{isRu ? 'Отмена' : 'Cancel'}</Button>
            <Button size="sm" disabled={!newNameEn.trim() || createCategory.isPending} onClick={handleAddCustom}>
              {createCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRu ? 'Добавить' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function FinanceCategorySettings() {
  return (
    <div className="space-y-8">
      <CategorySection type="expense" />
      <CategorySection type="income" />
    </div>
  );
}
