import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, Plus, MapPin, Check, X, Calendar, 
  Edit2, Trash2, ChevronRight, Loader2, ArrowLeft 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCities, City } from '@/hooks/useCities';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { cn } from '@/lib/utils';

interface CityFormData {
  slug: string;
  name_en: string;
  name_ru: string;
  name_th: string;
  country_code: string;
  country_en: string;
  country_ru: string;
  flag: string;
  lat: string;
  lng: string;
  timezone: string;
  default_currency: string;
  is_active: boolean;
  is_coming_soon: boolean;
  launch_date: string;
}

const initialFormData: CityFormData = {
  slug: '',
  name_en: '',
  name_ru: '',
  name_th: '',
  country_code: '',
  country_en: '',
  country_ru: '',
  flag: '',
  lat: '',
  lng: '',
  timezone: 'Asia/Bangkok',
  default_currency: 'THB',
  is_active: false,
  is_coming_soon: true,
  launch_date: '',
};

export default function AdminCities() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { cities, isLoading, refetch } = useCities();
  const isRu = language === 'ru';

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [cityToDelete, setCityToDelete] = useState<City | null>(null);
  const [formData, setFormData] = useState<CityFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreate = () => {
    setEditingCity(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (city: City) => {
    setEditingCity(city);
    setFormData({
      slug: city.slug,
      name_en: city.name_en,
      name_ru: city.name_ru || '',
      name_th: city.name_th || '',
      country_code: city.country_code,
      country_en: city.country_en,
      country_ru: city.country_ru || '',
      flag: city.flag,
      lat: String(city.lat),
      lng: String(city.lng),
      timezone: city.timezone,
      default_currency: city.default_currency,
      is_active: city.is_active,
      is_coming_soon: city.is_coming_soon,
      launch_date: city.launch_date || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.slug || !formData.name_en || !formData.country_code || !formData.flag) {
      toast.error(isRu ? 'Заполните обязательные поля' : 'Fill in required fields');
      return;
    }

    setIsSaving(true);
    
    try {
      const cityData = {
        slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
        name_en: formData.name_en,
        name_ru: formData.name_ru || null,
        name_th: formData.name_th || null,
        country_code: formData.country_code.toUpperCase(),
        country_en: formData.country_en,
        country_ru: formData.country_ru || null,
        flag: formData.flag,
        lat: parseFloat(formData.lat) || 0,
        lng: parseFloat(formData.lng) || 0,
        timezone: formData.timezone,
        default_currency: formData.default_currency,
        is_active: formData.is_active,
        is_coming_soon: formData.is_coming_soon,
        launch_date: formData.launch_date || null,
      };

      if (editingCity) {
        const { error } = await supabase
          .from('cities')
          .update(cityData)
          .eq('id', editingCity.id);

        if (error) throw error;
        toast.success(isRu ? 'Город обновлён' : 'City updated');
      } else {
        const { error } = await supabase
          .from('cities')
          .insert([cityData]);

        if (error) throw error;
        toast.success(isRu ? 'Город добавлен' : 'City added');
      }

      setIsDialogOpen(false);
      refetch();
    } catch (error: any) {
      console.error('Error saving city:', error);
      toast.error(error.message || (isRu ? 'Ошибка сохранения' : 'Error saving'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (city: City) => {
    setCityToDelete(city);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!cityToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('cities')
        .delete()
        .eq('id', cityToDelete.id);

      if (error) throw error;
      
      toast.success(isRu ? 'Город удалён' : 'City deleted');
      setIsDeleteDialogOpen(false);
      setCityToDelete(null);
      refetch();
    } catch (error: any) {
      console.error('Error deleting city:', error);
      toast.error(error.message || (isRu ? 'Ошибка удаления' : 'Error deleting'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (city: City) => {
    try {
      const { error } = await supabase
        .from('cities')
        .update({ 
          is_active: !city.is_active,
          is_coming_soon: city.is_active ? true : false // If deactivating, set to coming soon
        })
        .eq('id', city.id);

      if (error) throw error;
      
      toast.success(
        city.is_active 
          ? (isRu ? 'Город деактивирован' : 'City deactivated')
          : (isRu ? 'Город активирован' : 'City activated')
      );
      refetch();
    } catch (error: any) {
      console.error('Error toggling city:', error);
      toast.error(error.message || (isRu ? 'Ошибка' : 'Error'));
    }
  };

  const getStatusBadge = (city: City) => {
    if (city.is_active && !city.is_coming_soon) {
      return <Badge className="bg-emerald-500">{isRu ? 'Активен' : 'Active'}</Badge>;
    }
    if (city.is_coming_soon) {
      return <Badge variant="secondary">{isRu ? 'Скоро' : 'Coming Soon'}</Badge>;
    }
    return <Badge variant="outline">{isRu ? 'Неактивен' : 'Inactive'}</Badge>;
  };

  return (
    <AppLayout showFooter={false}>
      <div className="container max-w-4xl mx-auto px-4 py-6 pb-24">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isRu ? 'Назад' : 'Back'}
        </Button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{isRu ? 'Управление городами' : 'City Management'}</h1>
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Добавляйте и управляйте городами' : 'Add and manage cities'}
            </p>
          </div>
        </div>

      <div className="flex justify-end mb-4">
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          {isRu ? 'Добавить город' : 'Add City'}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {cities.map(city => (
            <Card 
              key={city.id}
              className={cn(
                "transition-all",
                city.is_active && !city.is_coming_soon && "border-emerald-500/50"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Flag & Name */}
                  <div className="text-3xl">{city.flag}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{city.name_en}</h3>
                      {city.name_ru && (
                        <span className="text-sm text-muted-foreground">
                          ({city.name_ru})
                        </span>
                      )}
                      {getStatusBadge(city)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {city.country_en} · {city.default_currency} · {city.timezone}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={city.is_active && !city.is_coming_soon}
                      onCheckedChange={() => handleToggleActive(city)}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleOpenEdit(city)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteClick(city)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Coordinates */}
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {city.lat}, {city.lng}
                  </span>
                  {city.launch_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {isRu ? 'Запуск:' : 'Launch:'} {city.launch_date}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {cities.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{isRu ? 'Нет городов' : 'No cities'}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={handleOpenCreate}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isRu ? 'Добавить первый город' : 'Add first city'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCity 
                ? (isRu ? 'Редактировать город' : 'Edit City')
                : (isRu ? 'Добавить город' : 'Add City')
              }
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{isRu ? 'Slug *' : 'Slug *'}</Label>
                <Input
                  value={formData.slug}
                  onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="dubai"
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Флаг (эмодзи) *' : 'Flag (emoji) *'}</Label>
                <Input
                  value={formData.flag}
                  onChange={e => setFormData(prev => ({ ...prev, flag: e.target.value }))}
                  placeholder="🇦🇪"
                />
              </div>
            </div>

            {/* Names */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>{isRu ? 'Имя EN *' : 'Name EN *'}</Label>
                <Input
                  value={formData.name_en}
                  onChange={e => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                  placeholder="Dubai"
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Имя RU' : 'Name RU'}</Label>
                <Input
                  value={formData.name_ru}
                  onChange={e => setFormData(prev => ({ ...prev, name_ru: e.target.value }))}
                  placeholder="Дубай"
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Имя TH' : 'Name TH'}</Label>
                <Input
                  value={formData.name_th}
                  onChange={e => setFormData(prev => ({ ...prev, name_th: e.target.value }))}
                  placeholder="ดูไบ"
                />
              </div>
            </div>

            {/* Country */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>{isRu ? 'Код страны *' : 'Country Code *'}</Label>
                <Input
                  value={formData.country_code}
                  onChange={e => setFormData(prev => ({ ...prev, country_code: e.target.value }))}
                  placeholder="AE"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Страна EN' : 'Country EN'}</Label>
                <Input
                  value={formData.country_en}
                  onChange={e => setFormData(prev => ({ ...prev, country_en: e.target.value }))}
                  placeholder="UAE"
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Страна RU' : 'Country RU'}</Label>
                <Input
                  value={formData.country_ru}
                  onChange={e => setFormData(prev => ({ ...prev, country_ru: e.target.value }))}
                  placeholder="ОАЭ"
                />
              </div>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{isRu ? 'Широта *' : 'Latitude *'}</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={e => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                  placeholder="25.2048"
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Долгота *' : 'Longitude *'}</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.lng}
                  onChange={e => setFormData(prev => ({ ...prev, lng: e.target.value }))}
                  placeholder="55.2708"
                />
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{isRu ? 'Часовой пояс' : 'Timezone'}</Label>
                <Input
                  value={formData.timezone}
                  onChange={e => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                  placeholder="Asia/Dubai"
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Валюта' : 'Currency'}</Label>
                <Input
                  value={formData.default_currency}
                  onChange={e => setFormData(prev => ({ ...prev, default_currency: e.target.value }))}
                  placeholder="AED"
                  maxLength={3}
                />
              </div>
            </div>

            {/* Launch Date */}
            <div className="space-y-2">
              <Label>{isRu ? 'Дата запуска' : 'Launch Date'}</Label>
              <Input
                type="date"
                value={formData.launch_date}
                onChange={e => setFormData(prev => ({ ...prev, launch_date: e.target.value }))}
              />
            </div>

            {/* Status */}
            <div className="flex items-center justify-between gap-4 p-3 border rounded-lg">
              <div>
                <p className="font-medium">{isRu ? 'Активен' : 'Active'}</p>
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Город доступен для пользователей' : 'City is available to users'}
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={checked => setFormData(prev => ({ 
                  ...prev, 
                  is_active: checked,
                  is_coming_soon: checked ? false : prev.is_coming_soon
                }))}
              />
            </div>

            <div className="flex items-center justify-between gap-4 p-3 border rounded-lg">
              <div>
                <p className="font-medium">{isRu ? 'Скоро' : 'Coming Soon'}</p>
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Показывать как "Скоро"' : 'Show as "Coming Soon"'}
                </p>
              </div>
              <Switch
                checked={formData.is_coming_soon}
                onCheckedChange={checked => setFormData(prev => ({ 
                  ...prev, 
                  is_coming_soon: checked,
                  is_active: checked ? false : prev.is_active
                }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isRu ? 'Сохранение...' : 'Saving...'}
                </>
              ) : (
                isRu ? 'Сохранить' : 'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRu ? 'Удалить город?' : 'Delete city?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRu 
                ? `Вы уверены, что хотите удалить "${cityToDelete?.name_en}"? Это действие нельзя отменить.`
                : `Are you sure you want to delete "${cityToDelete?.name_en}"? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                isRu ? 'Удалить' : 'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AppLayout>
  );
}
