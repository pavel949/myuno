import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export interface BookingVoucher {
  id: string;
  voucher_number: string;
  booking_type: string;
  order_id: string | null;
  booking_id: string | null;
  qr_code_data: string;
  pdf_url: string | null;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  is_used: boolean;
  used_at: string | null;
  valid_from: string;
  valid_until: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function useBookingVouchers() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's vouchers
  const { data: vouchers, isLoading, error } = useQuery({
    queryKey: ['booking-vouchers', user?.id],
    queryFn: async (): Promise<BookingVoucher[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('booking_vouchers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as BookingVoucher[];
    },
    enabled: !!user?.id,
  });

  // Generate voucher for an order
  const generateVoucher = useMutation({
    mutationFn: async ({ orderId, bookingId }: { orderId?: string; bookingId?: string }) => {
      const { data, error } = await supabase.functions.invoke('generate-booking-voucher', {
        body: { orderId, bookingId, language },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-vouchers', user?.id] });
      toast({
        title: language === 'ru' ? 'Ваучер создан' : 'Voucher generated',
      });
    },
    onError: () => {
      toast({
        title: language === 'ru' ? 'Ошибка создания ваучера' : 'Failed to generate voucher',
        variant: 'destructive',
      });
    },
  });

  // Get voucher by order or booking ID
  const getVoucherByEntity = async (entityId: string, type: 'order' | 'booking' = 'order') => {
    const column = type === 'order' ? 'order_id' : 'booking_id';
    
    const { data, error } = await supabase
      .from('booking_vouchers')
      .select('*')
      .eq(column, entityId)
      .single();

    if (error) return null;
    return data as BookingVoucher;
  };

  // Download voucher as HTML (can be printed)
  const downloadVoucher = async (orderId?: string, bookingId?: string) => {
    const result = await generateVoucher.mutateAsync({ orderId, bookingId });
    
    if (result.html) {
      // Decode base64 and open in new window for printing
      const html = decodeURIComponent(escape(atob(result.html)));
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }
    }
    
    return result;
  };

  // Share voucher
  const shareVoucher = async (voucher: BookingVoucher) => {
    const shareData = {
      title: `myUNO Voucher #${voucher.voucher_number}`,
      text: language === 'ru' 
        ? `Мой ваучер бронирования #${voucher.voucher_number}` 
        : `My booking voucher #${voucher.voucher_number}`,
      url: `https://uno.ae/voucher/${voucher.voucher_number}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed - silent in production
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareData.url);
      toast({
        title: language === 'ru' ? 'Ссылка скопирована' : 'Link copied',
      });
    }
  };

  return {
    vouchers: vouchers || [],
    isLoading,
    error,
    generateVoucher: generateVoucher.mutateAsync,
    isGenerating: generateVoucher.isPending,
    getVoucherByEntity,
    downloadVoucher,
    shareVoucher,
  };
}
