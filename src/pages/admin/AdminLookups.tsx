import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, Edit2, Trash2, GripVertical, MapPin, UtensilsCrossed, 
  Palmtree, Home, Sailboat, Calendar, Settings, PawPrint, Car,
  Dumbbell, Sparkles, Stethoscope, Wrench, CircleParking, Waves,
  TreePine, FileX, ScrollText, Users, Sofa, Eye
} from 'lucide-react';
import { useLookupValues, LookupValue, LookupType, LOOKUP_TYPE_LABELS } from '@/hooks/useLookupValues';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { toast } from 'sonner';

const LOOKUP_TYPE_ICONS: Record<LookupType, React.ComponentType<{ className?: string }>> = {
  district: MapPin,
  cuisine: UtensilsCrossed,
  tour_type: Palmtree,
  amenity: Settings,
  property_type: Home,
  yacht_type: Sailboat,
  event_category: Calendar,
  service_type: Wrench,
  pet_type: PawPrint,
  vehicle_type: Car,
  gym_type: Dumbbell,
  salon_type: Sparkles,
  clinic_specialty: Stethoscope,
  parking_type: CircleParking,
  pool_type: Waves,
  garden_type: TreePine,
  cancellation_policy: FileX,
  ownership_form: ScrollText,
  management_type: Users,
  equipment: Sofa,
  view_type: Eye,
  furnishing_level: Sofa,
};

const AVAILABLE_TYPES: LookupType[] = [
  'district',
  'cuisine',
  'tour_type',
  'amenity',
  'property_type',
  'yacht_type',
  'event_category',
  'service_type',
  'pet_type',
  'vehicle_type',
  'gym_type',
  'salon_type',
  'clinic_specialty',
  'parking_type',
  'pool_type',
  'garden_type',
  'cancellation_policy',
  'ownership_form',
  'management_type',
  'equipment',
  'view_type',
  'furnishing_level',
];

