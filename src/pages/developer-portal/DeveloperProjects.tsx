/**
 * Developer Portal — My Projects list
 */
import { useDeveloperProfile, useDeveloperProjects } from '@/hooks/useDeveloperPortal';
import { Link } from 'react-router-dom';
import { Plus, Edit, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NbProjectStatusBadge } from '@/components/newbuilds/NbProjectStatusBadge';
import { NbPriceDisplay } from '@/components/newbuilds/NbPriceDisplay';
import { NbConstructionProgress } from '@/components/newbuilds/NbConstructionProgress';
import { APP_ROUTES } from '@/lib/config/routes';

export default function DeveloperProjects() {
  const { data: developer } = useDeveloperProfile();
  const { data: projects = [], isLoading } = useDeveloperProjects(developer?.id);

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="nb-display text-2xl text-[hsl(var(--nb-text))]">Мои проекты</h1>
        <Link to="/developer-portal/projects/new">
          <button className="nb-btn-gold flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Новый проект
          </button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="nb-glass h-24 animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="nb-glass p-12 text-center">
          <p className="text-[hsl(var(--nb-text-secondary))] mb-4">У вас пока нет проектов</p>
          <Link to="/developer-portal/projects/new">
            <button className="nb-btn-gold">Создать первый проект</button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project: any) => (
            <div key={project.id} className="nb-glass p-5 flex flex-col md:flex-row md:items-center gap-4">
              {/* Thumbnail */}
              {project.cover_image && (
                <img src={project.cover_image} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
              )}
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[hsl(var(--nb-text))] font-semibold truncate">{project.name_en}</h3>
                  <NbProjectStatusBadge status={project.project_status || 'under_construction'} />
                  {project.is_approved === false && (
                    <span className="nb-badge bg-amber-500/15 text-amber-400 border-amber-500/30">На проверке</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-[hsl(var(--nb-text-secondary))]">
                  <span>{project.district || project.location_area || '—'}</span>
                  {project.price_from && <NbPriceDisplay price={project.price_from} className="text-[hsl(var(--nb-gold))]" />}
                </div>
                {project.construction_progress != null && (
                  <div className="mt-2 max-w-xs">
                    <NbConstructionProgress progress={project.construction_progress} size="sm" />
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-[hsl(var(--nb-muted))]">
                <span>{project.units_available || 0} юнитов</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <Link to={`/developer-portal/projects/${project.id}`}>
                  <Button size="sm" variant="outline" className="border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-text-secondary))]">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
                {project.slug && (
                  <Link to={APP_ROUTES.NEWBUILDS_PROJECT(project.slug)} target="_blank">
                    <Button size="sm" variant="outline" className="border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-text-secondary))]">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
