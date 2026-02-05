/**
 * useSimulation Hook
 * 
 * Provides simulation management for admin users.
 * Allows starting, monitoring, and purging simulation runs.
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { 
  getSimulationRunId, 
  setSimulationRunId,
  isSimulationMode,
  getSimulationConfig,
  setSimulationConfig,
  resetSimulationState,
} from '@/lib/simulation/simulationMode';
import { toast } from 'sonner';

export interface SimulationRun {
  id: string;
  label: string;
  status: 'created' | 'running' | 'completed' | 'purged';
  created_at: string;
  created_by: string;
  completed_at: string | null;
  config: Record<string, unknown>;
}

export interface SimulationEvent {
  id: string;
  run_id: string;
  ts: string;
  actor_role: string | null;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  payload: Record<string, unknown>;
  error: string | null;
  duration_ms: number | null;
}

export function useSimulation() {
  const { user } = useAuth();
  const { hasRole } = useUserRoles();
  const queryClient = useQueryClient();
  const [isStarting, setIsStarting] = useState(false);

  const isAdmin = hasRole('admin') || hasRole('uno_team');
  const canUseSimulation = isAdmin;

  // Fetch all simulation runs
  const {
    data: runs,
    isLoading: runsLoading,
    refetch: refetchRuns,
  } = useQuery({
    queryKey: ['simulation-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulation_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as SimulationRun[];
    },
    enabled: canUseSimulation,
  });

  // Fetch events for current run
  const currentRunId = getSimulationRunId();
  const {
    data: currentEvents,
    isLoading: eventsLoading,
  } = useQuery({
    queryKey: ['simulation-events', currentRunId],
    queryFn: async () => {
      if (!currentRunId) return [];
      const { data, error } = await supabase
        .from('simulation_events')
        .select('*')
        .eq('run_id', currentRunId)
        .order('ts', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as SimulationEvent[];
    },
    enabled: !!currentRunId && canUseSimulation,
    refetchInterval: isSimulationMode() ? 5000 : false, // Auto-refresh during simulation
  });

  // Start simulation
  const startSimulation = useCallback(async (label: string, config?: Record<string, unknown>) => {
    if (!canUseSimulation) {
      toast.error('Permission denied: Admin access required');
      return null;
    }

    setIsStarting(true);
    try {
      const { data, error } = await supabase.rpc('start_simulation_run', {
        p_label: label,
        p_config: (config || {}) as unknown as Record<string, never>,
      });

      if (error) throw error;
      
      const runId = data as string;
      setSimulationRunId(runId);
      setSimulationConfig({ includeSimulationData: true });
      
      toast.success(`Simulation started: ${label}`);
      await refetchRuns();
      
      return runId;
    } catch (err) {
      console.error('[Simulation] Start failed:', err);
      toast.error('Failed to start simulation');
      return null;
    } finally {
      setIsStarting(false);
    }
  }, [canUseSimulation, refetchRuns]);

  // Log event
  const logEvent = useCallback(async (
    eventType: string,
    options?: {
      actorRole?: string;
      entityType?: string;
      entityId?: string;
      payload?: Record<string, unknown>;
      error?: string;
      durationMs?: number;
    }
  ) => {
    const runId = getSimulationRunId();
    if (!runId) return;

    try {
      await supabase.rpc('log_simulation_event', {
        p_run_id: runId,
        p_event_type: eventType,
        p_actor_role: options?.actorRole || null,
        p_entity_type: options?.entityType || null,
        p_entity_id: options?.entityId || null,
        p_payload: (options?.payload || {}) as unknown as Record<string, never>,
        p_error: options?.error || null,
        p_duration_ms: options?.durationMs || null,
      });
    } catch (err) {
      console.error('[Simulation] Log event failed:', err);
    }
  }, []);

  // Link entity to simulation
  const linkEntity = useCallback(async (entityType: string, entityId: string) => {
    const runId = getSimulationRunId();
    if (!runId) return;

    try {
      await supabase.rpc('link_simulation_entity', {
        p_run_id: runId,
        p_entity_type: entityType,
        p_entity_id: entityId,
      });
    } catch (err) {
      console.error('[Simulation] Link entity failed:', err);
    }
  }, []);

  // Complete simulation
  const completeSimulation = useMutation({
    mutationFn: async (runId: string) => {
      const { error } = await supabase
        .from('simulation_runs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', runId);

      if (error) throw error;
    },
    onSuccess: () => {
      resetSimulationState();
      queryClient.invalidateQueries({ queryKey: ['simulation-runs'] });
      toast.success('Simulation completed');
    },
    onError: (err) => {
      console.error('[Simulation] Complete failed:', err);
      toast.error('Failed to complete simulation');
    },
  });

  // Purge simulation
  const purgeSimulation = useMutation({
    mutationFn: async (runId: string) => {
      const { data, error } = await supabase.rpc('purge_simulation_run', {
        p_run_id: runId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['simulation-runs'] });
      const deletedCounts = typeof data === 'object' && data !== null && 'deleted_counts' in data
        ? (data as { deleted_counts?: unknown }).deleted_counts
        : {};
      toast.success('Simulation purged', {
        description: `Deleted: ${JSON.stringify(deletedCounts || {})}`,
      });
    },
    onError: (err) => {
      console.error('[Simulation] Purge failed:', err);
      toast.error('Failed to purge simulation');
    },
  });

  // Get report
  const getReport = useCallback(async (runId: string) => {
    const { data, error } = await supabase.rpc('get_simulation_report', {
      p_run_id: runId,
    });

    if (error) throw error;
    return data;
  }, []);

  return {
    // State
    isSimulationMode: isSimulationMode(),
    currentRunId,
    config: getSimulationConfig(),
    canUseSimulation,
    
    // Data
    runs,
    currentEvents,
    runsLoading,
    eventsLoading,
    
    // Actions
    startSimulation,
    logEvent,
    linkEntity,
    completeSimulation: completeSimulation.mutate,
    purgeSimulation: purgeSimulation.mutate,
    getReport,
    setConfig: setSimulationConfig,
    resetState: resetSimulationState,
    
    // Loading states
    isStarting,
    isCompleting: completeSimulation.isPending,
    isPurging: purgeSimulation.isPending,
  };
}
