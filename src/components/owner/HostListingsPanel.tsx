import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PropertyCard, PropertyCardSkeleton } from '@/components/property/PropertyCard';
import { 
  Home, Plus, Clock, CheckCircle, 
  XCircle, AlertCircle, FileEdit, ArrowRight
} from 'lucide-react';


function EmptyState({ 
  title, 
  description, 
  action,
  icon: Icon = Home 
}: { 
  title: string; 
  description: string; 
  action?: React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/50 mb-3" />
      <h4 className="font-medium mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">{description}</p>
      {action}
    </div>
  );
}

export function HostListingsPanel() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const { data: properties, isLoading } = useOwnerProperties();

  const categorizedProperties = useMemo(() => {
    if (!properties) return { drafts: [], pending: [], active: [], rejected: [] };
    
    return {
      drafts: properties.filter(p => !p.approval_status || p.approval_status === 'draft'),
      pending: properties.filter(p => p.approval_status === 'pending'),
      active: properties.filter(p => p.approval_status === 'approved'),
      rejected: properties.filter(p => p.approval_status === 'rejected'),
    };
  }, [properties]);

  const counts = {
    drafts: categorizedProperties.drafts.length,
    pending: categorizedProperties.pending.length,
    active: categorizedProperties.active.length,
    rejected: categorizedProperties.rejected.length,
    total: properties?.length || 0,
  };

  const handleEdit = (id: string) => {
    navigate(`/owner/properties/${id}/editor`);
  };

  const handleView = (id: string) => {
    navigate(`/owner/properties/${id}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Home className="h-4 w-4" />
          {isRu ? 'Мои объекты' : 'My Listings'}
          <Badge variant="secondary" className="ml-1">{counts.total}</Badge>
        </CardTitle>
        <Button 
          size="sm" 
          onClick={() => navigate('/owner/properties/new')}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{isRu ? 'Добавить' : 'Add'}</span>
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-5 h-9 mb-4">
            <TabsTrigger value="all" className="text-xs px-1">
              {isRu ? 'Все' : 'All'}
              <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">{counts.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="drafts" className="text-xs px-1">
              {isRu ? 'Черн.' : 'Draft'}
              {counts.drafts > 0 && (
                <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">{counts.drafts}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs px-1">
              <Clock className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">{isRu ? 'Ожид.' : 'Review'}</span>
              {counts.pending > 0 && (
                <Badge className="ml-1 h-4 px-1 text-[10px] bg-yellow-500">{counts.pending}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs px-1">
              <CheckCircle className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">{isRu ? 'Актив.' : 'Active'}</span>
              {counts.active > 0 && (
                <Badge className="ml-1 h-4 px-1 text-[10px] bg-green-500">{counts.active}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs px-1">
              <XCircle className="h-3 w-3 sm:mr-1 text-red-500" />
              {counts.rejected > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">{counts.rejected}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0 space-y-3">
            {counts.total === 0 ? (
              <EmptyState
                title={isRu ? 'Нет объектов' : 'No listings yet'}
                description={isRu 
                  ? 'Добавьте вашу первую недвижимость и начните получать бронирования' 
                  : 'Add your first property and start receiving bookings'}
                action={
                  <Button onClick={() => navigate('/owner/properties/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    {isRu ? 'Добавить объект' : 'Add Property'}
                  </Button>
                }
              />
            ) : (
              <>
                {properties?.slice(0, 5).map((property) => (
                  <PropertyCard 
                    key={property.id} 
                    property={property} 
                    variant="list"
                    mode="owner"
                    onEdit={handleEdit}
                    onView={handleView}
                    showApprovalStatus
                  />
                ))}
                {counts.total > 5 && (
                  <Button 
                    variant="ghost" 
                    className="w-full" 
                    onClick={() => navigate('/owner/properties')}
                  >
                    {isRu ? 'Показать все' : 'View all'}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="drafts" className="mt-0 space-y-3">
            {counts.drafts === 0 ? (
              <EmptyState
                icon={FileEdit}
                title={isRu ? 'Нет черновиков' : 'No drafts'}
                description={isRu 
                  ? 'Начните создавать объект — он автоматически сохранится как черновик' 
                  : 'Start creating a listing — it will auto-save as a draft'}
              />
            ) : (
              categorizedProperties.drafts.map((property) => (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                  variant="list"
                  mode="owner"
                  onEdit={handleEdit}
                  onView={handleView}
                  showApprovalStatus
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-0 space-y-3">
            {counts.pending === 0 ? (
              <EmptyState
                icon={Clock}
                title={isRu ? 'Нет объектов на рассмотрении' : 'No pending listings'}
                description={isRu 
                  ? 'Объекты, отправленные на модерацию, появятся здесь' 
                  : 'Listings submitted for review will appear here'}
              />
            ) : (
              <>
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {isRu 
                      ? 'Модерация обычно занимает до 1 часа в рабочее время' 
                      : 'Moderation usually takes up to 1 hour during business hours'}
                  </span>
                </div>
                {categorizedProperties.pending.map((property) => (
                  <PropertyCard 
                    key={property.id} 
                    property={property} 
                    variant="list"
                    mode="owner"
                    onEdit={handleEdit}
                    onView={handleView}
                    showApprovalStatus
                  />
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-0 space-y-3">
            {counts.active === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title={isRu ? 'Нет активных объектов' : 'No active listings'}
                description={isRu 
                  ? 'Одобренные объекты будут отображаться здесь' 
                  : 'Approved listings will appear here'}
              />
            ) : (
              categorizedProperties.active.map((property) => (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                  variant="list"
                  mode="owner"
                  onEdit={handleEdit}
                  onView={handleView}
                  showApprovalStatus
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-0 space-y-3">
            {counts.rejected === 0 ? (
              <EmptyState
                icon={XCircle}
                title={isRu ? 'Нет отклонённых объектов' : 'No rejected listings'}
                description={isRu 
                  ? 'Отклонённые объекты с причиной появятся здесь' 
                  : 'Rejected listings with feedback will appear here'}
              />
            ) : (
              <>
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg text-sm text-red-800 dark:text-red-200 mb-2">
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {isRu 
                      ? 'Исправьте замечания и отправьте повторно на модерацию' 
                      : 'Fix the issues and resubmit for review'}
                  </span>
                </div>
                {categorizedProperties.rejected.map((property) => (
                  <PropertyCard 
                    key={property.id} 
                    property={property} 
                    variant="list"
                    mode="owner"
                    onEdit={handleEdit}
                    onView={handleView}
                    showApprovalStatus
                  />
                ))}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
