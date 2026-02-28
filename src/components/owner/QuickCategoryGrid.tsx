import { useLanguage } from '@/contexts/LanguageContext';
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
  { value: 'cleaning', icon: Brush, labelRu: 'Уборка', labelEn: 'Cleaning', color: 'text-info bg-info/10' },
  { value: 'repair', icon: Wrench, labelRu: 'Ремонт', labelEn: 'Repair', color: 'text-accent-amber bg-accent-amber/10' },
  { value: 'electricity', icon: Lightbulb, labelRu: 'Свет', labelEn: 'Electric', color: 'text-warning bg-warning/10' },
  { value: 'water', icon: Droplet, labelRu: 'Вода', labelEn: 'Water', color: 'text-accent-cyan bg-accent-cyan/10' },
  { value: 'supplies', icon: Package, labelRu: 'Расходники', labelEn: 'Supplies', color: 'text-accent-purple bg-accent-purple/10' },
  { value: 'furniture', icon: Sofa, labelRu: 'Мебель', labelEn: 'Furniture', color: 'text-warning bg-warning/10' },
  { value: 'appliances', icon: Plug, labelRu: 'Техника', labelEn: 'Tech', color: 'text-success bg-success/10' },
  { value: 'shopping', icon: ShoppingBag, labelRu: 'Закупки', labelEn: 'Shopping', color: 'text-destructive bg-destructive/10' },
  { value: 'other', icon: FileText, labelRu: 'Прочее', labelEn: 'Other', color: 'text-muted-foreground bg-muted' },
];

export function QuickCategoryGrid({
  selectedCategory,
  onSelect
}: QuickCategoryGridProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
      {QUICK_CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isSelected = selectedCategory === cat.value;
        
        return (
          <button
            key={cat.value}
            type="button"
            onClick={() => onSelect(cat.value)}
            className={cn(
              'flex flex-col items-center gap-1 p-2.5 rounded-xl shrink-0 min-w-[64px] transition-all',
              'border-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
              isSelected 
                ? 'border-primary bg-primary text-primary-foreground shadow-md' 
                : 'border-transparent bg-card hover:bg-muted'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shadow-sm',
              isSelected ? 'bg-primary-foreground/20' : cat.color
            )}>
              <Icon className={cn('h-5 w-5', isSelected && 'text-primary-foreground')} strokeWidth={2.2} />
            </div>
            <span className={cn(
              'text-[10px] font-medium leading-tight whitespace-nowrap',
              isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
            )}>
              {isRu ? cat.labelRu : cat.labelEn}
            </span>
          </button>
        );
      })}
    </div>
  );
}
