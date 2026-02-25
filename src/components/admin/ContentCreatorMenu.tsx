/**
 * ContentCreatorMenu - Multi-vertical content creation menu
 * 
 * Provides a stable, user-friendly interface for selecting what type of 
 * content to create for a provider (services, products, bouquets, etc.)
 * 
 * Features:
 * - Fixed position popover to prevent scroll issues
 * - Grouped by content type (Services vs Products)
 * - Auto-approval for admin-created content
 * - Direct navigation to canonical forms
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Package,
  ShoppingCart,
  Flower2,
  Scissors,
  Sparkles,
  Home,
  Car,
  Ship,
  Plane,
  GraduationCap,
  HeartPulse,
  Baby,
  Utensils,
  Briefcase,
  Camera,
  Wrench,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Content type configuration
interface ContentTypeConfig {
  id: string;
  group: 'service' | 'product' | 'property';
  icon: React.ReactNode;
  labelEn: string;
  labelRu: string;
  descriptionEn: string;
  descriptionRu: string;
  route: string;
  color: string;
}

const CONTENT_TYPES: ContentTypeConfig[] = [
  // Services
  {
    id: 'service',
    group: 'service',
    icon: <Package className="h-5 w-5" />,
    labelEn: 'Service',
    labelRu: 'Услуга',
    descriptionEn: 'General service offering',
    descriptionRu: 'Общая услуга',
    route: '/admin/services',
    color: 'text-info bg-info/10',
  },
  {
    id: 'beauty',
    group: 'service',
    icon: <Scissors className="h-5 w-5" />,
    labelEn: 'Beauty Service',
    labelRu: 'Услуга красоты',
    descriptionEn: 'Salon, spa, massage',
    descriptionRu: 'Салон, спа, массаж',
    route: '/admin/services',
    color: 'text-accent-coral bg-accent-coral/10',
  },
  {
    id: 'medical',
    group: 'service',
    icon: <HeartPulse className="h-5 w-5" />,
    labelEn: 'Medical Service',
    labelRu: 'Медицинская услуга',
    descriptionEn: 'Clinic, doctor, therapy',
    descriptionRu: 'Клиника, врач, терапия',
    route: '/admin/services',
    color: 'text-destructive bg-destructive/10',
  },
  {
    id: 'education',
    group: 'service',
    icon: <GraduationCap className="h-5 w-5" />,
    labelEn: 'Education',
    labelRu: 'Образование',
    descriptionEn: 'Tutoring, courses, school',
    descriptionRu: 'Репетиторство, курсы, школа',
    route: '/admin/services',
    color: 'text-accent-purple bg-accent-purple/10',
  },
  {
    id: 'babysitter',
    group: 'service',
    icon: <Baby className="h-5 w-5" />,
    labelEn: 'Babysitter',
    labelRu: 'Няня',
    descriptionEn: 'Childcare services',
    descriptionRu: 'Услуги по уходу за детьми',
    route: '/admin/babysitters',
    color: 'text-accent-purple bg-accent-purple/10',
  },
  {
    id: 'home-service',
    group: 'service',
    icon: <Wrench className="h-5 w-5" />,
    labelEn: 'Home Service',
    labelRu: 'Домашняя услуга',
    descriptionEn: 'Cleaning, repair, maintenance',
    descriptionRu: 'Уборка, ремонт, обслуживание',
    route: '/admin/home-services',
    color: 'text-accent-amber bg-accent-amber/10',
  },
  {
    id: 'legal',
    group: 'service',
    icon: <Briefcase className="h-5 w-5" />,
    labelEn: 'Legal Service',
    labelRu: 'Юридическая услуга',
    descriptionEn: 'Visa, legal, consulting',
    descriptionRu: 'Виза, юрист, консультации',
    route: '/admin/services',
    color: 'text-muted-foreground bg-muted',
  },
  // Products
  {
    id: 'product',
    group: 'product',
    icon: <ShoppingCart className="h-5 w-5" />,
    labelEn: 'Product',
    labelRu: 'Товар',
    descriptionEn: 'General marketplace product',
    descriptionRu: 'Товар маркетплейса',
    route: '/admin/catalog',
    color: 'text-success bg-success/10',
  },
  {
    id: 'bouquet',
    group: 'product',
    icon: <Flower2 className="h-5 w-5" />,
    labelEn: 'Bouquet',
    labelRu: 'Букет',
    descriptionEn: 'Flower arrangement',
    descriptionRu: 'Цветочная композиция',
    route: '/admin/flowers',
    color: 'text-accent-coral bg-accent-coral/10',
  },
  {
    id: 'food',
    group: 'product',
    icon: <Utensils className="h-5 w-5" />,
    labelEn: 'Food & Drink',
    labelRu: 'Еда и напитки',
    descriptionEn: 'Restaurant, cafe, delivery',
    descriptionRu: 'Ресторан, кафе, доставка',
    route: '/admin/catalog',
    color: 'text-warning bg-warning/10',
  },
  // Properties
  {
    id: 'property',
    group: 'property',
    icon: <Home className="h-5 w-5" />,
    labelEn: 'Property',
    labelRu: 'Недвижимость',
    descriptionEn: 'Real estate listing',
    descriptionRu: 'Объект недвижимости',
    route: '/admin/properties',
    color: 'text-accent-teal bg-accent-teal/10',
  },
  {
    id: 'vehicle',
    group: 'property',
    icon: <Car className="h-5 w-5" />,
    labelEn: 'Vehicle',
    labelRu: 'Транспорт',
    descriptionEn: 'Car, bike, scooter',
    descriptionRu: 'Автомобиль, мотоцикл, скутер',
    route: '/admin/vehicles',
    color: 'text-accent-cyan bg-accent-cyan/10',
  },
  {
    id: 'yacht',
    group: 'property',
    icon: <Ship className="h-5 w-5" />,
    labelEn: 'Boat Charter',
    labelRu: 'Чартер',
    descriptionEn: 'Yacht, boat, catamaran charter',
    descriptionRu: 'Аренда яхты, катера, катамарана',
    route: '/admin/yachts',
    color: 'text-info bg-info/10',
  },
];

const GROUP_LABELS = {
  service: { en: 'Services', ru: 'Услуги' },
  product: { en: 'Products', ru: 'Товары' },
  property: { en: 'Properties & Transport', ru: 'Недвижимость и транспорт' },
};

interface ContentCreatorMenuProps {
  providerId: string;
  providerName?: string;
  className?: string;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'default' | 'lg';
}

export function ContentCreatorMenu({
  providerId,
  providerName,
  className,
  variant = 'button',
  size = 'default',
}: ContentCreatorMenuProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [open, setOpen] = useState(false);

  const handleSelect = (contentType: ContentTypeConfig) => {
    setOpen(false);
    
    // Build route with provider ID and action
    const params = new URLSearchParams({
      provider: providerId,
      action: 'new',
      type: contentType.id,
    });
    
    navigate(`${contentType.route}?${params.toString()}`);
  };

  const serviceTypes = CONTENT_TYPES.filter(t => t.group === 'service');
  const productTypes = CONTENT_TYPES.filter(t => t.group === 'product');
  const propertyTypes = CONTENT_TYPES.filter(t => t.group === 'property');

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {variant === 'icon' ? (
          <Button size="icon" className={className}>
            <Plus className="h-4 w-4" />
          </Button>
        ) : (
          <Button size={size} className={cn('gap-2', className)}>
            <Plus className="h-4 w-4" />
            {isRu ? 'Добавить листинг' : 'Add Listing'}
          </Button>
        )}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-72 max-h-[70vh] overflow-y-auto"
        sideOffset={8}
      >
        {providerName && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              {isRu ? 'Создать для' : 'Create for'}: <span className="font-medium text-foreground">{providerName}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Services Group */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2 text-info">
            <Package className="h-4 w-4" />
            {isRu ? GROUP_LABELS.service.ru : GROUP_LABELS.service.en}
          </DropdownMenuLabel>
          {serviceTypes.map((type) => (
            <DropdownMenuItem
              key={type.id}
              onClick={() => handleSelect(type)}
              className="cursor-pointer py-2.5"
            >
              <div className={cn('p-1.5 rounded-md mr-3', type.color)}>
                {type.icon}
              </div>
              <div className="flex flex-col">
                <span className="font-medium">
                  {isRu ? type.labelRu : type.labelEn}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isRu ? type.descriptionRu : type.descriptionEn}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Products Group */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2 text-success">
            <ShoppingCart className="h-4 w-4" />
            {isRu ? GROUP_LABELS.product.ru : GROUP_LABELS.product.en}
          </DropdownMenuLabel>
          {productTypes.map((type) => (
            <DropdownMenuItem
              key={type.id}
              onClick={() => handleSelect(type)}
              className="cursor-pointer py-2.5"
            >
              <div className={cn('p-1.5 rounded-md mr-3', type.color)}>
                {type.icon}
              </div>
              <div className="flex flex-col">
                <span className="font-medium">
                  {isRu ? type.labelRu : type.labelEn}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isRu ? type.descriptionRu : type.descriptionEn}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Properties Group */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2 text-accent-teal">
            <Home className="h-4 w-4" />
            {isRu ? GROUP_LABELS.property.ru : GROUP_LABELS.property.en}
          </DropdownMenuLabel>
          {propertyTypes.map((type) => (
            <DropdownMenuItem
              key={type.id}
              onClick={() => handleSelect(type)}
              className="cursor-pointer py-2.5"
            >
              <div className={cn('p-1.5 rounded-md mr-3', type.color)}>
                {type.icon}
              </div>
              <div className="flex flex-col">
                <span className="font-medium">
                  {isRu ? type.labelRu : type.labelEn}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isRu ? type.descriptionRu : type.descriptionEn}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
