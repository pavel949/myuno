import { useState } from 'react';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookingCalendar } from '@/components/owner/BookingCalendar';
import { CalendarSyncManager } from '@/components/owner/CalendarSyncManager';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { CalendarDays, RefreshCw, Home } from 'lucide-react';

export default function OwnerCalendar() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [activeTab, setActiveTab] = useState('calendar');
  
  const { data: properties } = useOwnerProperties();

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
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
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Календарь бронирований' : 'Booking Calendar'}
        showBack
        fallbackPath="/owner"
      />
      
      <div className="mt-4 space-y-4">
        {/* Property Selector - shared between tabs */}
        {properties && properties.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <Label className="mb-2 block">
                {isRu ? 'Выберите объект' : 'Select Property'}
              </Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder={isRu ? 'Выберите объект' : 'Select property'} />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        {isRu ? property.title_ru || property.title : property.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              {isRu ? 'Календарь' : 'Calendar'}
            </TabsTrigger>
            <TabsTrigger value="sync" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {isRu ? 'Синхронизация' : 'Sync'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="mt-4">
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
      </div>
    </PageContainer>
  );
}
