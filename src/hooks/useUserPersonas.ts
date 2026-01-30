import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserPersona = 'tourist' | 'resident' | 'property_owner';

interface UserPersonaRecord {
  id: string;
  user_id: string;
  persona: UserPersona;
  is_active: boolean;
  created_at: string;
}

export function useUserPersonas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const queryKey = ['user-personas', user?.id];

  // Fetch user's active personas
  const { data: personas = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async (): Promise<UserPersona[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_personas')
        .select('persona')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (error) throw error;
      return (data || []).map(r => r.persona as UserPersona);
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });

  // Toggle a persona on/off
  const togglePersonaMutation = useMutation({
    mutationFn: async (persona: UserPersona) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const isActive = personas.includes(persona);
      
      if (isActive) {
        // Remove persona
        const { error } = await supabase
          .from('user_personas')
          .delete()
          .eq('user_id', user.id)
          .eq('persona', persona);
        
        if (error) throw error;
      } else {
        // Add persona (upsert in case it exists but is inactive)
        const { error } = await supabase
          .from('user_personas')
          .upsert(
            { user_id: user.id, persona, is_active: true },
            { onConflict: 'user_id,persona' }
          );
        
        if (error) throw error;
      }
      
      return { persona, wasActive: isActive };
    },
    onMutate: async (persona) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot previous value
      const previousPersonas = queryClient.getQueryData<UserPersona[]>(queryKey);
      
      // Optimistically update
      queryClient.setQueryData<UserPersona[]>(queryKey, (old = []) => {
        if (old.includes(persona)) {
          return old.filter(p => p !== persona);
        }
        return [...old, persona];
      });
      
      return { previousPersonas };
    },
    onError: (err, persona, context) => {
      // Rollback on error
      if (context?.previousPersonas) {
        queryClient.setQueryData(queryKey, context.previousPersonas);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Set multiple personas at once
  const setPersonasMutation = useMutation({
    mutationFn: async (newPersonas: UserPersona[]) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Delete all existing personas
      await supabase
        .from('user_personas')
        .delete()
        .eq('user_id', user.id);
      
      // Insert new ones if any
      if (newPersonas.length > 0) {
        const { error } = await supabase
          .from('user_personas')
          .insert(newPersonas.map(persona => ({
            user_id: user.id,
            persona,
            is_active: true,
          })));
        
        if (error) throw error;
      }
      
      return newPersonas;
    },
    onSuccess: (newPersonas) => {
      queryClient.setQueryData(queryKey, newPersonas);
    },
  });

  return {
    personas,
    isLoading,
    error,
    isAuthenticated: !!user,
    togglePersona: togglePersonaMutation.mutate,
    setPersonas: setPersonasMutation.mutate,
    isToggling: togglePersonaMutation.isPending,
    isSetting: setPersonasMutation.isPending,
  };
}

// Helper to check if user has a specific persona
export function hasPersona(personas: UserPersona[], persona: UserPersona): boolean {
  return personas.includes(persona);
}

// Get display info for personas
export const PERSONA_INFO: Record<UserPersona, {
  labelEn: string;
  labelRu: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  tourist: {
    labelEn: 'Tourist',
    labelRu: 'Турист',
    icon: '✈️',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-500/10',
  },
  resident: {
    labelEn: 'Resident',
    labelRu: 'Резидент',
    icon: '🏠',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
  },
  property_owner: {
    labelEn: 'Owner',
    labelRu: 'Владелец',
    icon: '🏢',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
  },
};
