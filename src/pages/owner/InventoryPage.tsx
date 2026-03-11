import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyProperties } from '@/hooks/useMyProperties';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Package, AlertTriangle, Search, Camera, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import InspectionChecklist from '@/components/owner/inventory/InspectionChecklist';
import { useNavigate, useParams } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';

const CATEGORIES = [
  { value: 'consumable', en: 'Consumable', ru: 'Расходник' },
  { value: 'furniture', en: 'Furniture', ru: 'Мебель' },
  { value: 'electronics', en: 'Electronics', ru: 'Электроника' },
  { value: 'linens', en: 'Linens', ru: 'Текстиль' },
  { value: 'kitchen', en: 'Kitchen', ru: 'Кухня' },
  { value: 'cleaning', en: 'Cleaning', ru: 'Уборка' },
  { value: 'other', en: 'Other', ru: 'Другое' },
];

export default function InventoryPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: routePropertyId } = useParams();
  const isRu = language === 'ru';
  const queryClient = useQueryClient();
  const { activeProperties, isLoading: propsLoading } = useMyProperties();
  const allProperties = activeProperties || [];

  const [search, setSearch] = useState('');
  const [filterLow, setFilterLow] = useState(false);
  const [filterPropertyId, setFilterPropertyId] = useState<string>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('items');

  // Form state
  const [name, setName] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [category, setCategory] = useState('consumable');
  const [quantity, setQuantity] = useState(0);
  const [minQuantity, setMinQuantity] = useState(0);
  const [reorderNote, setReorderNote] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (routePropertyId && filterPropertyId === 'all') {
      setFilterPropertyId(routePropertyId);
      return;
    }
    if (filterPropertyId === 'all' && allProperties.length === 1) {
      setFilterPropertyId(allProperties[0].property_id);
    }
  }, [allProperties, filterPropertyId, routePropertyId]);

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory-items', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_inventory_items')
        .select('*')
        .eq('owner_id', user!.id)
        .eq('is_active', true)
        .order('category', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addItem = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('property_inventory_items').insert({
        owner_id: user!.id,
        property_id: propertyId,
        name,
        name_ru: nameRu || null,
        category,
        quantity,
        min_quantity: minQuantity,
        reorder_note: reorderNote || null,
        condition: 'good',
        photos: photos.length > 0 ? photos : null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success(isRu ? 'Добавлено' : 'Item added');
      setSheetOpen(false);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateQty = useMutation({
    mutationFn: async ({ id, qty }: { id: string; qty: number }) => {
      const { error } = await supabase.from('property_inventory_items').update({ quantity: qty }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory-items'] }),
  });

  const resetForm = () => {
    setName(''); setNameRu(''); setQuantity(0); setMinQuantity(0);
    setReorderNote(''); setPropertyId(''); setPhotos([]);
  };

  const filtered = (items || []).filter(item => {
    const matchSearch = !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.name_ru || '').toLowerCase().includes(search.toLowerCase());
    const matchLow = !filterLow || (item.quantity <= (item.min_quantity || 0));
    const matchProperty = filterPropertyId === 'all' || item.property_id === filterPropertyId;
    return matchSearch && matchLow && matchProperty;
  });

  const lowStockCount = (items || []).filter(i => i.quantity <= (i.min_quantity || 0) && (i.min_quantity || 0) > 0).length;

  // Group by property
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, item) => {
    const key = item.property_id || 'unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const getPropertyName = (id: string) => {
    if (id === 'unassigned') return isRu ? 'Без объекта' : 'Unassigned';
    const p = allProperties.find(p => p.property_id === id);
    return p ? (isRu ? p.title_ru : p.title) : id.slice(0, 8);
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 max-w-[1536px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{isRu ? 'Инвентарь' : 'Inventory'}</h1>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />{isRu ? 'Добавить' : 'Add'}</Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{isRu ? 'Новый предмет' : 'New Item'}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>{isRu ? 'Объект' : 'Property'} *</Label>
                <Select value={propertyId} onValueChange={setPropertyId}>
                  <SelectTrigger><SelectValue placeholder={isRu ? 'Выберите объект' : 'Select property'} /></SelectTrigger>
                  <SelectContent>
                    {allProperties.map(p => (
                      <SelectItem key={p.property_id} value={p.property_id}>
                        {isRu ? p.title_ru : p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isRu ? 'Название (EN)' : 'Name (EN)'} *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <Label>{isRu ? 'Название (RU)' : 'Name (RU)'}</Label>
                <Input value={nameRu} onChange={e => setNameRu(e.target.value)} />
              </div>
              <div>
                <Label>{isRu ? 'Категория' : 'Category'}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{isRu ? c.ru : c.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isRu ? 'Количество' : 'Quantity'}</Label>
                  <Input type="number" min={0} value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
                </div>
                <div>
                  <Label>{isRu ? 'Мин. запас' : 'Min Stock'}</Label>
                  <Input type="number" min={0} value={minQuantity} onChange={e => setMinQuantity(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <Label>{isRu ? 'Заметка для заказа' : 'Reorder Note'}</Label>
                <Input value={reorderNote} onChange={e => setReorderNote(e.target.value)} placeholder={isRu ? 'Где купить, артикул...' : 'Where to buy, SKU...'} />
              </div>
              <div>
                <Label className="flex items-center gap-1.5 mb-2">
                  <Camera className="h-4 w-4" />
                  {isRu ? 'Фото предмета' : 'Item Photos'}
                </Label>
                <UnifiedMediaUploader
                  mode="gallery"
                  value={photos}
                  onChange={(v) => setPhotos(Array.isArray(v) ? v : [v])}
                  folder="inventory"
                  bucket="owner-vault"
                  maxItems={4}
                  enableCloudImport={false}
                  enableUrlImport={false}
                />
              </div>
              <Button className="w-full" onClick={() => addItem.mutate()} disabled={!name.trim() || !propertyId || addItem.isPending}>
                {isRu ? 'Добавить' : 'Add Item'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="items" className="flex-1">
            <Package className="h-3.5 w-3.5 mr-1" />
            {isRu ? 'Предметы' : 'Items'}
          </TabsTrigger>
          <TabsTrigger value="inspections" className="flex-1">
            <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
            {isRu ? 'Инспекции' : 'Inspections'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {allProperties.slice(0, 8).map((p) => {
              const isActive = filterPropertyId === p.property_id;
              return (
                <button
                  key={p.property_id}
                  onClick={() => setFilterPropertyId(isActive ? 'all' : p.property_id)}
                  className={`text-left p-3 rounded-xl border transition ${isActive ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/40'}`}
                >
                  <p className="text-xs text-muted-foreground">{isRu ? 'Объект' : 'Property'}</p>
                  <p className="text-sm font-medium truncate">{isRu ? p.title_ru : p.title}</p>
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="space-y-2 mb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={isRu ? 'Поиск...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Button variant={filterLow ? 'default' : 'outline'} size="sm" onClick={() => setFilterLow(!filterLow)} className="flex-shrink-0">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                {lowStockCount}
              </Button>
            </div>
            <Select value={filterPropertyId} onValueChange={setFilterPropertyId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={isRu ? 'Все объекты' : 'All properties'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRu ? 'Все объекты' : 'All properties'}</SelectItem>
                {allProperties.map(p => (
                  <SelectItem key={p.property_id} value={p.property_id}>
                    {isRu ? p.title_ru : p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filterPropertyId !== 'all' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`${APP_ROUTES.MC_PROPERTIES}/${filterPropertyId}/manage`)}
              >
                {isRu ? 'Открыть карточку объекта' : 'Open property operations'}
              </Button>
            )}
          </div>

          {isLoading || propsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : !filtered.length ? (
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">{isRu ? 'Нет предметов' : 'No items'}</p>
            </Card>
          ) : (
            <div className="space-y-5">
              {Object.entries(grouped).map(([propId, propItems]) => (
                <div key={propId}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    🏠 {getPropertyName(propId)}
                    <Badge variant="secondary" className="text-[10px] ml-1">{propItems.length}</Badge>
                  </h3>
                  <div className="space-y-2">
                    {propItems.map(item => {
                      const isLow = (item.min_quantity || 0) > 0 && item.quantity <= (item.min_quantity || 0);
                      const itemPhotos = item.photos as string[] | null;
                      return (
                        <Card key={item.id} className={`p-3 flex items-center gap-3 ${isLow ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                          {itemPhotos && itemPhotos[0] && (
                            <img src={itemPhotos[0]} alt="" className="h-10 w-10 rounded-md object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">{isRu && item.name_ru ? item.name_ru : item.name}</p>
                              {isLow && <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                              {isLow && <span className="text-destructive font-medium">{isRu ? 'Закупить!' : 'Reorder!'}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty.mutate({ id: item.id, qty: Math.max(0, (item.quantity ?? 0) - 1) })}>-</Button>
                            <span className="w-8 text-center text-sm font-bold">{item.quantity ?? 0}</span>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty.mutate({ id: item.id, qty: (item.quantity ?? 0) + 1 })}>+</Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inspections">
          <InspectionChecklist />
        </TabsContent>
      </Tabs>
    </div>
  );
}
