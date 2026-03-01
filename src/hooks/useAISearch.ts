import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGlobalSearch, SearchResult } from './useGlobalSearch';

export interface AISearchResponse {
  type: 'ai_answer' | 'search';
  answer?: string;
  suggestedCategories: string[];
  suggestedServices: Array<{
    type: string;
    query: string;
    reason: string;
  }>;
}

interface UseAISearchResult {
  // Regular search results (always active)
  searchResults: SearchResult[];
  isSearching: boolean;
  
  // AI response (opt-in only)
  aiResponse: AISearchResponse | null;
  isAILoading: boolean;
  aiError: string | null;
  
  // Trigger AI manually
  triggerAI: () => void;
  
  // Combined state
  isLoading: boolean;
}

export function useAISearch(
  query: string, 
  enabled: boolean = true,
  personas: string[] = []
): UseAISearchResult {
  const { language } = useLanguage();
  const [aiResponse, setAiResponse] = useState<AISearchResponse | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const lastAIQueryRef = useRef<string>('');
  
  // Always use regular search as default — no mode switching
  const { results: searchResults, isLoading: isSearching } = useGlobalSearch(query, enabled);

  // AI is opt-in only: user clicks "Ask AI" or types "?" prefix
  const triggerAI = useCallback(async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length < 3) return;
    if (trimmedQuery === lastAIQueryRef.current) return;
    
    lastAIQueryRef.current = trimmedQuery;
    setIsAILoading(true);
    setAiError(null);
    setAiResponse(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-smart-search', {
        body: { 
          query: trimmedQuery, 
          language,
          personas 
        }
      });

      if (error) {
        throw new Error(error.message || 'AI search failed');
      }

      if (data?.type === 'search') {
        setAiResponse(null);
      } else {
        setAiResponse(data);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI search failed');
      setAiResponse(null);
      lastAIQueryRef.current = '';
    } finally {
      setIsAILoading(false);
    }
  }, [query, language, personas]);

  return {
    searchResults,
    isSearching,
    aiResponse,
    isAILoading,
    aiError,
    triggerAI,
    isLoading: isSearching || isAILoading,
  };
}
