import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export type ListingType = 'property' | 'service' | 'product';
export type ApplicationStatus = 'draft' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'revision_requested';

export interface ListingApplicationDraft {
  // Common fields
  listing_type: ListingType;
  title_en?: string;
  title_ru?: string;
  description_en?: string;
  description_ru?: string;
  cover_image?: string;
  images?: string[];
  city?: string;
  district?: string;
  address?: string;
  price?: number;
  currency?: string;
  
  // Property-specific
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  max_guests?: number;
  amenities?: string[];
  
  // Service-specific
  service_category?: string;
  duration_minutes?: number;
  
  // Product-specific
  product_category?: string;
  stock_quantity?: number;
  
  // Applicant info (for non-auth users)
  applicant_name?: string;
  applicant_email?: string;
  applicant_phone?: string;
}

interface UseListingApplicationReturn {
  draft: ListingApplicationDraft;
  applicationId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  currentStep: number;
  
  setListingType: (type: ListingType) => void;
  updateDraft: (updates: Partial<ListingApplicationDraft>) => void;
  saveDraft: () => Promise<void>;
  submitApplication: () => Promise<boolean>;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
}

const DRAFT_STORAGE_KEY = 'listing_application_draft';

export function useListingApplication(): UseListingApplicationReturn {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Load draft from localStorage if exists
  const loadInitialDraft = (): ListingApplicationDraft => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load draft:', e);
    }
    return { listing_type: 'property', currency: 'THB' };
  };
  
  const [draft, setDraft] = useState<ListingApplicationDraft>(loadInitialDraft);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const setListingType = useCallback((type: ListingType) => {
    setDraft(prev => ({ ...prev, listing_type: type }));
  }, []);
  
  const updateDraft = useCallback((updates: Partial<ListingApplicationDraft>) => {
    setDraft(prev => {
      const updated = { ...prev, ...updates };
      // Auto-save to localStorage
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);
  
  const saveDraft = useCallback(async () => {
    if (!user) {
      // Just save to localStorage for non-auth users
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      return;
    }
    
    setIsSaving(true);
    try {
      const applicationData = {
        user_id: user.id,
        listing_type: draft.listing_type,
        status: 'draft' as const,
        draft_data: JSON.parse(JSON.stringify(draft)) as Json,
        property_type: draft.property_type,
        service_category: draft.service_category,
        product_category: draft.product_category,
        city: draft.city,
        district: draft.district,
        address: draft.address,
        estimated_price: draft.price,
        currency: draft.currency || 'THB',
        cover_image: draft.cover_image,
        applicant_name: draft.applicant_name,
        applicant_email: draft.applicant_email || user.email,
        applicant_phone: draft.applicant_phone,
      };
      
      if (applicationId) {
        // Update existing
        const { error } = await supabase
          .from('listing_applications')
          .update(applicationData)
          .eq('id', applicationId);
          
        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('listing_applications')
          .insert([applicationData])
          .select('id')
          .single();
          
        if (error) throw error;
        if (data) setApplicationId(data.id);
      }
      
      // Clear localStorage after saving to DB
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  }, [user, draft, applicationId]);
  
  const submitApplication = useCallback(async (): Promise<boolean> => {
    if (!user) {
      // Redirect to auth with return URL
      const returnUrl = `/list-with-us?continue=true`;
      navigate(`/auth?redirect=${encodeURIComponent(returnUrl)}`);
      return false;
    }
    
    setIsLoading(true);
    try {
      const applicationData = {
        user_id: user.id,
        listing_type: draft.listing_type,
        status: 'pending' as const,
        draft_data: JSON.parse(JSON.stringify(draft)) as Json,
        property_type: draft.property_type,
        service_category: draft.service_category,
        product_category: draft.product_category,
        city: draft.city,
        district: draft.district,
        address: draft.address,
        estimated_price: draft.price,
        currency: draft.currency || 'THB',
        cover_image: draft.cover_image,
        applicant_name: draft.applicant_name || user.user_metadata?.name,
        applicant_email: draft.applicant_email || user.email,
        applicant_phone: draft.applicant_phone,
        submitted_at: new Date().toISOString(),
      };
      
      if (applicationId) {
        // Update existing and submit
        const { error } = await supabase
          .from('listing_applications')
          .update(applicationData)
          .eq('id', applicationId);
          
        if (error) throw error;
      } else {
        // Create and submit
        const { data, error } = await supabase
          .from('listing_applications')
          .insert([applicationData])
          .select('id')
          .single();
          
        if (error) throw error;
        if (data) setApplicationId(data.id);
      }
      
      // Clear draft
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setDraft({ listing_type: 'property', currency: 'THB' });
      
      toast.success('Application submitted! We\'ll review it shortly.');
      return true;
    } catch (error) {
      console.error('Failed to submit application:', error);
      toast.error('Failed to submit application');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, draft, applicationId, navigate]);
  
  const nextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1);
  }, []);
  
  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);
  
  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);
  
  return {
    draft,
    applicationId,
    isLoading,
    isSaving,
    currentStep,
    setListingType,
    updateDraft,
    saveDraft,
    submitApplication,
    nextStep,
    prevStep,
    goToStep,
  };
}
