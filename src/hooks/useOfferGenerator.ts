/**
 * AI Offer Generator
 * Generates multilingual (RU/EN) property offers via Claude API (Edge Function).
 */
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type OfferLanguage = 'ru' | 'en';
export type OfferDealType = 'new_project' | 'secondary' | 'str' | 'ltr';
export type OfferTone = 'professional' | 'friendly' | 'luxury';
export type OfferLength = 'short' | 'medium' | 'long';
export type OfferChannel = 'whatsapp' | 'email' | 'sms';

export interface OfferGeneratorInput {
  dealId: string;
  language: OfferLanguage;
  dealType: OfferDealType;
  tone: OfferTone;
  length: OfferLength;
  channel: OfferChannel;
  clientName: string;
  clientPhone?: string | null;
  clientEmail?: string | null;
  // Financial context
  budgetMin?: number | null;
  budgetMax?: number | null;
  currency?: string | null;
  preferredDistricts?: string[] | null;
  preferredTypes?: string[] | null;
  bedroomsMin?: number | null;
  notes?: string | null;
  // NEW_PROJECT specific
  projectName?: string;
  projectROI?: number;
  projectOccupancy?: number;
  projectNightlyRate?: number;
  projectPrice?: number;
  projectCompletion?: string;
  // STR specific
  strMonthlyIncome?: number;
  strOccupancy?: number;
  // LTR specific
  ltrMonthlyRent?: number;
  ltrLeaseTerms?: string;
}

export interface OfferGeneratorResult {
  offerText: string;
  subject?: string;
  language: OfferLanguage;
  dealType: OfferDealType;
  channel: OfferChannel;
}

function buildFinancialBlock(input: OfferGeneratorInput): string {
  const currency = input.currency || 'THB';
  const parts: string[] = [];

  if (input.budgetMin || input.budgetMax) {
    const min = input.budgetMin ? `${(input.budgetMin / 1e6).toFixed(1)}M` : '';
    const max = input.budgetMax ? `${(input.budgetMax / 1e6).toFixed(1)}M` : '';
    parts.push(`Budget: ${min}–${max} ${currency}`);
  }
  if (input.preferredDistricts?.length) {
    parts.push(`Districts: ${input.preferredDistricts.join(', ')}`);
  }
  if (input.preferredTypes?.length) {
    parts.push(`Property types: ${input.preferredTypes.join(', ')}`);
  }
  if (input.bedroomsMin) {
    parts.push(`Min bedrooms: ${input.bedroomsMin}`);
  }

  if (input.dealType === 'new_project') {
    if (input.projectName) parts.push(`Project: ${input.projectName}`);
    if (input.projectPrice) parts.push(`Price: ${(input.projectPrice / 1e6).toFixed(1)}M ${currency}`);
    if (input.projectROI) parts.push(`Expected ROI: ${input.projectROI}%/year`);
    if (input.projectOccupancy) parts.push(`Avg occupancy: ${input.projectOccupancy}%`);
    if (input.projectNightlyRate) parts.push(`Nightly rate: ${input.projectNightlyRate.toLocaleString()} ${currency}`);
    if (input.projectCompletion) parts.push(`Completion: ${input.projectCompletion}`);
  } else if (input.dealType === 'str') {
    if (input.strMonthlyIncome) parts.push(`Monthly income: ${input.strMonthlyIncome.toLocaleString()} ${currency}`);
    if (input.strOccupancy) parts.push(`Occupancy: ${input.strOccupancy}%`);
  } else if (input.dealType === 'ltr') {
    if (input.ltrMonthlyRent) parts.push(`Monthly rent: ${input.ltrMonthlyRent.toLocaleString()} ${currency}`);
    if (input.ltrLeaseTerms) parts.push(`Lease terms: ${input.ltrLeaseTerms}`);
  }

  if (input.notes) parts.push(`Notes: ${input.notes}`);

  return parts.join('\n');
}

const DEAL_TYPE_CONTEXT: Record<OfferDealType, { en: string; ru: string }> = {
  new_project: {
    en: 'new off-plan development (focus on ROI, payment plan, capital appreciation, developer track record)',
    ru: 'новый офф-план проект (акцент на ROI, рассрочка, прирост капитала, репутация застройщика)',
  },
  secondary: {
    en: 'secondary market resale property (focus on ready to move in, title clarity, market value comparison)',
    ru: 'вторичный рынок (акцент на готовность к заселению, чистота документов, сравнение с рынком)',
  },
  str: {
    en: 'short-term rental investment (focus on monthly income, occupancy rate, management ease)',
    ru: 'краткосрочная аренда (акцент на ежемесячный доход, заполняемость, управление)',
  },
  ltr: {
    en: 'long-term rental (focus on stable monthly income, tenant vetting, lease security)',
    ru: 'долгосрочная аренда (акцент на стабильный доход, проверка арендатора, безопасность договора)',
  },
};

const LENGTH_WORDS: Record<OfferLength, string> = {
  short: '100-150 words',
  medium: '200-300 words',
  long: '400-500 words',
};

const TONE_CONTEXT: Record<OfferTone, string> = {
  professional: 'professional and formal, building trust with data and facts',
  friendly: 'warm and personal, like talking to a knowledgeable friend',
  luxury: 'premium and exclusive, speaking to high-net-worth individuals',
};

export function useGenerateOffer() {
  return useMutation({
    mutationFn: async (input: OfferGeneratorInput): Promise<OfferGeneratorResult> => {
      const financialBlock = buildFinancialBlock(input);
      const dealContext = DEAL_TYPE_CONTEXT[input.dealType];
      const dealContextText = input.language === 'ru' ? dealContext.ru : dealContext.en;
      const lengthGuide = LENGTH_WORDS[input.length];
      const toneGuide = TONE_CONTEXT[input.tone];
      const isRu = input.language === 'ru';

      const systemPrompt = isRu
        ? `Ты — опытный агент по недвижимости в Пхукете, Таиланд (Ignatev Estate). Пишешь коммерческое предложение клиенту по-русски. Стиль: ${toneGuide}. Длина: ${lengthGuide}. Контекст сделки: ${dealContextText}. Используй конкретные цифры из данных клиента. Не используй шаблонные фразы. Заканчивай чётким призывом к действию.`
        : `You are an experienced real estate agent in Phuket, Thailand (Ignatev Estate). Write a property offer to a client in English. Style: ${toneGuide}. Length: ${lengthGuide}. Deal context: ${dealContextText}. Use specific numbers from the client data. Avoid generic phrases. End with a clear call to action.`;

      const userPrompt = isRu
        ? `Клиент: ${input.clientName}\nКанал: ${input.channel}\n\nДанные:\n${financialBlock}\n\nНапиши персонализированное предложение.`
        : `Client: ${input.clientName}\nChannel: ${input.channel}\n\nData:\n${financialBlock}\n\nWrite a personalized offer.`;

      const { data, error } = await supabase.functions.invoke('ai-generate-offer', {
        body: {
          system: systemPrompt,
          user: userPrompt,
          language: input.language,
          dealType: input.dealType,
          channel: input.channel,
          clientName: input.clientName,
          dealId: input.dealId,
        },
      });

      if (error) throw new Error(error.message || 'Failed to generate offer');
      if (!data?.offerText) throw new Error('No offer text returned');

      return {
        offerText: data.offerText,
        subject: data.subject,
        language: input.language,
        dealType: input.dealType,
        channel: input.channel,
      };
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to generate offer');
    },
  });
}
