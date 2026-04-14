import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DEAL_STAGES, DEAL_STAGE_LABELS, DealStage, useBulkUpdateStage, useBulkDeleteDeals } from '@/hooks/useAgentDeals';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, ArrowRight, X } from 'lucide-react';

import { toast } from 'sonner';
interface Props {
  selectedIds: string[];
  onClear: () => void;
}

export function BulkActions({ selectedIds, onClear }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
const bulkStage = useBulkUpdateStage();
  const bulkDelete = useBulkDeleteDeals();
  const [targetStage, setTargetStage] = useState<string>('');

  if (selectedIds.length === 0) return null;

  const handleBulkStage = async () => {
    if (!targetStage) return;
    try {
      await bulkStage.mutateAsync({ ids: selectedIds, stage: targetStage as DealStage });
      toast(isRu ? `${selectedIds.length} сделок обновлено` : `${selectedIds.length} deals updated`);
      onClear();
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDelete.mutateAsync(selectedIds);
      toast(isRu ? `${selectedIds.length} сделок удалено` : `${selectedIds.length} deals deleted`);
      onClear();
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 rounded-xl border bg-primary/5 border-primary/30">
      <span className="text-sm font-medium shrink-0">
        {selectedIds.length} {isRu ? 'выбрано' : 'selected'}
      </span>
      <Select value={targetStage} onValueChange={setTargetStage}>
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <SelectValue placeholder={isRu ? 'Этап' : 'Stage'} />
        </SelectTrigger>
        <SelectContent>
          {DEAL_STAGES.map(s => (
            <SelectItem key={s} value={s}>
              {isRu ? DEAL_STAGE_LABELS[s].ru : DEAL_STAGE_LABELS[s].en}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" variant="outline" onClick={handleBulkStage} disabled={!targetStage || bulkStage.isPending} className="h-8 text-xs">
        <ArrowRight className="h-3 w-3 mr-1" />
        {isRu ? 'Переместить' : 'Move'}
      </Button>
      <Button size="sm" variant="ghost" onClick={handleBulkDelete} disabled={bulkDelete.isPending} className="h-8 text-xs text-destructive hover:text-destructive">
        <Trash2 className="h-3 w-3 mr-1" />
        {isRu ? 'Удалить' : 'Delete'}
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear} className="h-8 ml-auto">
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
