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
  overview: 'bg-info/10 text-info',
  culture: 'bg-warning/10 text-warning',
  'dos-donts': 'bg-success/10 text-success',
  government: 'bg-muted text-muted-foreground',
  nature: 'bg-success/10 text-success',
  practical: 'bg-accent-purple/10 text-accent-purple',
  emergency: 'bg-destructive/10 text-destructive',
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
