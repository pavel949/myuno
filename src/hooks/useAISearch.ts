import { useState, useEffect, useCallback, useRef } from 'react';
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
  // Regular search results
  searchResults: SearchResult[];
  isSearching: boolean;
  
  // AI response
  aiResponse: AISearchResponse | null;
  isAILoading: boolean;
  aiError: string | null;
  
  // Combined state
  isLoading: boolean;
  mode: 'search' | 'ai' | 'idle';
}

// Question indicators for quick client-side check
const QUESTION_INDICATORS_RU = [
  'где', 'как', 'что', 'куда', 'когда', 'почему', 'какой', 'какая', 'какие',
  'можно', 'лучше', 'посоветуй', 'подскажи', 'помоги', 'хочу', 'нужен', 'нужна',
  'ищу', 'рекомендуй', 'сколько', 'есть ли', 'стоит ли'
];

const QUESTION_INDICATORS_EN = [
  'where', 'how', 'what', 'when', 'why', 'which', 'can', 'should', 'could',
  'recommend', 'suggest', 'help', 'find', 'looking', 'best', 'good', 'need',
  'want', 'is there', 'are there', 'how much'
];

function isLikelyQuestion(query: string, language: string): boolean {
  const lowerQuery = query.toLowerCase().trim();
  
  if (lowerQuery.includes('?')) return true;
  
  const indicators = language === 'ru' ? QUESTION_INDICATORS_RU : QUESTION_INDICATORS_EN;
  
  for (const indicator of indicators) {
    if (lowerQuery.startsWith(indicator) || lowerQuery.includes(` ${indicator} `)) {
      return true;
    }
  }
  
  // Longer queries are likely questions
  const wordCount = lowerQuery.split(/\s+/).length;
  return wordCount > 4;
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
  const lastQueryRef = useRef<string>('');
  const isRequestingRef = useRef(false);
  
  // Memoize personas to prevent re-renders
  const personasKey = personas.join(',');
  
  // Determine if query looks like a question
  const isQuestion = query.length >= 3 && isLikelyQuestion(query, language);
  
  // Use regular search for non-questions or as fallback
  const { results: searchResults, isLoading: isSearching } = useGlobalSearch(
    query, 
    enabled && !isQuestion
  );

  // AI search effect
  useEffect(() => {
    let isMounted = true;
    
    const trimmedQuery = query.trim();
    
    if (!enabled || !trimmedQuery || trimmedQuery.length < 3 || !isQuestion) {
      setAiResponse(null);
      setAiError(null);
      lastQueryRef.current = '';
      isRequestingRef.current = false;
      return;
    }

    // Prevent duplicate requests for the same query
    if (trimmedQuery === lastQueryRef.current) {
      return;
    }
    
    // Prevent concurrent requests
    if (isRequestingRef.current) {
      return;
    }

    const searchTimeout = setTimeout(async () => {
      if (!isMounted) return;
      
      // Double-check to prevent race conditions
      if (isRequestingRef.current || trimmedQuery === lastQueryRef.current) {
        return;
      }
      
      isRequestingRef.current = true;
      lastQueryRef.current = trimmedQuery;
      setIsAILoading(true);
      setAiError(null);

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

        if (isMounted) {
          if (data.type === 'search') {
            // AI determined this should be regular search
            setAiResponse(null);
          } else {
            setAiResponse(data);
          }
        }
      } catch (err) {
        console.error('AI search error:', err);
        if (isMounted) {
          setAiError(err instanceof Error ? err.message : 'AI search failed');
          setAiResponse(null);
          // Reset lastQuery on error to allow retry
          lastQueryRef.current = '';
        }
      } finally {
        isRequestingRef.current = false;
        if (isMounted) {
          setIsAILoading(false);
        }
      }
    }, 600); // Debounce

    return () => {
      isMounted = false;
      clearTimeout(searchTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, enabled, language, isQuestion, personasKey]);

  // Determine current mode
  const mode: 'search' | 'ai' | 'idle' = !query.trim() 
    ? 'idle' 
    : isQuestion 
      ? 'ai' 
      : 'search';

  return {
    searchResults,
    isSearching,
    aiResponse,
    isAILoading,
    aiError,
    isLoading: isSearching || isAILoading,
    mode
  };
}
