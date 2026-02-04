/**
 * QuickFiltersRibbon - Agoda/Airbnb style horizontal filter chips
 * Dynamic filters loaded from lookup_values + property_projects
 */

import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { usePropertyQuickFilters, QuickFilter, PropertyProject, DistrictOption } from '@/hooks/usePropertyQuickFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, ChevronRight, ExternalLink, MapPin } from 'lucide-react';
import { FilterChip } from '@/components/uno/FilterChip';

interface QuickFiltersRibbonProps {
  selectedFilters: string[];
  selectedProjectId?: string | null;
  selectedDistricts?: string[];
  onFilterToggle: (filterId: string) => void;
  onProjectSelect: (projectId: string | null) => void;
  onDistrictToggle?: (districtId: string) => void;
  className?: string;
}

export function QuickFiltersRibbon({
  selectedFilters,
  selectedProjectId,
  selectedDistricts = [],
  onFilterToggle,
  onProjectSelect,
  onDistrictToggle,
  className,
}: QuickFiltersRibbonProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { quickFilters, projects, districts, isLoading } = usePropertyQuickFilters();

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Quick Filter Chips (Tags) */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 touch-pan-x">
        {quickFilters.map((filter) => (
          <FilterChip
            key={filter.id}
            label={language === 'ru' ? filter.labelRu : filter.labelEn}
            icon={filter.icon}
            isActive={selectedFilters.includes(filter.id)}
            onToggle={() => onFilterToggle(filter.id)}
            size="sm"
          />
        ))}
      </div>

      {/* Districts Section */}
      {districts.length > 0 && onDistrictToggle && (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mr-4 pr-4 touch-pan-x">
            {districts.map((district) => (
              <FilterChip
                key={district.id}
                label={language === 'ru' ? district.labelRu : district.labelEn}
                isActive={selectedDistricts.includes(district.valueKey)}
                onToggle={() => onDistrictToggle(district.valueKey)}
                size="sm"
              />
            ))}
          </div>
          {selectedDistricts.length > 0 && (
            <button
              onClick={() => {
                selectedDistricts.forEach((d) => onDistrictToggle(d));
              }}
              className="text-xs text-primary hover:underline shrink-0"
            >
              {language === 'ru' ? 'Сброс' : 'Clear'}
            </button>
          )}
        </div>
      )}

      {/* Projects / Complexes Section */}
      {projects.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              {language === 'ru' ? 'Комплексы' : 'Residences'}
            </h4>
            {selectedProjectId && (
              <button
                onClick={() => onProjectSelect(null)}
                className="text-xs text-primary hover:underline"
              >
                {language === 'ru' ? 'Показать все' : 'Show all'}
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 touch-pan-x snap-x snap-mandatory">
            {projects.map((project) => (
              <ProjectChip
                key={project.id}
                project={project}
                isSelected={selectedProjectId === project.id}
                onClick={() => onProjectSelect(selectedProjectId === project.id ? null : project.id)}
                onNavigate={() => navigate(`/property/project/${project.id}`)}
                language={language}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Removed local FilterChip - using uno/FilterChip instead

interface ProjectChipProps {
  project: PropertyProject;
  isSelected: boolean;
  onClick: () => void;
  onNavigate: () => void;
  language: string;
}

function ProjectChip({ project, isSelected, onClick, onNavigate, language }: ProjectChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border flex-shrink-0 snap-start touch-manipulation min-w-[140px]",
        isSelected
          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
          : "border-border bg-background hover:border-primary/50 hover:bg-accent/50 text-foreground"
      )}
    >
      {project.coverImage ? (
        <img 
          src={project.coverImage} 
          alt="" 
          className="w-8 h-8 rounded-lg object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <Building2 className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex flex-col items-start">
        <span className="font-medium text-xs line-clamp-1">
          {language === 'ru' ? project.nameRu : project.nameEn}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {project.propertyCount} {language === 'ru' ? 'объектов' : 'units'}
        </span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNavigate();
        }}
        className="ml-auto p-1 rounded-md hover:bg-primary/10 transition-colors"
        title={language === 'ru' ? 'Открыть комплекс' : 'View complex'}
      >
        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
      </button>
    </button>
  );
}

export default QuickFiltersRibbon;
