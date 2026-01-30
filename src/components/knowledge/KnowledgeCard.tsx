import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Globe, Landmark, CheckCircle, Building2, TreePine, 
  Briefcase, AlertTriangle, ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KnowledgeCardProps {
  section: string;
  title: string;
  summary?: string;
  icon?: string | null;
  articleCount?: number;
  className?: string;
}

const iconMap: Record<string, React.ElementType> = {
  Globe,
  Landmark,
  CheckCircle,
  Building2,
  TreePine,
  Briefcase,
  AlertTriangle,
};

const colorMap: Record<string, string> = {
  overview: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  culture: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'dos-donts': 'bg-green-500/10 text-green-600 dark:text-green-400',
  government: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  nature: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  practical: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  emergency: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export function KnowledgeCard({ 
  section, 
  title, 
  summary, 
  icon, 
  articleCount = 0,
  className 
}: KnowledgeCardProps) {
  const navigate = useNavigate();
  const IconComponent = icon ? iconMap[icon] || Globe : Globe;
  const colorClass = colorMap[section] || colorMap.overview;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
      onClick={() => navigate(`/knowledge/${section}`)}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn("p-3 rounded-xl", colorClass)}>
          <IconComponent className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{title}</h3>
          {summary && (
            <p className="text-sm text-muted-foreground line-clamp-1">{summary}</p>
          )}
          {articleCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {articleCount} {articleCount === 1 ? 'article' : 'articles'}
            </p>
          )}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </CardContent>
    </Card>
  );
}
