/**
 * /newbuilds/map — Interactive map view with layer filters.
 *
 * THEME EXCEPTION: This page uses the "Dark Luxury Editorial" theme (--nb-* tokens),
 * a documented exception to the super-app deep-sea palette. See docs/DESIGN_TOKENS.md §Themes
 * and mem://style/editorial-dark-luxury-theme.
 *
 * Hex values inside NB_MAP_PALETTE / MAP_STYLES are the only allowed hardcoded colors —
 * Google Maps API `stylers` only accept hex strings, so CSS variables can't be used there.
 * Keep NB_MAP_PALETTE in sync with --nb-bg / --nb-card / --nb-gold tokens in tokens.css.
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

/**
 * Local hex palette mirroring --nb-* and platform cluster tokens.
 * Google Maps `stylers` cannot consume CSS variables — keep these in sync with
 * src/styles/tokens.css when tokens change.
 */
const NB_MAP_PALETTE = {
  bg: '#0F0F0F',         // mirrors --nb-bg
  card: '#1A1A1A',       // mirrors --nb-card
  surface: '#141414',    // mirrors --nb-surface
  gold: '#C9A84C',       // mirrors --nb-gold
  goldMuted: '#8A7339',  // darker gold for secondary labels
  text: '#E8E2D5',       // mirrors --nb-text
  muted: '#6B5E3F',      // mirrors --nb-muted
  // Status colors — hex mirror of platform cluster tokens
  amber: '#F59E0B',      // mirrors --accent-amber / --cluster-legal
  blue: '#4E7BFF',       // mirrors --cluster-live
  mint: '#00D68F',       // mirrors --success / --cluster-arrive
} as const;

// Dark luxury map style matching newbuilds theme
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: NB_MAP_PALETTE.bg }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: NB_MAP_PALETTE.bg }] },
  { elementType: 'labels.text.fill', stylers: [{ color: NB_MAP_PALETTE.goldMuted }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: NB_MAP_PALETTE.gold }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: NB_MAP_PALETTE.muted }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1A2018' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: NB_MAP_PALETTE.card }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: NB_MAP_PALETTE.bg }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: NB_MAP_PALETTE.muted }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2A2418' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0A0A0A' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: NB_MAP_PALETTE.muted }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

