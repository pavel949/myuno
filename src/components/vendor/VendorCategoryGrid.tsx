import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext } from '@/hooks/useUserContext';
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
  Baby,
  Flower2,
  Ship,
  Home,
  Calendar,
  Dumbbell,
  Scale,
  PawPrint,
  LayoutGrid,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryItem {
  id: string;
  slug: string;
  icon: React.ElementType;
  title: string;
  titleRu: string;
  color: string;
  path: string;
}

// All available verticals - must match onboarding options
const allCategories: CategoryItem[] = [
  { id: '1', slug: 'beauty', icon: Sparkles, title: 'Beauty & Spa', titleRu: 'Красота и спа', color: 'text-destructive', path: '/vendor/beauty' },
  { id: '2', slug: 'fitness', icon: Dumbbell, title: 'Fitness', titleRu: 'Фитнес', color: 'text-accent-amber', path: '/vendor/fitness' },
  { id: '3', slug: 'restaurants', icon: Utensils, title: 'Restaurants', titleRu: 'Рестораны', color: 'text-warning', path: '/vendor/restaurants' },
  { id: '4', slug: 'tours', icon: Calendar, title: 'Tours', titleRu: 'Туры', color: 'text-info', path: '/vendor/tours' },
  { id: '5', slug: 'yachts', icon: Ship, title: 'Yachts', titleRu: 'Яхты', color: 'text-accent-cyan', path: '/vendor/yachts' },
  { id: '6', slug: 'transport', icon: Car, title: 'Transport', titleRu: 'Транспорт', color: 'text-accent-purple', path: '/vendor/transport' },
  { id: '7', slug: 'health', icon: Stethoscope, title: 'Health', titleRu: 'Здоровье', color: 'text-success', path: '/vendor/clinics' },
  { id: '8', slug: 'education', icon: GraduationCap, title: 'Education', titleRu: 'Образование', color: 'text-accent-purple', path: '/vendor/education' },
  { id: '9', slug: 'properties', icon: Home, title: 'Properties', titleRu: 'Недвижимость', color: 'text-success', path: '/vendor/properties' },
  { id: '10', slug: 'cleaning', icon: Brush, title: 'Cleaning', titleRu: 'Клининг', color: 'text-accent-teal', path: '/vendor/cleaning' },
  { id: '11', slug: 'childcare', icon: Baby, title: 'Childcare', titleRu: 'Няни', color: 'text-destructive', path: '/vendor/babysitters' },
  { id: '12', slug: 'flowers', icon: Flower2, title: 'Flowers', titleRu: 'Цветы', color: 'text-accent-purple', path: '/vendor/flowers' },
  { id: '13', slug: 'events', icon: Calendar, title: 'Events', titleRu: 'Мероприятия', color: 'text-accent-purple', path: '/vendor/events' },
  { id: '14', slug: 'legal', icon: Scale, title: 'Legal', titleRu: 'Юридические', color: 'text-muted-foreground', path: '/vendor/legal' },
  { id: '15', slug: 'pets', icon: PawPrint, title: 'Pets', titleRu: 'Питомцы', color: 'text-warning', path: '/vendor/pets' },
];

interface VendorCategoryGridProps {
  serviceCounts?: Record<string, number>;
}

export function VendorCategoryGrid({ serviceCounts = {} }: VendorCategoryGridProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { activeOrg } = useUserContext();
  const isRu = language === 'ru';
  const [isExpanded, setIsExpanded] = useState(false);

  // Get verticals from org metadata
  const orgMetadata = activeOrg?.metadata as { verticals?: string[] } | null;
  const vendorVerticals = orgMetadata?.verticals || [];

  // Filter categories based on vendor's selected verticals
  const vendorCategories = vendorVerticals.length > 0
    ? allCategories.filter(cat => vendorVerticals.includes(cat.slug))
    : allCategories; // Fallback to all if none selected (shouldn't happen)

  const visibleCategories = isExpanded ? vendorCategories : vendorCategories.slice(0, 6);
  const hasMore = vendorCategories.length > 6;

  if (vendorCategories.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" />
            {isRu ? 'Ваши категории' : 'Your Categories'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <AlertCircle className="h-4 w-4" />
            {isRu ? 'Категории не выбраны' : 'No categories selected'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-primary" />
          {isRu ? 'Ваши категории' : 'Your Categories'}
          <Badge variant="secondary" className="ml-auto text-xs">
            {vendorCategories.length}
          </Badge>
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
                onClick={() => navigate(category.path)}
              >
                <div className={cn(
                  "p-2 rounded-full bg-muted",
                  category.color
                )}>
                  <category.icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">
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
                {isRu ? 'Показать все' : 'Show All'} ({vendorCategories.length - 6})
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
