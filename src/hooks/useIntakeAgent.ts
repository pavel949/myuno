import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { isValidIntakeTable, VALID_INTAKE_TABLES } from '@/lib/providerIdMapping';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { getVerticalById } from '@/lib/intakeVerticals';
import { validateIntakeItem } from '@/lib/intake/validateItem';

export interface IntakeProgress {
  total: number;
  processed: number;
  failed: number;
  currentTitle: string | null;
}

export interface ExtractedField {
  value: unknown;
  confidence: number;
  source: 'text' | 'scraped' | 'image' | 'inferred';
}

/**
 * Persistent failure record for an intake item that couldn't be approved.
 * Surfaced in the admin "Failed" queue so operators can see *why* and retry.
 */
export interface IntakeItemError {
  /** Machine-readable category */
  code: 'validation' | 'unknown_table' | 'schema' | 'status' | 'network' | 'unknown';
  /** Human-readable description (already localized when possible) */
  message: string;
  /** Required fields the item was missing (only set for code === 'validation') */
  missing?: string[];
  /** Target table that rejected the row (when known) */
  table?: string;
  /** ISO timestamp of the failure */
  occurredAt: string;
}

export interface IntakeItem {
  id: string;
  status: 'pending' | 'approved' | 'discarded' | 'created' | 'failed';

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

  /** Last failure (set when approve fails — kept until item is retried/discarded) */
  lastError?: IntakeItemError;
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
  const [progress, setProgress] = useState<IntakeProgress | null>(null);

