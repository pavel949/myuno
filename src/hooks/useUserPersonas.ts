import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserPersona = 
  | 'tourist' | 'resident' | 'property_owner' | 'investor'
  | 'family' | 'couple' | 'nightlife' | 'active' | 'business' | 'nomad' | 'pet_owner' | 'relocation';

/** All DB-stored persona values (matches user_persona enum) */
export type DbPersona = UserPersona;

const GUEST_PERSONAS_KEY = 'myuno-guest-personas';
const GUEST_PERSONAS_CHANGED_EVENT = 'myuno-guest-personas-changed';

interface UserPersonaRecord {
  id: string;
  user_id: string;
  persona: UserPersona;
  is_active: boolean;
  created_at: string;
}

function readGuestPersonas(): UserPersona[] {
  try {
    const saved = localStorage.getItem(GUEST_PERSONAS_KEY);
    return saved ? (JSON.parse(saved) as UserPersona[]) : [];
  } catch {
    return [];
  }
}

function persistGuestPersonas(next: UserPersona[]) {
  localStorage.setItem(GUEST_PERSONAS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(GUEST_PERSONAS_CHANGED_EVENT));
}

// Guest personas hook (localStorage-based)
function useGuestPersonas() {
  const [personas, setPersonas] = useState<UserPersona[]>(() => readGuestPersonas());

  useEffect(() => {
    const syncFromStorage = () => setPersonas(readGuestPersonas());

    const handleStorage = (event: StorageEvent) => {
      if (event.key === GUEST_PERSONAS_KEY) syncFromStorage();
    };

    const handlePersonasChanged = () => syncFromStorage();

    window.addEventListener('storage', handleStorage);
    window.addEventListener(GUEST_PERSONAS_CHANGED_EVENT, handlePersonasChanged);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(GUEST_PERSONAS_CHANGED_EVENT, handlePersonasChanged);
    };
  }, []);

  const togglePersona = useCallback((persona: UserPersona) => {
    setPersonas(prev => {
      const newPersonas = prev.includes(persona)
        ? prev.filter(p => p !== persona)
        : [...prev, persona];
      persistGuestPersonas(newPersonas);
      return newPersonas;
    });
  }, []);

  const setPersonasAll = useCallback((newPersonas: UserPersona[]) => {
    setPersonas(newPersonas);
    persistGuestPersonas(newPersonas);
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

  const togglePersonaMutation = useMutation({
    mutationFn: async (persona: UserPersona) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const isActive = dbPersonas.includes(persona);
      
      if (isActive) {
        const { error } = await supabase
          .from('user_personas')
          .delete()
          .eq('user_id', user.id)
          .eq('persona', persona as any);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_personas')
          .upsert(
            { user_id: user.id, persona: persona as any, is_active: true },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const setPersonasMutation = useMutation({
    mutationFn: async (newPersonas: UserPersona[]) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      await supabase
        .from('user_personas')
        .delete()
        .eq('user_id', user.id);
      
      if (newPersonas.length > 0) {
        const { error } = await supabase
          .from('user_personas')
          .insert(newPersonas.map(persona => ({
            user_id: user.id,
            persona: persona as any,
            is_active: true,
          })));
        
        if (error) throw error;
      }
      
      return newPersonas;
    },
    onMutate: async (newPersonas) => {
      await queryClient.cancelQueries({ queryKey });
      const previousPersonas = queryClient.getQueryData<UserPersona[]>(queryKey);
      queryClient.setQueryData<UserPersona[]>(queryKey, newPersonas);
      return { previousPersonas };
    },
    onError: (_err, _newPersonas, context) => {
      if (context?.previousPersonas) {
        queryClient.setQueryData(queryKey, context.previousPersonas);
      }
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
            setPersonasMutation.mutate(parsed);
          }
        } catch {
          // Ignore corrupted localStorage data
        }
        localStorage.removeItem(GUEST_PERSONAS_KEY);
      }
    }
  }, [user?.id, dbPersonas.length]);

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

export function hasPersona(personas: UserPersona[], persona: UserPersona): boolean {
  return personas.includes(persona);
}

/** All persona options in display order */
export const PERSONA_OPTIONS: UserPersona[] = [
  'tourist', 'resident', 'relocation', 'property_owner', 'investor', 'pet_owner',
  'family', 'couple', 'nightlife', 'active', 'business', 'nomad',
];

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
    labelEn: 'Tourist', labelRu: 'Турист',
    descEn: 'Trips, tours, transfers', descRu: 'Поездки, туры, трансферы',
    icon: 'Plane', color: 'text-cyan-600', bgColor: 'bg-cyan-500/10',
  },
  resident: {
    labelEn: 'Resident', labelRu: 'Резидент',
    descEn: 'Daily life & services', descRu: 'Быт и сервисы',
    icon: 'Home', color: 'text-emerald-600', bgColor: 'bg-emerald-500/10',
  },
  property_owner: {
    labelEn: 'Owner', labelRu: 'Собственник',
    descEn: 'My property & services', descRu: 'Мой объект и сервисы',
    icon: 'Building2', color: 'text-amber-600', bgColor: 'bg-amber-500/10',
  },
  investor: {
    labelEn: 'Investor', labelRu: 'Инвестор',
    descEn: 'Projects & opportunities', descRu: 'Проекты и возможности',
    icon: 'TrendingUp', color: 'text-purple-600', bgColor: 'bg-purple-500/10',
  },
  family: {
    labelEn: 'Family', labelRu: 'Семья',
    descEn: 'Schools, doctors, kids', descRu: 'Школы, врачи, дети',
    icon: 'Baby', color: 'text-pink-600', bgColor: 'bg-pink-500/10',
  },
  couple: {
    labelEn: 'Couple', labelRu: 'Пара',
    descEn: 'Romance, spa, dining', descRu: 'Романтика, спа, рестораны',
    icon: 'Heart', color: 'text-rose-600', bgColor: 'bg-rose-500/10',
  },
  nightlife: {
    labelEn: 'Nightlife', labelRu: 'Тусовщик',
    descEn: 'Clubs, parties, VIP', descRu: 'Клубы, вечеринки, VIP',
    icon: 'Music', color: 'text-fuchsia-600', bgColor: 'bg-fuchsia-500/10',
  },
  active: {
    labelEn: 'Active', labelRu: 'Спортсмен',
    descEn: 'Fitness, surf, MMA', descRu: 'Фитнес, серфинг, MMA',
    icon: 'Dumbbell', color: 'text-orange-600', bgColor: 'bg-orange-500/10',
  },
  business: {
    labelEn: 'Business', labelRu: 'Бизнес',
    descEn: 'Coworking, legal, banking', descRu: 'Коворкинг, юрист, банк',
    icon: 'Briefcase', color: 'text-slate-600', bgColor: 'bg-slate-500/10',
  },
  nomad: {
    labelEn: 'Nomad', labelRu: 'Номад',
    descEn: 'Coworking, SIM, visa', descRu: 'Коворкинг, SIM, виза',
    icon: 'Laptop', color: 'text-teal-600', bgColor: 'bg-teal-500/10',
  },
  pet_owner: {
    labelEn: 'Pet Owner', labelRu: 'С питомцем',
    descEn: 'Vet, grooming, hotels', descRu: 'Ветеринар, груминг, отели',
    icon: 'PawPrint', color: 'text-amber-600', bgColor: 'bg-amber-500/10',
  },
  relocation: {
    labelEn: 'Relocating', labelRu: 'Переезд',
    descEn: 'Visa, housing, schools, legal', descRu: 'Виза, жильё, школы, юрист',
    icon: 'Globe', color: 'text-indigo-600', bgColor: 'bg-indigo-500/10',
  },
};
