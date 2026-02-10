import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AirbnbCalendarGrid } from '@/components/owner/AirbnbCalendarGrid';
import { CalendarTodayTasks } from '@/components/owner/CalendarTodayTasks';
import { CalendarSyncManager } from '@/components/owner/CalendarSyncManager';
import { PropertyThumbnailSelector } from '@/components/owner/PropertyThumbnailSelector';
import { CreateServiceTaskDialog } from '@/components/owner/CreateServiceTaskDialog';
import { AddBookingFromCalendarDialog } from '@/components/owner/AddBookingFromCalendarDialog';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useMyProperties } from '@/hooks/useMyProperties';
import { CalendarDays, CalendarPlus, Plus, RefreshCw } from 'lucide-react';

export default function OwnerCalendar() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  const [showAddBookingDialog, setShowAddBookingDialog] = useState(false);
  
  const { allProperties, isLoading: propertiesLoading } = useMyProperties();

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

  return (
    <div className="p-4 pb-24 space-y-4">
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

      {/* Dialogs */}
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
