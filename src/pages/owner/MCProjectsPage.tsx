import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, HardHat, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCityCurrency } from '@/hooks/useCityCurrency';

import { useMyPropertyProjects, type PropertyProject } from '@/hooks/usePropertyProjects';
import { APP_ROUTES } from '@/lib/config/routes';

export default function MCProjectsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { data: projects, isLoading } = useMyPropertyProjects();
  const [search, setSearch] = useState('');

  const filtered = (projects || []).filter((p) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      p.name_en?.toLowerCase().includes(q) ||
      p.name_ru?.toLowerCase().includes(q) ||
      p.district?.toLowerCase().includes(q)
    );
  });

  const statusLabel = (status?: string) => {
    if (!status) return null;
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      offplan: { label: isRu ? 'Офф-план' : 'Off-plan', variant: 'outline' },
      under_construction: { label: isRu ? 'Строится' : 'Under Construction', variant: 'secondary' },
      completed: { label: isRu ? 'Завершён' : 'Completed', variant: 'default' },
    };
    const entry = map[status];
    if (!entry) return null;
    return <Badge variant={entry.variant}>{entry.label}</Badge>;
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-start gap-2 font-display text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            <HardHat className="h-6 w-6 shrink-0 text-primary" />
            {isRu ? 'Проекты (Новостройки)' : 'Projects (New Builds)'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Ваши проекты и их страницы в каталоге новостроек' : 'Your developments and their public catalogue pages'}
          </p>
        </div>
        <Button onClick={() => navigate(APP_ROUTES.DEVELOPER_PORTAL_PROJECT_NEW)} className="gap-2">
          <Plus className="h-4 w-4" />
          {isRu ? 'Добавить' : 'Add Project'}
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isRu ? 'Поиск по названию или району...' : 'Search by name or district...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-none" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <HardHat className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">
            {isRu ? 'Проекты не найдены' : 'No projects found'}
          </p>
          <p className="text-sm mt-1">
            {isRu ? 'Создайте первый проект для управления новостройками' : 'Create your first project to manage new builds'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} isRu={isRu} statusLabel={statusLabel} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  isRu,
  statusLabel,
}: {
  project: PropertyProject;
  isRu: boolean;
  statusLabel: (s?: string) => React.ReactNode;
}) {
  const navigate = useNavigate();
  const { symbol: curSym } = useCityCurrency();


  return (
    <button
      onClick={() => navigate(APP_ROUTES.OFFPLAN_DETAIL(project.id))}
      className="group flex flex-col overflow-hidden border bg-card text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {project.cover_image ? (
        <img src={project.cover_image} alt="" className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-muted flex items-center justify-center">
          <HardHat className="h-10 w-10 text-muted-foreground/30" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start gap-2">
          <h3 className="min-w-0 font-display text-lg font-semibold leading-tight text-foreground [overflow-wrap:anywhere]">
            {isRu ? project.name_ru || project.name_en : project.name_en || project.name_ru}
          </h3>
          {statusLabel(project.project_status)}
        </div>
        {project.district && (
          <p className="text-xs text-muted-foreground">{project.district}</p>
        )}
        {(project.price_from || project.price_to) && (
          <p className="text-sm font-medium text-primary">
            {project.price_from ? `${curSym}${(project.price_from / 1e6).toFixed(1)}M` : ''}
            {project.price_from && project.price_to ? ' – ' : ''}
            {project.price_to ? `${curSym}${(project.price_to / 1e6).toFixed(1)}M` : ''}

          </p>
        )}
        <span className="mt-auto border-t pt-3 text-sm font-semibold text-primary">{isRu ? 'Смотреть в каталоге' : 'View in catalogue'}</span>
      </div>
    </button>
  );
}
