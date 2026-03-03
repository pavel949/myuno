import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDisputes, useResolveDispute } from '@/hooks/useDisputes';
import { DisputeCard } from '@/components/disputes/DisputeCard';
import { SectionHeader } from '@/components/ds';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDisputes() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: disputes, isLoading, refetch } = useAdminDisputes();
  const resolveMutation = useResolveDispute();
  const [resolveModal, setResolveModal] = useState<{ id: string; action: string } | null>(null);
  const [resolution, setResolution] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const statusFilter = (status: string) =>
    disputes?.filter((d) => d.status === status) || [];

  const handleAction = (disputeId: string, action: string) => {
    if (action === 'under_review') {
      resolveMutation.mutate(
        { disputeId, status: 'under_review' },
        { onSuccess: () => { toast.success(isRu ? 'Статус обновлён' : 'Status updated'); refetch(); } }
      );
    } else {
      setResolveModal({ id: disputeId, action });
      setResolution('');
      setAdminNotes('');
    }
  };

  const handleResolve = () => {
    if (!resolveModal) return;
    resolveMutation.mutate(
      {
        disputeId: resolveModal.id,
        status: resolveModal.action as any,
        resolution: resolution || undefined,
        adminNotes: adminNotes || undefined,
      },
      {
        onSuccess: () => {
          toast.success(isRu ? 'Спор обработан' : 'Dispute processed');
          setResolveModal(null);
          refetch();
        },
      }
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-[1536px] mx-auto w-full">
      <div className="flex items-center justify-between">
        <SectionHeader
          title={isRu ? 'Споры' : 'Disputes'}
          subtitle={isRu ? 'Модерация споров и арбитраж' : 'Dispute moderation & arbitration'}
          icon={AlertTriangle}
          size="lg"
        />
        <Button variant="ghost" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">
            {isRu ? 'Открытые' : 'Open'} ({statusFilter('open').length})
          </TabsTrigger>
          <TabsTrigger value="under_review">
            {isRu ? 'На рассмотрении' : 'Under Review'} ({statusFilter('under_review').length})
          </TabsTrigger>
          <TabsTrigger value="closed">
            {isRu ? 'Закрытые' : 'Closed'} ({(statusFilter('resolved').length + statusFilter('rejected').length)})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-4 space-y-3">
          {statusFilter('open').map((d) => (
            <DisputeCard key={d.id} dispute={d} showActions onAction={handleAction} />
          ))}
          {statusFilter('open').length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {isRu ? 'Нет открытых споров' : 'No open disputes'}
            </p>
          )}
        </TabsContent>

        <TabsContent value="under_review" className="mt-4 space-y-3">
          {statusFilter('under_review').map((d) => (
            <div key={d.id} className="space-y-2">
              <DisputeCard dispute={d} />
              <div className="flex gap-2 pl-4">
                <Button size="sm" onClick={() => handleAction(d.id, 'resolved')}>
                  {isRu ? 'Решить' : 'Resolve'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAction(d.id, 'rejected')}>
                  {isRu ? 'Отклонить' : 'Reject'}
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="closed" className="mt-4 space-y-3">
          {[...statusFilter('resolved'), ...statusFilter('rejected')].map((d) => (
            <DisputeCard key={d.id} dispute={d} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Resolve Modal */}
      <Dialog open={!!resolveModal} onOpenChange={() => setResolveModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {resolveModal?.action === 'resolved'
                ? (isRu ? 'Решить спор' : 'Resolve Dispute')
                : (isRu ? 'Отклонить спор' : 'Reject Dispute')}
            </DialogTitle>
            <DialogDescription>
              {isRu ? 'Укажите причину решения' : 'Provide resolution details'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder={isRu ? 'Решение для пользователя...' : 'Resolution for user...'}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={3}
            />
            <Textarea
              placeholder={isRu ? 'Внутренние заметки...' : 'Internal notes...'}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveModal(null)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button
              variant={resolveModal?.action === 'rejected' ? 'destructive' : 'default'}
              onClick={handleResolve}
              disabled={resolveMutation.isPending}
            >
              {resolveMutation.isPending
                ? '...'
                : resolveModal?.action === 'resolved'
                  ? (isRu ? 'Решить' : 'Resolve')
                  : (isRu ? 'Отклонить' : 'Reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
