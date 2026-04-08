import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge';
import { TicketPriorityBadge } from '@/components/tickets/TicketPriorityBadge';
import { TicketCategoryBadge } from '@/components/tickets/TicketCategoryBadge';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { 
  Search, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  MessageSquare,
  Ticket,
  Filter,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAdminTickets } from '@/hooks/useAdminTickets';
import type { TicketStatus, TicketPriority } from '@/hooks/useTickets';

export default function AdminTickets() {
  const navigate = useNavigate();
  const { tickets, stats, isLoading, filters, setFilters, refetch } = useAdminTickets();
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchInput }));
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

  return (
    <>
      <PageContainer>
        <PageHeader 
          title="Тикеты поддержки"
          showBack
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-info/10 rounded-lg">
                  <Ticket className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.open}</p>
                  <p className="text-xs text-muted-foreground">Открытых</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                  <p className="text-xs text-muted-foreground">В работе</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={stats.overdueSla > 0 ? 'border-destructive/30 bg-destructive/5' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stats.overdueSla > 0 ? 'bg-destructive/10' : 'bg-muted'}`}>
                  <AlertTriangle className={`w-5 h-5 ${stats.overdueSla > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.overdueSla}</p>
                  <p className="text-xs text-muted-foreground">Просрочено SLA</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.resolved}</p>
                  <p className="text-xs text-muted-foreground">Решено</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по номеру или теме..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  status: value as TicketStatus | 'all' 
                }))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="open">Открытые</SelectItem>
                  <SelectItem value="in_progress">В работе</SelectItem>
                  <SelectItem value="waiting_response">Ожидает ответа</SelectItem>
                  <SelectItem value="resolved">Решённые</SelectItem>
                  <SelectItem value="closed">Закрытые</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.priority || 'all'}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  priority: value as TicketPriority | 'all' 
                }))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Приоритет" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="urgent">Срочные</SelectItem>
                  <SelectItem value="high">Высокий</SelectItem>
                  <SelectItem value="normal">Обычный</SelectItem>
                  <SelectItem value="low">Низкий</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={handleSearch}>
                <Filter className="w-4 h-4 mr-2" />
                Применить
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Номер</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Тема</TableHead>
                  <TableHead>Приоритет</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Создан</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Тикеты не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => {
                    const isOverdue = ticket.sla_deadline && 
                      new Date(ticket.sla_deadline) < new Date() && 
                      !['resolved', 'closed'].includes(ticket.status);

                    return (
                      <TableRow 
                        key={ticket.id}
                        className={`cursor-pointer hover:bg-muted/50 ${isOverdue ? 'bg-destructive/5' : ''}`}
                        onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                      >
                        <TableCell className="font-mono text-sm">
                          {ticket.ticket_number}
                        </TableCell>
                        <TableCell>
                          <TicketCategoryBadge category={ticket.category} />
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {ticket.subject}
                        </TableCell>
                        <TableCell>
                          <TicketPriorityBadge priority={ticket.priority} />
                        </TableCell>
                        <TableCell>
                          <TicketStatusBadge status={ticket.status} />
                        </TableCell>
                        <TableCell>
                          {ticket.sla_deadline ? (
                            <span className={`text-xs ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                              {isOverdue ? 'Просрочено' : formatDistanceToNow(new Date(ticket.sla_deadline), { locale: ru })}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: ru })}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
