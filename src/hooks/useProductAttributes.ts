import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ProductAttribute {
  key: string;
  value: string;
  valueRu: string | null;
}

// Hook to fetch attributes for a single product
export function useProductAttributes(productId: string | undefined) {
  const { language } = useLanguage();

  const query = useQuery({
    queryKey: ['product-attributes', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('marketplace_product_attributes')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order');

      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Transform to localized format
  const attributes: ProductAttribute[] = (query.data || []).map(attr => ({
    key: attr.attribute_key,
    value: language === 'ru' && attr.attribute_value_ru 
      ? attr.attribute_value_ru 
      : attr.attribute_value,
    valueRu: attr.attribute_value_ru,
  }));

  // Get specific attribute
  const getAttribute = (key: string): string | null => {
    const attr = attributes.find(a => a.key === key);
    return attr?.value || null;
  };

  return {
    attributes,
    getAttribute,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// Hook to get unique attribute values for filtering
export function useAttributeFilter(categorySlug?: string, attributeKey?: string) {
  return useQuery({
    queryKey: ['attribute-filter', categorySlug, attributeKey],
    queryFn: async () => {
      if (!attributeKey) return [];

      let query = supabase
        .from('marketplace_product_attributes')
        .select(`
          attribute_value,
          attribute_value_ru,
          product_id,
          marketplace_products!inner(category_slug, is_active)
        `)
        .eq('attribute_key', attributeKey);

      if (categorySlug) {
        query = query.eq('marketplace_products.category_slug', categorySlug);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get unique values
      const uniqueValues = new Map<string, string | null>();
      (data || []).forEach(item => {
        if (!uniqueValues.has(item.attribute_value)) {
          uniqueValues.set(item.attribute_value, item.attribute_value_ru);
        }
      });

      return Array.from(uniqueValues.entries()).map(([value, valueRu]) => ({
        value,
        valueRu,
        label: value,
        labelRu: valueRu || value,
      }));
    },
    enabled: !!attributeKey,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Attribute key labels for display
export const ATTRIBUTE_LABELS: Record<string, { en: string; ru: string; th: string }> = {
  brand: { en: 'Brand', ru: 'Бренд', th: 'แบรนด์' },
  origin: { en: 'Country of Origin', ru: 'Страна происхождения', th: 'ประเทศต้นกำเนิด' },
  storage: { en: 'Storage', ru: 'Хранение', th: 'การจัดเก็บ' },
  organic: { en: 'Organic', ru: 'Органик', th: 'ออร์แกนิก' },
  weight: { en: 'Weight', ru: 'Вес', th: 'น้ำหนัก' },
  volume: { en: 'Volume', ru: 'Объём', th: 'ปริมาตร' },
  material: { en: 'Material', ru: 'Материал', th: 'วัสดุ' },
  size: { en: 'Size', ru: 'Размер', th: 'ขนาด' },
  color: { en: 'Color', ru: 'Цвет', th: 'สี' },
  expiry: { en: 'Shelf Life', ru: 'Срок годности', th: 'อายุการเก็บ' },
};

export function getAttributeLabel(key: string, language: 'en' | 'ru' | 'th'): string {
  return ATTRIBUTE_LABELS[key]?.[language] || ATTRIBUTE_LABELS[key]?.en || key;
}
