import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Clock, Archive, ShieldCheck } from 'lucide-react';
import { useUpdateManagementTerms, type ManagementTerms } from '@/hooks/usePropertyManagementTerms';
import { useLogTermsActivity } from '@/hooks/useManagementTermsActivity';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Status = ManagementTerms['status'];

const STATUS_CONFIG: Record<Status, {
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  className: string;
}> = {
  active: {
    icon: CheckCircle2,
    labelEn: 'Active',
    labelRu: 'Активно',
    className: 'text-primary',
  },
  pending_approval: {
    icon: ShieldCheck,
    labelEn: 'Pending',
    labelRu: 'Ожидает',
    className: 'text-warning',
  },
  draft: {
    icon: Clock,
    labelEn: 'Draft',
    labelRu: 'Черновик',
    className: 'text-muted-foreground',
  },
  archived: {
    icon: Archive,
    labelEn: 'Archived',
    labelRu: 'Архив',
    className: 'text-muted-foreground',
  },
};

interface InlineStatusSelectProps {
  terms: ManagementTerms;
}

export function InlineStatusSelect({ terms }: InlineStatusSelectProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const updateTerms = useUpdateManagementTerms();
  const logActivity = useLogTermsActivity();
  const [updating, setUpdating] = useState(false);

  const handleChange = async (newStatus: Status) => {
    if (newStatus === terms.status) return;
    setUpdating(true);
    try {
      await updateTerms.mutateAsync({
        id: terms.id,
        updates: { status: newStatus },
      });
      await logActivity.mutateAsync({
        terms_id: terms.id,
        action: 'status_changed',
        field_name: 'status',
        old_value: terms.status,
        new_value: newStatus,
      });
      toast.success(isRu ? 'Статус обновлён' : 'Status updated');
    } catch {
      toast.error(isRu ? 'Ошибка обновления' : 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const current = STATUS_CONFIG[terms.status];

  return (
    <Select value={terms.status} onValueChange={(v) => handleChange(v as Status)} disabled={updating}>
      <SelectTrigger
        className={cn(
          'h-7 w-auto gap-1 border-none bg-transparent px-1.5 text-xs font-medium shadow-none hover:bg-muted/60 focus:ring-0',
          current.className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(STATUS_CONFIG) as [Status, typeof current][]).map(([value, config]) => {
          const Icon = config.icon;
          return (
            <SelectItem key={value} value={value} className="text-xs">
              <div className="flex items-center gap-1.5">
                <Icon className={cn('h-3 w-3', config.className)} />
                {isRu ? config.labelRu : config.labelEn}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
