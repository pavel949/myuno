/**
 * @module StorefrontPage
 * @description Entry point for /b/:slug — loads storefront context and shows MC properties.
 */
import React, { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useStorefront, StorefrontData } from '@/contexts/StorefrontContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { PageContainer } from '@/components/uno/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, MapPin, Bed, Bath, Star } from 'lucide-react';

export default function StorefrontPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { setStorefront, storefront } = useStorefront();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    if (!slug) return;
    loadStorefront(slug);
  }, [slug]);

  async function loadStorefront(sfSlug: string) {
    setLoading(true);
    setError(null);

    try {
      // Fetch storefront
      const { data: sf, error: sfErr } = await supabase
        .from('company_storefronts')
        .select('*')
        .eq('slug', sfSlug)
        .eq('is_active', true)
        .single();

      if (sfErr || !sf) {
        setError(isRu ? 'Витрина не найдена' : 'Storefront not found');
        setLoading(false);
        return;
      }

      // Fetch company info
      const { data: mc } = await supabase
        .from('management_companies')
        .select('id, name_en, name_ru, logo, description_en, description_ru, phone, email, whatsapp')
        .eq('id', sf.company_id)
        .single();

      setCompany(mc);

      // Set storefront context
      const sfData: StorefrontData = {
        id: sf.id,
        company_id: sf.company_id,
        slug: sf.slug,
        mode: sf.mode as any,
        allow_cross_sell: sf.allow_cross_sell,
        allowed_company_ids: sf.allowed_company_ids,
        brand: sf.brand as any,
        company_name_en: mc?.name_en,
        company_name_ru: mc?.name_ru,
        company_logo: mc?.logo,
      };
      setStorefront(sfData);

      // Fetch properties for this MC
      let query = supabase
        .from('properties')
        .select('id, title_en, title_ru, cover_image, address, district, bedrooms, bathrooms, price_per_night, currency, property_type, rating, review_count, is_active')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (sf.mode === 'private') {
        query = query.eq('management_company_id', sf.company_id);
      }

      const { data: props } = await query;
      setProperties(props || []);
    } catch (err) {
      logger.error('Storefront load error:', err);
      setError(isRu ? 'Ошибка загрузки' : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[60vh]">
        <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">{error}</h2>
        <Button onClick={() => navigate('/')} variant="outline">
          {isRu ? 'На главную' : 'Go Home'}
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Company Header */}
      {company && (
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {company.logo && (
              <img src={company.logo} alt={company.name_en} className="h-16 w-16 rounded-lg object-cover" />
            )}
            <div>
              <h1 className="text-2xl font-bold">{isRu ? company.name_ru : company.name_en}</h1>
              <p className="text-muted-foreground text-sm">
                {isRu ? company.description_ru : company.description_en}
              </p>
            </div>
          </div>
          <Badge variant="secondary">
            {isRu ? 'Частная витрина' : 'Private Storefront'}
          </Badge>
        </div>
      )}

      {/* Properties Grid */}
      <h2 className="text-lg font-semibold mb-4">
        {isRu ? 'Доступные объекты' : 'Available Properties'} ({properties.length})
      </h2>
      
      {properties.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {isRu ? 'Нет доступных объектов' : 'No properties available'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((prop) => (
            <Card
              key={prop.id}
              className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
              onClick={() => navigate(`/property/${prop.id}`)}
            >
              {prop.cover_image && (
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={prop.cover_image}
                    alt={isRu ? prop.title_ru : prop.title_en}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <CardContent className="p-4">
                <h3 className="font-semibold line-clamp-1">
                  {isRu ? (prop.title_ru || prop.title_en) : prop.title_en}
                </h3>
                {prop.address && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {prop.district || prop.address}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  {prop.bedrooms != null && (
                    <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{prop.bedrooms}</span>
                  )}
                  {prop.bathrooms != null && (
                    <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{prop.bathrooms}</span>
                  )}
                  {prop.rating != null && (
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-primary text-primary" />{prop.rating}</span>
                  )}
                </div>
                {prop.price_per_night && (
                  <p className="mt-2 font-semibold text-primary">
                    {prop.price_per_night.toLocaleString()} {prop.currency || 'THB'}
                    <span className="text-xs text-muted-foreground font-normal">
                      /{isRu ? 'ночь' : 'night'}
                    </span>
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
