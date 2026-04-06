import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useCrmQuotes, useCreateQuote, useUpdateQuote, useDeleteQuote, CrmQuoteItem } from '@/hooks/useCrmQuotes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, FileText, Trash2, Send, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  draft: 'secondary',
  sent: 'default',
  accepted: 'default',
  rejected: 'destructive',
};

export default function CrmQuotesPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;
  const { data: quotes = [], isLoading, isError: quotesError, refetch: refetchQuotes } = useCrmQuotes(companyId);
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const deleteQuote = useDeleteQuote();
  const { toast } = useToast();

  const statusLabel = (s: string) => {
    const map: Record<string, [string, string]> = {
      draft: ['Draft', 'Черновик'],
      sent: ['Sent', 'Отправлено'],
      accepted: ['Accepted', 'Принято'],
      rejected: ['Rejected', 'Отклонено'],
    };
    return isRu ? (map[s]?.[1] || s) : (map[s]?.[0] || s);
  };

  if (quotesError) {
    return (
      <div className="p-4 md:p-6 lg:p-8 text-center pt-20 max-w-[1536px] mx-auto">
        <p className="text-destructive font-medium">{isRu ? 'Ошибка загрузки КП' : 'Failed to load quotes'}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchQuotes()}>
          {isRu ? 'Повторить' : 'Retry'}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1536px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isRu ? 'Коммерческие предложения' : 'Quotes & Proposals'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Создавайте и отправляйте КП клиентам' : 'Create and send proposals to clients'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</p>
      ) : quotes.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">{isRu ? 'Нет предложений' : 'No quotes yet'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isRu ? 'Создайте первое КП из карточки сделки' : 'Create your first quote from a deal card'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {quotes.map(q => (
            <Card key={q.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{q.quote_number}</span>
                    <Badge variant={STATUS_COLORS[q.status] as any || 'secondary'} className="text-[10px]">
                      {statusLabel(q.status)}
                    </Badge>
                  </div>
                  {q.title && <p className="text-xs text-muted-foreground mt-0.5">{q.title}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">
                    {q.currency} {q.total?.toLocaleString() || '0'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(q.created_at), 'dd.MM.yyyy')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    if (confirm(isRu ? 'Удалить?' : 'Delete?')) deleteQuote.mutate(q.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
