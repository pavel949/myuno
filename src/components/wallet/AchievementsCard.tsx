import { useLoyalty, AchievementDefinition, Achievement } from "@/hooks/useLoyalty";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Rocket, 
  Star, 
  Trophy, 
  MessageCircle, 
  Camera, 
  Users, 
  Heart,
  Sunrise,
  Award,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

const achievementIcons: Record<string, React.ReactNode> = {
  rocket: <Rocket className="h-5 w-5" />,
  star: <Star className="h-5 w-5" />,
  trophy: <Trophy className="h-5 w-5" />,
  'message-circle': <MessageCircle className="h-5 w-5" />,
  camera: <Camera className="h-5 w-5" />,
  users: <Users className="h-5 w-5" />,
  heart: <Heart className="h-5 w-5" />,
  sunrise: <Sunrise className="h-5 w-5" />,
};

interface AchievementBadgeProps {
  definition: AchievementDefinition;
  isUnlocked: boolean;
  achievement?: Achievement;
}

const AchievementBadge = ({ definition, isUnlocked, achievement }: AchievementBadgeProps) => {
  const { language } = useLanguage();
  const icon = achievementIcons[definition.icon] || <Award className="h-5 w-5" />;
  
  const name = language === 'ru' ? definition.name_ru : definition.name_en;
  const description = language === 'ru' ? definition.description_ru : definition.description_en;
  
  return (
    <div 
      className={cn(
        "relative flex flex-col items-center p-3 rounded-xl border-2 transition-all",
        isUnlocked 
          ? "bg-primary/5 border-primary/30 shadow-sm" 
          : "bg-muted/30 border-muted opacity-60"
      )}
    >
      <div 
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center mb-2",
          isUnlocked 
            ? "bg-primary/10 text-primary" 
            : "bg-muted text-muted-foreground"
        )}
      >
        {isUnlocked ? icon : <Lock className="h-5 w-5" />}
      </div>
      
      <div className="text-center">
        <div className={cn(
          "text-xs font-medium",
          isUnlocked ? "text-foreground" : "text-muted-foreground"
        )}>
          {name}
        </div>
        {definition.bonus_amount > 0 && (
          <Badge 
            variant={isUnlocked ? "default" : "secondary"} 
            className="text-xs mt-1"
          >
            +{definition.bonus_amount} ฿
          </Badge>
        )}
      </div>
      
      {isUnlocked && achievement && (
        <div className="absolute -top-1 -right-1">
          <div className="w-4 h-4 bg-success rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export const AchievementsCard = () => {
  const { language } = useLanguage();
  const { achievements, allAchievements, isLoading } = useLoyalty();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const achievedCodes = new Set(achievements.map(a => a.achievement_code));
  const unlockedCount = achievements.length;
  const totalCount = allAchievements.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning" />
            {language === 'ru' ? 'Достижения' : 'Achievements'}
          </CardTitle>
          <Badge variant="secondary">
            {unlockedCount}/{totalCount}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          {allAchievements.map((def) => {
            const isUnlocked = achievedCodes.has(def.code);
            const achievement = achievements.find(a => a.achievement_code === def.code);
            
            return (
              <AchievementBadge
                key={def.id}
                definition={def}
                isUnlocked={isUnlocked}
                achievement={achievement}
              />
            );
          })}
        </div>
        
        {unlockedCount === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            {language === 'ru' 
              ? 'Совершите первое бронирование, чтобы получить достижение!' 
              : 'Make your first booking to earn an achievement!'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
