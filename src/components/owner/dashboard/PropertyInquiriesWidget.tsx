import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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

interface Props {
  companyScope?: { id: string; propertyIds: string[] };
}

export function PropertyInquiriesWidget({ companyScope }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { allProperties } = useMyProperties();
  const { user } = useAuth();
  const propertyIds = companyScope?.propertyIds ?? [...new Set(allProperties.map(p => p.property_id || p.id))].sort();
  const enabled = !!user?.id && propertyIds.length > 0;
  const [actingId, setActingId] = useState<string | null>(null);
  const [openInquiryId, setOpenInquiryId] = useState<string | null>(null);

  const { data: inquiries, isLoading, isError } = useQuery({
    queryKey: ['property-inquiries-widget', user?.id, companyScope?.id, propertyIds],
    queryFn: async () => {
      if (!propertyIds.length) return [];
      const query = supabase
        .from('property_inquiries')
        .select('*')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false })
        .limit(10);
      const { data, error } = await (companyScope ? query.eq('status', 'pending') : query);
      if (error) throw error;
      return data || [];
    },
    enabled,
  });

  // Also fetch recent property orders (booking requests) for visibility.
  const { data: bookingRequests } = useQuery({
    queryKey: ['property-booking-requests-widget', user?.id, propertyIds],
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
    enabled: enabled && !companyScope,
  });

  const updateInquiryStatus = async (
    inquiryId: string,
    nextStatus: 'accepted' | 'rejected',
  ) => {
    setActingId(inquiryId);
    try {
      const { data, error } = await supabase
        .from('property_inquiries')
        .update({ status: nextStatus })
        .eq('id', inquiryId)
        .in('property_id', propertyIds)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error(isRu ? 'Запрос уже обработан или недоступен' : 'This enquiry already changed or is unavailable');
      toast.success(
        nextStatus === 'accepted'
          ? (isRu ? 'Запрос принят. Бронирование требует отдельного подтверждения.' : 'Enquiry accepted. Booking still requires confirmation.')
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

  if (isError) return <p role="alert" className="text-sm text-destructive">{isRu ? 'Не удалось загрузить запросы на проживание.' : 'Could not load stay requests.'}</p>;

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
  const propertyMap = new Map(allProperties.map(p => [p.property_id || p.id, p]));

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
            {isRu ? 'Запросы на проживание' : 'Stay requests'}
            {newCount > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-primary">
                {newCount}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            aria-label={isRu ? 'Все сообщения' : 'All messages'}
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
                className="p-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  aria-expanded={item.type === 'inquiry' ? openInquiryId === item.id : undefined}
                  onClick={() => {
                    if (item.type === 'booking') navigate(`/bookings/${item.id}`);
                    else setOpenInquiryId(current => current === item.id ? null : item.id);
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
                      {propertyName || property?.title || (isRu ? 'Объект' : 'Property')}
                      {item.checkIn && ` · ${format(parseISO(item.checkIn), 'd MMM', { locale: isRu ? ru : undefined })}`}
                      {item.checkOut && ` – ${format(parseISO(item.checkOut), 'd MMM', { locale: isRu ? ru : undefined })}`}
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
                      className="min-h-[44px] min-w-[44px] text-success hover:bg-success/10"
                      disabled={actingId !== null}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateInquiryStatus(item.id, 'accepted');
                      }}
                      aria-label={isRu ? 'Принять запрос' : 'Accept request'}
                    >
                      {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="min-h-[44px] min-w-[44px] text-destructive hover:bg-destructive/10"
                      disabled={actingId !== null}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateInquiryStatus(item.id, 'rejected');
                      }}
                      aria-label={isRu ? 'Отклонить запрос' : 'Decline request'}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                </div>
                {item.type === 'inquiry' && openInquiryId === item.id && (
                  <div className="mt-2 space-y-1 border-t border-border py-2 text-sm [overflow-wrap:anywhere]">
                    {item.message && <p className="whitespace-pre-wrap">{item.message}</p>}
                    {item.phone && <a className="block underline" href={`tel:${item.phone}`}>{item.phone}</a>}
                    {item.email && <a className="block underline" href={`mailto:${item.email}`}>{item.email}</a>}
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
