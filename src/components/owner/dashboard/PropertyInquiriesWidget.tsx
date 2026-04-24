import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMyProperties } from '@/hooks/useMyProperties';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Bell, User, ChevronRight, CheckCircle2, Clock, XCircle, Loader2, Check, X,
} from 'lucide-react';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Status mapping aligned with the property_inquiries CHECK constraint:
// pending | responded | accepted | rejected | cancelled
const STATUS_CONFIG = {
  pending:   { icon: Clock,         color: 'bg-warning/10 text-warning',         label: 'New',       labelRu: 'Новый' },
  responded: { icon: Bell,          color: 'bg-info/10 text-info',               label: 'Responded', labelRu: 'Отвечено' },
  accepted:  { icon: CheckCircle2,  color: 'bg-success/10 text-success',         label: 'Accepted',  labelRu: 'Принято' },
  confirmed: { icon: CheckCircle2,  color: 'bg-success/10 text-success',         label: 'Confirmed', labelRu: 'Подтверждён' },
  rejected:  { icon: XCircle,       color: 'bg-destructive/10 text-destructive', label: 'Rejected',  labelRu: 'Отклонён' },
  cancelled: { icon: XCircle,       color: 'bg-muted text-muted-foreground',     label: 'Cancelled', labelRu: 'Отменено' },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

export function PropertyInquiriesWidget() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { allProperties } = useMyProperties();
  const propertyIds = allProperties.map(p => p.id);
  const [actingId, setActingId] = useState<string | null>(null);

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ['property-inquiries-widget', propertyIds],
    queryFn: async () => {
      if (!propertyIds.length) return [];
      const { data, error } = await supabase
        .from('property_inquiries')
        .select('*')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: propertyIds.length > 0,
  });

  // Also fetch recent property orders (booking requests) for visibility.
  const { data: bookingRequests } = useQuery({
    queryKey: ['property-booking-requests-widget', propertyIds],
    queryFn: async () => {
      if (!propertyIds.length) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_type', 'property')
        .in('status', ['pending', 'confirmed', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []).filter(order => {
        const meta = order.metadata as any;
        return meta?.property_id && propertyIds.includes(meta.property_id);
      });
    },
    enabled: propertyIds.length > 0,
  });

  const updateInquiryStatus = async (
    inquiryId: string,
    nextStatus: 'accepted' | 'rejected',
  ) => {
    setActingId(inquiryId);
    try {
      const { error } = await supabase
        .from('property_inquiries')
        .update({ status: nextStatus })
        .eq('id', inquiryId);
      if (error) throw error;
      toast.success(
        nextStatus === 'accepted'
          ? (isRu ? 'Запрос принят' : 'Inquiry accepted')
          : (isRu ? 'Запрос отклонён' : 'Inquiry rejected'),
      );
      await queryClient.invalidateQueries({ queryKey: ['property-inquiries-widget'] });
      await queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    } catch (err: any) {
      console.error('[PropertyInquiriesWidget] status update failed:', err);
      toast.error(
        isRu
          ? `Не удалось обновить статус: ${err?.message ?? 'неизвестная ошибка'}`
          : `Could not update status: ${err?.message ?? 'unknown error'}`,
      );
    } finally {
      setActingId(null);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-[180px] rounded-none" />;
  }

  const allItems = [
    ...(inquiries || []).map(inq => ({
      id: inq.id,
      type: 'inquiry' as const,
      name: inq.name,
      phone: inq.phone,
      email: inq.email,
      message: inq.message,
      status: (inq.status || 'pending') as StatusKey,
      checkIn: inq.check_in,
      checkOut: inq.check_out,
      guests: inq.guests,
      propertyId: inq.property_id,
      createdAt: inq.created_at,
    })),
    ...(bookingRequests || []).map(order => {
      const meta = order.metadata as any;
      const participant = (order as any).participants?.[0];
      const status = (order.status === 'pending' ? 'pending' : order.status) as StatusKey;
      return {
        id: order.id,
        type: 'booking' as const,
        name: participant?.name || meta?.guest_name || 'Guest',
        phone: participant?.phone || meta?.guest_phone || null,
        email: participant?.email || meta?.guest_email || null,
        message: order.notes,
        status,
        checkIn: meta?.check_in || null,
        checkOut: meta?.check_out || null,
        guests: meta?.guests || null,
        propertyId: meta?.property_id,
        createdAt: order.created_at,
      };
    }),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
   .slice(0, 8);

  const newCount = allItems.filter(i => i.status === 'pending').length;
  const propertyMap = new Map(allProperties.map(p => [p.id, p]));

  if (allItems.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Нет новых обращений' : 'No enquiries yet'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(newCount > 0 && "border-primary/30")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            {isRu ? 'Обращения клиентов' : 'Client Enquiries'}
            {newCount > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-primary">
                {newCount}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => navigate('/mc/messages')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {allItems.slice(0, 5).map(item => {
            const property = propertyMap.get(item.propertyId);
            const propertyName = isRu ? (property as any)?.title_ru : (property as any)?.title_en;
            const statusKey: StatusKey = STATUS_CONFIG[item.status] ? item.status : 'pending';
            const statusCfg = STATUS_CONFIG[statusKey];
            const StatusIcon = statusCfg.icon;
            const isPending = statusKey === 'pending';
            const canAct = item.type === 'inquiry' && isPending;
            const isActing = actingId === item.id;

            return (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-center gap-2.5 p-2 hover:bg-muted/50 transition-colors"
              >
                <button
                  onClick={() => {
                    if (item.type === 'booking') navigate(`/bookings/${item.id}`);
                    else navigate(`/mc/messages`);
                  }}
                  className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      <User className="h-3.5 w-3.5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "text-sm truncate",
                        isPending ? "font-semibold" : "font-medium",
                      )}>
                        {item.name}
                      </span>
                      {isPending && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {propertyName || 'Property'}
                      {item.checkIn && ` · ${format(parseISO(item.checkIn), 'd MMM', { locale: isRu ? ru : undefined })}`}
                      {item.guests && ` · ${item.guests} ${isRu ? 'гост.' : 'guests'}`}
                    </p>
                  </div>
                </button>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span
                    className={cn("p-1 rounded-none inline-flex items-center gap-1", statusCfg.color)}
                    title={isRu ? statusCfg.labelRu : statusCfg.label}
                  >
                    <StatusIcon className="h-3 w-3" />
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: false,
                      locale: isRu ? ru : undefined,
                    })}
                  </span>
                </div>

                {canAct && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-success hover:bg-success/10"
                      disabled={isActing}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateInquiryStatus(item.id, 'accepted');
                      }}
                      aria-label={isRu ? 'Принять' : 'Accept'}
                    >
                      {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      disabled={isActing}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateInquiryStatus(item.id, 'rejected');
                      }}
                      aria-label={isRu ? 'Отклонить' : 'Reject'}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
