import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperty, useServiceRequests, usePropertyInspections } from '@/hooks/usePropertyCare';
import { PageContainer } from '@/components/uno/PageContainer';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Calendar, CheckCircle, Clock, AlertTriangle, FileText, Building2, Sparkles, Shield, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, differenceInHours } from 'date-fns';
import { ru } from 'date-fns/locale';
import { PropertyDocumentsTab } from '@/components/owner/PropertyDocumentsTab';
import { JuristicContactsCard } from '@/components/owner/JuristicContactsCard';
import { usePropertyDocuments } from '@/hooks/usePropertyDocuments';
import { PropertyDetailHeader } from '@/components/owner/property-detail/PropertyDetailHeader';
import { PropertyQuickActions } from '@/components/owner/property-detail/PropertyQuickActions';
import { MarketplaceStatusCard } from '@/components/owner/property-detail/MarketplaceStatusCard';
import { Bed, Bath, SquareStack } from 'lucide-react';

export default function OwnerPropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const { data: property, isLoading } = useOwnerProperty(id);
  const { data: serviceRequests } = useServiceRequests(id);
  const { data: inspections } = usePropertyInspections(id);
  const { documents } = usePropertyDocuments(id || '');

  const instantBookingEnabledAt = property?.instant_booking_enabled_at;
  const protectionEndTime = instantBookingEnabledAt ? new Date(instantBookingEnabledAt) : null;
  const isInProtectionPeriod = protectionEndTime && protectionEndTime > new Date();
  const hoursRemaining = protectionEndTime ? Math.max(0, differenceInHours(protectionEndTime, new Date())) : 0;
  const isRecentlyApproved = property?.approval_status === 'approved' && isInProtectionPeriod;

  const getPropertyTypeLabel = (type: string) => {
    const types: Record<string, { en: string; ru: string }> = {
      villa: { en: 'Villa', ru: 'Вилла' },
      apartment: { en: 'Apartment', ru: 'Квартира' },
      condo: { en: 'Condo', ru: 'Кондо' },
      house: { en: 'House', ru: 'Дом' },
    };
    return isRu ? types[type]?.ru || type : types[type]?.en || type;
  };

  const serviceTypeLabels: Record<string, { en: string; ru: string }> = {
    check_in: { en: 'Check-in', ru: 'Заезд гостей' },
    check_out: { en: 'Check-out', ru: 'Выезд гостей' },
    cleaning: { en: 'Cleaning', ru: 'Уборка' },
    maintenance: { en: 'Maintenance', ru: 'Обслуживание' },
    key_handover: { en: 'Key Handover', ru: 'Передача ключей' },
    emergency: { en: 'Emergency', ru: 'Экстренная помощь' },
  };

  const getServiceStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-info" />;
      case 'pending':
      case 'confirmed': return <Clock className="h-4 w-4 text-warning" />;
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <BackButton />
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </PageContainer>
    );
  }

  if (!property) {
    return (
      <PageContainer>
        <BackButton />
        <div className="text-center py-12">
          <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold">{isRu ? 'Объект не найден' : 'Property not found'}</h2>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BackButton />
      
      <PropertyDetailHeader property={property} isRu={isRu} />

      {/* Recently approved alert */}
      {isRecentlyApproved && (
        <Card className="mb-6 border-success/30 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-success">{isRu ? 'Объект одобрен' : 'Property Approved'}</p>
                <p className="text-sm text-success/80 mt-1">
                  {isRu ? 'Настройте календарь и цены, чтобы начать принимать бронирования' : 'Set up calendar and pricing to start accepting bookings'}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => navigate(`/owner/properties/${id}/setup`)}>
                    <Sparkles className="h-4 w-4 mr-1" />{isRu ? 'Настроить' : 'Set Up Now'}
                  </Button>
                  {isInProtectionPeriod && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Shield className="h-3 w-3" />{isRu ? `Защита: ${hoursRemaining}ч` : `Protection: ${hoursRemaining}h`}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Property specs */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">{getPropertyTypeLabel(property.property_type)}</span>
            {property.bedrooms && <span className="flex items-center gap-1"><Bed className="h-4 w-4" />{property.bedrooms}</span>}
            {property.bathrooms && <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{property.bathrooms}</span>}
            {property.area_sqm && <span className="flex items-center gap-1"><SquareStack className="h-4 w-4" />{property.area_sqm}{isRu ? 'м²' : ' sqm'}</span>}
          </div>
        </CardContent>
      </Card>

      <MarketplaceStatusCard propertyId={property.id} approvalStatus={property.approval_status} rejectionReason={property.rejection_reason} isRu={isRu} />

      <PropertyQuickActions propertyId={property.id} isRu={isRu} />

      {/* Activity Tabs */}
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services" className="text-xs px-2">
            {isRu ? 'Услуги' : 'Services'}
            {(serviceRequests?.length || 0) > 0 && <Badge variant="secondary" className="ml-1 text-[10px] px-1">{serviceRequests?.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="inspections" className="text-xs px-2">{isRu ? 'Инспекции' : 'Inspections'}</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs px-2">
            <FileText className="h-3 w-3 mr-1" />{isRu ? 'Документы' : 'Docs'}
            {(documents?.length || 0) > 0 && <Badge variant="secondary" className="ml-1 text-[10px] px-1">{documents?.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="juristic" className="text-xs px-2">
            <Building2 className="h-3 w-3 mr-1" />{isRu ? 'УК' : 'MC'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="mt-4 space-y-3">
          {!serviceRequests?.length ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">{isRu ? 'Нет активных заявок' : 'No active requests'}</CardContent></Card>
          ) : (
            serviceRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getServiceStatusIcon(request.status)}
                      <div>
                        <p className="font-medium">{isRu ? serviceTypeLabels[request.service_type]?.ru : serviceTypeLabels[request.service_type]?.en}</p>
                        {request.scheduled_at && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(request.scheduled_at), 'PPP', { locale: isRu ? ru : undefined })}
                          </p>
                        )}
                        {request.guest_name && <p className="text-sm text-muted-foreground">{isRu ? 'Гость:' : 'Guest:'} {request.guest_name}</p>}
                      </div>
                    </div>
                    <Badge variant="outline">{request.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="inspections" className="mt-4 space-y-3">
          {!inspections?.length ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">{isRu ? 'Нет инспекций' : 'No inspections'}</CardContent></Card>
          ) : (
            inspections.map((inspection) => (
              <Card key={inspection.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getServiceStatusIcon(inspection.status)}
                      <div>
                        <p className="font-medium capitalize">{inspection.inspection_type}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(inspection.scheduled_at), 'PPP', { locale: isRu ? ru : undefined })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{inspection.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          {id && <PropertyDocumentsTab propertyId={id} />}
        </TabsContent>

        <TabsContent value="juristic" className="mt-4 space-y-4">
          {property?.project_id ? (
            <>
              <JuristicContactsCard projectId={property.project_id} />
              <Button className="w-full" onClick={() => navigate(`/owner/properties/${id}/juristic-requests`)}>
                <Building2 className="h-4 w-4 mr-2" />{isRu ? 'Запросы к УК' : 'MC Requests'}
              </Button>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium mb-1">{isRu ? 'Комплекс не привязан' : 'No project linked'}</p>
                <p className="text-sm">{isRu ? 'Привяжите объект к комплексу для взаимодействия с УК' : 'Link property to a project to interact with management company'}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Button variant="ghost" className="w-full mt-6" onClick={() => navigate(`/owner/properties/${id}/editor`)}>
        <Settings className="h-4 w-4 mr-2" />{isRu ? 'Редактировать объект' : 'Edit Property'}
      </Button>
    </PageContainer>
  );
}
