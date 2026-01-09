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
  'warning': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  'success': 'bg-green-500/10 text-green-600 border-green-500/20',
  'accent': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'info': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
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
