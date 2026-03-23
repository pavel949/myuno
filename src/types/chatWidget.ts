/** Language codes sent to POST /api/chat */
export type ChatWidgetLang = 'ru' | 'en' | 'zh' | 'de' | 'th';

export interface ChatListingPayload {
  id: string;
  title: string;
  price?: number | null;
  currency?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  thumbnail_url?: string | null;
}

export interface ChatApiResponse {
  reply?: string;
  message?: string;
  text?: string;
  leadId?: string;
  quickReplies?: string[];
  listings?: ChatListingPayload[];
}
