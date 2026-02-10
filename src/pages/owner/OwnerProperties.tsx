import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { useUserRoles } from '@/hooks/useUserRoles';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PropertyCard, PropertyCardSkeleton } from '@/components/property/PropertyCard';
import { Home, Plus, Download, Building2, Users } from 'lucide-react';


export default function OwnerProperties() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { roles } = useUserRoles();
  
  const isPropertyManager = roles?.some(r => r.role === 'property_manager');
  const RoleIcon = isPropertyManager ? Users : Building2;
  const roleBadge = isPropertyManager 
    ? (isRu ? 'Управляющая компания' : 'Property Manager')
    : (isRu ? 'Собственник' : 'Owner');
  
  const { data: properties, isLoading } = useOwnerProperties();

  const handleView = (id: string) => {
    navigate(`/owner/properties/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/owner/properties/${id}/editor`);
  };

  const handleDuplicate = (id: string) => {
    navigate(`/owner/properties/new?cloneFrom=${id}`);
  };

  return (
    <PageContainer>
      <BackButton />
      <PageHeader 
        title={isRu ? 'Мои объекты' : 'My Properties'}
        subtitle={isRu ? 'Управление недвижимостью' : 'Property management'}
      />

      {/* Role badge */}
      <div className="flex items-center gap-2 mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/8 text-primary">
          <RoleIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{roleBadge}</span>
        </div>
      </div>
      {/* Action buttons */}
      <div className="flex gap-3 mb-6">
        <Button 
          className="flex-1"
          onClick={() => navigate('/owner/properties/new')}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Добавить объект' : 'Add Property'}
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate('/owner/properties/import')}
        >
          <Download className="h-4 w-4 mr-2" />
          {isRu ? 'Импорт с OTA' : 'Import from OTA'}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <PropertyCardSkeleton key={i} variant="list" />
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
            <PropertyCard
              key={property.id}
              property={property}
              variant="list"
              mode="owner"
              onView={handleView}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              showApprovalStatus
              showProtectionBadge
              showMarketplaceBadge
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
