import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronUp,
  Utensils,
  Car,
  Sparkles,
  Stethoscope,
  GraduationCap,
  Brush,
  Wrench,
  Baby,
  Flower2,
  Gift,
  LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryItem {
  id: string;
  slug: string;
  icon: React.ElementType;
  title: string;
  titleRu: string;
  color: string;
  serviceCount?: number;
}

const categories: CategoryItem[] = [
  { id: '1', slug: 'restaurants', icon: Utensils, title: 'Restaurants', titleRu: 'Рестораны', color: 'text-warning' },
  { id: '2', slug: 'transport', icon: Car, title: 'Transport', titleRu: 'Транспорт', color: 'text-info' },
  
  { id: '4', slug: 'health', icon: Stethoscope, title: 'Health', titleRu: 'Здоровье', color: 'text-success' },
  { id: '5', slug: 'education', icon: GraduationCap, title: 'Education', titleRu: 'Образование', color: 'text-purple-500' },
  { id: '6', slug: 'cleaning', icon: Brush, title: 'Cleaning', titleRu: 'Клининг', color: 'text-cyan-500' },
  { id: '7', slug: 'repairs', icon: Wrench, title: 'Repairs', titleRu: 'Ремонт', color: 'text-amber-500' },
  { id: '8', slug: 'childcare', icon: Baby, title: 'Childcare', titleRu: 'Няни', color: 'text-rose-500' },
  { id: '9', slug: 'flowers', icon: Flower2, title: 'Flowers', titleRu: 'Цветы', color: 'text-fuchsia-500' },
  { id: '10', slug: 'gifts', icon: Gift, title: 'Gifts', titleRu: 'Подарки', color: 'text-red-500' },
];

interface VendorCategoryGridProps {
  serviceCounts?: Record<string, number>;
}

export function VendorCategoryGrid({ serviceCounts = {} }: VendorCategoryGridProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleCategories = isExpanded ? categories : categories.slice(0, 6);
  const hasMore = categories.length > 6;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-primary" />
          {isRu ? 'Категории услуг' : 'Service Categories'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-2">
          {visibleCategories.map((category) => {
            const count = serviceCounts[category.slug] || 0;
            return (
              <Button
                key={category.id}
                variant="ghost"
                className="h-auto flex-col gap-1.5 py-3 hover:bg-muted relative"
                onClick={() => navigate(`/vendor/services?category=${category.slug}`)}
              >
                <div className={cn(
                  "p-2 rounded-full bg-muted",
                  category.color
                )}>
                  <category.icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium">
                  {isRu ? category.titleRu : category.title}
                </span>
                {count > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] text-[10px] px-1"
                  >
                    {count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
        
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-muted-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                {isRu ? 'Свернуть' : 'Show Less'}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                {isRu ? 'Показать все' : 'Show All'} ({categories.length - 6})
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
