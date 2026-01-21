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
import { Plus, Pencil, Trash2, Baby } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminBabysitters } from '@/hooks/useAdminContent';
import { ProviderSelector } from '@/components/admin/ProviderSelector';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { toast } from 'sonner';

interface BabysitterFormData {
  name_en: string;
  name_ru: string;
  bio_en: string;
  bio_ru: string;
  age_groups: string[];
  languages: string[];
  certifications: string[];
  experience_years: number | null;
  price_per_hour: number | null;
  price_per_day: number | null;
  currency: string;
  photo: string;
  images: string[];
  can_cook: boolean;
  can_drive: boolean;
  first_aid_certified: boolean;
  background_checked: boolean;
  is_active: boolean;
  is_featured: boolean;
  provider_id: string;
}

const defaultFormData: BabysitterFormData = {
  name_en: '',
  name_ru: '',
  bio_en: '',
  bio_ru: '',
  age_groups: [],
  languages: ['English'],
  certifications: [],
  experience_years: null,
  price_per_hour: null,
  price_per_day: null,
  currency: 'THB',
  photo: '',
  images: [],
  can_cook: false,
  can_drive: false,
  first_aid_certified: false,
  background_checked: false,
  is_active: true,
  is_featured: false,
  provider_id: '',
};

export default function AdminBabysitters() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { items, isLoading, createItem, updateItem, deleteItem } = useAdminBabysitters();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<BabysitterFormData>(defaultFormData);

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
      bio_en: item.bio_en || '',
      bio_ru: item.bio_ru || '',
      age_groups: item.age_groups || [],
      languages: item.languages || ['English'],
      certifications: item.certifications || [],
      experience_years: item.experience_years,
      price_per_hour: item.price_per_hour,
      price_per_day: item.price_per_day,
      currency: item.currency || 'THB',
      photo: item.photo || '',
      images: item.images || [],
      can_cook: item.can_cook || false,
      can_drive: item.can_drive || false,
      first_aid_certified: item.first_aid_certified || false,
      background_checked: item.background_checked || false,
      is_active: item.is_active ?? true,
      is_featured: item.is_featured || false,
      provider_id: item.provider_id || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name_en || !formData.name_ru) {
      toast.error(isRussian ? 'Заполните имена' : 'Fill in names');
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
        title={isRussian ? 'Няни' : 'Babysitters'} 
        showBack 
      />
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5" />
            {isRussian ? 'Няни' : 'Babysitters'}
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
                    <Label>Имя (RU)</Label>
                    <Input
                      value={formData.name_ru}
                      onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Bio (EN)</Label>
                    <Textarea
                      value={formData.bio_en}
                      onChange={(e) => setFormData({ ...formData, bio_en: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>О себе (RU)</Label>
                    <Textarea
                      value={formData.bio_ru}
                      onChange={(e) => setFormData({ ...formData, bio_ru: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isRussian ? 'Возрастные группы (через запятую)' : 'Age Groups (comma-separated)'}</Label>
                    <Input
                      value={formData.age_groups.join(', ')}
                      onChange={(e) => setFormData({ ...formData, age_groups: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      placeholder="0-1, 1-3, 3-6, 6-12"
                    />
                  </div>
                  <div>
                    <Label>{isRussian ? 'Языки (через запятую)' : 'Languages (comma-separated)'}</Label>
                    <Input
                      value={formData.languages.join(', ')}
                      onChange={(e) => setFormData({ ...formData, languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{isRussian ? 'Опыт (лет)' : 'Experience (years)'}</Label>
                    <Input
                      type="number"
                      value={formData.experience_years || ''}
                      onChange={(e) => setFormData({ ...formData, experience_years: e.target.value ? Number(e.target.value) : null })}
                    />
                  </div>
                  <div>
                    <Label>{isRussian ? 'Сертификаты (через запятую)' : 'Certifications (comma-separated)'}</Label>
                    <Input
                      value={formData.certifications.join(', ')}
                      onChange={(e) => setFormData({ ...formData, certifications: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
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

                <div>
                  <Label>{isRussian ? 'Фото профиля' : 'Profile Photo'}</Label>
                  <ImageUpload
                    value={formData.photo}
                    onChange={(url) => setFormData({ ...formData, photo: url })}
                  />
                </div>

                <div>
                  <Label>{isRussian ? 'Галерея (до 5 фото)' : 'Gallery (up to 5 photos)'}</Label>
                  <MultiImageUpload
                    value={formData.images}
                    onChange={(urls) => setFormData({ ...formData, images: urls })}
                    maxImages={5}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.can_cook}
                      onCheckedChange={(checked) => setFormData({ ...formData, can_cook: checked })}
                    />
                    <Label>{isRussian ? 'Готовит' : 'Can Cook'}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.can_drive}
                      onCheckedChange={(checked) => setFormData({ ...formData, can_drive: checked })}
                    />
                    <Label>{isRussian ? 'Водит авто' : 'Can Drive'}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.first_aid_certified}
                      onCheckedChange={(checked) => setFormData({ ...formData, first_aid_certified: checked })}
                    />
                    <Label>{isRussian ? 'Первая помощь' : 'First Aid'}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.background_checked}
                      onCheckedChange={(checked) => setFormData({ ...formData, background_checked: checked })}
                    />
                    <Label>{isRussian ? 'Проверена' : 'Background Check'}</Label>
                  </div>
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
                  <TableHead>{isRussian ? 'Имя' : 'Name'}</TableHead>
                  <TableHead>{isRussian ? 'Опыт' : 'Experience'}</TableHead>
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
                    <TableCell>
                      {item.experience_years ? `${item.experience_years} ${isRussian ? 'лет' : 'years'}` : '-'}
                    </TableCell>
                    <TableCell>
                      {item.price_per_hour ? `${item.price_per_hour} ${item.currency}/hr` : '-'}
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