// Status colors — semantic tokens (used in React/CSS context only, not in Google stylers)
const STATUS_LAYERS = [
  { key: 'all', label: 'Все', color: 'hsl(var(--nb-gold))' },
  { key: 'offplan', label: 'Off-plan', color: 'hsl(var(--accent-amber))' },
  { key: 'under_construction', label: 'Строится', color: 'hsl(var(--cluster-live))' },
  { key: 'completed', label: 'Готово', color: 'hsl(var(--success))' },
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
    case 'offplan': return 'hsl(var(--accent-amber))';
    case 'under_construction': return 'hsl(var(--cluster-live))';
    case 'completed': return 'hsl(var(--success))';
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
  const [zoom, setZoom] = useState<number>(() => getDefaultZoom('phuket'));

  const defaultCenter = useMemo(() => getDefaultCenter('phuket'), []);
  const defaultZoom = useMemo(() => getDefaultZoom('phuket'), []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setZoom(map.getZoom() ?? defaultZoom);
  }, [defaultZoom]);
  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);
  const onZoomChanged = useCallback(() => {
    if (mapRef.current) {
      const z = mapRef.current.getZoom();
      if (typeof z === 'number') setZoom(z);
    }
  }, []);

  // Build clusters by snapping coordinates to a zoom-dependent grid.
  // Cells get coarser at lower zoom so distant points merge; finer when zoomed in.
  type Cluster = {
    id: string;
    lat: number;
    lng: number;
    projects: NewbuildProject[];
  };
  const clusters = useMemo<Cluster[]>(() => {
    if (projectsWithCoords.length === 0) return [];
    // Cell size in degrees. At zoom 10 ≈ 0.04°, doubles per zoom-out, halves per zoom-in.
    const cellSize = 0.04 * Math.pow(2, 10 - Math.max(1, Math.min(20, zoom)));
    const map = new Map<string, Cluster>();
    for (const p of projectsWithCoords) {
      const cy = Math.floor(p.lat! / cellSize);
      const cx = Math.floor(p.lng! / cellSize);
      const key = `${cy}:${cx}`;
      const existing = map.get(key);
      if (existing) {
        existing.projects.push(p);
        existing.lat = (existing.lat * (existing.projects.length - 1) + p.lat!) / existing.projects.length;
        existing.lng = (existing.lng * (existing.projects.length - 1) + p.lng!) / existing.projects.length;
      } else {
        map.set(key, { id: key, lat: p.lat!, lng: p.lng!, projects: [p] });
      }
    }
    return Array.from(map.values());
  }, [projectsWithCoords, zoom]);

  const handleClusterClick = useCallback((cluster: Cluster) => {
    if (!mapRef.current) return;
    const bounds = new google.maps.LatLngBounds();
    cluster.projects.forEach(p => bounds.extend({ lat: p.lat!, lng: p.lng! }));
    mapRef.current.fitBounds(bounds, 80);
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

            </div>
          )}

          {/* Map legend (bottom-right) */}
          {showFilters && (
            <div className="absolute bottom-3 right-3 z-20 nb-glass rounded-xl p-3 w-[180px] space-y-2.5">
              <div
                className="nb-display text-[11px] uppercase tracking-wider pb-1.5 border-b"
                style={{ color: 'hsl(var(--nb-gold))', borderColor: 'hsl(var(--nb-gold) / 0.2)' }}
              >
                Легенда
              </div>

              {/* Status colors */}
              <div className="space-y-1.5">
                {STATUS_LAYERS.filter(s => s.key !== 'all').map(s => (
                  <div key={s.key} className="flex items-center gap-2 text-[11px]" style={{ color: 'hsl(var(--nb-text))' }}>
                    <span
                      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: s.color, boxShadow: `0 0 0 2px ${s.color}33` }}
                    />
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Marker / cluster meaning */}
              <div className="pt-2 border-t space-y-2" style={{ borderColor: 'hsl(var(--nb-gold) / 0.15)' }}>
                <div className="flex items-center gap-2 text-[11px]" style={{ color: 'hsl(var(--nb-text))' }}>
                  <span
                    className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0"
                    style={{
                      background: 'hsl(var(--nb-bg) / 0.92)',
                      color: 'hsl(var(--nb-gold))',
                      border: '1.5px solid hsl(var(--nb-gold))',
                    }}
                  >
                    ฿X.XM
                  </span>
                  <span>Цена проекта</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]" style={{ color: 'hsl(var(--nb-text))' }}>
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0"
                    style={{
                      background: 'hsl(var(--nb-card))',
                      color: 'hsl(var(--nb-gold))',
                      border: '1.5px solid hsl(var(--nb-gold) / 0.6)',
                      fontFamily: '"Playfair Display", Georgia, serif',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    9
                  </span>
                  <span>Группа проектов</span>
                </div>
              </div>
            </div>
          )}

          {/* Real Google Map */}
          {!hasKey || loadError ? (
            <div className="w-full h-full flex items-center justify-center text-center px-6">
              <div className="space-y-3">
                <MapPin className="w-12 h-12 mx-auto" style={{ color: 'hsl(var(--nb-gold))' }} />
                <p className="nb-display text-lg" style={{ color: 'hsl(var(--nb-text))' }}>
                  Карта недоступна
                </p>
                <p className="text-sm max-w-md" style={{ color: 'hsl(var(--nb-muted))' }}>
                  {loadError?.message ?? 'Google Maps API ключ не настроен'}
                </p>
              </div>
            </div>
          ) : !isLoaded ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--nb-gold))' }} />
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              center={defaultCenter}
              zoom={defaultZoom}
              onLoad={onMapLoad}
              onUnmount={onMapUnmount}
              onZoomChanged={onZoomChanged}
              options={{
                styles: MAP_STYLES,
                disableDefaultUI: false,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
                zoomControl: true,
                clickableIcons: false,
                backgroundColor: NB_MAP_PALETTE.bg,
              }}
            >
              {clusters.map(cluster => {
                if (cluster.projects.length === 1) {
                  const project = cluster.projects[0];
                  const isSelected = selectedProject?.id === project.id;
                  const markerColor = getStatusColor(project.project_status);
                  return (
                    <OverlayView
                      key={cluster.id}
                      position={{ lat: project.lat!, lng: project.lng! }}
                      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                      getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -h })}
                    >
                      <button
                        onClick={() => handleMarkerClick(project)}
                        className="transition-all"
                        style={{ zIndex: isSelected ? 1000 : 1 }}
                      >
                        <div
                          className="px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all"
                          style={{
                            background: isSelected ? markerColor : 'hsl(var(--nb-bg) / 0.92)',
                            color: isSelected ? 'hsl(var(--nb-bg))' : markerColor,
                            border: `2px solid ${markerColor}`,
                            transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                            boxShadow: isSelected
                              ? `0 4px 12px ${markerColor}66`
                              : '0 2px 6px rgba(0,0,0,0.4)',
                          }}
                        >
                          {project.price_from
                            ? `฿${(project.price_from / 1_000_000).toFixed(1)}M`
                            : (project.name_ru || project.name_en || '').slice(0, 12)}
                        </div>
                        <div
                          className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] mx-auto"
                          style={{
                            borderLeftColor: 'transparent',
                            borderRightColor: 'transparent',
                            borderTopColor: markerColor,
                          }}
                        />
                      </button>
                    </OverlayView>
                  );
                }

                // Multi-project cluster bubble
                const count = cluster.projects.length;
                const size = count >= 50 ? 56 : count >= 20 ? 48 : count >= 10 ? 44 : 38;
                return (
                  <OverlayView
                    key={cluster.id}
                    position={{ lat: cluster.lat, lng: cluster.lng }}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h / 2) })}
                  >
                    <button
                      onClick={() => handleClusterClick(cluster)}
                      className="nb-cluster-bubble rounded-full flex items-center justify-center font-serif transition-all hover:scale-110"
                      style={{
                        width: size,
                        height: size,
                        background: 'hsl(var(--nb-card))',
                        color: 'hsl(var(--nb-gold))',
                        border: '1.5px solid hsl(var(--nb-gold) / 0.6)',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
                        fontFamily: '"Playfair Display", Georgia, serif',
                        fontSize: count >= 100 ? 13 : 15,
                        fontWeight: 600,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'hsl(var(--nb-gold))';
                        e.currentTarget.style.color = 'hsl(var(--nb-bg))';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'hsl(var(--nb-card))';
                        e.currentTarget.style.color = 'hsl(var(--nb-gold))';
                      }}
                      aria-label={`${count} проектов в этой области`}
                    >
                      {count}
                    </button>
                  </OverlayView>
                );
              })}
            </GoogleMap>
          )}

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
