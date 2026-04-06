import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserListing, UserListingDraft, ItemCondition } from '@/types/userListing';
import { toast } from 'sonner';

export function useUserListings() {
  const [listings, setListings] = useState<UserListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
        toast.error('Authentication required', { description: 'Please sign in to create a listing' });
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

      toast('Listing created', { description: 'Your listing has been saved as a draft' })toast.error('Error creating listing', { description: err instanceof Error ? err.message : 'Unknown error' });

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
