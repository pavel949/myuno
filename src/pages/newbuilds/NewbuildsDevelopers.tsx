/**
 * /newbuilds/developers — Developer Directory (dark editorial theme)
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Building2, CheckCircle, ExternalLink, Globe, Phone, Mail } from 'lucide-react';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_ROUTES } from '@/lib/config/routes';

interface NbDeveloper {
  id: string;
  name_en: string;
  name_ru: string;
  slug: string | null;
  logo_url: string | null;
  description_en: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  is_verified: boolean;
  muuno_score: number | null;
  project_count: number;
}

function useNbDevelopers() {
  return useQuery({
    queryKey: ['nb-developers-directory'],
    queryFn: async (): Promise<NbDeveloper[]> => {
      const { data: devs, error } = await supabase
        .from('developers')
        .select('id, name_en, name_ru, slug, logo_url, description_en, website, phone, email, is_verified, muuno_score')
        .eq('is_active', true)
        .order('is_verified', { ascending: false })
        .order('muuno_score', { ascending: false, nullsFirst: false });
      if (error) throw error;

      // Count projects per developer
      const { data: projects } = await supabase
        .from('property_projects')
        .select('developer_id')
        .eq('is_active', true)
        .eq('is_approved', true);

      const countMap: Record<string, number> = {};
      (projects || []).forEach((p: any) => {
        if (p.developer_id) countMap[p.developer_id] = (countMap[p.developer_id] || 0) + 1;
      });

      return (devs || []).map((d: any) => ({
        ...d,
        project_count: countMap[d.id] || 0,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export default function NewbuildsDevelopers() {
  const { data: developers, isLoading } = useNbDevelopers();
  const [filter, setFilter] = useState<'all' | 'verified'>('all');

  const filtered = (developers || []).filter(d => filter === 'all' || d.is_verified);

  return (
    <NewbuildsLayout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <Link to={APP_ROUTES.NEWBUILDS} className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors" style={{ color: 'hsl(var(--nb-muted))' }}>
          <ChevronLeft className="w-4 h-4" /> Новостройки
        </Link>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="nb-display text-3xl md:text-4xl" style={{ color: 'hsl(var(--nb-gold))' }}>Девелоперы</h1>
            <p className="mt-2 text-sm" style={{ color: 'hsl(var(--nb-muted))' }}>
              {developers?.length || 0} компаний на платформе
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'verified'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-full text-sm transition-all"
                style={{
                  background: filter === f ? 'hsl(var(--nb-gold))' : 'hsl(var(--nb-gold) / 0.1)',
                  color: filter === f ? 'hsl(var(--nb-bg))' : 'hsl(var(--nb-gold))',
                  border: `1px solid hsl(var(--nb-gold) / ${filter === f ? '1' : '0.2'})`,
                }}
              >
                {f === 'all' ? 'Все' : 'Проверенные'}
              </button>
            ))}
            <Link
              to={APP_ROUTES.DEVELOPER_PORTAL_APPLY}
              className="px-4 py-1.5 rounded-full text-sm transition-all border"
              style={{
                background: 'transparent',
                color: 'hsl(var(--nb-gold))',
                borderColor: 'hsl(var(--nb-gold) / 0.4)',
              }}
            >
              Я застройщик →
            </Link>
          </div>
        </div>

        <div className="nb-separator mb-8" />

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-60 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(dev => (
              <Link
                key={dev.id}
                to={APP_ROUTES.NEWBUILDS_DEVELOPER(dev.slug || dev.id)}
                className="nb-glass p-6 rounded-xl transition-all duration-300 hover:border-[hsl(var(--nb-gold)/0.5)] group block"
              >
                <div className="flex items-start gap-4 mb-4">
                  {dev.logo_url ? (
                    <img src={dev.logo_url} alt={dev.name_en} className="w-14 h-14 rounded-lg object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--nb-gold) / 0.15)' }}>
                      <Building2 className="w-6 h-6" style={{ color: 'hsl(var(--nb-gold))' }} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="nb-display text-lg truncate" style={{ color: 'hsl(var(--nb-text))' }}>
                        {dev.name_en}
                      </h3>
                      {dev.is_verified && <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--nb-gold))' }} />}
                    </div>
                    <p className="text-sm" style={{ color: 'hsl(var(--nb-muted))' }}>{dev.name_ru}</p>
                  </div>
                </div>

                {dev.description_en && (
                  <p className="text-sm line-clamp-2 mb-4" style={{ color: 'hsl(var(--nb-text-secondary))' }}>
                    {dev.description_en}
                  </p>
                )}

                <div className="nb-separator mb-3" />
                <div className="flex items-center justify-between">
                  <span className="nb-mono text-sm" style={{ color: 'hsl(var(--nb-gold))' }}>
                    {dev.project_count} проектов
                  </span>
                  {dev.muuno_score && (
                    <span className="nb-mono text-xs px-2 py-0.5 rounded" style={{ background: 'hsl(var(--nb-gold) / 0.15)', color: 'hsl(var(--nb-gold))' }}>
                      Score {dev.muuno_score}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </NewbuildsLayout>
  );
}
