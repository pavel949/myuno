import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge';
import { TicketPriorityBadge } from '@/components/tickets/TicketPriorityBadge';
import { TicketCategoryBadge } from '@/components/tickets/TicketCategoryBadge';
import { TicketMessages } from '@/components/tickets/TicketMessages';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Package
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAdminTickets } from '@/hooks/useAdminTickets';
import type { SupportTicket, TicketMessage, TicketStatus, TicketPriority, ResolutionType } from '@/hooks/useTickets';

export default function AdminTicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { 
    updateTicketStatus, 
    updatePriority, 
    resolveTicket, 
    addAdminMessage, 
    getTicketMessages 
  } = useAdminTickets();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showResolveDialog, setShowResolveDialog] = useState(false);

  // Resolution form state
  const [resolutionType, setResolutionType] = useState<ResolutionType>('no_refund');
  const [resolution, setResolution] = useState('');
  const [refundAmount, setRefundAmount] = useState('');

  const fetchTicket = async () => {
    if (!ticketId) return;

    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (!error && data) {
      setTicket(data as unknown as SupportTicket);
    }
  };

  const fetchMessages = async () => {
    if (!ticketId) return;
    const data = await getTicketMessages(ticketId);
    setMessages(data);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTicket(), fetchMessages()]);
      setIsLoading(false);
    };
    loadData();
  }, [ticketId]);

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticketId) return;
    await updateTicketStatus(ticketId, status);
    await fetchTicket();
  };

  const handlePriorityChange = async (priority: TicketPriority) => {
    if (!ticketId) return;
    await updatePriority(ticketId, priority);
    await fetchTicket();
  };

  const handleResolve = async () => {
    if (!ticketId || !resolution.trim()) return;
    
    await resolveTicket(
      ticketId,
      resolutionType,
      resolution,
      refundAmount ? parseFloat(refundAmount) : undefined
    );
    
    setShowResolveDialog(false);
    await fetchTicket();
    await fetchMessages();
  };

  const handleSendMessage = async (message: string) => {
    if (!ticketId) return false;
    const success = await addAdminMessage(ticketId, message, false);
    if (success) {
      await fetchMessages();
      await fetchTicket();
    }
    return success;
  };

  const handleSendInternalNote = async (message: string) => {
    if (!ticketId) return false;
    const success = await addAdminMessage(ticketId, message, true);
    if (success) {
      await fetchMessages();
    }
    return success;
  };

  if (isLoading) {
    return (
      <>
        <PageContainer>
          <LoadingSpinner />
        </PageContainer>
      </>
    );
  }

  if (!ticket) {
    return (
      <>
        <PageContainer>
          <PageHeader title="Тикет не найден" showBack />
        </PageContainer>
      </>
    );
  }

  const isOverdue = ticket.sla_deadline && 
    new Date(ticket.sla_deadline) < new Date() && 
    !['resolved', 'closed'].includes(ticket.status);

  const canResolve = !['resolved', 'closed'].includes(ticket.status);

  return (
    <>
      <PageContainer>
        <PageHeader 
          title={ticket.ticket_number}
          showBack
        />

        {canResolve && (
          <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
            <DialogTrigger asChild>
              <Button className="mb-4">
                <CheckCircle className="w-4 h-4 mr-2" />
                Решить тикет
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Решение тикета</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Тип решения</Label>
                  <Select value={resolutionType} onValueChange={(v) => setResolutionType(v as ResolutionType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="refund_full">Полный возврат</SelectItem>
                      <SelectItem value="refund_partial">Частичный возврат</SelectItem>
                      <SelectItem value="compensation">Компенсация</SelectItem>
                      <SelectItem value="no_refund">Без возврата</SelectItem>
                      <SelectItem value="mediation">Медиация</SelectItem>
                      <SelectItem value="rejected">Отклонено</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                    {['refund_full', 'refund_partial', 'compensation'].includes(resolutionType) && (
                      <div>
                        <Label>Сумма возврата (฿)</Label>
                        <Input
                          type="number"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    )}

                    <div>
                      <Label>Комментарий к решению *</Label>
                      <Textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="Опишите решение для клиента..."
                        rows={4}
                      />
                    </div>

                    <Button 
                      onClick={handleResolve} 
                      className="w-full"
                      disabled={!resolution.trim()}
                    >
                      Подтвердить решение
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
        

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Status & Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Управление</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Статус</Label>
                  <Select value={ticket.status} onValueChange={handleStatusChange} disabled={!canResolve}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Открыт</SelectItem>
                      <SelectItem value="in_progress">В работе</SelectItem>
                      <SelectItem value="waiting_response">Ожидает ответа</SelectItem>
                      <SelectItem value="escalated">Эскалирован</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Приоритет</Label>
                  <Select value={ticket.priority} onValueChange={handlePriorityChange} disabled={!canResolve}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Низкий</SelectItem>
                      <SelectItem value="normal">Обычный</SelectItem>
                      <SelectItem value="high">Высокий</SelectItem>
                      <SelectItem value="urgent">Срочно</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {ticket.sla_deadline && (
                  <div className={`p-3 rounded-lg ${isOverdue ? 'bg-destructive/5 border border-destructive/20' : 'bg-muted'}`}>
                    <div className="flex items-center gap-2">
                      {isOverdue ? (
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                      ) : (
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className={`text-sm ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                        SLA: {isOverdue ? 'Просрочено' : formatDistanceToNow(new Date(ticket.sla_deadline), { locale: ru })}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ticket Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Детали</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <TicketStatusBadge status={ticket.status} />
                  <TicketPriorityBadge priority={ticket.priority} />
                  <TicketCategoryBadge category={ticket.category} />
                </div>

                <div>
                  <h3 className="font-medium">{ticket.subject}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(ticket.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                </div>

                {ticket.order_id && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <Button variant="link" className="p-0 h-auto" onClick={() => navigate(`/admin/orders/${ticket.order_id}`)}>
                      Заказ #{ticket.order_id.slice(0, 8)}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reporter Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Заявитель</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticket.reporter_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {ticket.reporter_name}
                  </div>
                )}
                {ticket.reporter_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${ticket.reporter_email}`} className="text-primary hover:underline">
                      {ticket.reporter_email}
                    </a>
                  </div>
                )}
                {ticket.reporter_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${ticket.reporter_phone}`} className="text-primary hover:underline">
                      {ticket.reporter_phone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resolution */}
            {ticket.resolution && (
              <Card className="border-success/20 bg-success/5">
                <CardHeader>
                  <CardTitle className="text-base text-success">Решение</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-success">{ticket.resolution}</p>
                  {ticket.refund_amount && (
                    <p className="text-sm font-medium text-success">
                      Возврат: ฿{ticket.refund_amount.toLocaleString()}
                    </p>
                  )}
                  {ticket.resolved_at && (
                    <p className="text-xs text-success/80">
                      {format(new Date(ticket.resolved_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Messages */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Переписка</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <TicketMessages
                  ticketId={ticket.id}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onSendInternalNote={handleSendInternalNote}
                  isAdmin
                  canReply={canResolve}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
