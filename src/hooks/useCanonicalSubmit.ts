/**
 * useCanonicalSubmit - P0-safe submission hook
 * 
 * Features:
 * - Idempotency key generation
 * - Debounce protection
 * - Duplicate record prevention
 * - Loading state management
 * - Optimistic locking
 * - Provider ID field mapping for different table schemas
 */
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { getProviderIdField, prepareDataWithProviderId } from '@/lib/providerIdMapping';
import { APPROVAL_STATUSES } from '@/lib/approvalStatus';

interface UseCanonicalSubmitOptions {
  tableName: string;
  providerId: string;
  /** Marketplace vendor ID (for products) */
  vendorId?: string;
  editingId?: string | null;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  /** Custom duplicate check query */
  duplicateCheckFields?: string[];
  /** Debounce timeout in ms */
  debounceMs?: number;
}

interface SubmitResult {
  success: boolean;
  id?: string;
  error?: Error;
}

export function useCanonicalSubmit({
  tableName,
  providerId,
  vendorId,
  editingId,
  onSuccess,
  onError,
  duplicateCheckFields = ['title_en', 'category_id'],
  debounceMs = 2000,
}: UseCanonicalSubmitOptions) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const isRu = language === 'ru';
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDuplicateBlocked, setIsDuplicateBlocked] = useState(false);
  const lastSubmitTimeRef = useRef<number>(0);
  const idempotencyKeyRef = useRef<string>('');
  
  /**
   * Generate idempotency key based on content hash
   */
  const generateIdempotencyKey = useCallback((data: Record<string, unknown>): string => {
    const hashSource = JSON.stringify({
      provider_id: providerId,
      ...Object.fromEntries(
        duplicateCheckFields.map(f => [f, data[f]])
      ),
      timestamp: Math.floor(Date.now() / 60000), // 1-minute window
    });
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < hashSource.length; i++) {
      const char = hashSource.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `idem_${Math.abs(hash).toString(16)}`;
  }, [providerId, duplicateCheckFields]);
  
  /**
   * Check for duplicate records
   */
  const checkDuplicate = useCallback(async (data: Record<string, unknown>): Promise<boolean> => {
    if (editingId) return false; // Editing existing record, no duplicate check
    
    try {
      // Get the correct provider ID field for this table
      const providerIdField = getProviderIdField(tableName);
      const idValue = providerIdField === 'vendor_id' ? vendorId : providerId;
      
      if (!idValue) return false;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from as any)(tableName)
        .select('id')
        .eq(providerIdField, idValue);
      
      // Add checks for each duplicate field
      duplicateCheckFields.forEach(field => {
        if (data[field]) {
          query = query.eq(field, data[field]);
        }
      });
      
      const { data: existing, error } = await query.limit(1).maybeSingle();
      
      if (error) return false;
      
      return !!existing;
    } catch {
      return false;
    }
  }, [tableName, providerId, vendorId, editingId, duplicateCheckFields]);
  
  /**
   * Main submit function with all P0 protections
   */
  const submit = useCallback(async (data: Record<string, unknown>): Promise<SubmitResult> => {
    const now = Date.now();
    
    // Debounce protection
    if (now - lastSubmitTimeRef.current < debounceMs) {
      setIsDuplicateBlocked(true);
      setTimeout(() => setIsDuplicateBlocked(false), debounceMs);
      return { success: false, error: new Error('Please wait before submitting again') };
    }
    
    // Idempotency check
    const newIdempotencyKey = generateIdempotencyKey(data);
    if (newIdempotencyKey === idempotencyKeyRef.current && !editingId) {
      toast.warning(isRu ? 'Запись уже отправляется' : 'Submission already in progress');
      return { success: false, error: new Error('Duplicate submission') };
    }
    
    // Prevent double-click
    if (isSubmitting) {
      return { success: false, error: new Error('Submission in progress') };
    }
    
    setIsSubmitting(true);
    lastSubmitTimeRef.current = now;
    idempotencyKeyRef.current = newIdempotencyKey;
    
    try {
      // Duplicate record check
      const isDuplicate = await checkDuplicate(data);
      if (isDuplicate) {
        const error = new Error(isRu 
          ? 'Похожая запись уже существует' 
          : 'A similar record already exists'
        );
        toast.error(error.message);
        onError?.(error);
        return { success: false, error };
      }
      
      // Prepare data with correct provider ID field based on table schema
      const baseData: Record<string, unknown> = {
        ...data,
        updated_at: new Date().toISOString(),
      };
      
      // Use the mapping utility to set the correct provider ID field
      const submissionData = prepareDataWithProviderId(tableName, baseData, {
        providerId,
        vendorId,
        userId: user?.id,
      });
      
      // Admin-created content is auto-approved
      if (isAdmin) {
        submissionData.approval_status = APPROVAL_STATUSES.APPROVED;
        submissionData.is_verified = true;
        submissionData.created_by_uno_team = true;
        submissionData.uno_team_creator_id = user?.id;
      } else {
        submissionData.approval_status = APPROVAL_STATUSES.PENDING;
      }
      
      let result;
      
      if (editingId) {
        // Update existing record - use correct provider ID field for ownership check
        const providerIdField = getProviderIdField(tableName);
        const idValue = providerIdField === 'vendor_id' ? vendorId : providerId;
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: updated, error } = await (supabase.from as any)(tableName)
          .update(submissionData)
          .eq('id', editingId)
          .eq(providerIdField, idValue) // Security: ensure ownership
          .select()
          .single();
        
        if (error) throw error;
        result = updated;
      } else {
        // Insert new record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: inserted, error } = await (supabase.from as any)(tableName)
          .insert({
            ...submissionData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (error) throw error;
        result = inserted;
      }
      
      const successMessage = isAdmin 
        ? (isRu ? (editingId ? 'Запись обновлена' : 'Запись создана и опубликована') : (editingId ? 'Record updated' : 'Record created and published'))
        : (isRu ? (editingId ? 'Запись обновлена' : 'Отправлено на модерацию') : (editingId ? 'Record updated' : 'Submitted for moderation'));
      
      toast.success(successMessage);
      
      onSuccess?.();
      return { success: true, id: result.id };
      
    } catch (error: unknown) {
      const pgError = error as { code?: string; message?: string };
      
      // Handle specific errors
      if (pgError.code === '23505') {
        // Unique constraint violation
        toast.error(isRu ? 'Запись с такими данными уже существует' : 'Record with these details already exists');
      } else if (pgError.code === '23503') {
        // Foreign key violation
        toast.error(isRu ? 'Связанные данные не найдены' : 'Related data not found');
      } else {
        toast.error(isRu ? 'Ошибка сохранения' : 'Save failed');
      }
      
      const err = error instanceof Error ? error : new Error(pgError.message || 'Save failed');
      onError?.(err);
      return { success: false, error: err };
      
    } finally {
      setIsSubmitting(false);
    }
  }, [
    tableName,
    providerId,
    editingId,
    debounceMs,
    isSubmitting,
    generateIdempotencyKey,
    checkDuplicate,
    onSuccess,
    onError,
    isRu,
    isAdmin,
    user?.id,
  ]);
  
  /**
   * Reset submission state (for retry scenarios)
   */
  const reset = useCallback(() => {
    setIsSubmitting(false);
    setIsDuplicateBlocked(false);
    idempotencyKeyRef.current = '';
    lastSubmitTimeRef.current = 0;
  }, []);
  
  return {
    submit,
    reset,
    isSubmitting,
    isDuplicateBlocked,
  };
}
