import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperty, usePublishToMarketplace, useServiceRequests, usePropertyInspections } from '@/hooks/usePropertyCare';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Home, MapPin, Bed, Bath, SquareStack, Settings, 
  Globe, ClipboardList, Wrench, Calendar, ExternalLink,
  CheckCircle, Clock, AlertTriangle, Loader2, DollarSign
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function OwnerPropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const { data: property, isLoading } = useOwnerProperty(id);
  const { data: serviceRequests } = useServiceRequests(id);
  const { data: inspections } = usePropertyInspections(id);
  const publishToMarketplace = usePublishToMarketplace();

  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishData, setPublishData] = useState({
    listing_type: 'rent',
    price: '',
    price_period: 'night',
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">{isRu ? 'Активен' : 'Active'}</Badge>;
      case 'pending':
        return <Badge variant="secondary">{isRu ? 'На проверке' : 'Pending'}</Badge>;
      default:
        return <Badge variant="outline">{isRu ? 'Неактивен' : 'Inactive'}</Badge>;
    }
  };

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

  const handlePublish = async () => {
    if (!property) return;
    
    await publishToMarketplace.mutateAsync({
      ownerPropertyId: property.id,
      listingType: publishData.listing_type as 'rent' | 'sale',
      price: Number(publishData.price),
      pricePeriod: publishData.price_period,
    });

    setShowPublishDialog(false);
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
            {getStatusBadge(property.status)}
          </div>
        </div>
      </div>

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

      {/* Marketplace integration */}
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
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{isRu ? 'Опубликуйте на маркетплейсе' : 'Publish on Marketplace'}</p>
                  <p className="text-sm text-muted-foreground">
                    {isRu ? 'Сдавайте или продавайте через UNO' : 'Rent or sell through UNO'}
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => setShowPublishDialog(true)}>
                <Globe className="h-4 w-4 mr-1" />
                {isRu ? 'Опубликовать' : 'Publish'}
              </Button>
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="services">
            {isRu ? 'Услуги' : 'Services'}
            {(serviceRequests?.length || 0) > 0 && (
              <Badge variant="secondary" className="ml-2">{serviceRequests?.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inspections">
            {isRu ? 'Инспекции' : 'Inspections'}
            {(inspections?.length || 0) > 0 && (
              <Badge variant="secondary" className="ml-2">{inspections?.length}</Badge>
            )}
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
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRu ? 'Опубликовать на маркетплейсе' : 'Publish on Marketplace'}</DialogTitle>
            <DialogDescription>
              {isRu 
                ? 'Ваш объект будет доступен для бронирования или покупки через UNO'
                : 'Your property will be available for booking or purchase through UNO'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isRu ? 'Тип листинга' : 'Listing Type'}</Label>
              <Select 
                value={publishData.listing_type}
                onValueChange={(value) => setPublishData(prev => ({ ...prev, listing_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">{isRu ? 'Аренда' : 'Rent'}</SelectItem>
                  <SelectItem value="sale">{isRu ? 'Продажа' : 'Sale'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Цена' : 'Price'}</Label>
              <Input
                type="number"
                value={publishData.price}
                onChange={(e) => setPublishData(prev => ({ ...prev, price: e.target.value }))}
                placeholder={publishData.listing_type === 'sale' ? '5000000' : '3500'}
              />
            </div>

            {publishData.listing_type === 'rent' && (
              <div className="space-y-2">
                <Label>{isRu ? 'Период' : 'Period'}</Label>
                <Select 
                  value={publishData.price_period}
                  onValueChange={(value) => setPublishData(prev => ({ ...prev, price_period: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="night">{isRu ? 'За ночь' : 'Per night'}</SelectItem>
                    <SelectItem value="week">{isRu ? 'За неделю' : 'Per week'}</SelectItem>
                    <SelectItem value="month">{isRu ? 'За месяц' : 'Per month'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button 
              onClick={handlePublish}
              disabled={!publishData.price || publishToMarketplace.isPending}
            >
              {publishToMarketplace.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isRu ? 'Публикация...' : 'Publishing...'}
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  {isRu ? 'Опубликовать' : 'Publish'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
