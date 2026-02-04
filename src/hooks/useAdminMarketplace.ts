import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  MarketplaceProduct, 
  MarketplaceCategory, 
  MarketplaceSubcategory,
  MarketplaceVendor 
} from '@/types/marketplace';

// ============ PRODUCTS ============

interface ProductFilters {
  categorySlug?: string;
  vendorId?: string;
  inStock?: boolean;
  isActive?: boolean;
  search?: string;
}

export function useAdminMarketplaceProducts(filters: ProductFilters = {}) {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-marketplace-products', filters],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_products')
        .select('*')
        .order('sort_order', { ascending: true });

      if (filters.categorySlug) {
        query = query.eq('category_slug', filters.categorySlug);
      }
      if (filters.vendorId) {
        query = query.eq('vendor_id', filters.vendorId);
      }
      if (filters.inStock !== undefined) {
        query = query.eq('in_stock', filters.inStock);
      }
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters.search) {
        query = query.or(`name_en.ilike.%${filters.search}%,name_ru.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MarketplaceProduct[];
    },
  });

  const createProduct = useMutation({
    mutationFn: async (product: Partial<MarketplaceProduct>) => {
      const { data, error } = await supabase
        .from('marketplace_products')
        .insert({
          ...product,
          is_active: product.is_active ?? true,
          is_verified: true, // Admin-created products are auto-verified
          approval_status: 'approved', // Auto-approved
          created_by_uno_team: true,
          in_stock: product.in_stock ?? true,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-products'] });
      toast.success('Product created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create product: ${error.message}`);
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MarketplaceProduct> & { id: string }) => {
      const { data, error } = await supabase
        .from('marketplace_products')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-products'] });
      toast.success('Product updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketplace_products')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete product: ${error.message}`);
    },
  });

  return {
    products,
    isLoading,
    refetch,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}

// ============ CATEGORIES ============

export function useAdminMarketplaceCategories() {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-marketplace-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as MarketplaceCategory[];
    },
  });

  const createCategory = useMutation({
    mutationFn: async (category: Partial<MarketplaceCategory>) => {
      const { data, error } = await supabase
        .from('marketplace_categories')
        .insert(category as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-categories'] });
      toast.success('Category created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create category: ${error.message}`);
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MarketplaceCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('marketplace_categories')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update category: ${error.message}`);
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketplace_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete category: ${error.message}`);
    },
  });

  const updateSortOrder = useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      for (const item of items) {
        const { error } = await supabase
          .from('marketplace_categories')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-categories'] });
      toast.success('Order updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update order: ${error.message}`);
    },
  });

  return {
    categories,
    isLoading,
    refetch,
    createCategory,
    updateCategory,
    deleteCategory,
    updateSortOrder,
  };
}

// ============ SUBCATEGORIES ============

export function useAdminMarketplaceSubcategories(categorySlug?: string) {
  const queryClient = useQueryClient();

  const { data: subcategories = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-marketplace-subcategories', categorySlug],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_subcategories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (categorySlug) {
        query = query.eq('category_slug', categorySlug);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MarketplaceSubcategory[];
    },
  });

  const createSubcategory = useMutation({
    mutationFn: async (subcategory: Partial<MarketplaceSubcategory>) => {
      const { data, error } = await supabase
        .from('marketplace_subcategories')
        .insert(subcategory as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-subcategories'] });
      toast.success('Subcategory created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create subcategory: ${error.message}`);
    },
  });

  const updateSubcategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MarketplaceSubcategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('marketplace_subcategories')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-subcategories'] });
      toast.success('Subcategory updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update subcategory: ${error.message}`);
    },
  });

  const deleteSubcategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketplace_subcategories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-subcategories'] });
      toast.success('Subcategory deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete subcategory: ${error.message}`);
    },
  });

  return {
    subcategories,
    isLoading,
    refetch,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
  };
}

// ============ VENDORS ============

export function useAdminMarketplaceVendors() {
  const queryClient = useQueryClient();

  const { data: vendors = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-marketplace-vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_vendors')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MarketplaceVendor[];
    },
  });

  const createVendor = useMutation({
    mutationFn: async (vendor: Partial<MarketplaceVendor>) => {
      const { data, error } = await supabase
        .from('marketplace_vendors')
        .insert({
          ...vendor,
          is_active: vendor.is_active ?? true,
          is_verified: true, // Admin-created vendors are auto-verified
          approval_status: 'approved', // Auto-approved
          created_by_uno_team: true,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-vendors'] });
      toast.success('Vendor created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create vendor: ${error.message}`);
    },
  });

  const updateVendor = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MarketplaceVendor> & { id: string }) => {
      const { data, error } = await supabase
        .from('marketplace_vendors')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-vendors'] });
      toast.success('Vendor updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update vendor: ${error.message}`);
    },
  });

  const deleteVendor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketplace_vendors')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-vendors'] });
      toast.success('Vendor deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete vendor: ${error.message}`);
    },
  });

  return {
    vendors,
    isLoading,
    refetch,
    createVendor,
    updateVendor,
    deleteVendor,
  };
}

// ============ PRODUCT COUNTS BY CATEGORY ============

export function useProductCountsByCategory() {
  return useQuery({
    queryKey: ['admin-marketplace-product-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('category_slug');
      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((p) => {
        counts[p.category_slug] = (counts[p.category_slug] || 0) + 1;
      });
      return counts;
    },
  });
}

// ============ PRODUCT COUNTS BY VENDOR ============

export function useProductCountsByVendor() {
  return useQuery({
    queryKey: ['admin-marketplace-vendor-product-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('vendor_id');
      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((p) => {
        if (p.vendor_id) {
          counts[p.vendor_id] = (counts[p.vendor_id] || 0) + 1;
        }
      });
      return counts;
    },
  });
}
