import { pickLang } from '@/lib/i18n/pickLang';
import '@/styles/premium-workspace.css';
import { bangkokTodayDate } from '@/lib/hotelDates';
import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { accessiblePropertySelection } from '@/lib/owner/propertyNavigation';
import { AirbnbCalendarGrid } from '@/components/owner/AirbnbCalendarGrid';
import { MultiPropertyTimeline } from '@/components/owner/MultiPropertyTimeline';
import { CalendarTodayTasks } from '@/components/owner/CalendarTodayTasks';
import { CalendarSyncManager } from '@/components/owner/CalendarSyncManager';
import { CreateServiceTaskDialog } from '@/components/owner/CreateServiceTaskDialog';
import { AddBookingFromCalendarDialog } from '@/components/owner/AddBookingFromCalendarDialog';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMyProperties } from '@/hooks/useMyProperties';
import { usePropertyComplexes } from '@/hooks/usePropertyComplexes';
import { usePropertyProjects } from '@/hooks/usePropertyProjects';
import { CalendarDays, CalendarPlus, Plus, RefreshCw, LayoutGrid, List, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { redirectToAuth } from '@/lib/auth/redirectToAuth';

type ViewMode = 'single' | 'multi';

export default function OwnerCalendar() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const requestedProperty = params.get('property');
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  const [showAddBookingDialog, setShowAddBookingDialog] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  // Default to multi on desktop (checked via initial window width)
  const [viewMode, setViewMode] = useState<ViewMode>(() => 
    requestedProperty !== null ? 'single' : typeof window !== 'undefined' && window.innerWidth >= 768 ? 'multi' : 'single'
  );
  
  const { allProperties, isLoading: propertiesLoading, error: propertiesError, refetch: retryProperties } = useMyProperties();
  const selectedPropertyId = accessiblePropertySelection(requestedProperty, allProperties, propertiesLoading, 'first');
  const setSelectedPropertyId = (id: string) => {
    if (!allProperties.some(p => p.property_id === id)) return;
    const next = new URLSearchParams(params);
    next.set('property', id);
    setParams(next);
  };
  const { data: complexes } = usePropertyComplexes();
  const { data: projects } = usePropertyProjects();

  // Build unified grouping options from both complexes and projects
  const groupOptions = useMemo(() => {
    const options: { id: string; label: string; type: 'complex' | 'project' }[] = [];
    
    // Complexes that have properties
    const usedComplexIds = new Set(allProperties.filter(p => p.complex_id).map(p => p.complex_id));
    complexes?.filter(c => usedComplexIds.has(c.id)).forEach(c => {
      options.push({ id: c.id, label: isRu ? (c.name_ru || c.name) : c.name, type: 'complex' });
    });

    // Projects that have properties
    const usedProjectIds = new Set(allProperties.filter(p => p.project_id).map(p => p.project_id));
    projects?.filter(p => usedProjectIds.has(p.id)).forEach(p => {
      options.push({ id: p.id, label: isRu ? (p.name_ru || p.name_en) : p.name_en, type: 'project' });
    });

    return options;
  }, [complexes, projects, allProperties, isRu]);

  // Filter properties by selected group
  const filteredProperties = useMemo(() => {
    if (selectedGroupId === 'all') return allProperties;
    if (selectedGroupId === 'no-group') return allProperties.filter(p => !p.complex_id && !p.project_id);
    return allProperties.filter(p => p.complex_id === selectedGroupId || p.project_id === selectedGroupId);
  }, [allProperties, selectedGroupId]);

  // Map to format expected by PropertyThumbnailSelector
  const propertyRefs = useMemo(() =>
    allProperties.map(p => ({
      id: p.property_id,
      title: p.title,
      title_ru: p.title_ru,
      cover_image: p.cover_image,
    })), [allProperties]
  );

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <CalendarDays className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">
          {pickLang(language, {"ru": "Календарь бронирований", "en": "Booking Calendar", "th": "ปฏิทินการจอง"})}
        </h1>
        <p className="text-muted-foreground mb-6">
          {pickLang(language, {"ru": "Войдите, чтобы просмотреть календарь", "en": "Sign in to view the calendar", "th": "เข้าสู่ระบบเพื่อดูปฏิทิน"})}
        </p>
        <Button onClick={() => redirectToAuth(navigate)}>
          {pickLang(language, {"ru": "Войти", "en": "Sign In", "th": "เข้าสู่ระบบ"})}
        </Button>
      </div>
    );
  }

  if (propertiesError) return <div className="mc-workspace-page mc-calendar-page space-y-4" role="alert"><h1>{pickLang(language, { ru: 'Календарь бронирований', en: 'Booking Calendar', th: 'ปฏิทินการจอง' })}</h1><p>{pickLang(language, { ru: 'Не удалось загрузить объекты. Выбор календаря сохранён.', en: 'Could not load properties. Your calendar choice is kept.', th: 'ไม่สามารถโหลดที่พักได้ ระบบเก็บตัวเลือกปฏิทินไว้แล้ว' })}</p><Button variant="outline" onClick={() => retryProperties()}>{pickLang(language, { ru: 'Повторить', en: 'Retry', th: 'ลองอีกครั้ง' })}</Button></div>;

  if (requestedProperty !== null && !selectedPropertyId) {
    return <div className="mc-workspace-page mc-calendar-page p-4 space-y-3">
      <h1 className="font-display text-h3">{pickLang(language, {"ru": "Календарь бронирований", "en": "Booking Calendar", "th": "ปฏิทินการจอง"})}</h1>
      <p role="status">{propertiesLoading ? (pickLang(language, {"ru": "Загрузка объектов…", "en": "Loading properties…", "th": "กำลังโหลดที่พัก…"}))
        : (pickLang(language, {"ru": "Объект недоступен. Выберите объект из своего списка.", "en": "This property is unavailable. Choose a property from your list.", "th": "ไม่สามารถเข้าถึงที่พักนี้ได้ โปรดเลือกที่พักจากรายการของคุณ"}))}</p>
      {!propertiesLoading && <Button variant="outline" onClick={() => navigate('/mc/properties')}>{pickLang(language, {"ru": "К объектам", "en": "Browse properties", "th": "ดูที่พัก"})}</Button>}
    </div>;
  }

  // A property deep link always opens that property's view, including history navigation.
  const isMulti = requestedProperty === null && viewMode === 'multi';

  return (
    <div className="mc-workspace-page mc-calendar-page p-4 pb-24 space-y-4 w-full min-w-0 max-w-full overflow-x-hidden">
      <header className="space-y-3">
        <h1 className="font-display text-h3 break-words">
          {pickLang(language, {"ru": "Календарь бронирований", "en": "Booking Calendar", "th": "ปฏิทินการจอง"})}
        </h1>
        {!isMulti && (
          <Button className="w-full sm:w-auto min-h-11" disabled={!selectedPropertyId}
            onClick={() => setShowAddBookingDialog(true)}>
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            {pickLang(language, {"ru": "Добавить бронирование", "en": "Add Booking", "th": "เพิ่มการจอง"})}
          </Button>
        )}
      </header>
      {allProperties.length > 1 && (
        <div className="grid grid-cols-2 gap-1 border-b border-border pb-3" role="group"
          aria-label={pickLang(language, {"ru": "Режим календаря", "en": "Calendar view", "th": "มุมมองปฏิทิน"})}>
          <Button variant="ghost" aria-pressed={isMulti} onClick={() => { const next = new URLSearchParams(params); next.delete('property'); setParams(next); setViewMode('multi'); }}
            className={cn('min-h-11 h-auto whitespace-normal text-sm px-2', isMulti ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
            <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden="true" />
            {pickLang(language, {"ru": "Все объекты", "en": "Portfolio", "th": "ภาพรวมที่พัก"})}
          </Button>
          <Button variant="ghost" aria-pressed={!isMulti} onClick={() => { if (selectedPropertyId) setSelectedPropertyId(selectedPropertyId); else setViewMode('single'); }}
            className={cn('min-h-11 h-auto whitespace-normal text-sm px-2', !isMulti ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
            <List className="h-4 w-4 shrink-0" aria-hidden="true" />
            {pickLang(language, {"ru": "Один объект", "en": "Single property", "th": "ที่พักเดียว"})}
          </Button>
        </div>
      )}

      {isMulti ? (
        /* Multi-property timeline view */
        <div className="space-y-3 min-w-0 max-w-full">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {isRu ? `Объектов в календаре: ${filteredProperties.length}` : `Properties in calendar: ${filteredProperties.length}`}
          </p>
          {/* Project / Complex filter */}
          {groupOptions.length > 0 && (
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger className="min-h-11 text-sm w-full min-w-0" aria-label={pickLang(language, {"ru": "Проект или комплекс", "en": "Project or complex", "th": "โครงการหรืออาคาร"})}>
                  <SelectValue placeholder={pickLang(language, {"ru": "Все проекты", "en": "All projects", "th": "ทุกโครงการ"})} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{pickLang(language, {"ru": "Все объекты", "en": "All properties", "th": "ที่พักทั้งหมด"})}</SelectItem>
                  {groupOptions.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="no-group">{pickLang(language, {"ru": "Без проекта", "en": "No project", "th": "ไม่มีโครงการ"})}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {selectedGroupId !== 'all' && (
            <p className="text-sm text-muted-foreground break-words" aria-live="polite">
              {pickLang(language, {"ru": "Фильтр: ", "en": "Filter: ", "th": "ตัวกรอง: "})}
              {selectedGroupId === 'no-group'
                ? (pickLang(language, {"ru": "Без проекта", "en": "No project", "th": "ไม่มีโครงการ"}))
                : groupOptions.find(g => g.id === selectedGroupId)?.label}
            </p>
          )}
          <MultiPropertyTimeline
            properties={filteredProperties}
            isLoading={propertiesLoading}
            complexes={complexes || []}
          />
        </div>
      ) : (
        /* Single property view */
        <>
          <section className="space-y-2 border-y border-border py-3" aria-label={pickLang(language, {"ru": "Объект календаря", "en": "Calendar property", "th": "ที่พักในปฏิทิน"})}>
            <label className="text-sm font-medium" htmlFor="calendar-property">
              {pickLang(language, {"ru": "Объект", "en": "Property", "th": "ที่พัก"})}
            </label>
            {propertiesLoading ? (
              <div className="h-11 bg-muted animate-pulse" />
            ) : propertyRefs.length ? (
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger id="calendar-property" className="min-h-11 w-full min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {propertyRefs.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {isRu && p.title_ru ? p.title_ru : p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{pickLang(language, {"ru": "Нет объектов", "en": "No properties", "th": "ไม่มีที่พัก"})}</p>
            )}
            <p className="text-sm break-words text-muted-foreground" aria-live="polite">
              {propertyRefs.find(p => p.id === selectedPropertyId) && (
                isRu ? propertyRefs.find(p => p.id === selectedPropertyId)?.title_ru || propertyRefs.find(p => p.id === selectedPropertyId)?.title
                  : propertyRefs.find(p => p.id === selectedPropertyId)?.title
              )}
            </p>
            <Button variant="outline" className="min-h-11" disabled={!selectedPropertyId}
              onClick={() => setShowCreateTaskDialog(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {pickLang(language, {"ru": "Добавить задачу", "en": "Add Task", "th": "เพิ่มงาน"})}
            </Button>
          </section>

          {selectedPropertyId && <Button variant="outline" onClick={() => {
            const returnTo = new URLSearchParams(params);
            returnTo.set('property', selectedPropertyId);
            const next = new URLSearchParams({ property: selectedPropertyId, returnTo: location.pathname + '?' + returnTo.toString() });
            navigate('/mc/rates?' + next.toString());
          }}>{pickLang(language, {"ru": "Тарифы объекта", "en": "Property rates", "th": "ราคาที่พัก"})}</Button>}

          {/* Calendar + today’s tasks: full-width grid on large screens */}
          <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] xl:gap-6 xl:items-start">
            <div className="min-w-0 w-full space-y-4">
              <AirbnbCalendarGrid
                propertyId={selectedPropertyId || undefined}
                properties={propertyRefs}
              />
            </div>
            <aside className="min-w-0 w-full space-y-4 xl:sticky xl:top-4 xl:self-start">
              <CalendarTodayTasks propertyId={selectedPropertyId || undefined} />
            </aside>
          </div>

          {/* iCal Sync - Collapsible */}
          {selectedPropertyId && (
            <Accordion type="single" collapsible>
              <AccordionItem value="sync" className="border rounded-none">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <RefreshCw className="h-4 w-4" />
                    {pickLang(language, {"ru": "Синхронизация iCal", "en": "iCal Sync", "th": "ซิงค์ iCal"})}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <CalendarSyncManager propertyId={selectedPropertyId} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </>
      )}

      {/* Dialogs (always available) */}
      <CreateServiceTaskDialog
        open={showCreateTaskDialog}
        onOpenChange={setShowCreateTaskDialog}
        properties={propertyRefs}
        defaultPropertyId={selectedPropertyId}
        defaultDate={bangkokTodayDate()}
      />

      {selectedPropertyId && (
        <AddBookingFromCalendarDialog
          open={showAddBookingDialog}
          onOpenChange={setShowAddBookingDialog}
          propertyId={selectedPropertyId}
          initialDate={bangkokTodayDate()}
          onSuccess={() => setShowAddBookingDialog(false)}
        />
      )}
    </div>
  );
}
