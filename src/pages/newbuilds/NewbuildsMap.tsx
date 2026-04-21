/**
 * /newbuilds/map — Interactive map view with layer filters
 */
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, List, Layers, Loader2 } from 'lucide-react';
import { GoogleMap, OverlayView } from '@react-google-maps/api';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { NbProjectCard } from '@/components/newbuilds/NbProjectCard';
import { NbPriceDisplay } from '@/components/newbuilds/NbPriceDisplay';
import { NbProjectStatusBadge } from '@/components/newbuilds/NbProjectStatusBadge';
import { useNewbuildProjects, type NewbuildProject } from '@/hooks/useNewbuildProjects';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { getDefaultCenter, getDefaultZoom } from '@/lib/config/geography';
import { APP_ROUTES } from '@/lib/config/routes';

const MAP_CONTAINER_STYLE: React.CSSProperties = { width: '100%', height: '100%' };

// Dark luxury map style matching newbuilds theme
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0f1620' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f1620' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a7a55' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#c9a961' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6b5e3f' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a2820' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2330' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0a0f17' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#7a6a45' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2a3445' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1018' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4a5a7a' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const STATUS_LAYERS = [
  { key: 'all', label: 'Все', color: 'hsl(var(--nb-gold))' },
  { key: 'offplan', label: 'Off-plan', color: '#f59e0b' },
  { key: 'under_construction', label: 'Строится', color: '#3b82f6' },
  { key: 'completed', label: 'Готово', color: '#22c55e' },
] as const;

const TYPE_LAYERS = [
  { key: 'all', label: 'Все типы' },
  { key: 'condo', label: 'Кондо' },
  { key: 'villa', label: 'Виллы' },
  { key: 'house', label: 'Дома' },
  { key: 'townhouse', label: 'Таунхаусы' },
] as const;

function getStatusColor(status: string) {
  switch (status) {
    case 'offplan': return '#f59e0b';
    case 'under_construction': return '#3b82f6';
    case 'completed': return '#22c55e';
    default: return 'hsl(var(--nb-gold))';
  }
}

