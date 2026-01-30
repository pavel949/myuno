import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ExtractedField {
  value: any;
  confidence: number;
  source: 'text' | 'scraped' | 'image' | 'inferred';
}

export interface IntakeItem {
  id: string;
  status: 'pending' | 'approved' | 'discarded' | 'created';
  
  // Source
  sourceUrl?: string;
  sourceText?: string;
  sourceImages?: string[];
  
  // AI Analysis
  detectedVertical: string;
  verticalConfidence: number;
  extractedFields: Record<string, ExtractedField>;
  
  // Generated content
  suggestedTitle: { en: string; ru: string };
  suggestedDescription: { en: string; ru: string };
  
  // Validation
  missingRequiredFields: string[];
  warnings: string[];
  overallConfidence: number;
  
  // After approval
  createdListingId?: string;
  createdListingTable?: string;
}

export interface IntakeSession {
  id: string;
  status: 'processing' | 'ready' | 'partial' | 'failed' | 'completed';
  items: IntakeItem[];
  inputMode: string;
  itemsCount: number;
  processedCount: number;
  approvedCount: number;
  discardedCount: number;
  createdAt: string;
}

export interface IntakeSummary {
  total: number;
  byVertical: Record<string, number>;
  avgConfidence: number;
  readyToApprove: number;
  needsReview: number;
}

export function useIntakeAgent() {
  const { language } = useLanguage();
  const [session, setSession] = useState<IntakeSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analyze input (single or bulk)
  const analyze = useCallback(async (options: {
    mode: 'single' | 'bulk_text' | 'bulk_urls';
    rawText?: string;
    urls?: string[];
    images?: string[];
    forceVertical?: string;
  }) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('intake-listing-agent', {
        body: options
      });

      if (fnError) throw fnError;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to process intake');
      }

      // Parse session from response
      const intakeSession: IntakeSession = {
        id: data.sessionId,
        status: data.status,
        items: data.items || [],
        inputMode: options.mode,
        itemsCount: data.summary?.total || 0,
        processedCount: data.summary?.total || 0,
        approvedCount: 0,
        discardedCount: 0,
        createdAt: new Date().toISOString(),
      };

      setSession(intakeSession);
      
      toast.success(
        language === 'ru' 
          ? `Обработано ${intakeSession.items.length} объектов` 
          : `Processed ${intakeSession.items.length} items`
      );
      
      return intakeSession;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [language]);

  // Update item locally
  const updateItem = useCallback((itemId: string, updates: Partial<IntakeItem>) => {
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
        )
      };
    });
  }, []);

  // Approve single item - creates listing
  const approveItem = useCallback(async (itemId: string) => {
    if (!session) return false;
    
    const item = session.items.find(i => i.id === itemId);
    if (!item) return false;

    setIsApproving(true);
    
    try {
      // Transform extracted fields to flat object
      const fields: Record<string, any> = {};
      for (const [key, field] of Object.entries(item.extractedFields)) {
        fields[key] = field.value;
      }
      
      // Add generated content if not present
      if (!fields.name_en && item.suggestedTitle?.en) {
        fields.name_en = item.suggestedTitle.en;
      }
      if (!fields.name_ru && item.suggestedTitle?.ru) {
        fields.name_ru = item.suggestedTitle.ru;
      }
      if (!fields.description_en && item.suggestedDescription?.en) {
        fields.description_en = item.suggestedDescription.en;
      }
      if (!fields.description_ru && item.suggestedDescription?.ru) {
        fields.description_ru = item.suggestedDescription.ru;
      }

      // Call bulk-import to create the listing
      const { data, error: fnError } = await supabase.functions.invoke('bulk-import', {
        body: {
          table: item.detectedVertical,
          rows: [fields]
        }
      });

      if (fnError) throw fnError;

      if (data.success > 0) {
        updateItem(itemId, { 
          status: 'created',
          createdListingId: data.insertedIds?.[0],
          createdListingTable: item.detectedVertical
        });
        
        setSession(prev => prev ? {
          ...prev,
          approvedCount: prev.approvedCount + 1
        } : prev);

        toast.success(
          language === 'ru' 
            ? 'Листинг создан и отправлен на модерацию' 
            : 'Listing created and sent to moderation'
        );
        return true;
      } else {
        throw new Error(data.errors?.[0] || 'Failed to create listing');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve';
      toast.error(message);
      return false;
    } finally {
      setIsApproving(false);
    }
  }, [session, updateItem, language]);

  // Discard item
  const discardItem = useCallback((itemId: string) => {
    updateItem(itemId, { status: 'discarded' });
    setSession(prev => prev ? {
      ...prev,
      discardedCount: prev.discardedCount + 1
    } : prev);
  }, [updateItem]);

  // Approve all pending items
  const approveAll = useCallback(async () => {
    if (!session) return;
    
    const pendingItems = session.items.filter(i => i.status === 'pending');
    let successCount = 0;
    
    for (const item of pendingItems) {
      const success = await approveItem(item.id);
      if (success) successCount++;
    }
    
    toast.success(
      language === 'ru'
        ? `Создано ${successCount} из ${pendingItems.length} листингов`
        : `Created ${successCount} of ${pendingItems.length} listings`
    );
  }, [session, approveItem, language]);

  // Calculate summary
  const summary: IntakeSummary | null = session ? {
    total: session.items.length,
    byVertical: session.items.reduce((acc, item) => {
      acc[item.detectedVertical] = (acc[item.detectedVertical] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    avgConfidence: session.items.length > 0
      ? session.items.reduce((sum, item) => sum + item.overallConfidence, 0) / session.items.length
      : 0,
    readyToApprove: session.items.filter(i => 
      i.status === 'pending' && i.missingRequiredFields.length === 0
    ).length,
    needsReview: session.items.filter(i => 
      i.status === 'pending' && (i.missingRequiredFields.length > 0 || i.overallConfidence < 0.7)
    ).length,
  } : null;

  // Reset session
  const reset = useCallback(() => {
    setSession(null);
    setError(null);
  }, []);

  return {
    session,
    summary,
    isProcessing,
    isApproving,
    error,
    analyze,
    updateItem,
    approveItem,
    discardItem,
    approveAll,
    reset,
  };
}
