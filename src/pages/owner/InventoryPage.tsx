import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Package, AlertTriangle, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function InventoryPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterLow, setFilterLow] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [category, setCategory] = useState('consumable');
  const [quantity, setQuantity] = useState(0);
  const [minQuantity, setMinQuantity] = useState(0);
  const [reorderNote, setReorderNote] = useState('');

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
        name,
        name_ru: nameRu || null,
        category,
        quantity,
        min_quantity: minQuantity,
        reorder_note: reorderNote || null,
        condition: 'good',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success(isRu ? 'Добавлено' : 'Item added');
      setSheetOpen(false);
      setName(''); setNameRu(''); setQuantity(0); setMinQuantity(0); setReorderNote('');
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

  const filtered = (items || []).filter(item => {
    const matchSearch = !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.name_ru || '').toLowerCase().includes(search.toLowerCase());
    const matchLow = !filterLow || (item.quantity <= (item.min_quantity || 0));
    return matchSearch && matchLow;
  });

  const lowStockCount = (items || []).filter(i => i.quantity <= (i.min_quantity || 0) && (i.min_quantity || 0) > 0).length;

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{isRu ? 'Инвентарь' : 'Inventory'}</h1>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />{isRu ? 'Добавить' : 'Add'}</Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{isRu ? 'Новый предмет' : 'New Item'}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
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
                    <SelectItem value="consumable">{isRu ? 'Расходник' : 'Consumable'}</SelectItem>
                    <SelectItem value="furniture">{isRu ? 'Мебель' : 'Furniture'}</SelectItem>
                    <SelectItem value="electronics">{isRu ? 'Электроника' : 'Electronics'}</SelectItem>
                    <SelectItem value="linens">{isRu ? 'Текстиль' : 'Linens'}</SelectItem>
                    <SelectItem value="kitchen">{isRu ? 'Кухня' : 'Kitchen'}</SelectItem>
                    <SelectItem value="cleaning">{isRu ? 'Уборка' : 'Cleaning'}</SelectItem>
                    <SelectItem value="other">{isRu ? 'Другое' : 'Other'}</SelectItem>
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
              <Button className="w-full" onClick={() => addItem.mutate()} disabled={!name.trim() || addItem.isPending}>
                {isRu ? 'Добавить' : 'Add Item'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Filters */}
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

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : !filtered.length ? (
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{isRu ? 'Нет предметов' : 'No items'}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const isLow = (item.min_quantity || 0) > 0 && item.quantity <= (item.min_quantity || 0);
            return (
              <Card key={item.id} className={`p-3 flex items-center gap-3 ${isLow ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{isRu && item.name_ru ? item.name_ru : item.name}</p>
                    {isLow && <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                    {isLow && <span className="text-destructive font-medium">{isRu ? 'Нужно закупить!' : 'Reorder needed!'}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty.mutate({ id: item.id, qty: Math.max(0, item.quantity - 1) })}>-</Button>
                  <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty.mutate({ id: item.id, qty: item.quantity + 1 })}>+</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
