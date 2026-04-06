import { useLanguage } from '@/contexts/LanguageContext';
import { useConsultationRequests } from '@/hooks/useConsultationRequests';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const INVESTMENT_TYPES = [
  'investment_advice', 'property_consultation', 'property_purchase', 'property_tour',
] as const;

const TYPE_LABELS: Record<string, { ru: string; en: string }> = {
  investment_advice: { ru: 'Инвестиционная консультация', en: 'Investment Advice' },
  property_consultation: { ru: 'Консультация по недвижимости', en: 'Property Consultation' },
  property_purchase: { ru: 'Покупка недвижимости', en: 'Property Purchase' },
  property_tour: { ru: 'Просмотр объекта', en: 'Property Tour' },
};

const STATUS_STYLES: Record<string, { ru: string; en: string; className: string }> = {
  pending: { ru: 'Ожидает', en: 'Pending', className: 'bg-amber-100 text-amber-800' },
  contacted: { ru: 'Связались', en: 'Contacted', className: 'bg-blue-100 text-blue-800' },
  scheduled: { ru: 'Запланировано', en: 'Scheduled', className: 'bg-purple-100 text-purple-800' },
  in_progress: { ru: 'В работе', en: 'In Progress', className: 'bg-cyan-100 text-cyan-800' },
  completed: { ru: 'Завершено', en: 'Completed', className: 'bg-green-100 text-green-800' },
  cancelled: { ru: 'Отменено', en: 'Cancelled', className: 'bg-gray-100 text-gray-600' },
};

export function InvestorInterestsList() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { requests, isLoading } = useConsultationRequests();

  const investmentRequests = (requests ?? []).filter(r =>
    INVESTMENT_TYPES.includes(r.request_type as typeof INVESTMENT_TYPES[number])
  );

  if (isLoading) {
    return (
      <Card className="p-6 space-y-3">
        <h3 className="font-medium mb-3">{isRu ? 'Мои заявки' : 'My Applications'}</h3>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-medium mb-3">{isRu ? 'Мои заявки' : 'My Applications'}</h3>

      {investmentRequests.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isRu ? 'У вас пока нет активных заявок' : 'No active applications yet'}
        </p>
      ) : (
        <div className="space-y-3">
          {investmentRequests.map(req => {
            const typeLabel = TYPE_LABELS[req.request_type];
            const statusStyle = STATUS_STYLES[req.status] ?? STATUS_STYLES.pending;
            const hasBudget = req.budget_min != null || req.budget_max != null;

            return (
              <div key={req.id} className="flex items-start justify-between gap-3 py-3 border-b last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {typeLabel ? (isRu ? typeLabel.ru : typeLabel.en) : req.request_type}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(req.created_at), {
                      addSuffix: true,
                      locale: isRu ? ru : undefined,
                    })}
                  </p>
                  {hasBudget && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isRu ? 'Бюджет: ' : 'Budget: '}
                      {req.budget_min != null ? `${req.budget_min.toLocaleString()} ` : ''}
                      {req.budget_min != null && req.budget_max != null ? '— ' : ''}
                      {req.budget_max != null ? `${req.budget_max.toLocaleString()} ` : ''}
                      {req.currency ?? 'THB'}
                    </p>
                  )}
                </div>
                <Badge className={`shrink-0 text-xs font-medium ${statusStyle.className}`}>
                  {isRu ? statusStyle.ru : statusStyle.en}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
