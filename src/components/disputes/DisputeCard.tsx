import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { DISPUTE_TYPES, type Dispute } from '@/hooks/useDisputes';
import { AlertTriangle, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; labelEn: string; labelRu: string }> = {
  open: { icon: AlertTriangle, color: 'text-warning', labelEn: 'Open', labelRu: 'Открыт' },
  under_review: { icon: Eye, color: 'text-primary', labelEn: 'Under Review', labelRu: 'На рассмотрении' },
  resolved: { icon: CheckCircle, color: 'text-emerald-600', labelEn: 'Resolved', labelRu: 'Решён' },
  rejected: { icon: XCircle, color: 'text-destructive', labelEn: 'Rejected', labelRu: 'Отклонён' },
};

interface Props {
  dispute: Dispute;
  showActions?: boolean;
  onAction?: (disputeId: string, action: string) => void;
}

export function DisputeCard({ dispute, showActions, onAction }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const statusCfg = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open;
  const typeInfo = DISPUTE_TYPES.find((t) => t.value === dispute.dispute_type);
  const StatusIcon = statusCfg.icon;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 ${statusCfg.color}`} />
            <Badge variant="outline" className="text-xs">
              {isRu ? statusCfg.labelRu : statusCfg.labelEn}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(dispute.created_at), 'dd.MM.yyyy')}
          </span>
        </div>

        <div>
          <p className="text-sm font-medium">
            {isRu ? typeInfo?.labelRu : typeInfo?.labelEn}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
            {dispute.description}
          </p>
        </div>

        {dispute.resolution && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs font-medium mb-1">{isRu ? 'Решение:' : 'Resolution:'}</p>
            <p className="text-xs text-muted-foreground">{dispute.resolution}</p>
          </div>
        )}

        {showActions && dispute.status === 'open' && onAction && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onAction(dispute.id, 'under_review')}
              className="text-xs text-primary hover:underline"
            >
              {isRu ? 'Взять в работу' : 'Take to review'}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
