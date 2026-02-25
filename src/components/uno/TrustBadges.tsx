import { useTrustBadges } from "@/hooks/useReviews";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, Star, Clock, Award, FileCheck, Leaf 
} from "lucide-react";

interface TrustBadgesProps {
  providerId?: string;
  compact?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'shield-check': ShieldCheck,
  'star': Star,
  'clock': Clock,
  'award': Award,
  'file-check': FileCheck,
  'leaf': Leaf,
};

const colorMap: Record<string, string> = {
  'primary': 'bg-primary/10 text-primary border-primary/20',
  'warning': 'bg-warning/10 text-warning border-warning/20',
  'success': 'bg-success/10 text-success border-success/20',
  'accent': 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
  'info': 'bg-info/10 text-info border-info/20',
};

export const TrustBadges = ({ providerId, compact = false }: TrustBadgesProps) => {
  const { language } = useLanguage();
  const { badges, isLoading } = useTrustBadges(providerId);

  if (isLoading || badges.length === 0) return null;

  return (
    <div className={`flex ${compact ? 'gap-1' : 'gap-2'} flex-wrap`}>
      {badges.map(badge => {
        const IconComponent = iconMap[badge.icon] || ShieldCheck;
        const colorClass = colorMap[badge.color] || colorMap.primary;

        return (
          <Badge
            key={badge.id}
            variant="outline"
            className={`${colorClass} ${compact ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'}`}
            title={language === 'ru' ? badge.description_ru || '' : badge.description_en || ''}
          >
            <IconComponent className={compact ? 'w-3 h-3 mr-0.5' : 'w-3.5 h-3.5 mr-1'} />
            {language === 'ru' ? badge.name_ru : badge.name_en}
          </Badge>
        );
      })}
    </div>
  );
};
