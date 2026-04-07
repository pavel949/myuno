/**
 * AI Personalize Home Edge Function
 * PUBLIC_ENDPOINT: Visitor-facing personalization. Rate-limited. No sensitive data exposed.
 */
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// Deno.serve used (native edge runtime)
import { createClient } from "../_shared/supabase.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://myuno.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AGENT_SLUG = 'ai-personalize-home';

type UserPersona = 'tourist' | 'resident' | 'property_owner';

interface RequestBody {
  personas: UserPersona[];
  language: 'en' | 'ru';
  recentCategories?: string[];
}

interface PersonalizedResponse {
  greeting: string;
  priorityCategories: string[];
  suggestedServices: Array<{
    id: string;
    reason: string;
  }>;
}

// Category mappings for each persona
const PERSONA_CATEGORIES: Record<UserPersona, string[]> = {
  tourist: ['property', 'transport', 'yachts', 'tours', 'flowers', 'market', 'beauty', 'events', 'exchange'],
  resident: ['visa', 'property', 'education', 'medical', 'legal', 'insurance', 'banking'],
  property_owner: ['services', 'property-management', 'rental', 'legal', 'insurance', 'cleaning'],
};

// Service suggestions per persona
const PERSONA_SERVICES: Record<UserPersona, Array<{ id: string; reasonEn: string; reasonRu: string }>> = {
  tourist: [
    { id: 'villa-rental', reasonEn: 'Best villas on the island', reasonRu: 'Лучшие виллы на острове' },
    { id: 'bike-rental', reasonEn: 'Easy way to get around', reasonRu: 'Удобное передвижение' },
    { id: 'yacht-charter', reasonEn: 'Unforgettable sea experience', reasonRu: 'Незабываемый отдых на воде' },
    { id: 'island-tour', reasonEn: 'Discover island beauty', reasonRu: 'Откройте красоты острова' },
    { id: 'spa-massage', reasonEn: 'Relaxation and wellness', reasonRu: 'Расслабление и релакс' },
  ],
  resident: [
    { id: 'visa-extension', reasonEn: 'Hassle-free visa renewal', reasonRu: 'Продление визы без проблем' },
    { id: 'international-school', reasonEn: 'Best schools for children', reasonRu: 'Лучшие школы для детей' },
    { id: 'long-term-rental', reasonEn: 'Long-term housing', reasonRu: 'Жильё на долгий срок' },
    { id: 'health-insurance', reasonEn: 'Security for you and family', reasonRu: 'Защита для вас и семьи' },
  ],
  property_owner: [
    { id: 'property-management-company', reasonEn: 'Trust professionals with management', reasonRu: 'Доверьте управление профессионалам' },
    { id: 'rental-management', reasonEn: 'Maximize your rental income', reasonRu: 'Максимальный доход от аренды' },
    { id: 'maintenance-service', reasonEn: 'Keep your property in top shape', reasonRu: 'Обслуживание вашего объекта' },
  ],
};

function getGreeting(personas: UserPersona[], language: 'en' | 'ru'): string {
  if (personas.length === 0) {
    return language === 'ru' 
      ? 'Добро пожаловать! Выберите свою роль для персональных рекомендаций.'
      : 'Welcome! Select your role for personalized recommendations.';
  }

  const personaLabels: Record<UserPersona, { en: string; ru: string }> = {
    tourist: { en: 'tourist', ru: 'туриста' },
    resident: { en: 'resident', ru: 'резидента' },
    property_owner: { en: 'property owner', ru: 'владельца недвижимости' },
  };

  if (language === 'ru') {
    if (personas.length === 1) {
      return `Привет! Вот лучшие предложения для ${personaLabels[personas[0]].ru} 🌴`;
    }
    const labels = personas.map(p => personaLabels[p].ru).join(' и ');
    return `Привет! Специально для вас как ${labels} 🌟`;
  } else {
    if (personas.length === 1) {
      return `Hi! Here are the best offers for a ${personaLabels[personas[0]].en} 🌴`;
    }
    const labels = personas.map(p => personaLabels[p].en).join(' and ');
    return `Hi! Curated just for you as a ${labels} 🌟`;
  }
}

function getPriorityCategories(personas: UserPersona[]): string[] {
  if (personas.length === 0) {
    return ['yachts', 'property', 'restaurants', 'medical', 'transport', 'beauty', 'legal', 'tours'];
  }

  // Collect all categories with count (higher count = higher priority)
  const categoryCount: Record<string, number> = {};
  
  for (const persona of personas) {
    const categories = PERSONA_CATEGORIES[persona];
    for (const cat of categories) {
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    }
  }

  // Sort by count (descending), then alphabetically
  return Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([cat]) => cat)
    .slice(0, 8);
}

function getSuggestedServices(
  personas: UserPersona[], 
  language: 'en' | 'ru'
): Array<{ id: string; reason: string }> {
  if (personas.length === 0) {
    return [];
  }

  const services: Array<{ id: string; reason: string }> = [];
  const seenIds = new Set<string>();

  for (const persona of personas) {
    const personaServices = PERSONA_SERVICES[persona];
    for (const service of personaServices) {
      if (!seenIds.has(service.id)) {
        seenIds.add(service.id);
        services.push({
          id: service.id,
          reason: language === 'ru' ? service.reasonRu : service.reasonEn,
        });
      }
    }
  }

  // Limit to top 6 suggestions
  return services.slice(0, 6);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit: public personalization
  const rlResponse = await withRateLimit(req, 'ai-personalize-home', RATE_LIMITS.publicRead, corsHeaders);
  if (rlResponse) return rlResponse;

  const startTime = Date.now();

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch agent config from DB (for is_active check and logging)
    const { data: agentConfig } = await supabase
      .from('ai_agents')
      .select('id, is_active')
      .eq('slug', AGENT_SLUG)
      .single();

    // Check if agent is disabled
    if (agentConfig && !agentConfig.is_active) {
      return new Response(JSON.stringify({ error: "Agent is currently disabled" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { personas = [], language = 'en', recentCategories = [] }: RequestBody = await req.json();

    // Generate personalized response
    const response: PersonalizedResponse = {
      greeting: getGreeting(personas, language),
      priorityCategories: getPriorityCategories(personas),
      suggestedServices: getSuggestedServices(personas, language),
    };

    // Log usage asynchronously (non-blocking)
    if (agentConfig?.id) {
      supabase.from('ai_agent_logs').insert({
        agent_id: agentConfig.id,
        response_time_ms: Date.now() - startTime,
        messages_count: 1,
      });
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in ai-personalize-home:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
