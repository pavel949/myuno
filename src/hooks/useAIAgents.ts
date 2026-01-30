import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AIAgent {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  icon: string;
  model: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  is_public: boolean;
  target_audience: string[];
  tone: string;
  created_at: string;
  updated_at: string;
}

export interface AIAgentKnowledge {
  id: string;
  agent_id: string;
  version: number;
  system_prompt: string;
  knowledge_base: string | null;
  is_published: boolean;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AIAgentWithKnowledge extends AIAgent {
  ai_agent_knowledge: AIAgentKnowledge[];
}

export interface AIAgentLog {
  id: string;
  agent_id: string;
  user_id: string | null;
  session_id: string | null;
  messages_count: number;
  tokens_used: number;
  response_time_ms: number | null;
  user_rating: number | null;
  feedback: string | null;
  created_at: string;
}

// Fetch all agents (for admin)
export function useAIAgents() {
  return useQuery({
    queryKey: ['ai-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as AIAgent[];
    },
  });
}

// Fetch single agent with knowledge
export function useAIAgent(id: string | undefined) {
  return useQuery({
    queryKey: ['ai-agent', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('ai_agents')
        .select(`
          *,
          ai_agent_knowledge (*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as AIAgentWithKnowledge;
    },
    enabled: !!id,
  });
}

// Fetch agent logs
export function useAIAgentLogs(agentId: string | undefined, limit = 100) {
  return useQuery({
    queryKey: ['ai-agent-logs', agentId, limit],
    queryFn: async () => {
      if (!agentId) return [];
      
      const { data, error } = await supabase
        .from('ai_agent_logs')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as AIAgentLog[];
    },
    enabled: !!agentId,
  });
}

// Create new agent
export function useCreateAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (agent: Partial<Omit<AIAgent, 'id' | 'created_at' | 'updated_at'>> & { slug: string; name_en: string; name_ru: string }) => {
      const { data, error } = await supabase
        .from('ai_agents')
        .insert([agent])
        .select()
        .single();
      
      if (error) throw error;
      return data as AIAgent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      toast.success('Агент создан');
    },
    onError: (error) => {
      console.error('Failed to create agent:', error);
      toast.error('Ошибка создания агента');
    },
  });
}

// Update agent
export function useUpdateAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AIAgent> & { id: string }) => {
      const { data, error } = await supabase
        .from('ai_agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as AIAgent;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      queryClient.invalidateQueries({ queryKey: ['ai-agent', data.id] });
      toast.success('Агент обновлён');
    },
    onError: (error) => {
      console.error('Failed to update agent:', error);
      toast.error('Ошибка обновления агента');
    },
  });
}

// Delete agent
export function useDeleteAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      toast.success('Агент удалён');
    },
    onError: (error) => {
      console.error('Failed to delete agent:', error);
      toast.error('Ошибка удаления агента');
    },
  });
}

// Save knowledge (create new version)
export function useSaveKnowledge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      agentId, 
      systemPrompt, 
      knowledgeBase,
      publish = false 
    }: { 
      agentId: string; 
      systemPrompt: string; 
      knowledgeBase: string;
      publish?: boolean;
    }) => {
      // Get next version number
      const { data: existing } = await supabase
        .from('ai_agent_knowledge')
        .select('version')
        .eq('agent_id', agentId)
        .order('version', { ascending: false })
        .limit(1);
      
      const nextVersion = (existing?.[0]?.version || 0) + 1;
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('ai_agent_knowledge')
        .insert({
          agent_id: agentId,
          version: nextVersion,
          system_prompt: systemPrompt,
          knowledge_base: knowledgeBase,
          is_published: publish,
          published_at: publish ? new Date().toISOString() : null,
          created_by: user?.id || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as AIAgentKnowledge;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent', data.agent_id] });
      toast.success(data.is_published ? 'База знаний опубликована' : 'Черновик сохранён');
    },
    onError: (error) => {
      console.error('Failed to save knowledge:', error);
      toast.error('Ошибка сохранения');
    },
  });
}

// Publish existing knowledge version
export function usePublishKnowledge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ knowledgeId, agentId }: { knowledgeId: string; agentId: string }) => {
      // Unpublish all other versions
      await supabase
        .from('ai_agent_knowledge')
        .update({ is_published: false })
        .eq('agent_id', agentId);
      
      // Publish this version
      const { data, error } = await supabase
        .from('ai_agent_knowledge')
        .update({ 
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .eq('id', knowledgeId)
        .select()
        .single();
      
      if (error) throw error;
      return data as AIAgentKnowledge;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent', data.agent_id] });
      toast.success(`Версия ${data.version} опубликована`);
    },
    onError: (error) => {
      console.error('Failed to publish knowledge:', error);
      toast.error('Ошибка публикации');
    },
  });
}

// Agent stats aggregation
export function useAIAgentStats(agentId: string | undefined) {
  return useQuery({
    queryKey: ['ai-agent-stats', agentId],
    queryFn: async () => {
      if (!agentId) return null;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: logs, error } = await supabase
        .from('ai_agent_logs')
        .select('created_at, messages_count, response_time_ms, user_rating')
        .eq('agent_id', agentId);
      
      if (error) throw error;
      
      const todayLogs = logs?.filter(l => new Date(l.created_at) >= today) || [];
      const allLogs = logs || [];
      
      const avgResponseTime = allLogs.length > 0
        ? allLogs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / allLogs.length
        : 0;
      
      const ratings = allLogs.filter(l => l.user_rating);
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, l) => sum + (l.user_rating || 0), 0) / ratings.length
        : 0;
      
      return {
        totalMessages: allLogs.reduce((sum, l) => sum + (l.messages_count || 0), 0),
        todayMessages: todayLogs.reduce((sum, l) => sum + (l.messages_count || 0), 0),
        totalSessions: allLogs.length,
        todaySessions: todayLogs.length,
        avgResponseTime: Math.round(avgResponseTime),
        avgRating: Math.round(avgRating * 10) / 10,
        ratingCount: ratings.length,
      };
    },
    enabled: !!agentId,
  });
}
