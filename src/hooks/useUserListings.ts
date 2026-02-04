import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserListing, UserListingDraft, ItemCondition } from '@/types/userListing';
import { useToast } from '@/hooks/use-toast';

export function useUserListings() {
  const [listings, setListings] = useState<UserListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchListings = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setListings([]);
        return;
      }

      const { data, error: queryError } = await supabase
        .from('user_listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      
      setListings((data || []) as UserListing[]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const createListing = async (draft: UserListingDraft): Promise<UserListing | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to create a listing',
          variant: 'destructive',
        });
        return null;
      }

      const { data, error: insertError } = await supabase
        .from('user_listings')
        .insert({
          user_id: user.id,
          title_en: draft.title_en,
          title_ru: draft.title_ru || null,
          description_en: draft.description_en || null,
          description_ru: draft.description_ru || null,
          category_slug: draft.category_slug || null,
          subcategory: draft.subcategory || null,
          price: draft.price || 0,
          currency: draft.currency,
          is_negotiable: draft.is_negotiable,
          condition: draft.condition,
          cover_image: draft.cover_image || null,
          images: draft.images || null,
          location: draft.location || null,
          contact_phone: draft.contact_phone || null,
          contact_whatsapp: draft.contact_whatsapp || null,
          show_phone: draft.show_phone,
          status: 'draft',
          moderation_status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: 'Listing created',
        description: 'Your listing has been saved as a draft',
      });

      await fetchListings();
      return data as UserListing;
    } catch (err) {
      toast({
        title: 'Error creating listing',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateListing = async (id: string, updates: Partial<UserListingDraft>): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('user_listings')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchListings();
      return true;
    } catch (err) {
      toast({
        title: 'Error updating listing',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
      return false;
    }
  };

  const publishListing = async (id: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('user_listings')
        .update({
          status: 'pending',
          published_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      toast({
        title: 'Listing submitted',
        description: 'Your listing is now pending review',
      });

      await fetchListings();
      return true;
    } catch (err) {
      toast({
        title: 'Error publishing listing',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteListing = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('user_listings')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast({
        title: 'Listing deleted',
        description: 'Your listing has been removed',
      });

      await fetchListings();
      return true;
    } catch (err) {
      toast({
        title: 'Error deleting listing',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
      return false;
    }
  };

  const markAsSold = async (id: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('user_listings')
        .update({
          status: 'sold',
          sold_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      toast({
        title: 'Marked as sold',
        description: 'Congratulations on your sale!',
      });

      await fetchListings();
      return true;
    } catch (err) {
      toast({
        title: 'Error updating listing',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    listings,
    isLoading,
    error,
    createListing,
    updateListing,
    publishListing,
    deleteListing,
    markAsSold,
    refetch: fetchListings,
  };
}

// Hook to fetch active public listings (for browsing)
export function usePublicListings(options: {
  category?: string;
  search?: string;
  condition?: ItemCondition;
  limit?: number;
} = {}) {
  const [listings, setListings] = useState<UserListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Stabilize options to prevent infinite loops
  const { category, search, condition, limit } = options;

  useEffect(() => {
    const fetchPublicListings = async () => {
      try {
        setIsLoading(true);
        
        // Include both 'active' status AND 'pending' with approved moderation
        // This ensures listings are visible after vendor publishes them
        let query = supabase
          .from('user_listings')
          .select('*')
          .eq('moderation_status', 'approved')
          .in('status', ['active', 'pending']) // Fix: include pending approved listings
          .order('created_at', { ascending: false });

        if (category) {
          query = query.eq('category_slug', category);
        }
        if (condition) {
          query = query.eq('condition', condition);
        }
        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        let result = (data || []) as UserListing[];

        // Client-side search
        if (search && search.length >= 2) {
          const searchLower = search.toLowerCase();
          result = result.filter(l =>
            l.title_en.toLowerCase().includes(searchLower) ||
            l.title_ru?.toLowerCase().includes(searchLower) ||
            l.description_en?.toLowerCase().includes(searchLower)
          );
        }

        setListings(result);
      } catch (err) {
        console.error('Error fetching public listings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicListings();
  }, [category, condition, limit, search]); // Stabilized dependencies

  return { listings, isLoading };
}
