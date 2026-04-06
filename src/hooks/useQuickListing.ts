import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { createErrorHandler } from '@/lib/errorHandler';

const errorLog = createErrorHandler('useQuickListing');

import { getStoredLang as getLang } from '@/lib/languageConfig';

export interface QuickListingData {
  category: string;
  subcategory: string;
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  images?: string[];
  location?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
}

export function useQuickListing() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitListing = async (data: QuickListingData): Promise<{ success: boolean; id?: string }> => {
    setIsSubmitting(true);
    
    try {
      const insertData = {
        ...data,
        user_id: user?.id || null,
        status: 'pending',
      };

      const { data: result, error } = await supabase
        .from('quick_listings')
        .insert(insertData)
        .select('id')
        .single();

      if (error) throw error;

      const isRu = getLang() === 'ru';
      toast({
        title: isRu ? 'Успешно!' : 'Success!',
        description: isRu ? 'Заявка отправлена на модерацию!' : 'Listing submitted for review!',
      });

      return { success: true, id: result.id };
    } catch (error) {
      errorLog.error(error, 'submit_listing', {
        toastTitle: 'Submission Error',
        toastTitleRu: 'Ошибка отправки',
        toastDescription: 'Error submitting listing',
        toastDescriptionRu: 'Ошибка при отправке заявки',
      });
      return { success: false };
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserListings = async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('quick_listings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      errorLog.silent(error, 'fetch_listings');
      return [];
    }

    return data;
  };

  return {
    submitListing,
    getUserListings,
    isSubmitting,
  };
}
