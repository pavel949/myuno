import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Plus, MapPin, Bed, Bath, SquareStack, Globe, Copy, Clock, CheckCircle, XCircle, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye } from 'lucide-react';

export default function OwnerProperties() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const { data: properties, isLoading } = useOwnerProperties();

  const getApprovalBadge = (approvalStatus?: string, status?: string) => {
    // First check approval status
    if (approvalStatus === 'pending') {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300 gap-1">
          <Clock className="h-3 w-3" />
          {isRu ? 'На рассмотрении' : 'Under Review'}
        </Badge>
      );
    }
    if (approvalStatus === 'rejected') {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          {isRu ? 'Требует доработки' : 'Needs Revision'}
        </Badge>
      );
    }
    // If approved, show based on status
    if (approvalStatus === 'approved' || status === 'active') {
      return (
        <Badge className="bg-green-500 gap-1">
          <CheckCircle className="h-3 w-3" />
          {isRu ? 'Активен' : 'Active'}
        </Badge>
      );
    }
    return <Badge variant="outline">{isRu ? 'Неактивен' : 'Inactive'}</Badge>;
  };

  const isInProtectionPeriod = (instantBookingEnabledAt?: string | null) => {
    if (!instantBookingEnabledAt) return false;
    return new Date(instantBookingEnabledAt) > new Date();
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

  return (
    <PageContainer>
      <BackButton />
      <PageHeader 
        title={isRu ? 'Мои объекты' : 'My Properties'}
        subtitle={isRu ? 'Управление недвижимостью' : 'Property management'}
      />

      <Button 
        className="w-full mb-6"
        onClick={() => navigate('/owner/properties/new')}
      >
        <Plus className="h-4 w-4 mr-2" />
        {isRu ? 'Добавить объект' : 'Add Property'}
      </Button>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="w-24 h-24 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !properties?.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {isRu ? 'Нет объектов' : 'No Properties'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isRu 
                ? 'Добавьте вашу первую недвижимость для управления' 
                : 'Add your first property to manage'}
            </p>
            <Button onClick={() => navigate('/owner/properties/new')}>
              <Plus className="h-4 w-4 mr-2" />
              {isRu ? 'Добавить' : 'Add Property'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {properties.map((property) => (
            <Card 
              key={property.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardContent className="p-0">
                <div className="flex">
                  <div 
                    className="w-28 h-28 bg-muted flex-shrink-0 cursor-pointer"
                    onClick={() => navigate(`/owner/properties/${property.id}`)}
                  >
                    {property.cover_image ? (
                      <img 
                        src={property.cover_image} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div 
                    className="flex-1 p-4 cursor-pointer"
                    onClick={() => navigate(`/owner/properties/${property.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold line-clamp-1">
                        {isRu && property.title_ru ? property.title_ru : property.title}
                      </h3>
                      <div className="flex items-center gap-1">
                        {(property as any).instant_booking_enabled_at && 
                         isInProtectionPeriod((property as any).instant_booking_enabled_at) && (
                          <Badge variant="outline" className="text-xs gap-1 border-blue-300 text-blue-700">
                            <Shield className="h-3 w-3" />
                          </Badge>
                        )}
                        {property.marketplace_property_id && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Globe className="h-3 w-3" />
                          </Badge>
                        )}
                        {getApprovalBadge((property as any).approval_status, property.status)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">
                        {property.district || property.address}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">
                        {getPropertyTypeLabel(property.property_type)}
                      </span>
                      {property.bedrooms && (
                        <span className="flex items-center gap-1">
                          <Bed className="h-3 w-3" />
                          {property.bedrooms}
                        </span>
                      )}
                      {property.bathrooms && (
                        <span className="flex items-center gap-1">
                          <Bath className="h-3 w-3" />
                          {property.bathrooms}
                        </span>
                      )}
                      {property.area_sqm && (
                        <span className="flex items-center gap-1">
                          <SquareStack className="h-3 w-3" />
                          {property.area_sqm}м²
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions dropdown */}
                  <div className="p-2 flex items-start">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/owner/properties/${property.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          {isRu ? 'Открыть' : 'View'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/owner/properties/new?cloneFrom=${property.id}`)}>
                          <Copy className="h-4 w-4 mr-2" />
                          {isRu ? 'Создать на основе' : 'Duplicate'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
