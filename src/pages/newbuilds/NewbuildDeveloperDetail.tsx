/**
 * /newbuilds/developers/:slug — Developer Profile (dark editorial)
 */
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Globe, Phone, Mail, Building2, MapPin } from 'lucide-react';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { NbProjectCard } from '@/components/newbuilds/NbProjectCard';
import { NbLeadForm } from '@/components/newbuilds/NbLeadForm';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_ROUTES } from '@/lib/config/routes';
import type { NewbuildProject } from '@/hooks/useNewbuildProjects';

function useDeveloperBySlug(slug?: string) {
  return useQuery({
    queryKey: ['nb-developer', slug],
    queryFn: async () => {
      if (!slug) return null;
      let { data, error } = await supabase.from('developers').select('*').eq('slug', slug).maybeSingle();
      if (!data && !error) {
        ({ data, error } = await supabase.from('developers').select('*').eq('id', slug).maybeSingle());
      }
      if (error) throw error;
      return data as any;
    },
    enabled: !!slug,
  });
}

function useDeveloperProjects(devId?: string) {
  return useQuery({
    queryKey: ['nb-developer-projects', devId],
    queryFn: async (): Promise<NewbuildProject[]> => {
      if (!devId) return [];
      const { data, error } = await supabase
        .from('property_projects')
        .select('*')
        .eq('developer_id', devId)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        id: p.id, slug: p.slug, name_en: p.name_en, name_ru: p.name_ru,
        tagline: p.tagline, description_en: p.description_en, description_ru: p.description_ru,
        cover_image: p.cover_image, gallery_urls: p.gallery_urls || p.images, images: p.images,
        video_url: p.video_url, location_area: p.location_area || p.district, district: p.district,
        address: p.address, lat: p.lat, lng: p.lng, price_from: p.price_from, price_to: p.price_to,
        unit_types: p.unit_types, total_units: p.total_units, units_available: p.units_available,
        units_sold: p.units_sold, completion_date: p.completion_date,
        construction_progress: p.construction_progress || 0,
        project_status: p.project_status || 'under_construction',
        is_featured: p.is_featured || false, is_approved: p.is_approved ?? true,
        developer_id: p.developer_id, developer_name: p.developer_name,
        amenities: p.amenities, muuno_score: p.muuno_score, created_at: p.created_at,
      }));
    },
    enabled: !!devId,
  });
}

export default function NewbuildDeveloperDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: dev, isLoading } = useDeveloperBySlug(slug);
  const { data: projects } = useDeveloperProjects(dev?.id);

  if (isLoading) {
    return (
      <NewbuildsLayout>
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      </NewbuildsLayout>
    );
  }

  if (!dev) {
    return (
      <NewbuildsLayout>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <p className="nb-display text-xl" style={{ color: 'hsl(var(--nb-muted))' }}>Девелопер не найден</p>
          <Link to={APP_ROUTES.NEWBUILDS_DEVELOPERS} className="mt-4 inline-block text-sm" style={{ color: 'hsl(var(--nb-gold))' }}>
            ← К списку девелоперов
          </Link>
        </div>
      </NewbuildsLayout>
    );
  }

  return (
    <NewbuildsLayout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <Link to={APP_ROUTES.NEWBUILDS_DEVELOPERS} className="inline-flex items-center gap-1.5 text-sm mb-6" style={{ color: 'hsl(var(--nb-muted))' }}>
          <ChevronLeft className="w-4 h-4" /> Девелоперы
        </Link>

        {/* Header */}
        <div className="nb-glass p-8 rounded-xl mb-10">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {dev.logo_url ? (
              <img src={dev.logo_url} alt={dev.name_en} className="w-20 h-20 rounded-xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--nb-gold) / 0.15)' }}>
                <Building2 className="w-8 h-8" style={{ color: 'hsl(var(--nb-gold))' }} />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="nb-display text-3xl" style={{ color: 'hsl(var(--nb-text))' }}>{dev.name_en}</h1>
                {dev.is_verified && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs" style={{ background: 'hsl(var(--nb-gold) / 0.15)', color: 'hsl(var(--nb-gold))' }}>
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-sm mb-3" style={{ color: 'hsl(var(--nb-muted))' }}>{dev.name_ru}</p>
              {dev.description_en && (
                <p className="text-sm max-w-2xl" style={{ color: 'hsl(var(--nb-text-secondary))' }}>{dev.description_en}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-4">
                {dev.website && (
                  <a href={dev.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80" style={{ color: 'hsl(var(--nb-gold))' }}>
                    <Globe className="w-4 h-4" /> Сайт
                  </a>
                )}
                {dev.phone && (
                  <a href={`tel:${dev.phone}`} className="flex items-center gap-1.5 text-sm" style={{ color: 'hsl(var(--nb-text-secondary))' }}>
                    <Phone className="w-4 h-4" /> {dev.phone}
                  </a>
                )}
                {dev.email && (
                  <a href={`mailto:${dev.email}`} className="flex items-center gap-1.5 text-sm" style={{ color: 'hsl(var(--nb-text-secondary))' }}>
                    <Mail className="w-4 h-4" /> {dev.email}
                  </a>
                )}
              </div>
            </div>
            <div className="text-center">
              <p className="nb-mono text-3xl font-bold" style={{ color: 'hsl(var(--nb-gold))' }}>{projects?.length || 0}</p>
              <p className="text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>Проектов</p>
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="nb-display text-2xl" style={{ color: 'hsl(var(--nb-text))' }}>Проекты</h2>
        </div>

        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {projects.map(p => <NbProjectCard key={p.id} project={p} />)}
          </div>
        ) : (
          <p className="text-sm py-8 text-center" style={{ color: 'hsl(var(--nb-muted))' }}>Нет активных проектов</p>
        )}

        {/* Lead form */}
        <div className="nb-separator my-10" />
        <div className="max-w-md mx-auto">
          <h3 className="nb-display text-xl text-center mb-4" style={{ color: 'hsl(var(--nb-text))' }}>
            Связаться с {dev.name_en}
          </h3>
          <NbLeadForm developerId={dev.id} source="developer_page" />
        </div>
      </div>
    </NewbuildsLayout>
  );
}
