import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { isValidIntakeTable, VALID_INTAKE_TABLES } from '@/lib/providerIdMapping';
import { useActiveCompany } from '@/hooks/useActiveCompany';

export interface ExtractedField {
  value: unknown;
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
  const { activeCompany } = useActiveCompany();
  const [session, setSession] = useState<IntakeSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analyze input (single or bulk)
  const analyze = useCallback(async (options: {
    mode: 'single' | 'bulk_text' | 'bulk_urls' | 'files' | 'agent_message';
    rawText?: string;
    urls?: string[];
    files?: Array<{ id: string; file: File; type: string }>;
    forceVertical?: string;
  }) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      let uploadedFileUrls: string[] = [];
      
      // Upload files to storage if in files mode
      if (options.mode === 'files' && options.files && options.files.length > 0) {
        const uploadPromises = options.files.map(async (fileItem) => {
          const timestamp = Date.now();
          const fileName = `${timestamp}-${fileItem.file.name}`;
          const filePath = `intake/${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('intake-uploads')
            .upload(filePath, fileItem.file);
            
          if (uploadError) {
            throw new Error(`Failed to upload ${fileItem.file.name}: ${uploadError.message}`);
          }
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('intake-uploads')
            .getPublicUrl(filePath);
            
          return {
            url: urlData.publicUrl,
            name: fileItem.file.name,
            type: fileItem.type
          };
        });
        
        const uploadedFiles = await Promise.all(uploadPromises);
        uploadedFileUrls = uploadedFiles.map(f => f.url);
        
        toast.success(
          language === 'ru' 
            ? `Загружено ${uploadedFiles.length} файлов` 
            : `Uploaded ${uploadedFiles.length} files`
        );
      }
      
      // Prepare body for edge function
      const body = {
        mode: options.mode,
        rawText: options.rawText,
        urls: options.urls,
        uploadedImages: uploadedFileUrls.length > 0 ? uploadedFileUrls : undefined,
        forceVertical: options.forceVertical,
      };
      
      const { data, error: fnError } = await supabase.functions.invoke('intake-listing-agent', {
        body
      });

      if (fnError) throw fnError;
      
      // Edge function returns sessionId, status, items - check for valid response
      if (!data || !data.sessionId || !data.items) {
        throw new Error(data?.error || 'Failed to process intake');
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
      const fields: Record<string, unknown> = {};
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
      // Attach resolved cloud images to listing
      if (!fields.images && item.sourceImages && item.sourceImages.length > 0) {
        fields.images = item.sourceImages;
      }
      // Set first image as main image if not already set
      if (!fields.image && item.sourceImages && item.sourceImages.length > 0) {
        fields.image = item.sourceImages[0];
      }

      if (!fields.description_ru && item.suggestedDescription?.ru) {
        fields.description_ru = item.suggestedDescription.ru;
      }

      // P0 FIX: Validate table before calling bulk-import
      if (!isValidIntakeTable(item.detectedVertical)) {
        const errorMsg = `Unknown vertical table: ${item.detectedVertical}. Valid tables: ${VALID_INTAKE_TABLES.slice(0, 5).join(', ')}...`;
        toast.error(errorMsg);
        return false;
      }

      // Call bulk-import to create the listing
      const { data, error: fnError } = await supabase.functions.invoke('bulk-import', {
        body: {
          table: item.detectedVertical,
          records: [fields]
        }
      });

      if (fnError) throw fnError;

      if (data.inserted > 0) {
        updateItem(itemId, { 
          status: 'created',
          createdListingTable: item.detectedVertical
        });
        
        setSession(prev => prev ? {
          ...prev,
          approvedCount: prev.approvedCount + 1
        } : prev);

        // Auto-create CRM contact from extracted contact info
        await createCrmContactFromItem(item);

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
  }, [session, updateItem, language, activeCompany]);

  // Auto-create CRM contact from intake item's extracted fields
  const createCrmContactFromItem = useCallback(async (item: IntakeItem) => {
    try {
      const f = item.extractedFields;
      const phone = f.phone?.value as string || f.contact_phone?.value as string;
      const email = f.email?.value as string || f.contact_email?.value as string;
      const whatsapp = f.whatsapp?.value as string || f.contact_whatsapp?.value as string;
      const telegram = f.telegram?.value as string || f.contact_telegram?.value as string;
      const contactName = f.agent_name?.value as string || f.contact_name?.value as string;

      // Skip if no contact info at all
      if (!phone && !email && !whatsapp && !telegram) return;

      const companyId = activeCompany?.company_id;
      if (!companyId) return;

      // Parse name into first/last
      let firstName = 'Agent';
      let lastName = '';
      if (contactName) {
        const parts = contactName.trim().split(/\s+/);
        firstName = parts[0] || 'Agent';
        lastName = parts.slice(1).join(' ');
      }

      // Check for existing contact by phone to avoid duplicates
      if (phone) {
        const { data: existing } = await supabase
          .from('crm_contacts')
          .select('id')
          .eq('company_id', companyId)
          .eq('phone', phone)
          .maybeSingle();
        
        if (existing) {
          console.log('[INTAKE] CRM contact already exists:', existing.id);
          return;
        }
      }

      const { data: contact, error: contactError } = await supabase
        .from('crm_contacts')
        .insert({
          company_id: companyId,
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          email: email || null,
          whatsapp: whatsapp || phone || null,
          telegram: telegram || null,
          source: 'intake_agent',
          contact_type: 'agent',
          tags: ['intake-auto'],
          notes: `Auto-created from AI Intake. Listing: ${item.suggestedTitle?.en || item.suggestedTitle?.ru || 'Unknown'}`,
        } as any)
        .select('id')
        .single();

      if (contactError) {
        console.error('[INTAKE] Failed to create CRM contact:', contactError);
      } else {
        console.log('[INTAKE] CRM contact created:', contact?.id);
        toast.success(
          language === 'ru'
            ? 'Контакт добавлен в CRM'
            : 'Contact added to CRM'
        );
      }
    } catch (err) {
      console.error('[INTAKE] CRM contact creation error:', err);
    }
  }, [activeCompany, language]);

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
