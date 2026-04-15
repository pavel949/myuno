import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { AgentDeal } from '@/hooks/useAgentDeals';
import { Badge } from '@/components/ui/badge';
import { Bed, MapPin } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';

interface Props {
  deal: AgentDeal;
}

export function PropertyMatching({ deal }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['matching-properties', deal.company_id, deal.budget_min, deal.budget_max, deal.preferred_types, deal.bedrooms_min],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('id, title_en, title_ru, property_type, price, currency, bedrooms, district, images, listing_type')
        .eq('management_company_id', deal.company_id)
        .in('listing_type', ['sale', 'rent_and_sale'])
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

      if (deal.budget_max) query = query.lte('price', Number(deal.budget_max));
      if (deal.budget_min) query = query.gte('price', Number(deal.budget_min));
      if (deal.bedrooms_min) query = query.gte('bedrooms', deal.bedrooms_min);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!deal.company_id,
  });

  // Client-side filtering + match score
  const scored = useMemo(() => {
    return properties.map(p => {
      let score = 0;
      if (deal.budget_min && deal.budget_max && p.price) {
        const price = Number(p.price);
        if (price >= Number(deal.budget_min) && price <= Number(deal.budget_max)) score += 3;
      }
      if (deal.preferred_types?.length && p.property_type) {
        if (deal.preferred_types.some(t => p.property_type?.toLowerCase().includes(t.toLowerCase()))) score += 2;
      }
      if (deal.preferred_districts?.length && p.district) {
        if (deal.preferred_districts.some(d => p.district?.toLowerCase().includes(d.toLowerCase()))) score += 2;
      }
      if (deal.bedrooms_min && p.bedrooms && p.bedrooms >= deal.bedrooms_min) score += 1;
      return { ...p, score };
    }).sort((a, b) => b.score - a.score);
  }, [properties, deal]);

  if (isLoading) return <p className="text-xs text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</p>;
  if (scored.length === 0) return <p className="text-xs text-muted-foreground">{isRu ? 'Нет подходящих объектов' : 'No matching properties'}</p>;

  return (
    <div className="space-y-2">
      {scored.slice(0, 5).map(p => (
        <button
          key={p.id}
          onClick={() => navigate(APP_ROUTES.PROPERTY_DETAIL(p.id))}
          className="w-full text-left flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
        >
          {p.images?.[0] && (
            <img src={p.images[0]} alt="" className="h-14 w-14 rounded-md object-cover shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{isRu ? p.title_ru : p.title_en}</p>
              {p.score >= 5 && <Badge variant="default" className="text-[9px] shrink-0">{isRu ? 'Отлично' : 'Great'}</Badge>}
              {p.score >= 3 && p.score < 5 && <Badge variant="secondary" className="text-[9px] shrink-0">{isRu ? 'Хорошо' : 'Good'}</Badge>}
            </div>
            <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
              {p.price && <span className="font-medium text-foreground">{Number(p.price).toLocaleString()} {p.currency}</span>}
              {p.bedrooms && <span className="flex items-center gap-0.5"><Bed className="h-3 w-3" />{p.bedrooms}</span>}
              {p.district && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{p.district}</span>}
              {p.property_type && <Badge variant="secondary" className="text-[9px]">{p.property_type}</Badge>}
            </div>
          </div>
        </button>
      ))}
      {scored.length > 5 && (
        <p className="text-xs text-muted-foreground text-center">+{scored.length - 5} {isRu ? 'ещё' : 'more'}</p>
      )}
    </div>
  );
}
