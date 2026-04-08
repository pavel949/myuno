import { 
  Shield, ShieldCheck, Star, Clock, Award, Users, 
  TrendingUp, CheckCircle, Calendar 
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrustBadges } from "@/components/uno/TrustBadges";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TrustScoreCardProps {
  providerId: string;
  trustScore?: number;
  stats?: {
    totalBookings?: number;
    responseRate?: number;
    responseTime?: string;
    memberSince?: string;
    repeatCustomers?: number;
  };
  isVerified?: boolean;
  compact?: boolean;
}

export const TrustScoreCard = ({
  providerId,
  trustScore = 0,
  stats,
  isVerified = false,
  compact = false,
}: TrustScoreCardProps) => {
  const { language } = useLanguage();

  const getTrustLevel = (score: number) => {
    if (score >= 90) return {
      level: language === 'ru' ? 'Превосходно' : 'Excellent',
      color: 'text-success',
      bg: 'bg-success'
    };
    if (score >= 75) return {
      level: language === 'ru' ? 'Очень хорошо' : 'Very Good',
      color: 'text-info',
      bg: 'bg-info'
    };
    if (score >= 60) return {
      level: language === 'ru' ? 'Хорошо' : 'Good',
      color: 'text-warning',
      bg: 'bg-warning'
    };
    return { 
      level: language === 'ru' ? 'Новичок' : 'New',
      color: 'text-muted-foreground',
      bg: 'bg-muted-foreground'
    };
  };

  const trustLevel = getTrustLevel(trustScore);

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-card rounded-xl border">
        <div className="relative">
          <div className={`w-12 h-12 rounded-full ${trustLevel.bg}/10 flex items-center justify-center`}>
            <ShieldCheck className={`w-6 h-6 ${trustLevel.color}`} />
          </div>
          {isVerified && (
            <CheckCircle className="w-4 h-4 text-success absolute -bottom-0.5 -right-0.5 bg-background rounded-full" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{trustScore}%</span>
            <span className={`text-sm ${trustLevel.color}`}>{trustLevel.level}</span>
          </div>
          <Progress value={trustScore} className="h-1.5 mt-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border overflow-hidden">
      {/* Header with Trust Score */}
      <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-b">
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full ${trustLevel.bg}/15 flex items-center justify-center`}>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${trustLevel.color}`}>{trustScore}</div>
                    </div>
                  </div>
                  {isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-success rounded-full p-1">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{language === 'ru' ? 'Индекс доверия' : 'Trust Score'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-semibold">
                {language === 'ru' ? 'Индекс доверия' : 'Trust Score'}
              </span>
            </div>
            <div className={`text-lg font-bold ${trustLevel.color}`}>
              {trustLevel.level}
            </div>
            <Progress value={trustScore} className="h-2 mt-2" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="p-4 grid grid-cols-2 gap-4">
          {stats.totalBookings !== undefined && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-info" />
              </div>
              <div>
                <div className="font-semibold">{stats.totalBookings}+</div>
                <div className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Заказов' : 'Bookings'}
                </div>
              </div>
            </div>
          )}

          {stats.responseRate !== undefined && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <div className="font-semibold">{stats.responseRate}%</div>
                <div className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Отклик' : 'Response'}
                </div>
              </div>
            </div>
          )}

          {stats.responseTime && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-purple/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent-purple" />
              </div>
              <div>
                <div className="font-semibold">{stats.responseTime}</div>
                <div className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Время ответа' : 'Response Time'}
                </div>
              </div>
            </div>
          )}

          {stats.memberSince && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-warning" />
              </div>
              <div>
                <div className="font-semibold">{stats.memberSince}</div>
                <div className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'На платформе' : 'Member Since'}
                </div>
              </div>
            </div>
          )}

          {stats.repeatCustomers !== undefined && (
            <div className="flex items-center gap-3 col-span-2">
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-warning" />
              </div>
              <div>
                <div className="font-semibold">{stats.repeatCustomers}%</div>
                <div className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Повторных клиентов' : 'Repeat Customers'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trust Badges */}
      <div className="px-4 pb-4">
        <TrustBadges providerId={providerId} />
      </div>
    </div>
  );
};
