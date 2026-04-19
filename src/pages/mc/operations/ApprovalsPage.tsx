/**
 * MC Approvals page — multi-step approval chains for expenses, POs, contracts.
 * Route: /mc/approvals
 */
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  useApprovalRequests,
  useMyPendingApprovalSteps,
  useDecideApprovalStep,
  useCreateApprovalRequest,
  useRequestSteps,
} from '@/hooks/useApprovals';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import {
  ShieldCheck, Plus, Clock, CheckCircle2, XCircle, ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function ApprovalsPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const [tab, setTab] = useState<'inbox' | 'all'>('inbox');
  const [creating, setCreating] = useState(false);

  const { data: pendingSteps = [], isLoading: l1 } = useMyPendingApprovalSteps();
  const { data: allRequests = [], isLoading: l2 } = useApprovalRequests();
  const decide = useDecideApprovalStep();

  if (l1 || l2) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-24">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold">{isRu ? 'Согласования' : 'Approvals'}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Многоступенчатые согласования расходов, договоров и заказов.' : 'Multi-step approvals for expenses, contracts and orders.'}
          </p>
        </div>
        <Sheet open={creating} onOpenChange={setCreating}>
          <SheetTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1.5" />{isRu ? 'Запросить' : 'Request'}</Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>{isRu ? 'Новый запрос на согласование' : 'New approval request'}</SheetTitle></SheetHeader>
            <CreateApprovalForm onClose={() => setCreating(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inbox">
            {isRu ? 'Мои' : 'My inbox'}
            {pendingSteps.length > 0 && <Badge className="ml-2 bg-warning text-warning-foreground">{pendingSteps.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="all">{isRu ? 'Все' : 'All'}</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-2 mt-4">
          {pendingSteps.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              {isRu ? 'Нет ожидающих согласований.' : 'No pending approvals.'}
            </CardContent></Card>
          ) : pendingSteps.map((s: any) => {
            const r = s.approval_requests;
            return (
              <Card key={s.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                      {r.amount && (
                        <p className="text-sm font-semibold tabular-nums mt-1">
                          {Number(r.amount).toLocaleString()} {r.currency || 'THB'}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">{r.entity_type}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" className="flex-1"
                      onClick={() => decide.mutate({ stepId: s.id, decision: 'approved' })}
                      disabled={decide.isPending}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />{isRu ? 'Одобрить' : 'Approve'}
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1"
                      onClick={() => {
                        const reason = window.prompt(isRu ? 'Причина отклонения:' : 'Rejection reason:') || '';
                        decide.mutate({ stepId: s.id, decision: 'rejected', comment: reason });
                      }}
                      disabled={decide.isPending}>
                      <XCircle className="w-3.5 h-3.5 mr-1.5" />{isRu ? 'Отклонить' : 'Reject'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="all" className="space-y-2 mt-4">
          {allRequests.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">
              {isRu ? 'Запросов пока нет.' : 'No requests yet.'}
            </CardContent></Card>
          ) : allRequests.map((r) => {
            const cfg = STATUS_CFG[r.status];
            const Icon = cfg.Icon;
            return (
              <Card key={r.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Badge variant="outline" className={cn('text-xs gap-1', cfg.cls)}>
                    <Icon className="w-3 h-3" />{isRu ? cfg.ru : cfg.en}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), 'd MMM HH:mm', { locale: isRu ? ru : undefined })}
                      {r.amount != null && ` · ${Number(r.amount).toLocaleString()} ${r.currency || 'THB'}`}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

const STATUS_CFG: Record<string, { en: string; ru: string; cls: string; Icon: typeof Clock }> = {
  pending: { en: 'Pending', ru: 'Ожидает', cls: 'bg-warning/15 text-warning', Icon: Clock },
  approved: { en: 'Approved', ru: 'Одобрено', cls: 'bg-success/15 text-success', Icon: CheckCircle2 },
  rejected: { en: 'Rejected', ru: 'Отклонено', cls: 'bg-destructive/15 text-destructive', Icon: XCircle },
  cancelled: { en: 'Cancelled', ru: 'Отменено', cls: 'bg-muted text-muted-foreground', Icon: XCircle },
};

function CreateApprovalForm({ onClose }: { onClose: () => void }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const create = useCreateApprovalRequest();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [entityType, setEntityType] = useState<'expense' | 'purchase_order' | 'contract' | 'payout' | 'invoice' | 'other'>('expense');
  const [amount, setAmount] = useState('');
  const [approverIds, setApproverIds] = useState('');

  return (
    <form
      className="space-y-4 mt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const ids = approverIds.split(',').map((s) => s.trim()).filter(Boolean);
        if (!ids.length) return;
        await create.mutateAsync({
          title,
          description,
          entity_type: entityType,
          amount: amount ? Number(amount) : undefined,
          approver_user_ids: ids,
        });
        onClose();
      }}
    >
      <div className="space-y-1.5">
        <Label>{isRu ? 'Заголовок' : 'Title'}</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label>{isRu ? 'Описание' : 'Description'}</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{isRu ? 'Тип' : 'Type'}</Label>
          <Select value={entityType} onValueChange={(v) => setEntityType(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">{isRu ? 'Расход' : 'Expense'}</SelectItem>
              <SelectItem value="purchase_order">{isRu ? 'Заказ' : 'Purchase order'}</SelectItem>
              <SelectItem value="contract">{isRu ? 'Договор' : 'Contract'}</SelectItem>
              <SelectItem value="payout">{isRu ? 'Выплата' : 'Payout'}</SelectItem>
              <SelectItem value="invoice">{isRu ? 'Инвойс' : 'Invoice'}</SelectItem>
              <SelectItem value="other">{isRu ? 'Другое' : 'Other'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{isRu ? 'Сумма (THB)' : 'Amount (THB)'}</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>{isRu ? 'ID согласующих (через запятую)' : 'Approver user IDs (comma-separated)'}</Label>
        <Textarea value={approverIds} onChange={(e) => setApproverIds(e.target.value)} rows={2}
          placeholder="uuid-1, uuid-2" required />
        <p className="text-xs text-muted-foreground">
          {isRu ? 'В будущем — выбор из команды. Пока используйте UUID пользователей.' : 'Future: pick from team. For now paste user UUIDs.'}
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={create.isPending}>
        {create.isPending ? (isRu ? 'Создание…' : 'Creating…') : (isRu ? 'Создать запрос' : 'Create request')}
      </Button>
    </form>
  );
}
