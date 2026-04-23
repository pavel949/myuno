import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFinancialCategories, useCreateFinancialCategory } from '@/hooks/useFinancialCategories';
import { CLASS_LABELS, CLASS_COLORS, type CategoryClass } from '@/lib/categoryDefaults';
import type { LucideIcon } from 'lucide-react';
import { 
  Brush, Wrench, Lightbulb, Droplet, Package, 
  Sofa, Plug, FileText, ShoppingBag, Shield, DollarSign,
  Wifi, Scale, Megaphone, Building, CreditCard,
  Calculator, PiggyBank, Plus, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface QuickCategoryGridProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
  type?: 'expense' | 'income';
}

const ICON_MAP: Record<string, LucideIcon> = {
  cleaning: Brush,
  repair: Wrench,
  maintenance: Wrench,
  electricity: Lightbulb,
  water: Droplet,
  supplies: Package,
  furniture: Sofa,
  appliances: Plug,
  shopping: ShoppingBag,
  insurance: Shield,
  taxes: DollarSign,
  income_tax: Calculator,
  management_fee: Building,
  platform_fee: CreditCard,
  internet: Wifi,
  utilities: Droplet,
  depreciation: PiggyBank,
  loan_payment: CreditCard,
  legal: Scale,
  advertising: Megaphone,
  other: FileText,
  other_expense: FileText,
  rent: Building,
  deposit: Shield,
  cleaning_fee: Brush,
  late_fee: DollarSign,
  other_income: DollarSign,
};

const COLOR_MAP: Record<string, string> = {
  cleaning: 'text-info bg-info/10',
  repair: 'text-accent-amber bg-accent-amber/10',
  maintenance: 'text-accent-amber bg-accent-amber/10',
  electricity: 'text-warning bg-warning/10',
  water: 'text-accent-cyan bg-accent-cyan/10',
  supplies: 'text-accent-purple bg-accent-purple/10',
  furniture: 'text-warning bg-warning/10',
  appliances: 'text-success bg-success/10',
  shopping: 'text-destructive bg-destructive/10',
  insurance: 'text-info bg-info/10',
  taxes: 'text-destructive bg-destructive/10',
  management_fee: 'text-primary bg-primary/10',
  platform_fee: 'text-muted-foreground bg-muted',
  internet: 'text-accent-cyan bg-accent-cyan/10',
  utilities: 'text-accent-cyan bg-accent-cyan/10',
  legal: 'text-info bg-info/10',
  advertising: 'text-accent-purple bg-accent-purple/10',
  rent: 'text-success bg-success/10',
  deposit: 'text-info bg-info/10',
  cleaning_fee: 'text-info bg-info/10',
  late_fee: 'text-warning bg-warning/10',
  other_income: 'text-success bg-success/10',
};

export function QuickCategoryGrid({
  selectedCategory,
  onSelect,
  type = 'expense',
}: QuickCategoryGridProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { categories } = useFinancialCategories(type);
  const createCategory = useCreateFinancialCategory();
  const [showAdd, setShowAdd] = useState(false);
  const [newNameEn, setNewNameEn] = useState('');
  const [newNameRu, setNewNameRu] = useState('');

  const handleAddCategory = async () => {
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
    onSelect(code);
  };

  return (
    <>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        {categories.map((cat) => {
          const Icon = ICON_MAP[cat.code] || FileText;
          const isSelected = selectedCategory === cat.code;
          const color = cat.color || COLOR_MAP[cat.code] || 'text-muted-foreground bg-muted';
          
          return (
            <button
              key={cat.code}
              type="button"
              onClick={() => onSelect(cat.code)}
              className={cn(
                'flex flex-col items-center gap-1 p-2.5 rounded-none shrink-0 min-w-[64px] transition-all',
                'border-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                isSelected 
                  ? 'border-primary bg-primary text-primary-foreground shadow-md' 
                  : 'border-transparent bg-card hover:bg-muted'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-none flex items-center justify-center shadow-sm',
                isSelected ? 'bg-primary-foreground/20' : color
              )}>
                <Icon className={cn('h-5 w-5', isSelected && 'text-primary-foreground')} strokeWidth={2.2} />
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-tight whitespace-nowrap max-w-[64px] truncate',
                isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
              )}>
                {isRu ? cat.name_ru : cat.name_en}
              </span>
              {/* Classification badge */}
              {!isSelected && (
                <span className={cn(
                  'text-[8px] leading-none px-1 py-0.5 rounded-none font-medium border',
                  CLASS_COLORS[cat.category_class] || 'text-muted-foreground bg-muted'
                )}>
                  {isRu ? CLASS_LABELS[cat.category_class]?.ru?.charAt(0) : CLASS_LABELS[cat.category_class]?.en?.charAt(0)}
                </span>
              )}
              {cat.isCustom && (
                <span className="w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}

        {/* Add custom category button */}
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className={cn(
            'flex flex-col items-center gap-1 p-2.5 rounded-none shrink-0 min-w-[64px] transition-all',
            'border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted'
          )}
        >
          <div className="w-10 h-10 rounded-none flex items-center justify-center bg-muted">
            <Plus className="h-5 w-5 text-muted-foreground" strokeWidth={2.2} />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
            {isRu ? 'Своя' : 'Custom'}
          </span>
        </button>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>
              {isRu
                ? type === 'expense' ? 'Новая статья расхода' : 'Новая статья дохода'
                : type === 'expense' ? 'New expense category' : 'New income category'
              }
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">{isRu ? 'Название (EN)' : 'Name (EN)'}</Label>
              <Input
                value={newNameEn}
                onChange={(e) => setNewNameEn(e.target.value)}
                placeholder="e.g. Pool Maintenance"
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">{isRu ? 'Название (RU)' : 'Name (RU)'}</Label>
              <Input
                value={newNameRu}
                onChange={(e) => setNewNameRu(e.target.value)}
                placeholder="напр. Обслуживание бассейна"
                className="h-9 mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button
              size="sm"
              disabled={!newNameEn.trim() || createCategory.isPending}
              onClick={handleAddCategory}
            >
              {createCategory.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                isRu ? 'Добавить' : 'Add'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