export default function NewbuildsMap() {
  const { data: projects } = useNewbuildProjects({ sort: 'featured' });
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<NewbuildProject | null>(null);
  const [showList, setShowList] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = useMemo(() => {
    if (!projects) return [];
    return projects.filter(p => {
      if (statusFilter !== 'all' && p.project_status !== statusFilter) return false;
      if (typeFilter !== 'all') {
        // Check offplan_catalog type or fallback to unit_types
        const raw = (p as any).offplan_catalog;
        const propType = raw?.type || (p.unit_types?.[0] || '').toLowerCase();
        if (propType !== typeFilter) return false;
      }
      return true;
    });
  }, [projects, statusFilter, typeFilter]);

  const projectsWithCoords = useMemo(
    () => filtered.filter(p => p.lat && p.lng),
    [filtered]
  );

  const { isLoaded, loadError, hasKey } = useGoogleMaps();
  const mapRef = useRef<google.maps.Map | null>(null);

  const defaultCenter = useMemo(() => getDefaultCenter('phuket'), []);
  const defaultZoom = useMemo(() => getDefaultZoom('phuket'), []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);
  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Auto-fit bounds when filtered projects change
  useEffect(() => {
    if (!mapRef.current || projectsWithCoords.length === 0) return;
    if (projectsWithCoords.length === 1) {
      const p = projectsWithCoords[0];
      mapRef.current.setCenter({ lat: p.lat!, lng: p.lng! });
      mapRef.current.setZoom(14);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    projectsWithCoords.forEach(p => bounds.extend({ lat: p.lat!, lng: p.lng! }));
    mapRef.current.fitBounds(bounds, 60);
  }, [projectsWithCoords]);

  const handleMarkerClick = useCallback((project: NewbuildProject) => {
    setSelectedProject(project);
    if (mapRef.current && project.lat && project.lng) {
      mapRef.current.panTo({ lat: project.lat, lng: project.lng });
    }
  }, []);

  return (
    <NewbuildsLayout>
      {/* Header */}
      <div className="relative z-20 px-4 py-3 flex items-center justify-between" style={{ background: 'hsl(var(--nb-bg))', borderBottom: '1px solid hsl(var(--nb-gold) / 0.15)' }}>
        <div className="flex items-center gap-3">
          <Link to={APP_ROUTES.OFFPLAN} className="p-1.5 rounded-lg transition-colors" style={{ color: 'hsl(var(--nb-gold))' }}>
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="nb-display text-lg" style={{ color: 'hsl(var(--nb-text))' }}>Карта проектов</h1>
          <span className="nb-mono text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>
            {projectsWithCoords.length} из {filtered.length}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: showFilters ? 'hsl(var(--nb-gold) / 0.2)' : 'hsl(var(--nb-gold) / 0.1)', color: 'hsl(var(--nb-gold))', border: '1px solid hsl(var(--nb-gold) / 0.3)' }}
          >
            <Layers className="w-3.5 h-3.5" /> Слои
          </button>
          <button
            onClick={() => setShowList(!showList)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'hsl(var(--nb-gold) / 0.15)', color: 'hsl(var(--nb-gold))', border: '1px solid hsl(var(--nb-gold) / 0.3)' }}
          >
            <List className="w-3.5 h-3.5" /> {showList ? 'Скрыть' : 'Список'}
          </button>
        </div>
      </div>

      <div className="flex" style={{ height: 'calc(100vh - 52px)' }}>
        {/* Map area */}
        <div className="flex-1 relative" style={{ background: 'hsl(var(--nb-surface))' }}>

          {/* Filter panel overlay */}
          {showFilters && (
            <div className="absolute top-3 left-3 z-20 space-y-2">
              {/* Status filters */}
              <div className="nb-glass p-2 rounded-xl flex flex-wrap gap-1.5">
                {STATUS_LAYERS.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setStatusFilter(s.key)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                    style={{
                      background: statusFilter === s.key ? s.color + '33' : 'transparent',
                      color: statusFilter === s.key ? s.color : 'hsl(var(--nb-muted))',
                      border: `1px solid ${statusFilter === s.key ? s.color : 'transparent'}`,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Type filters */}
              <div className="nb-glass p-2 rounded-xl flex flex-wrap gap-1.5">
                {TYPE_LAYERS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTypeFilter(t.key)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                    style={{
                      background: typeFilter === t.key ? 'hsl(var(--nb-gold) / 0.2)' : 'transparent',
                      color: typeFilter === t.key ? 'hsl(var(--nb-gold))' : 'hsl(var(--nb-muted))',
                      border: `1px solid ${typeFilter === t.key ? 'hsl(var(--nb-gold) / 0.5)' : 'transparent'}`,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="nb-glass p-2 rounded-xl flex gap-3">
                {STATUS_LAYERS.filter(s => s.key !== 'all').map(s => (
                  <div key={s.key} className="flex items-center gap-1.5 text-[10px]" style={{ color: 'hsl(var(--nb-muted))' }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                    {s.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Static map placeholder - uses project markers */}
          <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
            <div className="text-center space-y-4 relative z-10">
              <MapPin className="w-12 h-12 mx-auto" style={{ color: 'hsl(var(--nb-gold))' }} />
              <p className="nb-display text-xl" style={{ color: 'hsl(var(--nb-text))' }}>Карта проектов Пхукета</p>
              <p className="text-sm max-w-md mx-auto" style={{ color: 'hsl(var(--nb-muted))' }}>
                {projectsWithCoords.length} проектов с координатами
              </p>
            </div>

            {/* Project markers */}
            <div className="absolute inset-0">
              {projectsWithCoords.map(project => {
                const x = ((project.lng! - 98.25) / 0.35) * 100;
                const y = (1 - (project.lat! - 7.75) / 0.35) * 100;
                const isSelected = selectedProject?.id === project.id;
                const markerColor = getStatusColor(project.project_status);

                return (
                  <button
                    key={project.id}
                    onClick={() => handleMarkerClick(project)}
                    className="absolute transform -translate-x-1/2 -translate-y-full transition-all z-10"
                    style={{
                      left: `${Math.max(5, Math.min(95, x))}%`,
                      top: `${Math.max(5, Math.min(90, y))}%`,
                    }}
                  >
                    <div
                      className="px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all"
                      style={{
                        background: isSelected ? markerColor : 'hsl(var(--nb-bg) / 0.9)',
                        color: isSelected ? 'hsl(var(--nb-bg))' : markerColor,
                        border: `2px solid ${markerColor}`,
                        transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                        boxShadow: isSelected ? `0 4px 12px ${markerColor}44` : 'none',
                      }}
                    >
                      {project.price_from ? `฿${(project.price_from / 1_000_000).toFixed(1)}M` : project.name_en?.slice(0, 12)}
                    </div>
                    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] mx-auto"
                      style={{
                        borderLeftColor: 'transparent',
                        borderRightColor: 'transparent',
                        borderTopColor: markerColor,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected project popup */}
          {selectedProject && (
            <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[360px] z-20">
              <div className="nb-glass p-4 space-y-3">
                <div className="flex items-start gap-3">
                  {selectedProject.cover_image && (
                    <img src={selectedProject.cover_image} alt="" className="w-20 h-14 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="nb-display text-base truncate" style={{ color: 'hsl(var(--nb-text))' }}>
                      {selectedProject.name_ru || selectedProject.name_en}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <NbProjectStatusBadge status={selectedProject.project_status} />
                      {selectedProject.location_area && (
                        <span className="text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>{selectedProject.location_area}</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelectedProject(null)} className="p-1 flex-shrink-0" style={{ color: 'hsl(var(--nb-muted))' }}>
                    ✕
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <NbPriceDisplay price={selectedProject.price_from} priceTo={selectedProject.price_to} size="md" />
                  <button
                    onClick={() => navigate(APP_ROUTES.OFFPLAN_DETAIL(selectedProject.id))}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: 'hsl(var(--nb-gold))', color: 'hsl(var(--nb-bg))' }}
                  >
                    Подробнее
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side list (desktop) */}
        {showList && (
          <div className="hidden md:block w-[380px] overflow-y-auto border-l" style={{ borderColor: 'hsl(var(--nb-gold) / 0.15)', background: 'hsl(var(--nb-bg))' }}>
            <div className="p-3 border-b" style={{ borderColor: 'hsl(var(--nb-gold) / 0.1)' }}>
              <p className="text-xs font-medium" style={{ color: 'hsl(var(--nb-muted))' }}>
                {filtered.length} проектов
              </p>
            </div>
            <div className="p-4 space-y-3">
              {filtered.map(p => (
                <div key={p.id} onClick={() => { setSelectedProject(p); }} className="cursor-pointer">
                  <NbProjectCard project={p} variant="compact" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </NewbuildsLayout>
  );
}
