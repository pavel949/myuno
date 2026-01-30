import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  tourist: ['yachts', 'tours', 'restaurants', 'events', 'water', 'transport', 'beauty', 'flowers'],
  resident: ['visa', 'medical', 'legal', 'insurance', 'banking', 'education', 'pharmacy', 'property'],
  property_owner: ['property', 'legal', 'insurance', 'services', 'cleaning', 'visa'],
};

// Service suggestions per persona
const PERSONA_SERVICES: Record<UserPersona, Array<{ id: string; reasonEn: string; reasonRu: string }>> = {
  tourist: [
    { id: 'yacht-rental', reasonEn: 'Popular among tourists', reasonRu: 'Популярно среди туристов' },
    { id: 'island-tour', reasonEn: 'Must-see experience', reasonRu: 'Незабываемый опыт' },
    { id: 'airport-transfer', reasonEn: 'Convenient arrival', reasonRu: 'Удобный трансфер' },
  ],
  resident: [
    { id: 'visa-extension', reasonEn: 'Essential for long stay', reasonRu: 'Важно для долгого пребывания' },
    { id: 'health-insurance', reasonEn: 'Security for you and family', reasonRu: 'Защита для вас и семьи' },
    { id: 'legal-consultation', reasonEn: 'Solve any legal issues', reasonRu: 'Решение правовых вопросов' },
  ],
  property_owner: [
    { id: 'property-management', reasonEn: 'Maximize your rental income', reasonRu: 'Максимальный доход от аренды' },
    { id: 'legal-property', reasonEn: 'Protect your investment', reasonRu: 'Защита ваших инвестиций' },
    { id: 'cleaning-service', reasonEn: 'Keep property ready for guests', reasonRu: 'Подготовка к гостям' },
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { personas = [], language = 'en', recentCategories = [] }: RequestBody = await req.json();

    // Generate personalized response
    const response: PersonalizedResponse = {
      greeting: getGreeting(personas, language),
      priorityCategories: getPriorityCategories(personas),
      suggestedServices: getSuggestedServices(personas, language),
    };

    // If user has recent activity, we could boost those categories
    // (future enhancement: use AI model to generate smarter recommendations)

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
