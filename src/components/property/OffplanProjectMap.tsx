import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapLibreMap, type MapViewport } from '@/components/map/MapLibreMap';
import { useLanguage } from '@/contexts/LanguageContext';
import type { OffplanProject } from '@/hooks/useOffplanProjects';
import { pickLang } from '@/lib/i18n/pickLang';
import { PHUKET_MAP_BOUNDS } from '@/lib/map/basemap';
import { offplanProjectMapPosition } from '@/lib/offplan/mapState';
import { hrefOffplanProject } from '@/lib/real-estate/listingViewModel';
import { publicJourneyState } from '@/lib/real-estate/publicJourney';

const DEFAULT_VIEWPORT: MapViewport = { lat: 7.95, lng: 98.33, zoom: 10.5 };

export default function OffplanProjectMap({ projects, viewport, selectedId, onSelect, onViewport }: {
  projects: OffplanProject[];
  viewport?: MapViewport;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onViewport: (viewport: MapViewport) => void;
}) {
  const { language } = useLanguage();
  const location = useLocation();
  const markers = useMemo(() => projects.flatMap(project => {
    const position = offplanProjectMapPosition(project);
    const title = language === 'ru' ? project.nameRu || project.nameEn : project.nameEn || project.nameRu;
    return position ? [{ id: project.id, ...position, title }] : [];
  }), [projects, language]);
  const selected = markers.find(marker => marker.id === selectedId);
  const center = viewport ?? DEFAULT_VIEWPORT;

  return (
    <section aria-label={pickLang(language, { ru: 'Карта проектов', en: 'Project map', th: 'แผนที่โครงการ' })} className="space-y-3">
      {!markers.length ? (
        <p role="status" className="border p-4 text-sm text-muted-foreground">
          {pickLang(language, { ru: 'Для этих проектов нет координат на карте. Все результаты доступны в списке.', en: 'These projects have no map locations. All results remain in the list.', th: 'โครงการเหล่านี้ไม่มีตำแหน่งบนแผนที่ ผลลัพธ์ทั้งหมดยังคงอยู่ในรายการ' })}
        </p>
      ) : (
        <>
          <div className="h-[24rem] border lg:h-[30rem]">
            <MapLibreMap center={center} zoom={center.zoom} coverageBounds={PHUKET_MAP_BOUNDS} fitToMarkers={!viewport}
              markers={markers} activeMarkerId={selected?.id} showLocateButton={false}
              onMarkerClick={marker => onSelect(marker.id)} onUserViewportChange={onViewport} />
          </div>
          {selected && (
            <div className="flex flex-wrap items-center justify-between gap-2 border px-3 py-2">
              <Link className="inline-flex min-h-11 min-w-0 items-center break-words font-semibold underline underline-offset-4" to={hrefOffplanProject(selected.id)} state={publicJourneyState(location)}>
                {selected.title}
              </Link>
              <button className="min-h-11 px-2 text-sm underline underline-offset-4" type="button" onClick={() => onSelect('')}>
                {pickLang(language, { ru: 'Снять выбор', en: 'Clear selection', th: 'ล้างการเลือก' })}
              </button>
            </div>
          )}
          {markers.length < projects.length && (
            <p className="text-sm text-muted-foreground">{pickLang(language, { ru: 'Проекты без координат доступны в списке ниже.', en: 'Projects without map locations are still available in the list below.', th: 'โครงการที่ไม่มีตำแหน่งบนแผนที่ยังคงอยู่ในรายการด้านล่าง' })}</p>
          )}
        </>
      )}
    </section>
  );
}