export default function AdminLookups() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  
  const [selectedType, setSelectedType] = useState<LookupType>('district');
  const { values, isLoading, createValue, updateValue, deleteValue } = useLookupValues(selectedType);
  const { translate, isTranslating } = useAutoTranslate();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupValue | null>(null);
  const [formData, setFormData] = useState({
    value_key: '',
    value_en: '',
    value_ru: '',
    icon: '',
    color: '',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      value_key: '',
      value_en: '',
      value_ru: '',
      icon: '',
      color: '',
      is_active: true,
    });
    setEditingItem(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: LookupValue) => {
    setEditingItem(item);
    setFormData({
      value_key: item.value_key,
      value_en: item.value_en,
      value_ru: item.value_ru || '',
      icon: item.icon || '',
      color: item.color || '',
      is_active: item.is_active,
    });
    setIsDialogOpen(true);
  };

  const generateKey = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      value_en: value,
      value_key: prev.value_key || generateKey(value),
    }));
  };

  const handleAutoTranslate = async () => {
    if (!formData.value_en) {
      toast.info(isRussian ? 'Введите английское название' : 'Enter English name first');
      return;
    }
    
    const translated = await translate(formData.value_en, 'ru');
    if (translated && typeof translated === 'string') {
      setFormData(prev => ({ ...prev, value_ru: translated as string }));
      toast.success(isRussian ? 'Переведено!' : 'Translated!');
    }
  };

  const handleSubmit = async () => {
    if (!formData.value_key || !formData.value_en) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Fill in required fields');
      return;
    }

    const payload = {
      lookup_type: selectedType,
      value_key: formData.value_key,
      value_en: formData.value_en,
      value_ru: formData.value_ru || null,
      icon: formData.icon || null,
      color: formData.color || null,
      parent_id: null,
      is_active: formData.is_active,
      sort_order: editingItem?.sort_order || values.length + 1,
      metadata: {},
    };

    if (editingItem) {
      await updateValue(editingItem.id, payload);
    } else {
      await createValue(payload);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (item: LookupValue) => {
    if (confirm(isRussian ? `Удалить "${item.value_ru || item.value_en}"?` : `Delete "${item.value_en}"?`)) {
      await deleteValue(item.id);
    }
  };

  const TypeIcon = LOOKUP_TYPE_ICONS[selectedType];

  return (
    <PageContainer>
      <div className="space-y-6 pb-20">
        <div className="flex items-center gap-4">
          <BackButton fallbackPath="/admin" />
          <div>
            <h1 className="text-2xl font-bold">
              {isRussian ? 'Справочники' : 'Lookup Tables'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isRussian 
                ? 'Управление районами, типами кухни, удобствами и др.' 
                : 'Manage districts, cuisines, amenities and more'}
            </p>
          </div>
        </div>

        {/* Type Selector Tabs */}
        <div className="overflow-x-auto pb-2 touch-pan-y">
          <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as LookupType)}>
            <TabsList className="inline-flex h-auto flex-wrap gap-1 bg-transparent p-0">
              {AVAILABLE_TYPES.map((type) => {
                const Icon = LOOKUP_TYPE_ICONS[type];
                const label = LOOKUP_TYPE_LABELS[type];
                return (
                  <TabsTrigger
                    key={type}
                    value={type}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-1.5 text-sm"
                  >
                    <Icon className="h-4 w-4 mr-1.5" />
                    {isRussian ? label.ru : label.en}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Values List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TypeIcon className="h-5 w-5" />
              {isRussian 
                ? LOOKUP_TYPE_LABELS[selectedType].ru 
                : LOOKUP_TYPE_LABELS[selectedType].en}
              <Badge variant="secondary">{values.length}</Badge>
            </CardTitle>
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {isRussian ? 'Добавить' : 'Add'}
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : values.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {isRussian ? 'Нет значений' : 'No values yet'}
              </div>
            ) : (
              <div className="space-y-2">
                {values.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-none border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {isRussian ? (item.value_ru || item.value_en) : item.value_en}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <code className="bg-muted px-1 rounded-none">{item.value_key}</code>
                        {item.value_ru && !isRussian && (
                          <span>• {item.value_ru}</span>
                        )}
                        {item.value_en && isRussian && (
                          <span>• {item.value_en}</span>
                        )}
                      </div>
                    </div>

                    {!item.is_active && (
                      <Badge variant="secondary" className="text-xs">
                        {isRussian ? 'Неактивно' : 'Inactive'}
                      </Badge>
                    )}

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem 
                  ? (isRussian ? 'Редактировать значение' : 'Edit Value')
                  : (isRussian ? 'Добавить значение' : 'Add Value')}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{isRussian ? 'Название (EN)' : 'Name (EN)'} *</Label>
                <Input
                  value={formData.value_en}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Patong Beach"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{isRussian ? 'Название (RU)' : 'Name (RU)'}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAutoTranslate}
                    disabled={isTranslating || !formData.value_en}
                  >
                    {isTranslating ? '...' : '🔄 Auto'}
                  </Button>
                </div>
                <Input
                  value={formData.value_ru}
                  onChange={(e) => setFormData(prev => ({ ...prev, value_ru: e.target.value }))}
                  placeholder="напр. Пляж Патонг"
                />
              </div>

              <div className="space-y-2">
                <Label>{isRussian ? 'Ключ (slug)' : 'Key (slug)'} *</Label>
                <Input
                  value={formData.value_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, value_key: e.target.value }))}
                  placeholder="patong-beach"
                />
                <p className="text-xs text-muted-foreground">
                  {isRussian 
                    ? 'Используется в коде и URL. Только латиница, цифры и дефисы.' 
                    : 'Used in code and URLs. Only letters, numbers and hyphens.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRussian ? 'Иконка' : 'Icon'}</Label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="map-pin"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRussian ? 'Цвет' : 'Color'}</Label>
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>{isRussian ? 'Активно' : 'Active'}</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button onClick={handleSubmit}>
                {editingItem 
                  ? (isRussian ? 'Сохранить' : 'Save')
                  : (isRussian ? 'Создать' : 'Create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}
