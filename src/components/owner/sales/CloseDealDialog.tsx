import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUpdateDeal, DealStage, useMyCompanyId } from '@/hooks/useAgentDeals';
import { useAddDealActivity } from '@/hooks/useAgentDealActivities';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCrmOptions } from '@/hooks/useCrmSettings';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  currentStage: DealStage;
  mode: 'won' | 'lost';
}

export function CloseDealDialog({ open, onOpenChange, dealId, currentStage, mode }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { toast } = useToast();
  const updateDeal = useUpdateDeal();
  const addActivity = useAddDealActivity();
  const { data: membership } = useMyCompanyId();
  const { data: lostReasons = [] } = useCrmOptions(membership?.company_id, 'lost_reason');

  const [dealValue, setDealValue] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [lostReasonText, setLostReasonText] = useState('');

  const reasonLabel = selectedReason
    ? (isRu
      ? lostReasons.find(r => r.value === selectedReason)?.label_ru
      : lostReasons.find(r => r.value === selectedReason)?.label_en) || selectedReason
    : lostReasonText;

  const handleSubmit = async () => {
    const finalReason = selectedReason === 'other'
      ? lostReasonText || (isRu ? 'Другое' : 'Other')
      : reasonLabel || lostReasonText;

    try {
      if (mode === 'won') {
        await updateDeal.mutateAsync({
          id: dealId,
          stage: 'closed_won',
          closed_at: new Date().toISOString(),
          deal_value: dealValue ? Number(dealValue) : null,
          commission_percent: commissionPercent ? Number(commissionPercent) : null,
          commission_amount: dealValue && commissionPercent ? Number(dealValue) * Number(commissionPercent) / 100 : null,
        });
      } else {
        await updateDeal.mutateAsync({
          id: dealId,
          stage: 'closed_lost',
          closed_at: new Date().toISOString(),
          lost_reason: finalReason || null,
        });
      }
      await addActivity.mutateAsync({
        deal_id: dealId,
        user_id: user!.id,
        activity_type: 'stage_change',
        description: mode === 'won'
          ? (isRu ? 'Сделка закрыта — успех' : 'Deal closed — won')
          : (isRu ? `Сделка проиграна: ${finalReason}` : `Deal lost: ${finalReason}`),
        stage_from: currentStage,
        stage_to: mode === 'won' ? 'closed_won' : 'closed_lost',
      });
      toast({ title: mode === 'won' ? (isRu ? 'Поздравляем! 🎉' : 'Congratulations! 🎉') : (isRu ? 'Сделка закрыта' : 'Deal closed') });
      onOpenChange(false);
    } catch {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {mode === 'won'
              ? (isRu ? '🎉 Закрыть как успех' : '🎉 Close as Won')
              : (isRu ? 'Закрыть как проигрыш' : 'Close as Lost')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {mode === 'won' ? (
            <>
              <div>
                <Label>{isRu ? 'Сумма сделки' : 'Deal Value'}</Label>
                <Input type="number" value={dealValue} onChange={e => setDealValue(e.target.value)} placeholder="e.g. 5000000" />
              </div>
              <div>
                <Label>{isRu ? 'Комиссия (%)' : 'Commission (%)'}</Label>
                <Input type="number" value={commissionPercent} onChange={e => setCommissionPercent(e.target.value)} placeholder="e.g. 3" />
              </div>
              {dealValue && commissionPercent && (
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Комиссия' : 'Commission'}: {(Number(dealValue) * Number(commissionPercent) / 100).toLocaleString()} THB
                </p>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <Label>{isRu ? 'Причина проигрыша' : 'Lost Reason'}</Label>
              <div className="flex flex-wrap gap-1.5">
                {lostReasons.filter(r => r.is_active).map(r => (
                  <button
                    key={r.value}
                    onClick={() => setSelectedReason(r.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                      selectedReason === r.value
                        ? 'border-destructive bg-destructive/10 text-destructive'
                        : 'border-border bg-card text-muted-foreground hover:border-foreground/30',
                    )}
                  >
                    {isRu ? r.label_ru : r.label_en}
                  </button>
                ))}
              </div>
              {(selectedReason === 'other' || !lostReasons.length) && (
                <Textarea
                  value={lostReasonText}
                  onChange={e => setLostReasonText(e.target.value)}
                  rows={2}
                  placeholder={isRu ? 'Опишите причину...' : 'Describe the reason...'}
                />
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{isRu ? 'Отмена' : 'Cancel'}</Button>
          <Button
            onClick={handleSubmit}
            disabled={updateDeal.isPending}
            variant={mode === 'lost' ? 'destructive' : 'default'}
          >
            {updateDeal.isPending ? '...' : (mode === 'won' ? (isRu ? 'Закрыть сделку' : 'Close Deal') : (isRu ? 'Проиграна' : 'Mark Lost'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
