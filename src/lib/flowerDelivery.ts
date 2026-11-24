import { supabase } from '@/integrations/supabase/client';

const uuidPattern = '[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}';
const bouquetVariant = new RegExp('^bouquet-(' + uuidPattern + ')-([SML])$', 'i');
const shopProduct = new RegExp('^flowers-' + uuidPattern + '-(' + uuidPattern + ')$', 'i');
export const flowerReceiptPattern = new RegExp('^' + uuidPattern + '$', 'i');

export function readFlowerCartLine(id: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return null;
  const match = bouquetVariant.exec(id) ?? shopProduct.exec(id);
  return match ? { bouquet_id: match[1].toLowerCase(), size: match[2]?.toUpperCase() ?? null, quantity } : null;
}

export const FLOWER_WINDOWS = { morning: '09:00–12:00', afternoon: '12:00–17:00', evening: '17:00–21:00' } as const;

export interface FlowerDeliveryRequest {
  id: string;
  request: {
    recipient: string;
    phone: string;
    address: string;
    date: string;
    slot: keyof typeof FLOWER_WINDOWS;
    note: string;
    items: NonNullable<ReturnType<typeof readFlowerCartLine>>[];
  };
  estimate: FlowerQuote | null;
  confirmed_quote: FlowerQuote | null;
  status: 'pending' | 'confirmed' | 'unavailable';
}

export interface FlowerQuote {
  currency: 'THB';
  subtotal: number;
  delivery_fee: number;
  total: number;
  items: { bouquet_id: string; size: string | null; quantity: number; name_en: string; name_ru: string; unit_price: number }[];
}

interface DeliveryRpc {
  request_flower_delivery: { args: { payload: FlowerDeliveryRequest['request'] & { request_key: string } }; value: string };
  get_flower_delivery: { args: { p_id: string }; value: FlowerDeliveryRequest | null };
  list_pending_flower_deliveries: { args: Record<string, never>; value: FlowerDeliveryRequest[] };
  review_flower_delivery: { args: { p_id: string; p_confirm: boolean; p_expected_quote: FlowerQuote | null }; value: { status: 'confirmed' | 'unavailable' | 'expired' | 'quote_changed' | 'quote_missing' } };
}

export async function flowerDeliveryRpc<Name extends keyof DeliveryRpc>(name: Name, args: DeliveryRpc[Name]['args']): Promise<DeliveryRpc[Name]['value']> {
  type Call = (name: Name, args: DeliveryRpc[Name]['args']) => PromiseLike<{ data: DeliveryRpc[Name]['value']; error: unknown }>;
  const { data, error } = await (supabase.rpc as unknown as Call).call(supabase, name, args);
  if (error) throw error;
  return data;
}
