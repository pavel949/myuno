import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateDispute, DISPUTE_TYPES } from '@/hooks/useDisputes';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string;
  providerId?: string;
}

export function OpenDisputeModal({ open, onOpenChange, orderId, providerId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const createDispute = useCreateDispute();
  const [disputeType, setDisputeType] = useState('service_quality');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error(isRu ? 'Опишите проблему' : 'Please describe the issue');
      return;
    }

    try {
      await createDispute.mutateAsync({
        orderId,
        providerId,
        disputeType,
        description: description.trim(),
      });
      toast.success(isRu ? 'Спор открыт' : 'Dispute opened');
      setDescription('');
      onOpenChange(false);
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Failed to open dispute');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            {isRu ? 'Открыть спор' : 'Open Dispute'}
          </DialogTitle>
          <DialogDescription>
            {isRu
              ? 'Опишите проблему — мы рассмотрим её в течение 24 часов'
              : 'Describe the issue — we\'ll review it within 24 hours'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {isRu ? 'Тип проблемы' : 'Issue Type'}
            </label>
            <Select value={disputeType} onValueChange={setDisputeType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISPUTE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {isRu ? t.labelRu : t.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {isRu ? 'Описание' : 'Description'}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isRu ? 'Опишите проблему подробно...' : 'Describe the issue in detail...'}
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/2000</p>
          </div>

          <Button
            className="w-full"
            variant="destructive"
            disabled={!description.trim() || createDispute.isPending}
            onClick={handleSubmit}
          >
            {createDispute.isPending
              ? (isRu ? 'Отправка...' : 'Submitting...')
              : (isRu ? 'Отправить спор' : 'Submit Dispute')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
