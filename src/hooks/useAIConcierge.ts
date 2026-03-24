import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { useUserPersonas } from '@/hooks/useUserPersonas';

export interface ConciergeSuggestion {
  icon: string;
  title: string;
  description: string;
  path: string;
  urgency: 'high' | 'medium' | 'low';
}

const CACHE_KEY = 'myuno-concierge-cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  suggestions: ConciergeSuggestion[];
  timestamp: number;
}

function getCached(): ConciergeSuggestion[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedData = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cached.suggestions;
  } catch {
    return null;
  }
}

function setCache(suggestions: ConciergeSuggestion[]) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ suggestions, timestamp: Date.now() })
    );
  } catch { /* ignore */ }
}

export function useAIConcierge() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { activeCode } = useLifeSituationContext();
  const { personas } = useUserPersonas();

  const [suggestions, setSuggestions] = useState<ConciergeSuggestion[]>(() => getCached() || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const saved = sessionStorage.getItem('myuno-concierge-dismissed');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const fetchSuggestions = useCallback(async () => {
    if (!user?.id) return;

    // Check cache first
    const cached = getCached();
    if (cached && cached.length > 0) {
      setSuggestions(cached);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-concierge', {
        body: {
          user_id: user.id,
          language,
          persona: personas[0] || 'tourist',
          life_situation: activeCode || null,
        },
      });

      if (fnError) throw fnError;

      const result = data?.suggestions || [];
      setSuggestions(result);
      setCache(result);
    } catch (e) {
      console.error('Concierge error:', e);
      setError(e instanceof Error ? e.message : 'Failed to load suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, language, personas, activeCode]);

  useEffect(() => {
    if (user?.id) {
      fetchSuggestions();
    }
  }, [user?.id]); // Only fetch on mount/login, not on every context change

  const dismiss = useCallback((title: string) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(title);
      try {
        sessionStorage.setItem('myuno-concierge-dismissed', JSON.stringify([...next]));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  const refresh = useCallback(() => {
    sessionStorage.removeItem(CACHE_KEY);
    fetchSuggestions();
  }, [fetchSuggestions]);

  const visibleSuggestions = suggestions.filter(s => !dismissed.has(s.title));

  return {
    suggestions: visibleSuggestions,
    isLoading,
    error,
    dismiss,
    refresh,
    hasSuggestions: visibleSuggestions.length > 0,
  };
}
