import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDisputes, useResolveDispute } from '@/hooks/useDisputes';
import { DisputeCard } from '@/components/disputes/DisputeCard';
import { toast } from 'sonner';

export function OperationsDisputesTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: disputes, isLoading, refetch } = useAdminDisputes();
  const resolveMutation = useResolveDispute();

  const openDisputes = disputes?.filter((d) => d.status === 'open' || d.status === 'under_review') || [];

  const handleAction = (disputeId: string, action: string) => {
    resolveMutation.mutate(
      { disputeId, status: action as any },
      { onSuccess: () => { toast.success(isRu ? 'Обновлено' : 'Updated'); refetch(); } }
    );
  };

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-8">{isRu ? 'Загрузка...' : 'Loading...'}</p>;
  }

  if (openDisputes.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        {isRu ? 'Нет активных споров' : 'No active disputes'}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {openDisputes.map((d) => (
        <DisputeCard key={d.id} dispute={d} showActions onAction={handleAction} />
      ))}
    </div>
  );
}
