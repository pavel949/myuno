import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';

import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, CheckCircle, AlertTriangle, Clock, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';

interface RestaurantQuality {
  id: string;
  name_en: string;
  slug: string | null;
  area: string | null;
  district: string | null;
  reservation_supported: boolean | null;
  reservation_url: string | null;
  menu_url: string | null;
  hero_image_url: string | null;
  cover_image: string | null;
  needs_manual_verification: boolean | null;
  last_verified_at: string | null;
  verification_notes: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  is_active: boolean | null;
  data_sources: any;
}

export default function AdminRestaurantDataQuality() {
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const queryClient = useQueryClient();
  const [filterVerification, setFilterVerification] = useState(false);

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['restaurant-data-quality', filterVerification],
    queryFn: async () => {
      let query = supabase
        .from('restaurants')
        .select('id,name_en,slug,area,district,reservation_supported,reservation_url,menu_url,hero_image_url,cover_image,needs_manual_verification,last_verified_at,verification_notes,address,lat,lng,is_active,data_sources')
        .eq('city', 'Phuket')
        .order('needs_manual_verification', { ascending: false })
        .order('name_en');

      if (filterVerification) {
        query = query.eq('needs_manual_verification', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as RestaurantQuality[];
    },
  });

  const markVerified = async (id: string) => {
    // Update JSONB attributes in listings table
    const { data: current } = await supabase
      .from('listings')
      .select('attributes')
      .eq('id', id)
      .single();
    
    const updatedAttrs = {
      ...(current?.attributes as Record<string, any> || {}),
      needs_manual_verification: false,
      last_verified_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('listings')
      .update({ attributes: updatedAttrs } as any)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success('Marked as verified');
      queryClient.invalidateQueries({ queryKey: ['restaurant-data-quality'] });
    }
  };

  const needsVerCount = restaurants.filter(r => r.needs_manual_verification).length;
  const verifiedCount = restaurants.filter(r => r.last_verified_at).length;
  const missingImages = restaurants.filter(r => !r.hero_image_url && !r.cover_image).length;
  const missingCoords = restaurants.filter(r => !r.lat || !r.lng).length;

  if (adminLoading) return <><Skeleton className="h-96" /></>;
  if (!isAdmin) return <><PageContainer><p>Access denied</p></PageContainer></>;

  return (
    <>
      <PageContainer>
        <PageHeader
          title="Restaurant Data Quality"
          subtitle={`${restaurants.length} Phuket restaurants • ${verifiedCount} verified • ${needsVerCount} need verification`}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{restaurants.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">{verifiedCount}</div>
            <div className="text-xs text-muted-foreground">Verified</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">{needsVerCount}</div>
            <div className="text-xs text-muted-foreground">Need Verification</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-destructive">{missingImages}</div>
            <div className="text-xs text-muted-foreground">Missing Images</div>
          </CardContent></Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-4">
          <Switch checked={filterVerification} onCheckedChange={setFilterVerification} id="filter-verif" />
          <Label htmlFor="filter-verif">Show only needs verification ({needsVerCount})</Label>
        </div>

        {/* Table */}
        {isLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <div className="space-y-3">
            {restaurants.map((r) => (
              <Card key={r.id} className={r.needs_manual_verification ? 'border-warning/30 bg-warning/5' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{r.name_en}</h3>
                        {r.needs_manual_verification ? (
                          <Badge variant="outline" className="text-warning border-warning/30 shrink-0">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Needs Verification
                          </Badge>
                        ) : r.last_verified_at ? (
                          <Badge variant="outline" className="text-success border-success/30 shrink-0">
                            <CheckCircle className="h-3 w-3 mr-1" /> Verified
                          </Badge>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                        <span>{r.area || r.district || '—'}</span>
                        <span>•</span>
                        <span>{r.address ? '📍 Has address' : '❌ No address'}</span>
                        <span>•</span>
                        <span>{r.lat ? '🗺️ Has coords' : '❌ No coords'}</span>
                        <span>•</span>
                        <span>{(r.hero_image_url || r.cover_image) ? '🖼️ Has image' : '❌ No image'}</span>
                      </div>

                      {r.verification_notes && (
                        <p className="text-xs text-muted-foreground italic mb-2">{r.verification_notes}</p>
                      )}

                      {r.last_verified_at && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Verified: {new Date(r.last_verified_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      {r.reservation_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={r.reservation_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" /> Reserve
                          </a>
                        </Button>
                      )}
                      {r.menu_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={r.menu_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" /> Menu
                          </a>
                        </Button>
                      )}
                      {r.needs_manual_verification && (
                        <Button size="sm" variant="default" onClick={() => markVerified(r.id)}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Mark Verified
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
