-- ============================================
-- AI AGENT FARM: Core Tables
-- ============================================

-- Table: AI Agents (main registry)
CREATE TABLE public.ai_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  icon TEXT DEFAULT 'Bot',
  model TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  temperature DECIMAL(3,2) NOT NULL DEFAULT 0.7,
  max_tokens INTEGER NOT NULL DEFAULT 2000,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT true,
  target_audience TEXT[] DEFAULT ARRAY[]::TEXT[],
  tone TEXT DEFAULT 'professional',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: AI Agent Knowledge (versioned prompts and knowledge base)
CREATE TABLE public.ai_agent_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  system_prompt TEXT NOT NULL,
  knowledge_base TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id, version)
);

-- Table: AI Agent Logs (usage tracking)
CREATE TABLE public.ai_agent_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  messages_count INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_agents
CREATE POLICY "Public agents are viewable by everyone" 
ON public.ai_agents FOR SELECT 
USING (is_active = true AND is_public = true);

CREATE POLICY "Admins can manage all agents" 
ON public.ai_agents FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team')
  )
);

-- RLS Policies for ai_agent_knowledge
CREATE POLICY "Published knowledge is viewable for active agents" 
ON public.ai_agent_knowledge FOR SELECT 
USING (
  is_published = true AND 
  EXISTS (
    SELECT 1 FROM public.ai_agents 
    WHERE id = agent_id AND is_active = true
  )
);

CREATE POLICY "Admins can manage all knowledge" 
ON public.ai_agent_knowledge FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team')
  )
);

-- RLS Policies for ai_agent_logs
CREATE POLICY "Users can view their own logs" 
ON public.ai_agent_logs FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all logs" 
ON public.ai_agent_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team')
  )
);

CREATE POLICY "Anyone can insert logs" 
ON public.ai_agent_logs FOR INSERT 
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_ai_agents_slug ON public.ai_agents(slug);
CREATE INDEX idx_ai_agents_active ON public.ai_agents(is_active);
CREATE INDEX idx_ai_agent_knowledge_agent ON public.ai_agent_knowledge(agent_id);
CREATE INDEX idx_ai_agent_knowledge_published ON public.ai_agent_knowledge(agent_id, is_published);
CREATE INDEX idx_ai_agent_logs_agent ON public.ai_agent_logs(agent_id);
CREATE INDEX idx_ai_agent_logs_user ON public.ai_agent_logs(user_id);
CREATE INDEX idx_ai_agent_logs_created ON public.ai_agent_logs(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_ai_agents_updated_at
BEFORE UPDATE ON public.ai_agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed existing agents (migrate hardcoded agents to DB)
INSERT INTO public.ai_agents (slug, name_en, name_ru, description_en, description_ru, icon, is_active, target_audience, tone) VALUES
('owner-assistant', 'Owner Assistant', 'Ассистент владельца', 'AI assistant for property owners - system guidance, market insights, Thai real estate law', 'AI-ассистент для владельцев недвижимости - помощь по системе, рынок, законодательство', 'Building2', true, ARRAY['owner'], 'professional'),
('property-search', 'Property Search', 'Поиск недвижимости', 'AI assistant helping guests find perfect rental properties in Phuket', 'AI-ассистент для поиска идеальной аренды на Пхукете', 'Search', true, ARRAY['guest', 'user'], 'friendly'),
('support-chat', 'Support Chat', 'Чат поддержки', 'General platform support and FAQ', 'Общая поддержка платформы и FAQ', 'MessageCircle', true, ARRAY['user', 'guest', 'owner', 'provider'], 'helpful'),
('smart-search', 'Smart Search', 'Умный поиск', 'AI-powered search with recommendations', 'AI-поиск с рекомендациями', 'Sparkles', true, ARRAY['user', 'guest'], 'concise');

-- Insert initial knowledge versions for existing agents
INSERT INTO public.ai_agent_knowledge (agent_id, version, system_prompt, knowledge_base, is_published, published_at)
SELECT 
  id,
  1,
  CASE slug
    WHEN 'owner-assistant' THEN 'You are UNO Property Assistant, an expert AI helping property owners in Phuket, Thailand. You have deep knowledge of the UNO platform, Thai real estate market, and property management best practices.

{{KNOWLEDGE_BASE}}

RESPONSE GUIDELINES:
- Be professional but friendly
- Give specific, actionable advice
- Always consider Thai legal context
- Recommend UNO services when relevant'
    WHEN 'property-search' THEN 'You are a Phuket rental property expert helping guests find the perfect accommodation. You know all districts, price ranges, and what to watch out for.

{{KNOWLEDGE_BASE}}

RESPONSE GUIDELINES:
- Ask clarifying questions about budget, dates, preferences
- Explain pros/cons of different areas
- Warn about common rental pitfalls
- Be friendly and helpful'
    WHEN 'support-chat' THEN 'You are the myUNO support assistant. Help users navigate the platform and answer their questions.

{{KNOWLEDGE_BASE}}

RESPONSE GUIDELINES:
- Be helpful and concise
- Guide users to relevant features
- Escalate complex issues to human support'
    WHEN 'smart-search' THEN 'You are the myUNO smart search assistant. Help users find services and answer questions about Phuket.

{{KNOWLEDGE_BASE}}

RESPONSE GUIDELINES:
- Recommend relevant services
- Be concise and action-oriented
- Personalize based on user context'
  END,
  'Knowledge base will be populated by admin.',
  true,
  now()
FROM public.ai_agents;