/**
 * Chat translation-target rule (frontend mirror of the `thai-chat-send` edge fn).
 *
 * A Russian message is translated to Thai (the owner reads TH); anything else
 * (TH/EN from the owner) is translated to Russian (the customer reads RU).
 * Kept here as a pure, unit-tested function; the edge function applies the same
 * rule server-side where the actual translation + persistence happens.
 */
import type { ChatLang } from '@/types/thaiBusiness';

export function chatTargetLang(senderLang: ChatLang): ChatLang {
  return senderLang === 'ru' ? 'th' : 'ru';
}
