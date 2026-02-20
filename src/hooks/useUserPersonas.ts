import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserPersona = 'tourist' | 'resident' | 'property_owner' | 'investor';

const GUEST_PERSONAS_KEY = 'myuno-guest-personas';

interface UserPersonaRecord {
  id: string;
  user_id: string;
  persona: UserPersona;
  is_active: boolean;
  created_at: string;
}

// Guest personas hook (localStorage-based)
function useGuestPersonas() {
  const [personas, setPersonas] = useState<UserPersona[]>(() => {
    try {
      const saved = localStorage.getItem(GUEST_PERSONAS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const togglePersona = useCallback((persona: UserPersona) => {
    setPersonas(prev => {
      const newPersonas = prev.includes(persona)
        ? prev.filter(p => p !== persona)
        : [...prev, persona];
      localStorage.setItem(GUEST_PERSONAS_KEY, JSON.stringify(newPersonas));
      return newPersonas;
    });
  }, []);

  const setPersonasAll = useCallback((newPersonas: UserPersona[]) => {
    setPersonas(newPersonas);
    localStorage.setItem(GUEST_PERSONAS_KEY, JSON.stringify(newPersonas));
  }, []);

  return {
    personas,
    togglePersona,
    setPersonas: setPersonasAll,
    isLoading: false,
    isToggling: false,
  };
}

export function useUserPersonas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const guestHook = useGuestPersonas();
  
  const queryKey = ['user-personas', user?.id];

  // Fetch user's active personas (authenticated users)
  const { data: dbPersonas = [], isLoading, error } = useQuery({
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
    staleTime: 60000,
  });

  // Toggle a persona on/off (authenticated users)
  const togglePersonaMutation = useMutation({
    mutationFn: async (persona: UserPersona) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Investor persona is handled client-side only for now (not in DB schema)
      if (persona === 'investor') {
        return { persona, wasActive: dbPersonas.includes(persona) };
      }
      
      const isActive = dbPersonas.includes(persona);
      
      if (isActive) {
        const { error } = await supabase
          .from('user_personas')
          .delete()
          .eq('user_id', user.id)
          .eq('persona', persona as 'tourist' | 'resident' | 'property_owner');
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_personas')
          .upsert(
            { user_id: user.id, persona: persona as 'tourist' | 'resident' | 'property_owner', is_active: true },
            { onConflict: 'user_id,persona' }
          );
        
        if (error) throw error;
      }
      
      return { persona, wasActive: isActive };
    },
    onMutate: async (persona) => {
      await queryClient.cancelQueries({ queryKey });
      const previousPersonas = queryClient.getQueryData<UserPersona[]>(queryKey);
      
      queryClient.setQueryData<UserPersona[]>(queryKey, (old = []) => {
        if (old.includes(persona)) {
          return old.filter(p => p !== persona);
        }
        return [...old, persona];
      });
      
      return { previousPersonas };
    },
    onError: (err, persona, context) => {
      if (context?.previousPersonas) {
        queryClient.setQueryData(queryKey, context.previousPersonas);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Set multiple personas at once (authenticated users)
  const setPersonasMutation = useMutation({
    mutationFn: async (newPersonas: UserPersona[]) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Filter out investor persona (client-side only)
      const dbPersonasToSet = newPersonas.filter(p => p !== 'investor') as ('tourist' | 'resident' | 'property_owner')[];
      
      await supabase
        .from('user_personas')
        .delete()
        .eq('user_id', user.id);
      
      if (dbPersonasToSet.length > 0) {
        const { error } = await supabase
          .from('user_personas')
          .insert(dbPersonasToSet.map(persona => ({
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

  // Migrate guest personas to DB on login
  useEffect(() => {
    if (user?.id) {
      const guestPersonas = localStorage.getItem(GUEST_PERSONAS_KEY);
      if (guestPersonas) {
        try {
          const parsed = JSON.parse(guestPersonas) as UserPersona[];
          if (parsed.length > 0 && dbPersonas.length === 0) {
            // Migrate guest personas to authenticated user
            setPersonasMutation.mutate(parsed);
          }
        } catch {
          // Ignore corrupted localStorage data
        }
        localStorage.removeItem(GUEST_PERSONAS_KEY);
      }
    }
  }, [user?.id, dbPersonas.length]);

  // Return appropriate hook based on auth status
  if (!user) {
    return {
      personas: guestHook.personas,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      togglePersona: guestHook.togglePersona,
      setPersonas: guestHook.setPersonas,
      isToggling: false,
      isSetting: false,
    };
  }

  return {
    personas: dbPersonas,
    isLoading,
    error,
    isAuthenticated: true,
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
  descEn: string;
  descRu: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  tourist: {
    labelEn: 'Tourist',
    labelRu: 'Турист',
    descEn: 'Trips, tours, transfers',
    descRu: 'Поездки, туры, трансферы',
    icon: '✈️',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-500/10',
  },
  resident: {
    labelEn: 'Resident',
    labelRu: 'Резидент',
    descEn: 'Daily life & services',
    descRu: 'Быт и сервисы',
    icon: '🏠',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
  },
  property_owner: {
    labelEn: 'Owner / MC',
    labelRu: 'Владелец / УК',
    descEn: 'Property management',
    descRu: 'Управление недвижимостью',
    icon: '🏢',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
  },
  investor: {
    labelEn: 'Investor',
    labelRu: 'Инвестор',
    descEn: 'Projects & opportunities',
    descRu: 'Проекты и возможности',
    icon: '📈',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
  },
};
