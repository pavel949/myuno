import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PropertyListItem } from '@/components/property/PropertyListItem';
import { Home, Plus, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function OwnerProperties() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
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
            <PropertyListItem
              key={property.id}
              property={property}
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
