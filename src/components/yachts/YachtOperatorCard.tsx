import { useEffect, useState } from 'react';
import { Building2, Phone, Mail, Globe, Shield, Star, Ship } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface Provider {
  id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  is_verified: boolean;
  rating: number;
  review_count: number;
  response_time_minutes: number | null;
  fleet_count?: number;
}

interface YachtOperatorCardProps {
  providerId: string;
}

export function YachtOperatorCard({ providerId }: YachtOperatorCardProps) {
  const { language } = useLanguage();
  const t = language === 'ru';
  const [provider, setProvider] = useState<Provider | null>(null);

  useEffect(() => {
    if (!providerId) return;

    const fetchProvider = async () => {
      // Fetch provider + fleet count
      const { data: prov } = await supabase
        .from('providers')
        .select('id, name, logo_url, phone, email, website, is_verified, rating, review_count, response_time_minutes')
        .eq('id', providerId)
        .single();

      if (!prov) return;

      const { count } = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('vertical', 'yacht')
        .eq('provider_id', providerId)
        .eq('is_active', true);

      setProvider({ ...prov, fleet_count: count || 0 });
    };

    fetchProvider();
  }, [providerId]);

  if (!provider) return null;

  return (
    <div className="p-5 border border-border/60 rounded-2xl bg-card">
      <div className="flex items-start gap-4">
        {/* Avatar / Logo */}
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {provider.logo_url ? (
            <img src={provider.logo_url} alt={provider.name} className="w-full h-full object-contain p-1" />
          ) : (
            <Building2 className="w-7 h-7 text-primary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm truncate">{provider.name}</h4>
            {provider.is_verified && (
              <Badge variant="outline" className="text-xs gap-1 px-1.5 py-0 border-primary/30 text-primary">
                <Shield className="w-3 h-3" />
                {t ? 'Проверен' : 'Verified'}
              </Badge>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            {provider.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {provider.rating} ({provider.review_count})
              </span>
            )}
            {provider.fleet_count != null && provider.fleet_count > 0 && (
              <span className="flex items-center gap-1">
                <Ship className="w-3 h-3" />
                {provider.fleet_count} {t ? 'яхт' : 'yachts'}
              </span>
            )}
            {provider.response_time_minutes && (
              <span>
                ⚡ {provider.response_time_minutes < 60
                  ? `${provider.response_time_minutes}m`
                  : `${Math.round(provider.response_time_minutes / 60)}h`
                } {t ? 'ответ' : 'reply'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
        {provider.phone && (
          <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" asChild>
            <a href={`tel:${provider.phone}`}>
              <Phone className="w-3.5 h-3.5" />
              {t ? 'Позвонить' : 'Call'}
            </a>
          </Button>
        )}
        {provider.email && (
          <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" asChild>
            <a href={`mailto:${provider.email}`}>
              <Mail className="w-3.5 h-3.5" />
              {t ? 'Написать' : 'Email'}
            </a>
          </Button>
        )}
        {provider.website && (
          <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" asChild>
            <a href={provider.website} target="_blank" rel="noopener noreferrer">
              <Globe className="w-3.5 h-3.5" />
              {t ? 'Сайт' : 'Website'}
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
