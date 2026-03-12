import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePortfolioHealth, type PropertyHealthReport, type HealthStatus } from '@/hooks/usePortfolioHealth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse, ChevronDown, ChevronRight, Check,
  AlertTriangle, X, Filter, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function scoreColor(score: number) {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

function scoreProgressColor(score: number) {
  if (score >= 80) return '[&>div]:bg-success';
  if (score >= 50) return '[&>div]:bg-warning';
  return '[&>div]:bg-destructive';
}

function statusIcon(status: HealthStatus) {
  if (status === 'ok') return <Check className="h-3.5 w-3.5 text-success" />;
  if (status === 'warning') return <AlertTriangle className="h-3.5 w-3.5 text-warning" />;
  return <X className="h-3.5 w-3.5 text-destructive" />;
}

function PropertyHealthCard({ report, isRu }: { report: PropertyHealthReport; isRu: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const title = isRu ? report.titleRu : report.title;

  return (
    <Card variant="interactive" className="overflow-hidden">
      <CardContent className="p-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-3 flex items-center gap-3 text-left"
        >
          {/* Cover thumbnail */}
          {report.coverImage ? (
            <img
              src={report.coverImage}
              alt={title}
              className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <HeartPulse className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium truncate">{title}</p>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={cn("text-sm font-bold tabular-nums", scoreColor(report.score))}>
                  {report.score}%
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  expanded && "rotate-180"
                )} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Progress
                value={report.score}
                className={cn("h-1.5 flex-1", scoreProgressColor(report.score))}
              />
              {report.issueCount > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                  {report.issueCount} {isRu ? 'нужно' : 'to fix'}
                </Badge>
              )}
            </div>
          </div>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-1 border-t border-border/50 pt-2">
                {report.checks.map(check => (
                  <div
                    key={check.id}
                    className={cn(
                      "flex items-center gap-2 py-1.5 px-2 rounded-md text-xs",
                      check.status !== 'ok' && "bg-muted/50"
                    )}
                  >
                    <span className="flex-shrink-0">{check.icon}</span>
                    {statusIcon(check.status)}
                    <span className="flex-1 truncate">
                      {isRu ? check.labelRu : check.labelEn}
                    </span>
                    <span className="text-muted-foreground text-[11px] truncate max-w-[100px]">
                      {isRu ? check.detailRu : check.detail}
                    </span>
                    {check.status !== 'ok' && check.actionPath && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-[10px] text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(check.actionPath!);
                        }}
                      >
                        Fix
                        <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export function PortfolioHealthWidget() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [showOnlyProblems, setShowOnlyProblems] = useState(false);
  const { reports, portfolioScore, problemCount, isLoading, totalProperties } = usePortfolioHealth();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (totalProperties === 0) return null;

  const filtered = showOnlyProblems ? reports.filter(r => r.score < 100) : reports;

  return (
    <div>
      {/* Summary header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <HeartPulse className={cn("h-5 w-5", scoreColor(portfolioScore))} />
          <div>
            <h3 className="font-semibold text-[15px] flex items-center gap-2">
              {isRu ? 'Здоровье портфеля' : 'Portfolio Health'}
              <span className={cn("text-lg font-bold tabular-nums", scoreColor(portfolioScore))}>
                {portfolioScore}%
              </span>
            </h3>
            {problemCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {problemCount} {isRu ? 'из' : 'of'} {totalProperties} {isRu ? 'требуют внимания' : 'need attention'}
              </p>
            )}
          </div>
        </div>

        {reports.some(r => r.score === 100) && (
          <Button
            variant={showOnlyProblems ? 'secondary' : 'ghost'}
            size="sm"
            className="text-xs h-7 gap-1"
            onClick={() => setShowOnlyProblems(!showOnlyProblems)}
          >
            <Filter className="h-3 w-3" />
            {isRu ? 'Проблемные' : 'Issues only'}
          </Button>
        )}
      </div>

      {/* Portfolio-level progress */}
      <Progress
        value={portfolioScore}
        className={cn("h-2 mb-3", scoreProgressColor(portfolioScore))}
      />

      {/* Property cards */}
      <div className="space-y-2">
        {filtered.slice(0, 20).map(report => (
          <PropertyHealthCard key={report.propertyId} report={report} isRu={isRu} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <Check className="h-8 w-8 mx-auto mb-2 text-success" />
            {isRu ? 'Все объекты в порядке!' : 'All properties are in good shape!'}
          </div>
        )}
      </div>
    </div>
  );
}
