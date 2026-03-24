/**
 * Business Card Scanner Edge Function
 * AUTH_REQUIRED: Processes personal contact data. Requires authentication.
 */

// Deno.serve used (native edge runtime)
import { requireAuth } from "../_shared/auth-guard.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VERTICALS = [
  { id: 'restaurants', nameEn: 'Restaurants & Cafes', nameRu: 'Рестораны и кафе', keywords: ['restaurant', 'cafe', 'food', 'catering', 'bar', 'kitchen', 'chef', 'dining'] },
  { id: 'salons', nameEn: 'Beauty Salons', nameRu: 'Салоны красоты', keywords: ['salon', 'spa', 'beauty', 'hair', 'nails', 'massage', 'wellness', 'cosmetics'] },
  { id: 'tours', nameEn: 'Tours & Excursions', nameRu: 'Туры и экскурсии', keywords: ['tour', 'travel', 'excursion', 'trip', 'guide', 'adventure', 'island'] },
  { id: 'yachts', nameEn: 'Boat Charters', nameRu: 'Аренда яхт и катеров', keywords: ['yacht', 'boat', 'marine', 'charter', 'sailing', 'cruise', 'sea'] },
  { id: 'property', nameEn: 'Real Estate', nameRu: 'Недвижимость', keywords: ['property', 'real estate', 'villa', 'condo', 'apartment', 'house', 'rent', 'agent'] },
  { id: 'legal', nameEn: 'Legal Services', nameRu: 'Юридические услуги', keywords: ['legal', 'lawyer', 'attorney', 'visa', 'immigration', 'law', 'consultant'] },
  { id: 'clinics', nameEn: 'Medical Clinics', nameRu: 'Клиники', keywords: ['clinic', 'medical', 'doctor', 'dental', 'hospital', 'health', 'pharmacy'] },
  { id: 'cleaning', nameEn: 'Cleaning Services', nameRu: 'Клининг', keywords: ['cleaning', 'maid', 'housekeeping', 'laundry', 'maintenance'] },
  { id: 'transport', nameEn: 'Transport & Rentals', nameRu: 'Транспорт и аренда', keywords: ['transport', 'taxi', 'car', 'bike', 'scooter', 'rental', 'driver', 'transfer'] },
  { id: 'fitness', nameEn: 'Fitness & Gyms', nameRu: 'Фитнес и спортзалы', keywords: ['gym', 'fitness', 'yoga', 'muay thai', 'sport', 'training', 'coach'] },
  { id: 'construction', nameEn: 'Construction', nameRu: 'Строительство', keywords: ['construction', 'builder', 'contractor', 'renovation', 'architect', 'interior'] },
  { id: 'retail', nameEn: 'Retail & Shops', nameRu: 'Магазины', keywords: ['shop', 'store', 'retail', 'boutique', 'market', 'supermarket'] },
  { id: 'education', nameEn: 'Education', nameRu: 'Образование', keywords: ['school', 'education', 'language', 'tutor', 'training', 'course', 'academy'] },
  { id: 'pets', nameEn: 'Pet Services', nameRu: 'Услуги для питомцев', keywords: ['pet', 'dog', 'cat', 'vet', 'grooming', 'animal', 'veterinary'] },
  { id: 'events', nameEn: 'Events & Entertainment', nameRu: 'Мероприятия', keywords: ['event', 'party', 'wedding', 'dj', 'photography', 'entertainment'] },
  { id: 'it', nameEn: 'IT & Digital', nameRu: 'IT и Диджитал', keywords: ['web', 'software', 'digital', 'marketing', 'seo', 'design', 'developer', 'agency'] },
  { id: 'finance', nameEn: 'Finance & Insurance', nameRu: 'Финансы и страхование', keywords: ['insurance', 'bank', 'finance', 'accounting', 'tax', 'investment'] },
  { id: 'other', nameEn: 'Other Services', nameRu: 'Другие услуги', keywords: [] },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit
  const rlResponse = await withRateLimit(req, 'scan-business-card', RATE_LIMITS.ai, corsHeaders);
  if (rlResponse) return rlResponse;

  // Auth required: personal contact data
  const authResult = await requireAuth(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      throw new Error('No image provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing business card image...');

    let pureBase64 = imageBase64;
    let mimeType = 'image/jpeg';
    
    if (imageBase64.startsWith('data:')) {
      const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        pureBase64 = matches[2];
      } else {
        pureBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      }
    }

    console.log('Image mime type:', mimeType, 'Base64 length:', pureBase64.length);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a business card OCR and analysis expert. Extract all information from business cards accurately.
            
Your task:
1. Extract all visible text and information from the business card
2. Classify the business into one of these verticals: ${VERTICALS.map(v => v.id).join(', ')}
3. Suggest relevant services/products this business might offer
4. Rate your confidence in the extraction (0-100)

Always respond using the provided function schema.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this business card image. Extract all information and classify the business vertical. 
                
Available verticals with their keywords for classification:
${VERTICALS.map(v => `- ${v.id}: ${v.nameEn} (keywords: ${v.keywords.join(', ')})`).join('\n')}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${pureBase64}`
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_business_card',
              description: 'Extract and structure business card information',
              parameters: {
                type: 'object',
                properties: {
                  company_name: { type: 'string', description: 'Name of the company/business' },
                  company_name_thai: { type: 'string', description: 'Thai name of the company if present' },
                  contact_person: { type: 'string', description: 'Name of the contact person' },
                  position: { type: 'string', description: 'Job title/position' },
                  phone: { type: 'array', items: { type: 'string' }, description: 'Phone numbers found on card' },
                  email: { type: 'string', description: 'Email address' },
                  website: { type: 'string', description: 'Website URL' },
                  address: { type: 'string', description: 'Physical address' },
                  social_media: {
                    type: 'object',
                    properties: {
                      facebook: { type: 'string' },
                      instagram: { type: 'string' },
                      line: { type: 'string' },
                      whatsapp: { type: 'string' }
                    },
                    description: 'Social media handles'
                  },
                  vertical: { type: 'string', enum: VERTICALS.map(v => v.id), description: 'Business category/vertical' },
                  suggested_services: { type: 'array', items: { type: 'string' }, description: 'Services or products this business likely offers' },
                  description: { type: 'string', description: 'Brief description of the business based on card info' },
                  raw_text: { type: 'string', description: 'All raw text visible on the card' },
                  confidence: { type: 'number', description: 'Confidence score 0-100 for the extraction quality' }
                },
                required: ['company_name', 'vertical', 'confidence']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_business_card' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'extract_business_card') {
      throw new Error('Unexpected AI response format');
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    const verticalInfo = VERTICALS.find(v => v.id === extractedData.vertical) || VERTICALS.find(v => v.id === 'other');

    const result = {
      ...extractedData,
      vertical_info: verticalInfo,
      extracted_at: new Date().toISOString(),
    };

    console.log('Extraction complete:', { 
      company: result.company_name, 
      vertical: result.vertical,
      confidence: result.confidence 
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing business card:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to process business card' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
