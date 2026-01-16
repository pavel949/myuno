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
  ): Promise<{ success: boolean; error?: string; newBalance?: number }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Use atomic RPC function with row-level locking to prevent race conditions
      const { data, error } = await supabase.rpc('pay_from_wallet_atomic', {
        p_user_id: user.id,
        p_amount: amount,
        p_description: description,
        p_description_ru: descriptionRu,
        p_reference_type: referenceType || null,
        p_reference_id: referenceId || null,
      });

      if (error) throw error;

      // Parse the JSONB result
      const result = data as {
        success: boolean;
        error?: string;
        message?: string;
        new_balance?: number;
        transaction_id?: string;
      };

      if (!result.success) {
        return { 
          success: false, 
          error: result.message || result.error || 'Payment failed' 
        };
      }

      // Update local state with the new balance from the atomic operation
      setWallet(prev => prev ? { 
        ...prev, 
        balance: result.new_balance ?? prev.balance - amount 
      } : null);

      return { success: true, newBalance: result.new_balance };
    } catch (error) {
      console.error('Error paying from wallet:', error);
      return { success: false, error: 'Payment failed' };
    }
  }, [user]);

  const refetch = useCallback(() => {
    loadWallet();
  }, [loadWallet]);

  return {
    wallet,
    balance: wallet?.balance ?? 0,
    currency: wallet?.currency ?? 'THB',
    isLoading,
    payFromWallet,
    refetch,
    hasEnoughBalance: (amount: number) => (wallet?.balance ?? 0) >= amount,
  };
};
