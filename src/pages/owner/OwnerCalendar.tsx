import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UnifiedPropertyCalendar } from '@/components/owner/UnifiedPropertyCalendar';
import { BookingCalendar } from '@/components/owner/BookingCalendar';
import { CalendarSyncManager } from '@/components/owner/CalendarSyncManager';
import { PropertyThumbnailSelector } from '@/components/owner/PropertyThumbnailSelector';
import { CreateServiceTaskDialog } from '@/components/owner/CreateServiceTaskDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { CalendarDays, RefreshCw, ClipboardList, Plus } from 'lucide-react';

export default function OwnerCalendar() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [activeTab, setActiveTab] = useState('calendar');
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  
  const { data: properties, isLoading: propertiesLoading } = useOwnerProperties();

  // Auto-select first property when properties load
  useEffect(() => {
    if (properties?.length && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <CalendarDays className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">
          {isRu ? 'Календарь бронирований' : 'Booking Calendar'}
        </h1>
        <p className="text-muted-foreground mb-6">
          {isRu 
            ? 'Войдите, чтобы просмотреть календарь' 
            : 'Sign in to view the calendar'}
        </p>
        <Button onClick={() => navigate('/auth')}>
          {isRu ? 'Войти' : 'Sign In'}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header with Property Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {isRu ? 'Выберите объект' : 'Select Property'}
          </p>
          
          {/* Quick Add Task Button - visible on all screens */}
          <Button 
            onClick={() => setShowCreateTaskDialog(true)}
            size="sm"
            className="gap-1.5"
            disabled={!selectedPropertyId}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{isRu ? 'Создать задачу' : 'Add Task'}</span>
            <span className="sm:hidden">{isRu ? 'Задача' : 'Task'}</span>
          </Button>
        </div>
        
        <PropertyThumbnailSelector
          properties={properties || []}
          selectedId={selectedPropertyId}
          onSelect={setSelectedPropertyId}
          isLoading={propertiesLoading}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            {isRu ? 'Календарь' : 'Calendar'}
          </TabsTrigger>
          <TabsTrigger value="operations" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            {isRu ? 'Задачи' : 'Tasks'}
          </TabsTrigger>
          <TabsTrigger value="sync" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {isRu ? 'Синхр.' : 'Sync'}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="mt-4">
          <UnifiedPropertyCalendar 
            propertyId={selectedPropertyId || undefined}
            properties={properties || []}
          />
        </TabsContent>

        <TabsContent value="operations" className="mt-4">
          <BookingCalendar 
            propertyId={selectedPropertyId || undefined} 
            showPropertySelector={false} 
          />
        </TabsContent>
        
        <TabsContent value="sync" className="mt-4">
          {selectedPropertyId ? (
            <CalendarSyncManager propertyId={selectedPropertyId} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <RefreshCw className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{isRu ? 'Выберите объект для настройки синхронизации' : 'Select a property to configure sync'}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Task Dialog */}
      <CreateServiceTaskDialog
        open={showCreateTaskDialog}
        onOpenChange={setShowCreateTaskDialog}
        properties={properties || []}
        defaultPropertyId={selectedPropertyId}
        defaultDate={new Date()}
      />
    </div>
  );
}
