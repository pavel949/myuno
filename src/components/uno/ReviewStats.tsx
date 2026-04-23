import { Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReviewStatsProps {
  average: number;
  total: number;
  distribution: number[]; // [1-star count, 2-star count, ..., 5-star count]
}

export const ReviewStats = ({ average, total, distribution }: ReviewStatsProps) => {
  const { t } = useLanguage();

  const getPercentage = (count: number) => {
    return total > 0 ? (count / total) * 100 : 0;
  };

  return (
    <div className="bg-card rounded-none p-4 border">
      <div className="flex items-center gap-6">
        {/* Average Score */}
        <div className="text-center">
          <div className="text-4xl font-bold">{average.toFixed(1)}</div>
          <div className="flex justify-center my-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < Math.round(average) ? 'fill-warning text-warning' : 'text-muted-foreground'}`}
              />
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            {total} {t('label.reviews')}
          </div>
        </div>

        {/* Distribution Bars */}
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((stars, index) => (
            <div key={stars} className="flex items-center gap-2">
              <span className="text-xs w-3">{stars}</span>
              <Star className="w-3 h-3 fill-warning text-warning" />
              <Progress 
                value={getPercentage(distribution[stars - 1])} 
                className="flex-1 h-2"
              />
              <span className="text-xs text-muted-foreground w-8 text-right">
                {distribution[stars - 1]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
