import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useMyProperties } from '@/hooks/useMyProperties';
import { useUserRoles } from '@/hooks/useUserRoles';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PropertyCard, PropertyCardSkeleton } from '@/components/property/PropertyCard';
import { Home, Plus, Download, Building2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';


export default function OwnerProperties() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { roles } = useUserRoles();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  
  const isPropertyManager = roles?.some(r => r.role === 'property_manager');
  const RoleIcon = isPropertyManager ? Users : Building2;
  const roleBadge = isPropertyManager 
    ? (isRu ? 'Управляющая компания' : 'Property Manager')
    : (isRu ? 'Собственник' : 'Owner');
  
  const { allProperties, isLoading } = useMyProperties();

  const handleView = (id: string) => {
    navigate(`/owner/properties/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/owner/properties/${id}/editor`);
  };

  const handleDuplicate = (id: string) => {
    navigate(`/owner/properties/new?cloneFrom=${id}`);
  };

  const handleToggleActive = async (id: string, activate: boolean) => {
    const { error } = await supabase
      .from('properties')
      .update({ is_active: activate })
      .eq('id', id);

    if (error) {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    } else {
      toast({ title: activate ? (isRu ? 'Объект активирован' : 'Property activated') : (isRu ? 'Объект деактивирован' : 'Property deactivated') });
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      queryClient.invalidateQueries({ queryKey: ['assigned-properties'] });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', deleteTarget);

    if (error) {
      toast({ title: isRu ? 'Ошибка удаления' : 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: isRu ? 'Объект удалён' : 'Property deleted' });
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      queryClient.invalidateQueries({ queryKey: ['assigned-properties'] });
    }
    setDeleteTarget(null);
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
      ) : !allProperties?.length ? (
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
          {allProperties.map((property) => (
            <div key={property.id} className="relative">
              {property.source === 'managed' && (
                <Badge variant="secondary" className="absolute top-2 right-2 z-10 text-[10px]">
                  {isRu ? 'В управлении' : 'Managed'}
                </Badge>
              )}
              <PropertyCard
                property={property as any}
                variant="list"
                mode="owner"
                onView={() => handleView(property.property_id)}
                onEdit={() => handleEdit(property.property_id)}
                onDuplicate={() => handleDuplicate(property.property_id)}
                onToggleActive={(_, activate) => handleToggleActive(property.property_id, activate)}
                onDelete={() => setDeleteTarget(property.property_id)}
                showApprovalStatus
                showInstantBadge
                showProtectionBadge
                showMarketplaceBadge
              />
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRu ? 'Удалить объект?' : 'Delete property?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRu 
                ? 'Это действие необратимо. Все данные объекта, включая бронирования и финансовую историю, будут удалены.'
                : 'This action cannot be undone. All property data including bookings and financial history will be deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isRu ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
