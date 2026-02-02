import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useYacht } from '@/hooks/useYachts';
import { useYachtAvailability } from '@/hooks/useYachtAvailability';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { YachtCalendar, YachtAvailabilityEntry } from '@/components/yacht/YachtCalendar';
import { YachtICalSync } from '@/components/yacht/YachtICalSync';
import { YachtPricingRules } from '@/components/yacht/YachtPricingRules';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Save, 
  Sailboat,
  AlertCircle,
  Calendar,
  DollarSign,
  Link2
} from 'lucide-react';

export default function VendorYachtCalendar() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { yacht, isLoading: yachtLoading } = useYacht(id || '');
  const { 
    availability, 
    isLoading: availabilityLoading, 
    updateAvailability, 
    isUpdating 
  } = useYachtAvailability(id);

  const [localAvailability, setLocalAvailability] = useState<YachtAvailabilityEntry[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');

  // Sync local state with fetched data
  React.useEffect(() => {
    if (availability.length > 0 && localAvailability.length === 0) {
      setLocalAvailability(availability);
    }
  }, [availability]);

  const handleAvailabilityChange = useCallback((newAvailability: YachtAvailabilityEntry[]) => {
    setLocalAvailability(newAvailability);
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    if (!id) return;

    try {
      await updateAvailability({
        yachtId: id,
        entries: localAvailability,
      });
      setHasChanges(false);
      toast.success(isRu ? 'Календарь сохранён' : 'Calendar saved');
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error(isRu ? 'Ошибка сохранения' : 'Error saving');
    }
  };

  const handleReset = () => {
    setLocalAvailability(availability);
    setHasChanges(false);
  };

  if (authLoading || yachtLoading || availabilityLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-[500px]" />
        </PageContainer>
      </AppLayout>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!yacht) {
    return (
      <AppLayout>
        <PageContainer>
          <Card>
            <CardContent className="p-8 text-center">
              <Sailboat className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">
                {isRu ? 'Яхта не найдена' : 'Yacht not found'}
              </h3>
              <Button variant="outline" onClick={() => navigate('/vendor/yachts')}>
                {isRu ? 'Вернуться к списку' : 'Back to list'}
              </Button>
            </CardContent>
          </Card>
        </PageContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Управление яхтой' : 'Yacht Management'}
          showBack
        />

        {/* Yacht Info Card */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {yacht.cover_image ? (
                <img 
                  src={yacht.cover_image} 
                  alt={yacht.name_en}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                  <Sailboat className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="font-semibold">
                  {isRu ? yacht.name_ru : yacht.name_en}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">
                    {yacht.yacht_type}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ฿{(yacht.price_full_day || 0).toLocaleString()}/day
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unsaved Changes Warning */}
        {hasChanges && (
          <Card className="mb-4 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {isRu ? 'Есть несохранённые изменения' : 'You have unsaved changes'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  {isRu ? 'Отменить' : 'Discard'}
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isUpdating}>
                  <Save className="h-4 w-4 mr-1" />
                  {isUpdating 
                    ? (isRu ? 'Сохранение...' : 'Saving...') 
                    : (isRu ? 'Сохранить' : 'Save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isRu ? 'Календарь' : 'Calendar'}
              </span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isRu ? 'Цены' : 'Pricing'}
              </span>
            </TabsTrigger>
            <TabsTrigger value="sync" className="gap-2">
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isRu ? 'Синхронизация' : 'Sync'}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <YachtCalendar
              availability={localAvailability}
              onChange={handleAvailabilityChange}
              basePriceHalfDay={yacht.price_half_day || 0}
              basePriceFullDay={yacht.price_full_day || 0}
              currency="THB"
            />
          </TabsContent>

          <TabsContent value="pricing">
            <YachtPricingRules
              yachtId={id!}
              basePriceHalfDay={yacht.price_half_day || 0}
              basePriceFullDay={yacht.price_full_day || 0}
              currency="THB"
            />
          </TabsContent>

          <TabsContent value="sync">
            <YachtICalSync yachtId={id!} />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </AppLayout>
  );
}
