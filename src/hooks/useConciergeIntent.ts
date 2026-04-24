/**
 * useConciergeIntent — M10d hook for free-text intent routing.
 *
 * Maintains in-memory conversation state and calls the `concierge-intent`
 * edge function with full history each turn (per chatbot best practices).
 *
 * Conversation is NOT persisted — guest-friendly and resets on page reload.
 * If we want to persist later, store in `concierge_conversations` table.
 */
import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCanonicalProfile } from '@/hooks/useCanonicalProfile';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** Suggested route attached to this assistant turn (markdown CTA). */
  route?: string | null;
  routeLabel?: { en: string; ru: string } | null;
  cluster?: string | null;
  isError?: boolean;
}

interface IntentResponse {
  reply: string;
  route: string | null;
  route_label: { en: string; ru: string } | null;
  cluster: string | null;
  model: string;
}

export function useConciergeIntent() {
  const { language } = useLanguage();
  const { profile } = useCanonicalProfile();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPending, setIsPending] = useState(false);

  const reset = useCallback(() => {
    setMessages([]);
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isPending) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: trimmed,
      };

      // Build full history for the API (assistants + users only)
      const historyForApi = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      setMessages(prev => [...prev, userMsg]);
      setIsPending(true);

      try {
        const { data, error } = await supabase.functions.invoke<IntentResponse>(
          'concierge-intent',
          {
            body: {
              messages: historyForApi,
              language,
              persona: profile?.detectedPersona ?? null,
            },
          },
        );

        if (error) throw error;
        if (!data) throw new Error('Empty response');

        const assistantMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          route: data.route,
          routeLabel: data.route_label,
          cluster: data.cluster,
        };
        setMessages(prev => [...prev, assistantMsg]);
      } catch (err) {
        const errorMsg: ChatMessage = {
          id: `a-err-${Date.now()}`,
          role: 'assistant',
          content:
            language === 'ru'
              ? 'Что-то пошло не так. Попробуйте ещё раз через минуту.'
              : 'Something went wrong. Please try again in a minute.',
          isError: true,
        };
        setMessages(prev => [...prev, errorMsg]);
        // eslint-disable-next-line no-console
        console.error('concierge-intent failed', err);
      } finally {
        setIsPending(false);
      }
    },
    [messages, isPending, language, profile?.detectedPersona],
  );

  return { messages, isPending, send, reset };
}
