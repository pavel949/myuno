import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ContentType } from './useContentModeration';

export interface QualityIssue {
  severity: 'critical' | 'warning' | 'info';
  code: string;
  message_en: string;
  message_ru: string;
}

export interface QualityRecommendation {
  action: string;
  impact: 'high' | 'medium' | 'low';
}

export interface QualityReport {
  overall_score: number;
  completeness: {
    has_name_en: boolean;
    has_name_ru: boolean;
    has_description_en: boolean;
    has_description_ru: boolean;
    has_images: boolean;
    image_count: number;
    has_price: boolean;
    has_location: boolean;
  };
  issues: QualityIssue[];
  recommendations: QualityRecommendation[];
  ai_confidence: number;
  ai_explanation?: string;
}

export interface QualityArtifact {
  id: string;
  artifact_type: string;
  entity_type: string;
  entity_id: string;
  data: QualityReport;
  primary_score: number;
  verdict: 'approve' | 'review' | 'suspicious' | 'reject_recommend';
  is_reviewed: boolean;
  admin_action?: string;
  admin_notes?: string;
  correlation_id?: string;
  created_at: string;
}

export interface AnalysisResult {
  success: boolean;
  artifact_id?: string;
  correlation_id?: string;
  report?: QualityReport;
  verdict?: string;
  analysis_time_ms?: number;
  error?: string;
}

export function useListingQualityAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<Record<string, QualityArtifact>>({});
  const { toast } = useToast();

  // Analyze a single listing
  const analyzeListing = useCallback(async (
    entityType: ContentType,
    entityId: string,
    entityData?: Record<string, unknown>
  ): Promise<AnalysisResult | null> => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('listing-quality-analyzer', {
        body: {
          entityType,
          entityId,
          entityData,
        },
      });

      if (error) {
        console.error('[QUALITY] Analysis failed:', error);
        toast({
          title: 'Analysis Failed',
          description: error.message || 'Could not analyze listing',
          variant: 'destructive',
        });
        return null;
      }

      if (data?.success && data.report) {
        // Store result locally for quick access
        const artifact: QualityArtifact = {
          id: data.artifact_id,
          artifact_type: 'listing_quality_report',
          entity_type: entityType,
          entity_id: entityId,
          data: data.report,
          primary_score: data.report.overall_score,
          verdict: data.verdict,
          is_reviewed: false,
          correlation_id: data.correlation_id,
          created_at: new Date().toISOString(),
        };

        setAnalysisResults(prev => ({
          ...prev,
          [`${entityType}-${entityId}`]: artifact,
        }));

        return data as AnalysisResult;
      }

      return data as AnalysisResult;
    } catch (error) {
      console.error('[QUALITY] Analysis error:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze listing quality',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  // Analyze multiple listings (batch)
  const analyzeBatch = useCallback(async (
    items: Array<{ entityType: ContentType; entityId: string }>
  ): Promise<{ successful: number; failed: number }> => {
    setIsAnalyzing(true);
    let successful = 0;
    let failed = 0;

    try {
      // Process in sequence to avoid rate limits
      for (const item of items) {
        const result = await analyzeListing(item.entityType, item.entityId);
        if (result?.success) {
          successful++;
        } else {
          failed++;
        }
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      toast({
        title: 'Batch Analysis Complete',
        description: `Analyzed ${successful} listings successfully${failed > 0 ? `, ${failed} failed` : ''}`,
      });

      return { successful, failed };
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeListing, toast]);

  // Fetch existing artifact for a listing
  const fetchArtifact = useCallback(async (
    entityType: string,
    entityId: string
  ): Promise<QualityArtifact | null> => {
    try {
      const { data, error } = await supabase
        .from('ai_artifacts')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('artifact_type', 'listing_quality_report')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[QUALITY] Fetch artifact error:', error);
        return null;
      }

      if (data) {
        const artifact = data as unknown as QualityArtifact;
        setAnalysisResults(prev => ({
          ...prev,
          [`${entityType}-${entityId}`]: artifact,
        }));
        return artifact;
      }

      return null;
    } catch (error) {
      console.error('[QUALITY] Fetch error:', error);
      return null;
    }
  }, []);

  // Fetch all artifacts for a list of entities
  const fetchArtifactsForEntities = useCallback(async (
    entities: Array<{ entityType: string; entityId: string }>
  ): Promise<void> => {
    if (entities.length === 0) return;

    try {
      // Build OR conditions for each entity
      const entityIds = entities.map(e => e.entityId);
      
      const { data, error } = await supabase
        .from('ai_artifacts')
        .select('*')
        .eq('artifact_type', 'listing_quality_report')
        .in('entity_id', entityIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[QUALITY] Fetch artifacts error:', error);
        return;
      }

      if (data) {
        const results: Record<string, QualityArtifact> = {};
        // Group by entity, keeping only the latest
        for (const item of data) {
          const key = `${item.entity_type}-${item.entity_id}`;
          if (!results[key]) {
            results[key] = item as unknown as QualityArtifact;
          }
        }
        setAnalysisResults(prev => ({ ...prev, ...results }));
      }
    } catch (error) {
      console.error('[QUALITY] Batch fetch error:', error);
    }
  }, []);

  // Update admin action on artifact
  const updateArtifactAction = useCallback(async (
    artifactId: string,
    action: 'acknowledged' | 'dismissed' | 'escalated' | 'actioned',
    notes?: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ai_artifacts')
        .update({
          is_reviewed: true,
          admin_action: action,
          admin_notes: notes || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', artifactId);

      if (error) {
        console.error('[QUALITY] Update artifact error:', error);
        toast({
          title: 'Error',
          description: 'Failed to update artifact',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Updated',
        description: `AI insight ${action}`,
      });

      return true;
    } catch (error) {
      console.error('[QUALITY] Update error:', error);
      return false;
    }
  }, [toast]);

  // Get cached result for an entity
  const getResult = useCallback((entityType: string, entityId: string): QualityArtifact | undefined => {
    return analysisResults[`${entityType}-${entityId}`];
  }, [analysisResults]);

  return {
    isAnalyzing,
    analysisResults,
    analyzeListing,
    analyzeBatch,
    fetchArtifact,
    fetchArtifactsForEntities,
    updateArtifactAction,
    getResult,
  };
}
