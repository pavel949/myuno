import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserContext } from '@/hooks/useUserContext';
import { supabase } from '@/integrations/supabase/client';
import { VendorLayout } from '@/components/vendor/VendorLayout';

interface VendorLocation {
  id: string;
  org_id: string;
  name: string;
  name_ru?: string;
  description?: string;
  description_ru?: string;
  phone?: string;
  email?: string;
  address: string;
  address_ru?: string;
  district?: string;
  city_id?: string;
  lat?: number;
  lng?: number;
  cover_image?: string;
  images?: string[];
  working_hours?: Record<string, { open: string; close: string; closed?: boolean }>;
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected' | 'info_requested';
  rejection_reason?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

interface LocationFormData {
  name: string;
  name_ru?: string;
  description?: string;
  description_ru?: string;
  phone?: string;
  email?: string;
  address: string;
  address_ru?: string;
  district?: string;
  city_id?: string;
  lat?: number;
  lng?: number;
  cover_image?: string;
  images?: string[];
  working_hours?: Record<string, { open: string; close: string; closed?: boolean }>;
}

function useVendorLocations() {
  const { user } = useAuth();
  const { activeOrgId } = useUserContext();
  const [locations, setLocations] = useState<VendorLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLocations = useCallback(async () => {
    if (!activeOrgId) {
      setLocations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendor_locations')
        .select('*')
        .eq('org_id', activeOrgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocations((data as VendorLocation[]) || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const createLocation = async (formData: LocationFormData) => {
    if (!activeOrgId) {
      return { data: null, error: new Error('No active organization') };
    }

    try {
      const { data, error } = await supabase
        .from('vendor_locations')
        .insert({
          org_id: activeOrgId,
          ...formData,
          is_active: true,
          approval_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      await fetchLocations();
      return { data: data as VendorLocation, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const updateLocation = async (id: string, formData: Partial<LocationFormData>) => {
    try {
      const { data, error } = await supabase
        .from('vendor_locations')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchLocations();
      return { data: data as VendorLocation, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vendor_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchLocations();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const submitForModeration = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vendor_locations')
        .update({
          approval_status: 'pending',
          rejection_reason: null,
        })
        .eq('id', id);

      if (error) throw error;

      await fetchLocations();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  // Get location services
  const getLocationServices = async (locationId: string) => {
    try {
      const { data, error } = await supabase
        .from('vendor_location_services')
        .select(`
          *,
          service:services(*)
        `)
        .eq('location_id', locationId);

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  // Add services to location
  const addServicesToLocation = async (locationId: string, serviceIds: string[]) => {
    try {
      const inserts = serviceIds.map(serviceId => ({
        location_id: locationId,
        service_id: serviceId,
        is_active: true,
      }));

      const { error } = await supabase
        .from('vendor_location_services')
        .upsert(inserts, { onConflict: 'location_id,service_id' });

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  // Remove service from location
  const removeServiceFromLocation = async (locationId: string, serviceId: string) => {
    try {
      const { error } = await supabase
        .from('vendor_location_services')
        .delete()
        .eq('location_id', locationId)
        .eq('service_id', serviceId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return {
    locations,
    isLoading,
    error,
    refetch: fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation,
    submitForModeration,
    getLocationServices,
    addServicesToLocation,
    removeServiceFromLocation,
  };
}
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Clock,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Send,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const VendorLocations = () => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { locations, isLoading, createLocation, updateLocation, deleteLocation, submitForModeration } = useVendorLocations();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    name_ru: '',
    description: '',
    description_ru: '',
    address: '',
    address_ru: '',
    phone: '',
    email: '',
    district: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      name_ru: '',
      description: '',
      description_ru: '',
      address: '',
      address_ru: '',
      phone: '',
      email: '',
      district: '',
    });
    setEditingLocation(null);
  };

  const handleOpenDialog = (location?: typeof locations[0]) => {
    if (location) {
      setEditingLocation(location.id);
      setFormData({
        name: location.name,
        name_ru: location.name_ru || '',
        description: location.description || '',
        description_ru: location.description_ru || '',
        address: location.address,
        address_ru: location.address_ru || '',
        phone: location.phone || '',
        email: location.email || '',
        district: location.district || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address) {
      toast.error(isRu ? 'Заполните название и адрес' : 'Fill in name and address');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingLocation) {
        const { error } = await updateLocation(editingLocation, formData);
        if (error) throw error;
        toast.success(isRu ? 'Локация обновлена' : 'Location updated');
      } else {
        const { error } = await createLocation(formData);
        if (error) throw error;
        toast.success(isRu ? 'Локация добавлена и отправлена на модерацию' : 'Location added and submitted for moderation');
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error(isRu ? 'Ошибка сохранения' : 'Error saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteLocation(id);
    if (error) {
      toast.error(isRu ? 'Ошибка удаления' : 'Error deleting');
    } else {
      toast.success(isRu ? 'Локация удалена' : 'Location deleted');
    }
  };

  const handleResubmit = async (id: string) => {
    const { error } = await submitForModeration(id);
    if (error) {
      toast.error(isRu ? 'Ошибка отправки' : 'Error submitting');
    } else {
      toast.success(isRu ? 'Отправлено на модерацию' : 'Submitted for moderation');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-success/20 text-success border-success/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {isRu ? 'Одобрено' : 'Approved'}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30">
            <XCircle className="h-3 w-3 mr-1" />
            {isRu ? 'Отклонено' : 'Rejected'}
          </Badge>
        );
      case 'info_requested':
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            {isRu ? 'Запрос информации' : 'Info Requested'}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-info/20 text-info border-info/30">
            <Clock className="h-3 w-3 mr-1" />
            {isRu ? 'На модерации' : 'Pending'}
          </Badge>
        );
    }
  };

  return (
    <VendorLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Локации' : 'Locations'}
          showBack
        />

        {/* Add Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full mb-4" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              {isRu ? 'Добавить локацию' : 'Add Location'}
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLocation 
                  ? (isRu ? 'Редактировать локацию' : 'Edit Location')
                  : (isRu ? 'Новая локация' : 'New Location')
                }
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{isRu ? 'Название (EN) *' : 'Name (EN) *'}</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Main Office"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Название (RU)' : 'Name (RU)'}</Label>
                  <Input
                    value={formData.name_ru}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_ru: e.target.value }))}
                    placeholder="Главный офис"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{isRu ? 'Адрес (EN) *' : 'Address (EN) *'}</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Адрес (RU)' : 'Address (RU)'}</Label>
                  <Input
                    value={formData.address_ru}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_ru: e.target.value }))}
                    placeholder="ул. Главная, 123"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Район' : 'District'}</Label>
                <Input
                  value={formData.district}
                  onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                  placeholder={isRu ? 'Центр' : 'Downtown'}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{isRu ? 'Телефон' : 'Phone'}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+7 999 123-45-67"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="location@example.com"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Описание (EN)' : 'Description (EN)'}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={isRu ? 'Опишите локацию...' : 'Describe the location...'}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>{isRu ? 'Описание (RU)' : 'Description (RU)'}</Label>
                <Textarea
                  value={formData.description_ru}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))}
                  placeholder={isRu ? 'Описание на русском...' : 'Russian description...'}
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingLocation 
                  ? (isRu ? 'Сохранить' : 'Save')
                  : (isRu ? 'Добавить и отправить на модерацию' : 'Add & Submit for Moderation')
                }
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && locations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">
                {isRu ? 'Нет локаций' : 'No Locations'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isRu 
                  ? 'Добавьте первую локацию вашего бизнеса'
                  : 'Add your first business location'
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Locations List */}
        <div className="space-y-3">
          {locations.map((location) => (
            <Card key={location.id} className={cn(
              "transition-all",
              location.approval_status === 'rejected' && "border-destructive/30",
              location.approval_status === 'info_requested' && "border-warning/30"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="font-semibold truncate">
                        {isRu && location.name_ru ? location.name_ru : location.name}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {isRu && location.address_ru ? location.address_ru : location.address}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(location.approval_status)}
                      {location.district && (
                        <Badge variant="outline" className="text-xs">
                          {location.district}
                        </Badge>
                      )}
                    </div>

                    {/* Rejection reason */}
                    {location.rejection_reason && (
                      <div className="mt-2 p-2 rounded bg-destructive/10 text-destructive text-xs">
                        {location.rejection_reason}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {(location.approval_status === 'rejected' || location.approval_status === 'info_requested') && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleResubmit(location.id)}
                        title={isRu ? 'Отправить повторно' : 'Resubmit'}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleOpenDialog(location)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {isRu ? 'Удалить локацию?' : 'Delete Location?'}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {isRu 
                              ? 'Это действие нельзя отменить. Все привязанные услуги будут отвязаны.'
                              : 'This action cannot be undone. All linked services will be unlinked.'
                            }
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(location.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {isRu ? 'Удалить' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    </VendorLayout>
  );
};

export default VendorLocations;
