import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { 
  Brush, Wrench, Lightbulb, Droplet, Package, 
  Sofa, Plug, FileText, ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickCategoryGridProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
}

const QUICK_CATEGORIES = [
  { value: 'cleaning', icon: Brush, labelRu: 'Уборка', labelEn: 'Cleaning', color: 'text-blue-500' },
  { value: 'repair', icon: Wrench, labelRu: 'Ремонт', labelEn: 'Repair', color: 'text-orange-500' },
  { value: 'electricity', icon: Lightbulb, labelRu: 'Электричество', labelEn: 'Electricity', color: 'text-yellow-500' },
  { value: 'water', icon: Droplet, labelRu: 'Вода', labelEn: 'Water', color: 'text-cyan-500' },
  { value: 'supplies', icon: Package, labelRu: 'Расходники', labelEn: 'Supplies', color: 'text-purple-500' },
  { value: 'furniture', icon: Sofa, labelRu: 'Мебель', labelEn: 'Furniture', color: 'text-amber-600' },
  { value: 'appliances', icon: Plug, labelRu: 'Техника', labelEn: 'Appliances', color: 'text-emerald-500' },
  { value: 'shopping', icon: ShoppingBag, labelRu: 'Закупки', labelEn: 'Shopping', color: 'text-pink-500' },
  { value: 'other', icon: FileText, labelRu: 'Прочее', labelEn: 'Other', color: 'text-muted-foreground' },
];

export function QuickCategoryGrid({
  selectedCategory,
  onSelect
}: QuickCategoryGridProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="grid grid-cols-3 gap-2">
      {QUICK_CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isSelected = selectedCategory === cat.value;
        
        return (
          <Button
            key={cat.value}
            type="button"
            variant={isSelected ? 'default' : 'outline'}
            className={cn(
              'h-auto flex-col gap-1.5 py-3',
              isSelected && 'ring-2 ring-primary ring-offset-2'
            )}
            onClick={() => onSelect(cat.value)}
          >
            <div className={cn(
              'p-1.5 rounded-full',
              isSelected ? 'bg-primary-foreground/20' : 'bg-muted'
            )}>
              <Icon className={cn('h-4 w-4', isSelected ? 'text-primary-foreground' : cat.color)} />
            </div>
            <span className="text-[11px] font-medium leading-tight">
              {isRu ? cat.labelRu : cat.labelEn}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
