import React, { useState } from 'react';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, PawPrint } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminPets } from '@/hooks/useAdminContent';
import { ProviderSelector } from '@/components/admin/ProviderSelector';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { toast } from 'sonner';

interface PetServiceFormData {
  name_en: string;
  name_ru: string;
  description_en: string;
  description_ru: string;
  service_type: string;
  pet_types: string[];
  price_per_hour: number | null;
  price_per_day: number | null;
  currency: string;
  address: string;
  district: string;
  phone: string;
  email: string;
  cover_image: string;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  provider_id: string;
}

const defaultFormData: PetServiceFormData = {
  name_en: '',
  name_ru: '',
  description_en: '',
  description_ru: '',
  service_type: 'grooming',
  pet_types: ['dogs', 'cats'],
  price_per_hour: null,
  price_per_day: null,
  currency: 'THB',
  address: '',
  district: '',
  phone: '',
  email: '',
  cover_image: '',
  images: [],
  is_active: true,
  is_featured: false,
  provider_id: '',
};

export default function AdminPets() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { items, isLoading, createItem, updateItem, deleteItem } = useAdminPets();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<PetServiceFormData>(defaultFormData);

  const handleCreate = () => {
    setEditingItem(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name_en: item.name_en || '',
      name_ru: item.name_ru || '',
      description_en: item.description_en || '',
      description_ru: item.description_ru || '',
      service_type: item.service_type || 'grooming',
      pet_types: item.pet_types || ['dogs', 'cats'],
      price_per_hour: item.price_per_hour,
      price_per_day: item.price_per_day,
      currency: item.currency || 'THB',
      address: item.address || '',
      district: item.district || '',
      phone: item.phone || '',
      email: item.email || '',
      cover_image: item.cover_image || '',
      images: item.images || [],
      is_active: item.is_active ?? true,
      is_featured: item.is_featured || false,
      provider_id: item.provider_id || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name_en || !formData.name_ru) {
      toast.error(isRussian ? 'Заполните названия' : 'Fill in names');
      return;
    }

    try {
      if (editingItem) {
        await updateItem({ id: editingItem.id, ...formData });
        toast.success(isRussian ? 'Обновлено' : 'Updated');
      } else {
        await createItem(formData);
        toast.success(isRussian ? 'Создано' : 'Created');
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(isRussian ? 'Ошибка сохранения' : 'Save error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(isRussian ? 'Удалить?' : 'Delete?')) {
      await deleteItem(id);
      toast.success(isRussian ? 'Удалено' : 'Deleted');
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title={isRussian ? 'Услуги для питомцев' : 'Pet Services'} 
        showBack 
      />
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PawPrint className="h-5 w-5" />
            {isRussian ? 'Услуги для питомцев' : 'Pet Services'}
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                {isRussian ? 'Добавить' : 'Add'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem 
                    ? (isRussian ? 'Редактировать' : 'Edit')
                    : (isRussian ? 'Добавить' : 'Add')
                  }
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <ProviderSelector
                  value={formData.provider_id}
                  onChange={(id) => setFormData({ ...formData, provider_id: id })}
                  label={isRussian ? 'Провайдер' : 'Provider'}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name (EN)</Label>
                    <Input
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Название (RU)</Label>
                    <Input
                      value={formData.name_ru}
                      onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Description (EN)</Label>
                    <Textarea
                      value={formData.description_en}
                      onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Описание (RU)</Label>
                    <Textarea
                      value={formData.description_ru}
                      onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isRussian ? 'Тип услуги' : 'Service Type'}</Label>
                    <Input
                      value={formData.service_type}
                      onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                      placeholder="grooming, sitting, walking, vet"
                    />
                  </div>
                  <div>
                    <Label>{isRussian ? 'Типы питомцев (через запятую)' : 'Pet Types (comma-separated)'}</Label>
                    <Input
                      value={formData.pet_types.join(', ')}
                      onChange={(e) => setFormData({ ...formData, pet_types: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>{isRussian ? 'Цена/час' : 'Price/hour'}</Label>
                    <Input
                      type="number"
                      value={formData.price_per_hour || ''}
                      onChange={(e) => setFormData({ ...formData, price_per_hour: e.target.value ? Number(e.target.value) : null })}
                    />
                  </div>
                  <div>
                    <Label>{isRussian ? 'Цена/день' : 'Price/day'}</Label>
                    <Input
                      type="number"
                      value={formData.price_per_day || ''}
                      onChange={(e) => setFormData({ ...formData, price_per_day: e.target.value ? Number(e.target.value) : null })}
                    />
                  </div>
                  <div>
                    <Label>{isRussian ? 'Валюта' : 'Currency'}</Label>
                    <Input
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isRussian ? 'Адрес' : 'Address'}</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{isRussian ? 'Район' : 'District'}</Label>
                    <Input
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isRussian ? 'Телефон' : 'Phone'}</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>{isRussian ? 'Обложка' : 'Cover Image'}</Label>
                  <ImageUpload
                    value={formData.cover_image}
                    onChange={(url) => setFormData({ ...formData, cover_image: url })}
                  />
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>{isRussian ? 'Активно' : 'Active'}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                    <Label>{isRussian ? 'Рекомендуем' : 'Featured'}</Label>
                  </div>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {isRussian ? 'Сохранить' : 'Save'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {isRussian ? 'Загрузка...' : 'Loading...'}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isRussian ? 'Нет данных' : 'No data'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRussian ? 'Название' : 'Name'}</TableHead>
                  <TableHead>{isRussian ? 'Тип' : 'Type'}</TableHead>
                  <TableHead>{isRussian ? 'Цена' : 'Price'}</TableHead>
                  <TableHead>{isRussian ? 'Статус' : 'Status'}</TableHead>
                  <TableHead className="text-right">{isRussian ? 'Действия' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {isRussian ? item.name_ru : item.name_en}
                    </TableCell>
                    <TableCell>{item.service_type}</TableCell>
                    <TableCell>
                      {item.price_per_hour ? `${item.price_per_hour} ${item.currency}/hr` : 
                       item.price_per_day ? `${item.price_per_day} ${item.currency}/day` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? 'default' : 'secondary'}>
                        {item.is_active 
                          ? (isRussian ? 'Активно' : 'Active')
                          : (isRussian ? 'Неактивно' : 'Inactive')
                        }
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
