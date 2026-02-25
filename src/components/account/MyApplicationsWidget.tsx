import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Wrench, Package, Clock, CheckCircle2, XCircle, Plus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  draft: { icon: Clock, color: 'bg-muted text-muted-foreground', labelEn: 'Draft', labelRu: 'Черновик' },
  pending: { icon: Clock, color: 'bg-warning/20 text-warning', labelEn: 'Under Review', labelRu: 'На проверке' },
  under_review: { icon: Clock, color: 'bg-info/20 text-info', labelEn: 'Reviewing', labelRu: 'Проверяется' },
  approved: { icon: CheckCircle2, color: 'bg-success/20 text-success', labelEn: 'Approved', labelRu: 'Одобрено' },
  rejected: { icon: XCircle, color: 'bg-destructive/20 text-destructive', labelEn: 'Rejected', labelRu: 'Отклонено' },
  revision_requested: { icon: Clock, color: 'bg-accent-amber/20 text-accent-amber', labelEn: 'Needs Changes', labelRu: 'Требуются правки' },
};

const TYPE_ICONS = {
  property: Building2,
  service: Wrench,
  product: Package,
};

export function MyApplicationsWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: applications, isLoading } = useQuery({
    queryKey: ['my-listing-applications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('listing_applications')
        .select('id, listing_type, status, draft_data, cover_image, created_at, submitted_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!applications?.length) {
    return null; // Don't show widget if no applications
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {isRu ? 'Мои заявки' : 'My Applications'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => navigate('/list-with-us')}
          >
            <Plus className="h-3 w-3 mr-1" />
            {isRu ? 'Новая' : 'New'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {applications.map((app) => {
          const statusConfig = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
          const TypeIcon = TYPE_ICONS[app.listing_type as keyof typeof TYPE_ICONS] || Building2;
          const StatusIcon = statusConfig.icon;
          const draftData = app.draft_data as Record<string, unknown> | null;
          const title = draftData?.title_en as string || draftData?.title_ru as string || (isRu ? 'Без названия' : 'Untitled');

          return (
            <div
              key={app.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => {
                // TODO: Navigate to application detail/edit page
              }}
            >
              {app.cover_image ? (
                <img
                  src={app.cover_image}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                  <TypeIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", statusConfig.color)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {isRu ? statusConfig.labelRu : statusConfig.labelEn}
                  </Badge>
                </div>
              </div>
              
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
