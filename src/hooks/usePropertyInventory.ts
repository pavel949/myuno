import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export interface InventoryItem {
  id: string;
  property_id: string;
  category: string;
  name: string;
  name_ru: string | null;
  description: string | null;
  quantity: number;
  condition: string;
  estimated_value: number | null;
  currency: string | null;
  photos: string[] | null;
  serial_number: string | null;
  purchase_date: string | null;
  warranty_until: string | null;
  location_in_property: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryReport {
  id: string;
  booking_id: string;
  inventory_item_id: string;
  report_type: string;
  previous_condition: string | null;
  current_condition: string;
  damage_description: string | null;
  photos: string[] | null;
  estimated_damage_cost: number | null;
  currency: string | null;
  linked_to_deposit: boolean | null;
  reported_by: string | null;
  reported_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  item?: InventoryItem;
}

export interface CreateInventoryItemInput {
  property_id: string;
  category: string;
  name: string;
  name_ru?: string;
  description?: string;
  quantity?: number;
  condition?: InventoryItem['condition'];
  estimated_value?: number;
  currency?: string;
  photos?: string[];
  serial_number?: string;
  purchase_date?: string;
  warranty_until?: string;
  location_in_property?: string;
  notes?: string;
}

export const INVENTORY_CATEGORIES = {
  furniture: { en: 'Furniture', ru: 'Мебель' },
  electronics: { en: 'Electronics', ru: 'Электроника' },
  kitchen: { en: 'Kitchen', ru: 'Кухня' },
  bathroom: { en: 'Bathroom', ru: 'Ванная' },
  bedroom: { en: 'Bedroom', ru: 'Спальня' },
  decor: { en: 'Decor', ru: 'Декор' },
  appliances: { en: 'Appliances', ru: 'Бытовая техника' },
  linens: { en: 'Linens & Towels', ru: 'Белье и полотенца' },
  outdoor: { en: 'Outdoor', ru: 'Улица' },
  general: { en: 'General', ru: 'Общее' },
} as const;

export const CONDITION_OPTIONS = {
  new: { en: 'New', ru: 'Новое', color: 'text-success' },
  good: { en: 'Good', ru: 'Хорошее', color: 'text-primary' },
  fair: { en: 'Fair', ru: 'Удовлетв.', color: 'text-warning' },
  worn: { en: 'Worn', ru: 'Изношенное', color: 'text-orange-500' },
  damaged: { en: 'Damaged', ru: 'Повреждённое', color: 'text-destructive' },
} as const;

export function usePropertyInventory(propertyId?: string) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  const t = (en: string, ru: string) => language === 'ru' ? ru : en;

  // Fetch inventory items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['property-inventory', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];

      const { data, error } = await supabase
        .from('property_inventory_items')
        .select('*')
        .eq('property_id', propertyId)
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as InventoryItem[];
    },
    enabled: !!propertyId,
  });

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  // Calculate total value
  const totalValue = items.reduce((sum, item) => {
    return sum + (item.estimated_value || 0) * item.quantity;
  }, 0);

  // Create item
  const createItem = useMutation({
    mutationFn: async (input: CreateInventoryItemInput) => {
      const insertData = {
        property_id: input.property_id,
        category: input.category,
        name: input.name,
        name_ru: input.name_ru,
        description: input.description,
        condition: input.condition || 'good',
        quantity: input.quantity || 1,
        currency: input.currency || 'THB',
        estimated_value: input.estimated_value,
        photos: input.photos || [],
        location_in_property: input.location_in_property,
      };

      const { data, error } = await supabase
        .from('property_inventory_items')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-inventory', propertyId] });
      toast(t, { description: t('Inventory item has been added' });
    },
    onError: (error: Error) => {
      toast.error(t, { description: error.message });
    },
  });

  // Update item
  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventoryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('property_inventory_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-inventory', propertyId] });
      toast(t);
    },
  });

  // Delete item (soft delete)
  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('property_inventory_items')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-inventory', propertyId] });
      toast(t);
    },
  });

  return {
    items,
    itemsByCategory,
    totalValue,
    isLoading,
    createItem,
    updateItem,
    deleteItem,
  };
}

// Hook for inventory condition reports in bookings
export function useInventoryReports(bookingId?: string) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  const t = (en: string, ru: string) => language === 'ru' ? ru : en;

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['inventory-reports', bookingId],
    queryFn: async () => {
      if (!bookingId) return [];

      const { data, error } = await supabase
        .from('booking_inventory_reports')
        .select(`
          *,
          item:property_inventory_items (*)
        `)
        .eq('booking_id', bookingId)
        .order('reported_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as InventoryReport[];
    },
    enabled: !!bookingId,
  });

  // Total damage cost
  const totalDamageCost = reports.reduce((sum, report) => {
    return sum + (report.estimated_damage_cost || 0);
  }, 0);

  // Create report
  const createReport = useMutation({
    mutationFn: async (input: {
      inventory_item_id: string;
      report_type: InventoryReport['report_type'];
      previous_condition?: string;
      current_condition: InventoryReport['current_condition'];
      damage_description?: string;
      photos?: string[];
      estimated_damage_cost?: number;
      linked_to_deposit?: boolean;
    }) => {
      if (!bookingId || !user?.id) throw new Error('Missing booking or user');

      const { data, error } = await supabase
        .from('booking_inventory_reports')
        .insert({
          booking_id: bookingId,
          ...input,
          photos: input.photos || [],
          currency: 'THB',
          reported_by: user.id,
        })
        .select(`
          *,
          item:property_inventory_items (*)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-reports', bookingId] });
      toast(t);
    },
    onError: (error: Error) => {
      toast.error(t, { description: error.message });
    },
  });

  // Resolve report
  const resolveReport = useMutation({
    mutationFn: async ({ reportId, resolution_notes }: { reportId: string; resolution_notes?: string }) => {
      const { data, error } = await supabase
        .from('booking_inventory_reports')
        .update({
          resolved_at: new Date().toISOString(),
          resolution_notes,
        })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-reports', bookingId] });
      toast(t);
    },
  });

  return {
    reports,
    totalDamageCost,
    isLoading,
    createReport,
    resolveReport,
    hasUnresolvedReports: reports.some(r => !r.resolved_at),
  };
}