  // Analyze input (single or bulk)
  const analyze = useCallback(async (options: {
    mode: 'single' | 'bulk_text' | 'bulk_urls' | 'files' | 'agent_message' | 'csv';
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
      
      // Map UI mode to edge-function mode. CSV is sent as bulk_text (records joined with ---).
      const edgeMode: 'single' | 'bulk_text' | 'bulk_urls' | 'files' | 'agent_message' =
        options.mode === 'csv' ? 'bulk_text' : options.mode;

      const body = {
        mode: edgeMode,
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
  const approveItem = useCallback(async (itemId: string, opts?: { silent?: boolean }) => {
    if (!session) return false;
    
    const item = session.items.find(i => i.id === itemId);
    if (!item) return false;

    // Helper: persist a failure on the item so it shows up in the "Failed" admin queue.
    const recordFailure = (err: IntakeItemError) => {
      updateItem(itemId, { status: 'failed', lastError: err });
    };

    // P0: Validation gate — block invalid items AND surface them in the failed queue
    const validation = validateIntakeItem(item);
    if (!validation.valid) {
      const message = language === 'ru'
        ? `Не хватает обязательных полей: ${validation.missing.join(', ')}`
        : `Missing required fields: ${validation.missing.join(', ')}`;
      recordFailure({
        code: 'validation',
        message,
        missing: validation.missing,
        occurredAt: new Date().toISOString(),
      });
      if (!opts?.silent) toast.error(message);
      return false;
    }

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
      if (!fields.description_ru && item.suggestedDescription?.ru) {
        fields.description_ru = item.suggestedDescription.ru;
      }
      // Attach resolved cloud images to listing
      if (!fields.images && item.sourceImages && item.sourceImages.length > 0) {
        fields.images = item.sourceImages;
      }
      // Set first image as cover/main image if not already set
      if (!fields.cover_image && item.sourceImages && item.sourceImages.length > 0) {
        fields.cover_image = item.sourceImages[0];
      }
      if (!fields.image && item.sourceImages && item.sourceImages.length > 0) {
        fields.image = item.sourceImages[0];
      }

      // P0 FIX: Resolve target table from vertical config (not the vertical id itself!)
      const verticalConfig = getVerticalById(item.detectedVertical);
      const targetTable = verticalConfig?.table ?? item.detectedVertical;

      if (!isValidIntakeTable(targetTable)) {
        const errorMsg = language === 'ru'
          ? `Неизвестная таблица: ${targetTable} (вертикаль ${item.detectedVertical})`
          : `Unknown table: ${targetTable} (vertical ${item.detectedVertical})`;
        recordFailure({
          code: 'unknown_table',
          message: errorMsg,
          table: targetTable,
          occurredAt: new Date().toISOString(),
        });
        if (!opts?.silent) toast.error(errorMsg);
        return false;
      }

      // Call bulk-import to create the listing
      const { data, error: fnError } = await supabase.functions.invoke('bulk-import', {
        body: {
          table: targetTable,
          records: [fields]
        }
      });

      if (fnError) throw fnError;

      if (data.inserted > 0) {
        const insertedId = data.inserted_ids?.[0] ?? null;
        updateItem(itemId, {
          status: 'created',
          createdListingTable: targetTable,
          lastError: undefined,
          ...(insertedId ? { createdListingId: insertedId } : {}),
        });

        setSession(prev => prev ? {
          ...prev,
          approvedCount: prev.approvedCount + 1
        } : prev);

        // Auto-create CRM contact from extracted contact info
        await createCrmContactFromItem(item);

        // Audit log — non-blocking
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('admin_audit_logs').insert({
              admin_id: user.id,
              action: 'intake_approve',
              entity_type: targetTable,
              entity_id: insertedId,
              new_data: {
                vertical: item.detectedVertical,
                source: item.sourceUrl ? 'url' : item.sourceImages?.length ? 'files' : 'text',
                title: item.suggestedTitle?.en || item.suggestedTitle?.ru,
                health: item.overallConfidence,
              },
            } as any);
          }
        } catch (auditErr) {
          logger.log('[INTAKE] audit log skipped:', auditErr);
        }

        if (!opts?.silent) {
          toast.success(
            language === 'ru'
              ? 'Листинг создан и отправлен на модерацию'
              : 'Listing created and sent to moderation'
          );
        }
        return true;
      } else {
        // bulk-import responded but inserted nothing — surface schema/status reason
        const reason = data?.errors?.[0] || (language === 'ru' ? 'Не удалось создать листинг' : 'Failed to create listing');
        const code: IntakeItemError['code'] =
          /status|approval|moderation/i.test(String(reason)) ? 'status' : 'schema';
        recordFailure({
          code,
          message: String(reason),
          table: targetTable,
          occurredAt: new Date().toISOString(),
        });
        if (!opts?.silent) toast.error(String(reason));
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve';
      // Classify common failure modes from edge function / network
      let code: IntakeItemError['code'] = 'unknown';
      if (/fetch|network|timeout|cors/i.test(message)) code = 'network';
      else if (/column|constraint|null value|violates|invalid input|enum/i.test(message)) code = 'schema';
      else if (/status|approval|admin/i.test(message)) code = 'status';
      recordFailure({
        code,
        message,
        occurredAt: new Date().toISOString(),
      });
      if (!opts?.silent) toast.error(message);
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
          logger.log('[INTAKE] CRM contact already exists:', existing.id);
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
        logger.log('[INTAKE] CRM contact created:', contact?.id);
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

  // Approve all pending items — skips invalid, tracks progress
  const approveAll = useCallback(async () => {
    if (!session) return;

    const pendingItems = session.items.filter(i => i.status === 'pending');

    // Pre-split: valid vs invalid
    const validItems = pendingItems.filter(i => validateIntakeItem(i).valid);
    const skippedCount = pendingItems.length - validItems.length;

    setProgress({
      total: validItems.length,
      processed: 0,
      failed: 0,
      currentTitle: null,
    });

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      setProgress({
        total: validItems.length,
        processed: i,
        failed: failedCount,
        currentTitle: item.suggestedTitle?.en || item.suggestedTitle?.ru || null,
      });

      const success = await approveItem(item.id, { silent: true });
      if (success) successCount++;
      else failedCount++;
    }

    setProgress({
      total: validItems.length,
      processed: validItems.length,
      failed: failedCount,
      currentTitle: null,
    });

    toast.success(
      language === 'ru'
        ? `Создано ${successCount} из ${pendingItems.length}${skippedCount > 0 ? ` (${skippedCount} пропущено)` : ''}`
        : `Created ${successCount} of ${pendingItems.length}${skippedCount > 0 ? ` (${skippedCount} skipped)` : ''}`
    );

    // Auto-clear progress after 3s
    setTimeout(() => setProgress(null), 3000);
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
      i.status === 'pending' && validateIntakeItem(i).valid
    ).length,
    needsReview: session.items.filter(i => 
      i.status === 'pending' && (!validateIntakeItem(i).valid || i.overallConfidence < 0.7)
    ).length,
  } : null;

  // Reset session
  const reset = useCallback(() => {
    setSession(null);
    setError(null);
    setProgress(null);
  }, []);

  return {
    session,
    summary,
    isProcessing,
    isApproving,
    progress,
    error,
    analyze,
    updateItem,
    approveItem,
    discardItem,
    approveAll,
    reset,
  };
}
