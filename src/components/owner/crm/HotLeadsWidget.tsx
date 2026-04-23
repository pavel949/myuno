import { useLanguage } from '@/contexts/LanguageContext';
import { useHotLeads } from '@/hooks/useReturningGuests';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Phone, MessageCircle, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export function HotLeadsWidget() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: hotLeads = [], isLoading } = useHotLeads(2);

  if (isLoading || hotLeads.length === 0) return null;

  return (
    <div className="rounded-none border border-destructive/30 bg-destructive/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-destructive" />
        <h3 className="font-semibold text-sm">
          {isRu ? 'Горячие лиды — готовы к покупке' : 'Hot Leads — Ready to Buy'}
        </h3>
        <Badge variant="destructive" className="ml-auto text-xs">
          {hotLeads.length}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        {isRu
          ? 'Гости с 2+ бронированиями. Высокая вероятность покупки недвижимости.'
          : 'Guests with 2+ bookings. High probability of property purchase.'}
      </p>
      <div className="space-y-2">
        {hotLeads.slice(0, 5).map(lead => (
          <div
            key={lead.id}
            className="flex items-center justify-between p-3 rounded-none bg-card border"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">
                {lead.guest_name}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {lead.booking_count} {isRu ? 'визитов' : 'visits'}
                </span>
                {(lead.total_spent ?? 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ฿{((lead.total_spent || 0)).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {lead.guest_phone && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  asChild
                >
                  <a href={`https://wa.me/${lead.guest_phone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 text-success" />
                  </a>
                </Button>
              )}
              {lead.guest_phone && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  asChild
                >
                  <a href={`tel:${lead.guest_phone}`}>
                    <Phone className="h-4 w-4 text-primary" />
                  </a>
                </Button>
              )}
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] shrink-0',
                  (lead.booking_count || 0) >= 3
                    ? 'border-destructive/50 text-destructive bg-destructive/10'
                    : 'border-warning/50 text-warning bg-warning/10'
                )}
              >
                {(lead.booking_count || 0) >= 3
                  ? (isRu ? '🔥 Покупатель' : '🔥 Buyer')
                  : (isRu ? '⚡ Тёплый' : '⚡ Warm')}
              </Badge>
            </div>
          </div>
        ))}
      </div>
      {hotLeads.length > 5 && (
        <p className="text-xs text-center text-muted-foreground">
          +{hotLeads.length - 5} {isRu ? 'ещё' : 'more'}
        </p>
      )}
    </div>
  );
}
