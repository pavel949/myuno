/**
 * AirbnbCategoryRibbon — Horizontal scrollable category icons
 * Phuket-specific differentiators that match real search patterns
 */
import { memo } from 'react';
import { 
  Waves, Footprints, Eye, Droplets, Lock, 
  WashingMachine, PawPrint, Baby, Car, Wifi, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export interface CategoryItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelRu: string;
  labelTh: string;
}

export const PROPERTY_CATEGORIES: CategoryItem[] = [
  { id: 'beachfront', icon: Waves, labelEn: 'Beach', labelRu: 'Пляж', labelTh: 'หาด' },
  { id: 'walk_to_beach', icon: Footprints, labelEn: 'Walk', labelRu: 'Пешком', labelTh: 'เดินถึง' },
  { id: 'sea_view', icon: Eye, labelEn: 'Sea', labelRu: 'Море', labelTh: 'วิวทะเล' },
  { id: 'private_pool', icon: Lock, labelEn: 'Priv pool', labelRu: 'Свой пул', labelTh: 'สระส่วนตัว' },
  { id: 'pool', icon: Droplets, labelEn: 'Pool', labelRu: 'Пул', labelTh: 'สระว่ายน้ำ' },
  { id: 'washer', icon: WashingMachine, labelEn: 'Washer', labelRu: 'Стирка', labelTh: 'เครื่องซักผ้า' },
  { id: 'pet_friendly', icon: PawPrint, labelEn: 'Pets', labelRu: 'Питомцы', labelTh: 'สัตว์เลี้ยง' },
  { id: 'kid_friendly', icon: Baby, labelEn: 'Kids', labelRu: 'Дети', labelTh: 'เด็ก' },
  { id: 'parking', icon: Car, labelEn: 'Parking', labelRu: 'Авто', labelTh: 'ที่จอดรถ' },
  { id: 'wifi', icon: Wifi, labelEn: 'WiFi', labelRu: 'WiFi', labelTh: 'WiFi' },
  { id: 'luxury', icon: Sparkles, labelEn: 'Luxury', labelRu: 'Люкс', labelTh: 'หรูหรา' },
];

interface AirbnbCategoryRibbonProps {
  selected: string[];
  onChange: (categories: string[]) => void;
  className?: string;
}

export const AirbnbCategoryRibbon = memo(function AirbnbCategoryRibbon({
  selected,
  onChange,
  className,
}: AirbnbCategoryRibbonProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';

  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter(s => s !== id)
        : [...selected, id]
    );
  };

  return (
    <div className={cn("flex gap-0 overflow-x-auto scrollbar-hide touch-pan-y", className)}>
      {PROPERTY_CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = selected.includes(cat.id);
        return (
          <button
            key={cat.id}
            onClick={() => toggle(cat.id)}
            className={cn(
              "flex flex-col items-center gap-1 px-2 pt-1.5 pb-1.5 shrink-0 transition-all",
              "border-b-2 min-w-[48px]",
              isActive
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground/70 hover:text-muted-foreground hover:border-muted-foreground/30"
            )}
          >
            <Icon className={cn("w-4 h-4", isActive && "text-foreground")} />
            <span className="text-[9px] font-medium whitespace-nowrap leading-none">
              {isRu ? cat.labelRu : isTh ? cat.labelTh : cat.labelEn}
            </span>
          </button>
        );
      })}
    </div>
  );
});
