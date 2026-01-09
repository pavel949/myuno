import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface WalletData {
  id: string;
  balance: number;
  currency: string;
}

export const useWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadWallet = useCallback(async () => {
    if (!user) {
      setWallet(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_or_create_wallet', { p_user_id: user.id });

      if (error) throw error;

      if (data) {
        setWallet({
          id: data.id,
          balance: Number(data.balance),
          currency: data.currency,
        });
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const payFromWallet = useCallback(async (
    amount: number,
    description: string,
    descriptionRu: string,
    referenceType?: string,
    referenceId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user || !wallet) {
      return { success: false, error: 'User not authenticated or wallet not found' };
    }

    if (wallet.balance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    try {
      // Deduct balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance: wallet.balance - amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          user_id: user.id,
          type: 'payment',
          amount: amount,
          currency: wallet.currency,
          description: description,
          description_ru: descriptionRu,
          reference_type: referenceType,
          reference_id: referenceId,
          status: 'completed',
        });

      if (txError) throw txError;

      // Update local state
      setWallet(prev => prev ? { ...prev, balance: prev.balance - amount } : null);

      return { success: true };
    } catch (error) {
      console.error('Error paying from wallet:', error);
      return { success: false, error: 'Payment failed' };
    }
  }, [user, wallet]);

  const refetch = useCallback(() => {
    loadWallet();
  }, [loadWallet]);

  return {
    wallet,
    balance: wallet?.balance ?? 0,
    currency: wallet?.currency ?? 'RUB',
    isLoading,
    payFromWallet,
    refetch,
    hasEnoughBalance: (amount: number) => (wallet?.balance ?? 0) >= amount,
  };
};
