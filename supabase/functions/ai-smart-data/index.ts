import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AGENT_SLUG = 'ai-smart-data';
const DEFAULT_MODEL = 'google/gemini-3-flash-preview';
const DEFAULT_TEMPERATURE = 0.2;

interface SmartMappingRequest {
  type: 'field-mapping';
  sourceColumns: string[];
  targetFields: { name: string; label: string; required: boolean }[];
  sampleData?: Record<string, string>[];
}

interface TextExtractionRequest {
  type: 'text-extraction';
  text: string;
  targetFields: { name: string; label: string; type: string }[];
  context: 'property' | 'product' | 'service';
}

interface PhotoAnalysisRequest {
  type: 'photo-analysis';
  imageUrl: string;
  context: 'property' | 'product' | 'inspection';
}

type RequestBody = SmartMappingRequest | TextExtractionRequest | PhotoAnalysisRequest;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch agent config from DB
    const { data: agentConfig } = await supabase
      .from('ai_agents')
      .select('id, model, temperature, is_active')
      .eq('slug', AGENT_SLUG)
      .single();

    // Check if agent is disabled
    if (agentConfig && !agentConfig.is_active) {
      return new Response(JSON.stringify({ error: "Agent is currently disabled" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use config from DB or fallback to defaults
    const configModel = agentConfig?.model || DEFAULT_MODEL;
    const temperature = agentConfig?.temperature || DEFAULT_TEMPERATURE;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const body: RequestBody = await req.json();

    let systemPrompt: string;
    let userPrompt: string;
    let tools: any[] = [];
    let toolChoice: any = undefined;

    if (body.type === 'field-mapping') {
      systemPrompt = `You are a data mapping expert. Analyze source column names and match them to target database fields.
Consider:
- Column names in English and Russian
- Common abbreviations and variations
- Sample data patterns when available
- Semantic meaning of column headers

Return confident mappings only. If unsure, don't map that field.`;

      userPrompt = `Map these source columns to target fields:

SOURCE COLUMNS:
${body.sourceColumns.map((col, i) => `${i + 1}. "${col}"`).join('\n')}

TARGET FIELDS:
${body.targetFields.map(f => `- ${f.name} (${f.label})${f.required ? ' [REQUIRED]' : ''}`).join('\n')}

${body.sampleData ? `SAMPLE DATA (first 3 rows):
${JSON.stringify(body.sampleData.slice(0, 3), null, 2)}` : ''}

Return mappings and confidence scores.`;

      tools = [{
        type: "function",
        function: {
          name: "suggest_field_mappings",
          description: "Return suggested field mappings with confidence scores",
          parameters: {
            type: "object",
            properties: {
              mappings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sourceColumn: { type: "string" },
                    targetField: { type: "string" },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    reason: { type: "string" }
                  },
                  required: ["sourceColumn", "targetField", "confidence"]
                }
              },
              unmappedColumns: {
                type: "array",
                items: { type: "string" },
                description: "Columns that couldn't be confidently mapped"
              }
            },
            required: ["mappings", "unmappedColumns"]
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "suggest_field_mappings" } };

    } else if (body.type === 'text-extraction') {
      const contextPrompts = {
        property: `Extract property/real estate information. Look for:
- Title/name of property
- Location details (address, district, area)
- Property characteristics (bedrooms, bathrooms, area in sqm)
- Price and currency
- Amenities and features
- Condition and furnishing`,
        product: `Extract product information. Look for:
- Product name/title
- Price and currency
- Category
- Description and features
- Stock/availability
- Brand`,
        service: `Extract service information. Look for:
- Service name
- Pricing structure
- Duration
- What's included
- Requirements`
      };

      systemPrompt = `You are a data extraction expert. ${contextPrompts[body.context]}
Extract structured data from unstructured text. Be precise and only extract what's clearly stated.`;

      userPrompt = `Extract data from this text:

"""
${body.text}
"""

Extract values for these fields:
${body.targetFields.map(f => `- ${f.name} (${f.label}, type: ${f.type})`).join('\n')}`;

      tools = [{
        type: "function",
        function: {
          name: "extract_data",
          description: "Extract structured data from text",
          parameters: {
            type: "object",
            properties: {
              extractedData: {
                type: "object",
                additionalProperties: true,
                description: "Extracted field values"
              },
              confidence: {
                type: "object",
                additionalProperties: { type: "number" },
                description: "Confidence score for each extracted field"
              },
              notes: {
                type: "string",
                description: "Any additional observations about the data"
              }
            },
            required: ["extractedData", "confidence"]
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "extract_data" } };

    } else if (body.type === 'photo-analysis') {
      const contextPrompts = {
        property: `Analyze this property photo. Identify:
- Property type (apartment, villa, condo, house, studio)
- Room type if applicable (bedroom, bathroom, kitchen, living room, balcony)
- Estimated number of bedrooms/bathrooms visible
- Furnishing level (unfurnished, partially furnished, fully furnished)
- Condition (excellent, good, fair, needs renovation)
- Notable amenities (pool, gym, parking, sea view, city view)
- Architectural style
- Approximate size estimation`,
        product: `Analyze this product photo. Identify:
- Product category
- Color and materials
- Condition (new, used, refurbished)
- Brand if visible
- Key features`,
        inspection: `Analyze this inspection photo. Identify:
- What area/item is shown
- Current condition (excellent, good, fair, poor, damaged)
- Any visible damage or issues
- Cleanliness level
- Maintenance recommendations`
      };

      systemPrompt = `You are a visual analysis expert. ${contextPrompts[body.context]}
Provide detailed, accurate observations based on what you can see.`;

      userPrompt = `Analyze this image and extract relevant information.`;

      tools = [{
        type: "function",
        function: {
          name: "analyze_image",
          description: "Analyze image and extract structured data",
          parameters: {
            type: "object",
            properties: {
              analysis: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  subcategory: { type: "string" },
                  condition: { type: "string", enum: ["excellent", "good", "fair", "poor", "damaged"] },
                  features: { type: "array", items: { type: "string" } },
                  colors: { type: "array", items: { type: "string" } },
                  estimatedValues: {
                    type: "object",
                    properties: {
                      bedrooms: { type: "number" },
                      bathrooms: { type: "number" },
                      areaSqm: { type: "number" },
                      furnishingLevel: { type: "string" }
                    }
                  },
                  issues: { type: "array", items: { type: "string" } },
                  recommendations: { type: "array", items: { type: "string" } }
                }
              },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              description: { type: "string" }
            },
            required: ["analysis", "confidence", "description"]
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "analyze_image" } };
    } else {
      throw new Error('Invalid request type');
    }

    // Build messages
    const messages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    if (body.type === 'photo-analysis') {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: body.imageUrl } }
        ]
      });
    } else {
      messages.push({ role: "user", content: userPrompt });
    }

    // Use gemini-2.5-flash for photo analysis (vision), configModel for text
    const modelToUse = body.type === 'photo-analysis' ? 'google/gemini-2.5-flash' : configModel;

    // Call AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        temperature,
        messages,
        tools,
        tool_choice: toolChoice,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    
    // Extract tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Log usage asynchronously (non-blocking)
    if (agentConfig?.id) {
      supabase.from('ai_agent_logs').insert({
        agent_id: agentConfig.id,
        response_time_ms: Date.now() - startTime,
        messages_count: 1,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      type: body.type,
      result 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Smart data error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
