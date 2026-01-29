import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MarketplaceVendor, MarketplaceProductWithVendor } from '@/types/marketplace';

// Hook for fetching a single vendor by slug
export function useVendor(slug: string | undefined) {
  const [vendor, setVendor] = useState<MarketplaceVendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) {
      setVendor(null);
      setIsLoading(false);
      return;
    }

    const fetchVendor = async () => {
      setIsLoading(true);
      try {
        const { data, error: queryError } = await supabase
          .from('marketplace_vendors')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (queryError) throw queryError;
        setVendor(data as MarketplaceVendor);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setVendor(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendor();
  }, [slug]);

  return { vendor, isLoading, error };
}

// Hook for fetching a vendor by ID
export function useVendorById(vendorId: string | undefined) {
  const [vendor, setVendor] = useState<MarketplaceVendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!vendorId) {
      setVendor(null);
      setIsLoading(false);
      return;
    }

    const fetchVendor = async () => {
      setIsLoading(true);
      try {
        const { data, error: queryError } = await supabase
          .from('marketplace_vendors')
          .select('*')
          .eq('id', vendorId)
          .single();

        if (queryError) throw queryError;
        setVendor(data as MarketplaceVendor);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setVendor(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendor();
  }, [vendorId]);

  return { vendor, isLoading, error };
}

// Hook for fetching all active vendors
export function useVendors() {
  const [vendors, setVendors] = useState<MarketplaceVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const { data, error: queryError } = await supabase
          .from('marketplace_vendors')
          .select('*')
          .eq('is_active', true)
          .order('rating', { ascending: false });

        if (queryError) throw queryError;
        setVendors((data || []) as MarketplaceVendor[]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendors();
  }, []);

  return { vendors, isLoading, error };
}

// Hook for fetching products by vendor
export function useVendorProducts(vendorId: string | undefined) {
  const [products, setProducts] = useState<MarketplaceProductWithVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!vendorId) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const { data, error: queryError } = await supabase
          .from('marketplace_products')
          .select('*')
          .eq('vendor_id', vendorId)
          .eq('in_stock', true)
          .order('is_popular', { ascending: false });

        if (queryError) throw queryError;
        setProducts((data || []) as MarketplaceProductWithVendor[]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [vendorId]);

  return { products, isLoading, error };
}

// Hook for fetching product with vendor data
export function useProductWithVendor(productId: string | undefined) {
  const [product, setProduct] = useState<MarketplaceProductWithVendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setIsLoading(false);
      return;
    }

    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const { data, error: queryError } = await supabase
          .from('marketplace_products')
          .select(`
            *,
            vendor:marketplace_vendors(*)
          `)
          .eq('id', productId)
          .single();

        if (queryError) throw queryError;
        setProduct(data as unknown as MarketplaceProductWithVendor);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return { product, isLoading, error };
}

// Hook for getting vendor product count
export function useVendorProductCount(vendorId: string | undefined) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!vendorId) {
      setCount(0);
      setIsLoading(false);
      return;
    }

    const fetchCount = async () => {
      try {
        const { count: productCount, error } = await supabase
          .from('marketplace_products')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendorId)
          .eq('in_stock', true);

        if (!error && productCount !== null) {
          setCount(productCount);
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();
  }, [vendorId]);

  return { count, isLoading };
}
