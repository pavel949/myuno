import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AirbnbCalendarGrid } from '@/components/owner/AirbnbCalendarGrid';
import { MultiPropertyTimeline } from '@/components/owner/MultiPropertyTimeline';
import { CalendarTodayTasks } from '@/components/owner/CalendarTodayTasks';
import { CalendarSyncManager } from '@/components/owner/CalendarSyncManager';
import { PropertyThumbnailSelector } from '@/components/owner/PropertyThumbnailSelector';
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
        <Button onClick={() => navigate('/auth')}>
          {isRu ? 'Войти' : 'Sign In'}
        </Button>
      </div>
    );
  }

  const isMulti = viewMode === 'multi';

  return (
    <div className="p-4 pb-24 space-y-4">
      {/* View Mode Toggle */}
      {allProperties.length > 1 && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isRu ? 'Календарь' : 'Calendar'}
          </h2>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('multi')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                isMulti ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              {isRu ? 'Все' : 'All'}
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                !isMulti ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-3.5 w-3.5" />
              {isRu ? 'Один' : 'Single'}
            </button>
          </div>
        </div>
      )}

      {isMulti ? (
        /* Multi-property timeline view */
        <div className="space-y-3">
          {/* Project / Complex filter */}
          {groupOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger className="h-8 text-xs w-auto min-w-[160px]">
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
          <MultiPropertyTimeline
            properties={filteredProperties}
            isLoading={propertiesLoading}
            complexes={complexes || []}
          />
        </div>
      ) : (
        /* Single property view */
        <>
          {/* Property Selector */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {isRu ? 'Выберите объект' : 'Select Property'}
            </p>
            <PropertyThumbnailSelector
              properties={propertyRefs}
              selectedId={selectedPropertyId}
              onSelect={setSelectedPropertyId}
              isLoading={propertiesLoading}
            />
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={() => setShowAddBookingDialog(true)}
              variant="default"
              className="gap-2"
              disabled={!selectedPropertyId}
            >
              <CalendarPlus className="h-4 w-4" />
              {isRu ? 'Бронирование' : 'Add Booking'}
            </Button>
            <Button 
              onClick={() => setShowCreateTaskDialog(true)}
              variant="outline"
              className="gap-2"
              disabled={!selectedPropertyId}
            >
              <Plus className="h-4 w-4" />
              {isRu ? 'Задача' : 'Add Task'}
            </Button>
          </div>

          {/* Airbnb-style Calendar Grid */}
          <AirbnbCalendarGrid
            propertyId={selectedPropertyId || undefined}
            properties={propertyRefs}
          />

          {/* Today's Tasks */}
          <CalendarTodayTasks propertyId={selectedPropertyId || undefined} />

          {/* iCal Sync - Collapsible */}
          {selectedPropertyId && (
            <Accordion type="single" collapsible>
              <AccordionItem value="sync" className="border rounded-lg">
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
