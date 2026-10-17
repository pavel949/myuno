import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  const [showAddBookingDialog, setShowAddBookingDialog] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  // Default to multi on desktop (checked via initial window width)
  const [viewMode, setViewMode] = useState<ViewMode>(() => 
    typeof window !== 'undefined' && window.innerWidth >= 768 ? 'multi' : 'single'
  );
  
  const { allProperties, isLoading: propertiesLoading } = useMyProperties();
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

  useEffect(() => {
    if (allProperties.length && !selectedPropertyId) {
      setSelectedPropertyId(allProperties[0].property_id);
    }
  }, [allProperties, selectedPropertyId]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <CalendarDays className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">
          {isRu ? 'Календарь бронирований' : 'Booking Calendar'}
        </h1>
        <p className="text-muted-foreground mb-6">
          {isRu ? 'Войдите, чтобы просмотреть календарь' : 'Sign in to view the calendar'}
        </p>
        <Button onClick={() => redirectToAuth(navigate)}>
          {isRu ? 'Войти' : 'Sign In'}
        </Button>
      </div>
    );
  }

  const isMulti = viewMode === 'multi';

  return (
    <div className="p-4 pb-24 space-y-4 w-full min-w-0 max-w-full overflow-x-hidden">
      <header className="space-y-3">
        <h1 className="font-display text-h3 break-words">
          {isRu ? 'Календарь бронирований' : 'Booking Calendar'}
        </h1>
        {!isMulti && (
          <Button className="w-full sm:w-auto min-h-11" disabled={!selectedPropertyId}
            onClick={() => setShowAddBookingDialog(true)}>
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            {isRu ? 'Добавить бронирование' : 'Add Booking'}
          </Button>
        )}
      </header>
      {allProperties.length > 1 && (
        <div className="grid grid-cols-2 gap-1 border-b border-border pb-3" role="group"
          aria-label={isRu ? 'Режим календаря' : 'Calendar view'}>
          <Button variant="ghost" aria-pressed={isMulti} onClick={() => setViewMode('multi')}
            className={cn('min-h-11 h-auto whitespace-normal text-sm px-2', isMulti ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
            <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden="true" />
            {isRu ? 'Все объекты' : 'Portfolio'}
          </Button>
          <Button variant="ghost" aria-pressed={!isMulti} onClick={() => setViewMode('single')}
            className={cn('min-h-11 h-auto whitespace-normal text-sm px-2', !isMulti ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
            <List className="h-4 w-4 shrink-0" aria-hidden="true" />
            {isRu ? 'Один объект' : 'Single property'}
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
                <SelectTrigger className="min-h-11 text-sm w-full min-w-0" aria-label={isRu ? 'Проект или комплекс' : 'Project or complex'}>
                  <SelectValue placeholder={isRu ? 'Все проекты' : 'All projects'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRu ? 'Все объекты' : 'All properties'}</SelectItem>
                  {groupOptions.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="no-group">{isRu ? 'Без проекта' : 'No project'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {selectedGroupId !== 'all' && (
            <p className="text-sm text-muted-foreground break-words" aria-live="polite">
              {isRu ? 'Фильтр: ' : 'Filter: '}
              {selectedGroupId === 'no-group'
                ? (isRu ? 'Без проекта' : 'No project')
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
          <section className="space-y-2 border-y border-border py-3" aria-label={isRu ? 'Объект календаря' : 'Calendar property'}>
            <label className="text-sm font-medium" htmlFor="calendar-property">
              {isRu ? 'Объект' : 'Property'}
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
              <p className="text-sm text-muted-foreground">{isRu ? 'Нет объектов' : 'No properties'}</p>
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
              {isRu ? 'Добавить задачу' : 'Add Task'}
            </Button>
          </section>

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
                    {isRu ? 'Синхронизация iCal' : 'iCal Sync'}
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
        defaultDate={new Date()}
      />

      {selectedPropertyId && (
        <AddBookingFromCalendarDialog
          open={showAddBookingDialog}
          onOpenChange={setShowAddBookingDialog}
          propertyId={selectedPropertyId}
          initialDate={new Date()}
          onSuccess={() => setShowAddBookingDialog(false)}
        />
      )}
    </div>
  );
}
