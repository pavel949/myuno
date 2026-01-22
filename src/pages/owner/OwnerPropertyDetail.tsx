import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperty, useServiceRequests, usePropertyInspections } from '@/hooks/usePropertyCare';
import { PageContainer } from '@/components/uno/PageContainer';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Home, MapPin, Bed, Bath, SquareStack, Settings, 
  Globe, ClipboardList, Wrench, Calendar, ExternalLink,
  CheckCircle, Clock, AlertTriangle, DollarSign, BookOpen,
  FileText, Building2, Sparkles, Shield
} from 'lucide-react';
import { differenceInHours } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { PropertyDocumentsTab } from '@/components/owner/PropertyDocumentsTab';
import { JuristicContactsCard } from '@/components/owner/JuristicContactsCard';
import { usePropertyDocuments } from '@/hooks/usePropertyDocuments';

export default function OwnerPropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const { data: property, isLoading } = useOwnerProperty(id);
  const { data: serviceRequests } = useServiceRequests(id);
  const { data: inspections } = usePropertyInspections(id);
  const { documents } = usePropertyDocuments(id || '');

  const getStatusBadge = (status: string, approvalStatus?: string) => {
    if (approvalStatus === 'pending') {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 gap-1">
          <Clock className="h-3 w-3" />
          {isRu ? 'На рассмотрении' : 'Under Review'}
        </Badge>
      );
    }
    if (approvalStatus === 'rejected') {
      return (
        <Badge variant="destructive" className="gap-1">
          {isRu ? 'Требует доработки' : 'Needs Revision'}
        </Badge>
      );
    }
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">{isRu ? 'Активен' : 'Active'}</Badge>;
      case 'pending':
        return <Badge variant="secondary">{isRu ? 'На проверке' : 'Pending'}</Badge>;
      default:
        return <Badge variant="outline">{isRu ? 'Неактивен' : 'Inactive'}</Badge>;
    }
  };

  // Calculate protection period
  const instantBookingEnabledAt = (property as any)?.instant_booking_enabled_at;
  const protectionEndTime = instantBookingEnabledAt ? new Date(instantBookingEnabledAt) : null;
  const isInProtectionPeriod = protectionEndTime && protectionEndTime > new Date();
  const hoursRemaining = protectionEndTime ? Math.max(0, differenceInHours(protectionEndTime, new Date())) : 0;
  const isRecentlyApproved = (property as any)?.approval_status === 'approved' && isInProtectionPeriod;

  const getServiceStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending':
      case 'confirmed':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

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
      
      {/* Header with image */}
      <div className="relative rounded-xl overflow-hidden mb-6">
        {property.cover_image ? (
          <img 
            src={property.cover_image} 
            alt={property.title}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-muted flex items-center justify-center">
            <Home className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                {isRu && property.title_ru ? property.title_ru : property.title}
              </h1>
              <p className="text-white/80 text-sm flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {property.district || property.address}
              </p>
            </div>
            {getStatusBadge(property.status, (property as any).approval_status)}
          </div>
        </div>
      </div>

      {/* Recently approved alert - prompt to setup */}
      {isRecentlyApproved && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-green-900">
                  {isRu ? 'Объект одобрен! 🎉' : 'Property Approved! 🎉'}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  {isRu 
                    ? 'Настройте календарь и цены, чтобы начать принимать бронирования' 
                    : 'Set up calendar and pricing to start accepting bookings'}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => navigate(`/owner/properties/${id}/setup`)}
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    {isRu ? 'Настроить' : 'Set Up Now'}
                  </Button>
                  {isInProtectionPeriod && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Shield className="h-3 w-3" />
                      {isRu ? `Защита: ${hoursRemaining}ч` : `Protection: ${hoursRemaining}h`}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                {getPropertyTypeLabel(property.property_type)}
              </span>
              {property.bedrooms && (
                <span className="flex items-center gap-1">
                  <Bed className="h-4 w-4" />
                  {property.bedrooms}
                </span>
              )}
              {property.bathrooms && (
                <span className="flex items-center gap-1">
                  <Bath className="h-4 w-4" />
                  {property.bathrooms}
                </span>
              )}
              {property.area_sqm && (
                <span className="flex items-center gap-1">
                  <SquareStack className="h-4 w-4" />
                  {property.area_sqm}м²
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marketplace integration - now automatic on approval */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          {property.marketplace_property_id ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{isRu ? 'Опубликовано на маркетплейсе' : 'Published on Marketplace'}</p>
                  <p className="text-sm text-muted-foreground">
                    {isRu ? 'Доступно для бронирования' : 'Available for booking'}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/property/${property.marketplace_property_id}`)}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                {isRu ? 'Открыть' : 'View'}
              </Button>
            </div>
          ) : (property as any).approval_status === 'pending' ? (
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium">{isRu ? 'На модерации' : 'Under Review'}</p>
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'После одобрения объект автоматически появится на маркетплейсе' : 'Property will be published automatically after approval'}
                </p>
              </div>
            </div>
          ) : (property as any).approval_status === 'rejected' ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium">{isRu ? 'Требуется доработка' : 'Revision Required'}</p>
                  <p className="text-sm text-muted-foreground">
                    {(property as any).rejection_reason || (isRu ? 'Внесите изменения и отправьте на повторную проверку' : 'Make changes and resubmit for review')}
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => navigate(`/owner/properties/${id}/edit`)}>
                <Settings className="h-4 w-4 mr-1" />
                {isRu ? 'Редактировать' : 'Edit'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{isRu ? 'Ожидает отправки на модерацию' : 'Awaiting Submission'}</p>
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Заполните все обязательные поля и отправьте на проверку' : 'Complete all required fields and submit for review'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button 
          variant="outline" 
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate(`/owner/properties/${id}/terms`)}
        >
          <DollarSign className="h-5 w-5" />
          <span className="text-sm">{isRu ? 'Условия аренды' : 'Rental Terms'}</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate(`/owner/properties/${id}/guidebook`)}
        >
          <BookOpen className="h-5 w-5" />
          <span className="text-sm">{isRu ? 'Гайд для гостей' : 'Guest Guidebook'}</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate(`/owner/calendar`)}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-sm">{isRu ? 'Календарь' : 'Calendar'}</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate(`/owner/service-request?property=${id}`)}
        >
          <Wrench className="h-5 w-5" />
          <span className="text-sm">{isRu ? 'Заказать услугу' : 'Request Service'}</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate(`/owner/inspection?property=${id}`)}
        >
          <ClipboardList className="h-5 w-5" />
          <span className="text-sm">{isRu ? 'Инспекция' : 'Inspection'}</span>
        </Button>
      </div>

      {/* Tabs for activity */}
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services" className="text-xs px-2">
            {isRu ? 'Услуги' : 'Services'}
            {(serviceRequests?.length || 0) > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1">{serviceRequests?.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inspections" className="text-xs px-2">
            {isRu ? 'Инспекции' : 'Inspections'}
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs px-2">
            <FileText className="h-3 w-3 mr-1" />
            {isRu ? 'Документы' : 'Docs'}
            {(documents?.length || 0) > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1">{documents?.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="juristic" className="text-xs px-2">
            <Building2 className="h-3 w-3 mr-1" />
            {isRu ? 'УК' : 'MC'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="mt-4 space-y-3">
          {!serviceRequests?.length ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                {isRu ? 'Нет активных заявок' : 'No active requests'}
              </CardContent>
            </Card>
          ) : (
            serviceRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getServiceStatusIcon(request.status)}
                      <div>
                        <p className="font-medium">
                          {isRu 
                            ? serviceTypeLabels[request.service_type]?.ru 
                            : serviceTypeLabels[request.service_type]?.en
                          }
                        </p>
                        {request.scheduled_at && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(request.scheduled_at), 'PPP', { locale: isRu ? ru : undefined })}
                          </p>
                        )}
                        {request.guest_name && (
                          <p className="text-sm text-muted-foreground">
                            {isRu ? 'Гость:' : 'Guest:'} {request.guest_name}
                          </p>
                        )}
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
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                {isRu ? 'Нет инспекций' : 'No inspections'}
              </CardContent>
            </Card>
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
              <Button 
                className="w-full"
                onClick={() => navigate(`/owner/properties/${id}/juristic-requests`)}
              >
                <Building2 className="h-4 w-4 mr-2" />
                {isRu ? 'Запросы к УК' : 'MC Requests'}
              </Button>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium mb-1">
                  {isRu ? 'Комплекс не привязан' : 'No project linked'}
                </p>
                <p className="text-sm">
                  {isRu 
                    ? 'Привяжите объект к комплексу для взаимодействия с УК' 
                    : 'Link property to a project to interact with management company'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Settings button */}
      <Button 
        variant="ghost" 
        className="w-full mt-6"
        onClick={() => navigate(`/owner/properties/${id}/edit`)}
      >
        <Settings className="h-4 w-4 mr-2" />
        {isRu ? 'Редактировать объект' : 'Edit Property'}
      </Button>

      {/* Publish Dialog */}
    </PageContainer>
  );
}