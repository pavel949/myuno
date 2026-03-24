/**
 * VendorModerationQueue - Shows pending items for vendor moderation
 * Displays approval status across all verticals owned by vendor
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChevronRight,
  AlertCircle,
  Eye
} from 'lucide-react';
import { 
  APPROVAL_STATUSES, 
  APPROVAL_STATUS_LABELS, 
  APPROVAL_STATUS_COLORS,
  type ApprovalStatus 
} from '@/lib/approvalStatus';
import { cn } from '@/lib/utils';

interface ModerationItem {
  id: string;
  name: string;
  table: string;
  status: ApprovalStatus;
  rejectionReason?: string | null;
  createdAt: string;
}

interface VendorModerationQueueProps {
  providerId: string;
  vendorId?: string;
  limit?: number;
  className?: string;
}

// Tables to query for moderation status
const MODERATION_TABLES = [
  { table: 'marketplace_products', nameField: 'name_en', providerField: 'vendor_id', useVendorId: true, path: '/vendor/marketplace' },
  { table: 'vendor_services', nameField: 'name_en', providerField: 'provider_id', useVendorId: false, path: '/vendor/services' },
  { table: 'yachts', nameField: 'name_en', providerField: 'provider_id', useVendorId: false, path: '/vendor/yachts' },
  { table: 'tours', nameField: 'name_en', providerField: 'provider_id', useVendorId: false, path: '/vendor/tours' },
  { table: 'salons', nameField: 'name_en', providerField: 'provider_id', useVendorId: false, path: '/vendor/beauty' },
  { table: 'clinics', nameField: 'name_en', providerField: 'provider_id', useVendorId: false, path: '/vendor/clinics' },
  { table: 'gyms', nameField: 'name_en', providerField: 'provider_id', useVendorId: false, path: '/vendor/fitness' },
  { table: 'vehicles', nameField: 'name_en', providerField: 'provider_id', useVendorId: false, path: '/vendor/transport' },
];

export function VendorModerationQueue({
  providerId,
  vendorId,
  limit = 5,
  className,
}: VendorModerationQueueProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  useEffect(() => {
    const fetchModerationItems = async () => {
      if (!providerId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const allItems: ModerationItem[] = [];

      try {
        // Query each table for pending/rejected items
        for (const tableConfig of MODERATION_TABLES) {
          const id = tableConfig.useVendorId ? vendorId : providerId;
          if (!id) continue;

          try {
            const { data, error } = await supabase
              .from(tableConfig.table as any)
              .select(`id, ${tableConfig.nameField}, approval_status, rejection_reason, created_at`)
              .eq(tableConfig.providerField, id)
              .in('approval_status', ['pending', 'rejected'])
              .order('created_at', { ascending: false })
              .limit(limit);

            if (error) {
              console.warn(`Error fetching ${tableConfig.table}:`, error.message);
              continue;
            }

            if (data) {
              for (const item of data as any[]) {
                allItems.push({
                  id: item.id,
                  name: item[tableConfig.nameField] || 'Untitled',
                  table: tableConfig.table,
                  status: (item.approval_status || 'pending') as ApprovalStatus,
                  rejectionReason: item.rejection_reason,
                  createdAt: item.created_at,
                });
              }
            }
          } catch (e) {
            // Table might not exist, skip silently
          }
        }

        // Sort by created date and limit
        allItems.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setItems(allItems.slice(0, limit));
        setPendingCount(allItems.filter(i => i.status === APPROVAL_STATUSES.PENDING).length);
        setRejectedCount(allItems.filter(i => i.status === APPROVAL_STATUSES.REJECTED).length);
      } catch (err) {
        console.error('Error fetching moderation items:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModerationItems();
  }, [providerId, vendorId, limit]);

  const getStatusIcon = (status: ApprovalStatus) => {
    switch (status) {
      case APPROVAL_STATUSES.PENDING:
        return <Clock className="h-4 w-4" />;
      case APPROVAL_STATUSES.APPROVED:
        return <CheckCircle className="h-4 w-4" />;
      case APPROVAL_STATUSES.REJECTED:
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTableLabel = (table: string): string => {
    const labels: Record<string, { en: string; ru: string }> = {
      'marketplace_products': { en: 'Product', ru: 'Товар' },
      'vendor_services': { en: 'Service', ru: 'Услуга' },
      'yachts': { en: 'Yacht', ru: 'Яхта' },
      'tours': { en: 'Tour', ru: 'Тур' },
      'salons': { en: 'Salon', ru: 'Салон' },
      'clinics': { en: 'Clinic', ru: 'Клиника' },
      'gyms': { en: 'Gym', ru: 'Зал' },
      'vehicles': { en: 'Vehicle', ru: 'Транспорт' },
    };
    return labels[table]?.[isRu ? 'ru' : 'en'] || table;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Don't show if nothing pending/rejected
  if (items.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" />
            {isRu ? 'Модерация' : 'Moderation Queue'}
          </span>
          <div className="flex gap-1">
            {pendingCount > 0 && (
              <Badge variant="secondary" className="bg-warning/20 text-warning">
                {pendingCount} {isRu ? 'ожидает' : 'pending'}
              </Badge>
            )}
            {rejectedCount > 0 && (
              <Badge variant="secondary" className="bg-destructive/20 text-destructive">
                {rejectedCount} {isRu ? 'отклонено' : 'rejected'}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {items.map((item) => (
          <div
            key={`${item.table}-${item.id}`}
            className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs shrink-0">
                  {getTableLabel(item.table)}
                </Badge>
                <p className="font-medium text-sm truncate">{item.name}</p>
              </div>
              {item.status === APPROVAL_STATUSES.REJECTED && item.rejectionReason && (
                <p className="text-xs text-destructive mt-1 truncate">
                  {item.rejectionReason}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className={cn('text-xs', APPROVAL_STATUS_COLORS[item.status])}>
                {getStatusIcon(item.status)}
                <span className="ml-1">
                  {APPROVAL_STATUS_LABELS[item.status][isRu ? 'ru' : 'en']}
                </span>
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => {
                  // Navigate to the appropriate edit page
                  const config = MODERATION_TABLES.find(t => t.table === item.table);
                  if (config) {
                    navigate(`${config.path}?edit=${item.id}`);
                  }
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
        {(pendingCount + rejectedCount) > limit && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => navigate('/vendor/moderation')}
          >
            {isRu ? 'Показать все' : 'View All'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
