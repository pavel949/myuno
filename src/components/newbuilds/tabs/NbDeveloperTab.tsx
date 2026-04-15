/**
 * NbDeveloperTab — Inline developer profile with their other projects
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle, Globe, Phone, Mail, Calendar, Award, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NbProjectCard } from '../NbProjectCard';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_ROUTES } from '@/lib/config/routes';
import { mapToNewbuildProject, type NewbuildProject } from '@/hooks/useNewbuildProjects';

interface Props {
  developerId: string;
  currentProjectId: string;
}

function useDeveloperWithProjects(developerId?: string, excludeProjectId?: string) {
  const devQuery = useQuery({
    queryKey: ['nb-developer-inline', developerId],
    queryFn: async () => {
      if (!developerId) return null;
      const { data, error } = await supabase.from('developers').select('*').eq('id', developerId).maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!developerId,
    staleTime: 5 * 60 * 1000,
  });

  const projectsQuery = useQuery({
    queryKey: ['nb-developer-other-projects', developerId, excludeProjectId],
    queryFn: async (): Promise<NewbuildProject[]> => {
      if (!developerId) return [];
      let query = supabase
        .from('property_projects')
        .select('*')
        .eq('developer_id', developerId)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .limit(6);

      if (excludeProjectId) {
        query = query.neq('id', excludeProjectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapToNewbuildProject);
    },
    enabled: !!developerId,
    staleTime: 5 * 60 * 1000,
  });

  return { developer: devQuery.data, projects: projectsQuery.data || [], isLoading: devQuery.isLoading };
}

export function NbDeveloperTab({ developerId, currentProjectId }: Props) {
  const { developer: dev, projects, isLoading } = useDeveloperWithProjects(developerId, currentProjectId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-xl" style={{ background: 'hsl(var(--nb-surface))' }} />
        <Skeleton className="h-60 rounded-xl" style={{ background: 'hsl(var(--nb-surface))' }} />
      </div>
    );
  }

  if (!dev) {
    return (
      <div className="text-center py-16">
        <Building2 className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--nb-muted))' }} />
        <p className="nb-display text-xl" style={{ color: 'hsl(var(--nb-muted))' }}>Информация о девелопере не найдена</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Developer profile card */}
      <div className="nb-glass p-6 space-y-5">
        <div className="flex items-start gap-5">
          {dev.logo_url ? (
            <img src={dev.logo_url} alt={dev.name_en} className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--nb-gold) / 0.15)' }}>
              <Building2 className="w-7 h-7" style={{ color: 'hsl(var(--nb-gold))' }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="nb-display text-xl" style={{ color: 'hsl(var(--nb-text))' }}>{dev.name_en}</h3>
              {dev.is_verified && (
                <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(var(--nb-gold))' }} />
              )}
            </div>
            {dev.name_ru && (
              <p className="text-sm" style={{ color: 'hsl(var(--nb-muted))' }}>{dev.name_ru}</p>
            )}
          </div>
          {dev.muuno_score && (
            <div className="text-center flex-shrink-0">
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ background: 'hsl(var(--nb-gold) / 0.12)' }}>
                <Award className="w-4 h-4" style={{ color: 'hsl(var(--nb-gold))' }} />
                <span className="nb-mono text-lg font-bold" style={{ color: 'hsl(var(--nb-gold))' }}>{dev.muuno_score}</span>
              </div>
              <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--nb-muted))' }}>myUNO Score</p>
            </div>
          )}
        </div>

        {/* Description */}
        {(dev.description_en || dev.description_ru) && (
          <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--nb-text-secondary))' }}>
            {dev.description_ru || dev.description_en}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {dev.founded_year && (
            <div className="text-center p-3 rounded-lg" style={{ background: 'hsl(var(--nb-surface))' }}>
              <Calendar className="w-4 h-4 mx-auto mb-1" style={{ color: 'hsl(var(--nb-gold))' }} />
              <p className="nb-mono text-sm font-bold" style={{ color: 'hsl(var(--nb-text))' }}>{dev.founded_year}</p>
              <p className="text-[10px]" style={{ color: 'hsl(var(--nb-muted))' }}>Основан</p>
            </div>
          )}
          {dev.projects_completed !== null && (
            <div className="text-center p-3 rounded-lg" style={{ background: 'hsl(var(--nb-surface))' }}>
              <Building2 className="w-4 h-4 mx-auto mb-1" style={{ color: 'hsl(var(--nb-gold))' }} />
              <p className="nb-mono text-sm font-bold" style={{ color: 'hsl(var(--nb-text))' }}>{dev.projects_completed}</p>
              <p className="text-[10px]" style={{ color: 'hsl(var(--nb-muted))' }}>Проектов сдано</p>
            </div>
          )}
          {dev.total_units_sold !== null && (
            <div className="text-center p-3 rounded-lg" style={{ background: 'hsl(var(--nb-surface))' }}>
              <Award className="w-4 h-4 mx-auto mb-1" style={{ color: 'hsl(var(--nb-gold))' }} />
              <p className="nb-mono text-sm font-bold" style={{ color: 'hsl(var(--nb-text))' }}>{dev.total_units_sold}</p>
              <p className="text-[10px]" style={{ color: 'hsl(var(--nb-muted))' }}>Юнитов продано</p>
            </div>
          )}
        </div>

        {/* Contact links */}
        <div className="flex flex-wrap gap-3">
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

        {/* View full profile link */}
        <Link
          to={APP_ROUTES.NEWBUILDS_DEVELOPER(dev.slug || dev.id)}
          className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: 'hsl(var(--nb-gold))' }}
        >
          Полный профиль девелопера <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Other projects */}
      {projects.length > 0 && (
        <div>
          <p className="nb-label mb-4">ДРУГИЕ ПРОЕКТЫ {dev.name_en.toUpperCase()}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <NbProjectCard key={p.id} project={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
