// Deno.serve used (native edge runtime)
import { createClient } from "../_shared/supabase.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

/**
 * Build CORS headers from the canonical helper, then extend Allow-Headers
 * with the supabase-js client-info headers this function sees in practice.
 */
function buildCors(req: Request): Record<string, string> {
  const base = getCorsHeaders(req);
  return {
    ...base,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}


// Vertical configurations - loaded from database with static fallback
interface VerticalConfig {
  id: string;
  table: string;
  keywords: string[];
}

// Static fallback for when DB is unavailable
const STATIC_VERTICALS: VerticalConfig[] = [
  { id: 'yachts', table: 'yachts', keywords: ['yacht', 'яхта', 'boat', 'лодка', 'катер', 'charter', 'чартер', 'catamaran', 'катамаран', 'sailboat', 'парусник'] },
  { id: 'properties', table: 'properties', keywords: ['property', 'недвижимость', 'квартира', 'apartment', 'villa', 'вилла', 'condo', 'кондо', 'house', 'дом', 'rent', 'аренда', 'penthouse'] },
  { id: 'owner_properties', table: 'owner_properties', keywords: ['owner property', 'собственник', 'владелец', 'сдаю', 'my property', 'моя квартира'] },
  { id: 'tours', table: 'tours', keywords: ['tour', 'тур', 'excursion', 'экскурсия', 'trip', 'поездка', 'island hopping', 'sightseeing'] },
  { id: 'water_activities', table: 'water_activities', keywords: ['diving', 'дайвинг', 'snorkeling', 'jet ski', 'гидроцикл', 'parasailing', 'kayak', 'surfing', 'сёрфинг'] },
  { id: 'restaurants', table: 'restaurants', keywords: ['restaurant', 'ресторан', 'cafe', 'кафе', 'bar', 'бар', 'bistro', 'food', 'еда', 'cuisine', 'menu'] },
  { id: 'salons', table: 'salons', keywords: ['salon', 'салон', 'spa', 'спа', 'beauty', 'massage', 'массаж', 'manicure', 'маникюр', 'hair', 'nails'] },
  { id: 'clinics', table: 'clinics', keywords: ['clinic', 'клиника', 'hospital', 'госпиталь', 'doctor', 'доктор', 'врач', 'medical', 'dental', 'health'] },
  { id: 'gyms', table: 'gyms', keywords: ['gym', 'зал', 'fitness', 'фитнес', 'workout', 'crossfit', 'yoga', 'йога', 'pilates', 'sport'] },
  { id: 'vehicles', table: 'vehicles', keywords: ['car', 'машина', 'авто', 'motorbike', 'мотобайк', 'scooter', 'скутер', 'bike', 'rental', 'прокат'] },
  { id: 'events', table: 'events', keywords: ['event', 'событие', 'party', 'вечеринка', 'concert', 'концерт', 'festival', 'фестиваль', 'show'] },
  { id: 'babysitters', table: 'babysitters', keywords: ['babysitter', 'няня', 'nanny', 'childcare', 'baby', 'ребёнок', 'children', 'дети'] },
  { id: 'cleaning_services', table: 'cleaning_providers', keywords: ['cleaning', 'уборка', 'maid', 'housekeeping', 'клининг', 'deep clean'] },
  { id: 'legal_services', table: 'lawyers', keywords: ['lawyer', 'юрист', 'адвокат', 'legal', 'visa', 'виза', 'immigration', 'notary', 'contract'] },
  { id: 'pet_services', table: 'pet_services', keywords: ['pet', 'питомец', 'dog', 'собака', 'cat', 'кошка', 'vet', 'ветеринар', 'grooming'] },
  { id: 'education_providers', table: 'education_centers', keywords: ['school', 'школа', 'education', 'course', 'курс', 'tutor', 'репетитор', 'language', 'training'] },
  { id: 'flower_shops', table: 'flower_shops', keywords: ['flowers', 'цветы', 'bouquet', 'букет', 'florist', 'флорист', 'roses'] },
  { id: 'providers', table: 'providers', keywords: ['provider', 'провайдер', 'company', 'компания', 'service', 'услуга', 'business', 'pharmacy', 'аптека', 'insurance', 'страховка', 'store', 'магазин'] },
  { id: 'marketplace_products', table: 'marketplace_products', keywords: ['product', 'товар', 'item', 'goods', 'buy', 'sell', 'продать'] },
  { id: 'marketplace_vendors', table: 'marketplace_vendors', keywords: ['vendor', 'продавец', 'seller', 'merchant'] },
];

// Cache for loaded verticals (per-request scope)
let cachedVerticals: VerticalConfig[] | null = null;

/**
 * Load vertical configs from database with static fallback
 */
async function loadVerticalConfigs(supabase: any): Promise<VerticalConfig[]> {
  if (cachedVerticals) return cachedVerticals;

  try {
    const { data, error } = await supabase
      .from('sys_intake_configs')
      .select('vertical_id, target_table, keywords')
      .eq('is_active', true)
      .order('sort_order');

    if (error || !data || data.length === 0) {
      console.log('[INTAKE] Using static verticals fallback');
      cachedVerticals = STATIC_VERTICALS;
      return STATIC_VERTICALS;
    }

    const loaded: VerticalConfig[] = data.map((row: any) => ({
      id: row.vertical_id,
      table: row.target_table,
      keywords: row.keywords || [],
    }));

    cachedVerticals = loaded;
    console.log(`[INTAKE] Loaded ${loaded.length} verticals from DB`);
    return loaded;
  } catch (err) {
    console.error('[INTAKE] Error loading verticals:', err);
    cachedVerticals = STATIC_VERTICALS;
    return STATIC_VERTICALS;
  }
}

// URL detection regex
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

// Emoji number patterns for agent messages
const EMOJI_NUMBER_PATTERN = /(?:^|\n)\s*(?:1️⃣|2️⃣|3️⃣|4️⃣|5️⃣|6️⃣|7️⃣|8️⃣|9️⃣|🔟|[①②③④⑤⑥⑦⑧⑨⑩])/;
const EMOJI_SPLIT_PATTERN = /(?=(?:^|\n)\s*(?:[1-9]️⃣|🔟|[①②③④⑤⑥⑦⑧⑨⑩]))/;

// Item separators for bulk text (updated with emoji patterns)
const ITEM_SEPARATORS = [
  /^---+$/m,
  /^===+$/m,
  /^#{2,}\s/m,
  /^\d+\.\s+[A-ZА-Я]/m,
];

/**
 * Detect if text is an agent-style group message with emoji-numbered items
 */
function isAgentMessage(text: string): boolean {
  const emojiMatches = text.match(/[1-9]️⃣|[①②③④⑤⑥⑦⑧⑨⑩]/g);
  return (emojiMatches?.length || 0) >= 2;
}

/**
 * Split agent group message into individual items with shared header/footer context
 * 
 * Structure:
 *   HEADER (complex name, location, type)
 *   1️⃣ Item 1 + link
 *   2️⃣ Item 2 + link
 *   FOOTER (price policy, commission, contact)
 * 
 * Each returned item = HEADER + ITEM_BODY + FOOTER
 */
function splitAgentMessage(text: string): string[] {
  const lines = text.split('\n');
  
  // Find first emoji number position
  let firstEmojiLineIdx = -1;
  let lastEmojiLineIdx = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^(?:[1-9]️⃣|[①②③④⑤⑥⑦⑧⑨⑩])/.test(line)) {
      if (firstEmojiLineIdx === -1) firstEmojiLineIdx = i;
      lastEmojiLineIdx = i;
    }
  }
  
  if (firstEmojiLineIdx === -1) {
    return [text]; // No emoji numbers found, return as single item
  }
  
  // Extract header = everything before the first emoji number
  const headerLines = lines.slice(0, firstEmojiLineIdx).filter(l => l.trim());
  const header = headerLines.join('\n').trim();
  
  // Find footer = everything after the last item block
  // Walk from lastEmojiLineIdx to find where its content ends (next emoji or end)
  // Then footer is everything after all items
  
  // Split the items section by emoji numbers
  const itemsSection = lines.slice(firstEmojiLineIdx).join('\n');
  const itemChunks = itemsSection.split(EMOJI_SPLIT_PATTERN).filter(s => s.trim());
  
  // Detect footer: lines after last item that look like shared info
  // (commission, contact, price policy, etc.)
  const footerKeywords = [
    /commission|комиссия/i,
    /contact|контакт|whatsapp|telegram|📲|📱|☎/i,
    /price\s*calculation|расчёт/i,
    /short.?term|долгосроч|краткосроч/i,
    /available|доступн/i,
    /💰|📧|📞/,
  ];
  
  // Check if the last chunk has trailing footer lines
  let footer = '';
  if (itemChunks.length > 0) {
    const lastChunk = itemChunks[itemChunks.length - 1];
    const lastChunkLines = lastChunk.split('\n');
    
    // Walk backwards from the last chunk to find footer start
    let footerStartInLastChunk = lastChunkLines.length;
    for (let i = lastChunkLines.length - 1; i >= 1; i--) {
      const line = lastChunkLines[i].trim();
      if (!line) continue;
      const isFooter = footerKeywords.some(kw => kw.test(line));
      if (isFooter) {
        footerStartInLastChunk = i;
      } else {
        break;
      }
    }
    
    // Also check lines after all emoji items in the original text
    // Find where item content truly ends
    const allItemsEnd = firstEmojiLineIdx + itemsSection.split('\n').length;
    const trailingLines = lines.slice(allItemsEnd).filter(l => l.trim());
    
    if (footerStartInLastChunk < lastChunkLines.length) {
      footer = lastChunkLines.slice(footerStartInLastChunk).join('\n').trim();
      // Trim footer from last item chunk
      itemChunks[itemChunks.length - 1] = lastChunkLines.slice(0, footerStartInLastChunk).join('\n').trim();
    }
    
    if (trailingLines.length > 0) {
      footer = (footer ? footer + '\n' : '') + trailingLines.join('\n').trim();
    }
  }
  
  // Build final items: HEADER + ITEM + FOOTER
  const results: string[] = [];
  for (const chunk of itemChunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    
    // Extract URLs from this chunk for sourceImages tracking
    const parts: string[] = [];
    if (header) parts.push(header);
    parts.push(trimmed);
    if (footer) parts.push(footer);
    
    results.push(parts.join('\n\n'));
  }
  
  return results.length > 0 ? results : [text];
}

interface IntakeRequest {
  mode: 'single' | 'bulk_text' | 'bulk_file' | 'bulk_urls' | 'files' | 'agent_message';
  rawText?: string;
  fileData?: { rows: Record<string, unknown>[] };
  urls?: string[];
  images?: string[];
  forceVertical?: string;
  sessionId?: string;
}

interface ExtractedField {
  value: unknown;
  confidence: number;
  source: 'text' | 'scraped' | 'image' | 'inferred';
}

interface IntakeItem {
  id: string;
  status: 'pending' | 'approved' | 'discarded' | 'created';
  sourceUrl?: string;
  sourceText?: string;
  sourceImages?: string[];
  detectedVertical: string;
  verticalConfidence: number;
  extractedFields: Record<string, ExtractedField>;
  suggestedTitle: { en: string; ru: string };
  suggestedDescription: { en: string; ru: string };
  missingRequiredFields: string[];
  warnings: string[];
  overallConfidence: number;
  createdListingId?: string;
  createdListingTable?: string;
}

interface IntakeResponse {
  sessionId: string;
  status: 'ready' | 'partial' | 'failed';
  items: IntakeItem[];
  summary: {
    total: number;
    byVertical: Record<string, number>;
    avgConfidence: number;
    readyToApprove: number;
    needsReview: number;
  };
}

/**
 * Detect vertical from content using keyword matching + AI
 */
function detectVerticalFromKeywords(content: string, verticals: VerticalConfig[]): { vertical: string; confidence: number } {
  const lowerContent = content.toLowerCase();
  const scores: Record<string, number> = {};

  for (const v of verticals) {
    let score = 0;
    for (const keyword of v.keywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    if (score > 0) {
      scores[v.id] = score;
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    const maxScore = sorted[0][1];
    const confidence = Math.min(0.95, 0.5 + (maxScore * 0.1));
    return { vertical: sorted[0][0], confidence };
  }

  return { vertical: 'providers', confidence: 0.3 };
}

/**
 * Split bulk text into individual items
 * Now also detects agent-style emoji-numbered messages
 */
function splitBulkText(text: string): string[] {
  // Check for agent-style message first
  if (isAgentMessage(text)) {
    const agentItems = splitAgentMessage(text);
    if (agentItems.length > 1) return agentItems;
  }
  
  for (const sep of ITEM_SEPARATORS) {
    const parts = text.split(sep).filter(p => p.trim().length > 50);
    if (parts.length > 1) {
      return parts;
    }
  }
  // Check for double newlines as separator
  const doubleNewlineParts = text.split(/\n\n\n+/).filter(p => p.trim().length > 50);
  if (doubleNewlineParts.length > 1) {
    return doubleNewlineParts;
  }
  return [text];
}

/**
 * Extract URLs from text
 */
function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Cloud storage link patterns
 */
const CLOUD_STORAGE_PATTERNS = [
  /disk\.yandex\.(ru|com)/i,
  /drive\.google\.com/i,
  /dropbox\.com/i,
  /cloud\.mail\.ru/i,
  /photos\.google\.com/i,
];

function isCloudStorageLink(url: string): boolean {
  return CLOUD_STORAGE_PATTERNS.some(p => p.test(url));
}

/**
 * Extract direct image URLs from cloud storage pages using Firecrawl
 */
async function extractImagesFromCloudLinks(
  urls: string[],
  firecrawlApiKey?: string
): Promise<string[]> {
  const cloudUrls = urls.filter(isCloudStorageLink);
  if (cloudUrls.length === 0 || !firecrawlApiKey) return urls;

  const imageUrls: string[] = [];
  // Keep non-cloud URLs as-is
  const nonCloudUrls = urls.filter(u => !isCloudStorageLink(u));
  imageUrls.push(...nonCloudUrls);

  for (const url of cloudUrls) {
    try {
      console.log(`[INTAKE] Extracting images from cloud link: ${url}`);
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['links', 'html'],
          waitFor: 5000,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.success === false) {
        console.warn(`[INTAKE] Cloud scrape failed for ${url}:`, data?.error);
        imageUrls.push(url); // Keep original link as fallback
        continue;
      }

      const scraped = data.data || {};
      
      // Extract image URLs from links and HTML
      const allLinks: string[] = scraped.links || [];
      const html: string = scraped.html || '';
      
      // Find direct image links
      const imgExtensions = /\.(jpg|jpeg|png|webp|heic|avif)(\?|$)/i;
      const directImages = allLinks.filter((l: string) => imgExtensions.test(l));
      
      // Also extract from HTML img tags and og:image meta
      const htmlImgMatches = html.match(/(?:src|content)=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi) || [];
      const htmlImages = htmlImgMatches
        .map((m: string) => m.replace(/^(?:src|content)=["']/, '').replace(/["']$/, ''))
        .filter((u: string) => u.startsWith('http'));

      const foundImages = [...new Set([...directImages, ...htmlImages])];
      
      if (foundImages.length > 0) {
        console.log(`[INTAKE] Found ${foundImages.length} images from ${url}`);
        imageUrls.push(...foundImages.slice(0, 20)); // Limit to 20 images per link
      } else {
        console.log(`[INTAKE] No images found in cloud link, keeping original: ${url}`);
        imageUrls.push(url); // Keep original as reference
      }
    } catch (err) {
      console.error(`[INTAKE] Cloud image extraction error for ${url}:`, err);
      imageUrls.push(url);
    }
  }

  return [...new Set(imageUrls)];
}

/**
 * Call Firecrawl to scrape URLs
 */
async function scrapeUrls(urls: string[], firecrawlApiKey?: string): Promise<Record<string, { title: string; content: string; metadata: Record<string, unknown> }>> {
  if (urls.length === 0) return {};

  if (!firecrawlApiKey) {
    console.warn('[INTAKE] FIRECRAWL_API_KEY not configured, URL scraping skipped');
    return {};
  }

  const results: Record<string, { title: string; content: string; metadata: Record<string, unknown> }> = {};

  for (const url of urls) {
    try {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'html'],
          onlyMainContent: true,
          waitFor: 5000,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        console.error(`[INTAKE] Firecrawl error for ${url}:`, data?.error || response.status);
        continue;
      }

      const scraped = data.data || {};
      const content = scraped.markdown || scraped.html || '';

      if (!content.trim()) {
        console.warn(`[INTAKE] Empty scraped content for ${url}`);
        continue;
      }

      results[url] = {
        title: scraped.metadata?.title || '',
        content,
        metadata: scraped.metadata || {},
      };

      console.log(`[INTAKE] Scraped ${url}: ${content.length} chars`);
    } catch (error) {
      console.error(`[INTAKE] Firecrawl exception for ${url}:`, error);
    }
  }

  return results;
}

/**
 * Call AI to extract structured fields and generate descriptions
 */
async function extractFieldsWithAI(
  content: string,
  vertical: string,
  apiKey: string
): Promise<{
  fields: Record<string, ExtractedField>;
  title: { en: string; ru: string };
  description: { en: string; ru: string };
  confidence: number;
}> {
  // Note: verticalConfig not used in current implementation but kept for future enhancements
  
  const systemPrompt = `You are a data extraction assistant for a marketplace platform. 
Extract structured information from the provided content for a "${vertical}" listing.

Return a JSON object with:
1. "fields": Object with extracted field values and confidence scores (0-1)
2. "title": { "en": "English title", "ru": "Russian title" }
3. "description": { "en": "English description (2-3 sentences)", "ru": "Russian description (2-3 sentences)" }
4. "confidence": Overall extraction confidence (0-1)

COMPLETE LIST OF FIELDS TO EXTRACT (extract ALL that can be found or inferred):

=== Identity & Descriptions ===
- name_en, name_ru: Property/listing name in English and Russian
- title_en, title_ru: Short title for cards
- internal_name: Internal reference name (e.g. "Villa Sunset B12")
- description_en, description_ru: Full description (2-4 sentences, professional, engaging)
- short_description_en, short_description_ru: One-liner summary

=== Property Type & Structure ===
- property_type: villa, apartment, condo, house, townhouse, penthouse, studio, duplex
- bedrooms: Number of bedrooms (integer)
- bathrooms: Number of bathrooms (integer)
- area_sqm: Total area in square meters (number)
- plot_size_sqm: Land plot size for villas/houses (number)
- floor: Floor number (integer)
- total_floors: Total floors in building (integer)
- unit_number: Unit/apt number (string)
- has_elevator: true/false

=== Location ===
- address: Full street address
- district: Area/district name (e.g. Rawai, Bang Tao, Kata, Kamala, Patong, Cherng Talay, Layan)
- lat: Latitude coordinate (number)
- lng: Longitude coordinate (number)

=== Pricing & Terms ===
- price: Base price (number only)
- price_per_night: Nightly rental rate (number)
- price_per_day, price_per_hour, price_per_month: Other pricing models (number)
- deposit_amount: Security deposit (number)
- min_stay_nights: Minimum stay in nights (integer)
- max_guests: Maximum number of guests (integer)
- check_in_time: Check-in time (e.g. "14:00")
- check_out_time: Check-out time (e.g. "12:00")
- instant_booking: true/false
- weekly_discount: Weekly discount percentage (0-100)
- monthly_discount: Monthly discount percentage (0-100)
- cancellation_policy: flexible, moderate, strict, super_strict

=== Property Features ===
- parking_type: garage, carport, open, street, none
- parking_spaces: Number of parking spaces (integer)
- pool_type: private, shared, rooftop, infinity, plunge, none
- garden_type: private, shared, tropical, rooftop, none
- view_type: sea, ocean, mountain, pool, garden, city, panoramic, lake
- furnishing_level: fully_furnished, partially_furnished, unfurnished
- equipment: Array of equipment items (e.g. ["washing_machine", "dishwasher", "air_conditioning", "wifi", "tv", "microwave", "oven", "iron"])
- amenities: Array of amenities (e.g. ["gym", "sauna", "jacuzzi", "bbq", "playground", "security", "cctv"])
- highlights: Array of property highlights (e.g. ["beachfront", "newly_renovated", "mountain_view", "private_pool"])

=== Ownership & Management ===
- ownership_form: freehold, leasehold, company, foreign_company
- management_type: full, partial, self
- is_for_sale: true/false
- sale_price: Sale price if for sale (number)

=== House Rules ===
- pets_allowed: true/false
- pet_deposit: Pet deposit amount (number)
- smoking_allowed: true/false
- smoking_penalty: Smoking penalty amount (number)
- parties_allowed: true/false
- max_party_guests: Max guests for parties (integer)
- children_friendly: true/false
- has_crib: true/false
- has_high_chair: true/false
- quiet_hours_start: Quiet hours start (e.g. "22:00")
- quiet_hours_end: Quiet hours end (e.g. "08:00")
- house_rules: House rules text in English
- house_rules_ru: House rules text in Russian

=== Non-Property Verticals (additional fields) ===
- phone, email, website: Contact info
- features, services: Lists of features/services
- capacity: Max capacity (integer)
- working_hours: Operating schedule
- pricing_model: fixed, hourly, daily, per_person
- availability_type: instant, request, schedule
- category_id: Category identifier
- images, cover_image: Image URLs

IMPORTANT: Extract ALL fields that can be found or reasonably inferred from the content.
For prices, extract the numeric value only (no currency symbols).
For boolean fields, return true/false.
For arrays, return as arrays of strings.
Generate professional, engaging descriptions in both languages.
If a field can be reasonably inferred (e.g. a beachfront villa likely has sea view), include it with lower confidence.`;

  const userPrompt = `Extract listing data for vertical "${vertical}" from this content:

"""
${content.substring(0, 8000)}
"""

Return valid JSON only.`;

  try {
    // Get model and temperature from function context (passed via closure or defaults)
    const modelToUse = (globalThis as any).__intakeModel || "google/gemini-3-flash-preview";
    const tempToUse = (globalThis as any).__intakeTemperature ?? 0.3;
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelToUse,
        temperature: tempToUse,
        max_tokens: 2000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_listing_data",
            description: "Extract structured listing data from content",
            parameters: {
              type: "object",
              properties: {
                fields: {
                  type: "object",
                  description: "Extracted fields with values and confidence",
                  additionalProperties: {
                    type: "object",
                    properties: {
                      value: {},
                      confidence: { type: "number" },
                      source: { type: "string", enum: ["text", "scraped", "image", "inferred"] }
                    }
                  }
                },
                title: {
                  type: "object",
                  properties: {
                    en: { type: "string" },
                    ru: { type: "string" }
                  },
                  required: ["en", "ru"]
                },
                description: {
                  type: "object",
                  properties: {
                    en: { type: "string" },
                    ru: { type: "string" }
                  },
                  required: ["en", "ru"]
                },
                confidence: { type: "number" }
              },
              required: ["fields", "title", "description", "confidence"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_listing_data" } }
      }),
    });

    if (!response.ok) {
      console.error('[INTAKE] AI extraction error:', response.status);
      return getDefaultExtraction(vertical);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        return {
          fields: parsed.fields || {},
          title: parsed.title || { en: 'Untitled', ru: 'Без названия' },
          description: parsed.description || { en: '', ru: '' },
          confidence: parsed.confidence || 0.5,
        };
      } catch (e) {
        console.error('[INTAKE] Failed to parse AI response:', e);
      }
    }

    return getDefaultExtraction(vertical);
  } catch (error) {
    console.error('[INTAKE] AI extraction exception:', error);
    return getDefaultExtraction(vertical);
  }
}

function getDefaultExtraction(vertical: string) {
  return {
    fields: {},
    title: { en: `New ${vertical} listing`, ru: `Новый листинг ${vertical}` },
    description: { en: '', ru: '' },
    confidence: 0.3,
  };
}

/**
 * Get required fields for a vertical
 */
function getRequiredFields(vertical: string): string[] {
  const requiredByVertical: Record<string, string[]> = {
    yachts: ['name_en'],
    properties: ['name_en'],
    owner_properties: ['title_en'],
    tours: ['name_en'],
    restaurants: ['name_en'],
    salons: ['name_en'],
    clinics: ['name_en'],
    gyms: ['name_en'],
    vehicles: ['name_en'],
    events: ['name_en'],
    babysitters: ['name_en'],
    cleaning_services: ['name_en'],
    legal_services: ['name_en'],
    pet_services: ['name_en'],
    education_providers: ['name_en'],
    pharmacies: ['name_en'],
    insurance_providers: ['name_en'],
    flower_shops: ['name_en'],
    stores: ['name_en'],
    providers: ['name_en'],
    marketplace_products: ['name_en'],
    marketplace_vendors: ['name_en'],
    vendor_locations: ['name_en'],
    water_activities: ['name_en'],
  };
  return requiredByVertical[vertical] || ['name_en'];
}

/**
 * Process a single content item
 */
async function processItem(
  content: string,
  sourceUrl: string | undefined,
  images: string[],
  forceVertical: string | undefined,
  apiKey: string,
  verticals: VerticalConfig[]
): Promise<IntakeItem> {
  const id = crypto.randomUUID();
  
  // Detect vertical
  let verticalResult: { vertical: string; confidence: number };
  if (forceVertical && verticals.find(v => v.id === forceVertical)) {
    verticalResult = { vertical: forceVertical, confidence: 0.99 };
  } else {
    verticalResult = detectVerticalFromKeywords(content, verticals);
  }

  // Extract fields with AI
  const extraction = await extractFieldsWithAI(content, verticalResult.vertical, apiKey);

  // Auto-fill name fields from AI-generated title if not in extracted fields
  if (!extraction.fields.name_en?.value && extraction.title?.en) {
    extraction.fields.name_en = { value: extraction.title.en, confidence: 0.9, source: 'inferred' };
  }
  if (!extraction.fields.name_ru?.value && extraction.title?.ru) {
    extraction.fields.name_ru = { value: extraction.title.ru, confidence: 0.9, source: 'inferred' };
  }
  // Auto-fill title_en for owner_properties vertical
  if (!extraction.fields.title_en?.value && extraction.title?.en) {
    extraction.fields.title_en = { value: extraction.title.en, confidence: 0.9, source: 'inferred' };
  }
  // Auto-fill description fields from AI-generated description
  if (!extraction.fields.description_en?.value && extraction.description?.en) {
    extraction.fields.description_en = { value: extraction.description.en, confidence: 0.85, source: 'inferred' };
  }
  if (!extraction.fields.description_ru?.value && extraction.description?.ru) {
    extraction.fields.description_ru = { value: extraction.description.ru, confidence: 0.85, source: 'inferred' };
  }

  // Check required fields
  const requiredFields = getRequiredFields(verticalResult.vertical);
  const missingRequired: string[] = [];
  for (const field of requiredFields) {
    if (!extraction.fields[field]?.value) {
      missingRequired.push(field);
    }
  }

  // Generate warnings
  const warnings: string[] = [];
  if (extraction.confidence < 0.5) {
    warnings.push('Low confidence extraction - please review carefully');
  }
  if (Object.keys(extraction.fields).length < 3) {
    warnings.push('Few fields extracted - consider adding more details');
  }

  // Calculate overall confidence
  const overallConfidence = (verticalResult.confidence + extraction.confidence) / 2;

  return {
    id,
    status: 'pending',
    sourceUrl,
    sourceText: content.substring(0, 500),
    sourceImages: images,
    detectedVertical: verticalResult.vertical,
    verticalConfidence: verticalResult.confidence,
    extractedFields: extraction.fields,
    suggestedTitle: extraction.title,
    suggestedDescription: extraction.description,
    missingRequiredFields: missingRequired,
    warnings,
    overallConfidence,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json() as IntakeRequest & { uploadedImages?: string[] };
    const { mode, rawText, fileData, urls, forceVertical, sessionId } = body;
    // Support both "images" and "uploadedImages" from frontend
    const images = body.images || body.uploadedImages || [];

    console.log(`[INTAKE] Processing request: mode=${mode}, sessionId=${sessionId || 'new'}`);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch agent config from DB
    const { data: agentConfig } = await supabase
      .from('ai_agents')
      .select('id, model, temperature, is_active')
      .eq('slug', 'intake-listing-agent')
      .single();

    // Check if agent is active
    if (agentConfig && !agentConfig.is_active) {
      return new Response(
        JSON.stringify({ error: "Intake agent is currently disabled" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use DB config or fallback to defaults
    const aiModel = agentConfig?.model || 'google/gemini-3-flash-preview';
    const aiTemperature = agentConfig?.temperature ?? 0.3;

    // Get user from auth header
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set global config for AI calls (used in extractFieldsWithAI)
    (globalThis as any).__intakeModel = aiModel;
    (globalThis as any).__intakeTemperature = aiTemperature;

    // Get API key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY") || undefined;

    const items: IntakeItem[] = [];
    const scrapedContent: Record<string, { title: string; content: string; metadata: Record<string, unknown> }> = {};

    // Load vertical configs from DB (with fallback)
    const verticals = await loadVerticalConfigs(supabase);

    // Process based on mode
    if (mode === 'bulk_urls' && urls && urls.length > 0) {
      // Scrape all URLs
      const scraped = await scrapeUrls(urls, FIRECRAWL_API_KEY);
      Object.assign(scrapedContent, scraped);

      for (const url of urls) {
        const content = scrapedContent[url];
        if (content) {
          const combinedContent = `${content.title}\n\n${content.content}`;
          const item = await processItem(combinedContent, url, [], forceVertical, LOVABLE_API_KEY, verticals);
          items.push(item);
        } else {
          // Failed to scrape - create placeholder
          items.push({
            id: crypto.randomUUID(),
            status: 'pending',
            sourceUrl: url,
            sourceText: '',
            detectedVertical: 'providers',
            verticalConfidence: 0,
            extractedFields: {},
            suggestedTitle: { en: 'Failed to scrape', ru: 'Ошибка загрузки' },
            suggestedDescription: { en: '', ru: '' },
            missingRequiredFields: ['name_en'],
            warnings: ['Failed to scrape URL content'],
            overallConfidence: 0,
          });
        }
      }
    } else if (mode === 'files' && images.length > 0) {
      // Files mode: uploaded images/documents - describe them for AI extraction
      const imageListText = images.map((url: string, i: number) => `Image ${i + 1}: ${url}`).join('\n');
      const content = `Uploaded files for listing creation:\n${imageListText}\n\nPlease extract all possible listing information from these images/documents.`;
      const item = await processItem(content, undefined, images, forceVertical, LOVABLE_API_KEY, verticals);
      items.push(item);
    } else if (mode === 'bulk_file' && fileData?.rows) {
      // Process file rows
      for (const row of fileData.rows) {
        const content = Object.entries(row)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n');
        const item = await processItem(content, undefined, [], forceVertical, LOVABLE_API_KEY, verticals);
        items.push(item);
      }
    } else if (rawText) {
      // Check for URLs in text
      const extractedUrls = extractUrls(rawText);
      if (extractedUrls.length > 0 && mode !== 'bulk_text' && mode !== 'agent_message') {
        // Scrape URLs first
        const scraped = await scrapeUrls(extractedUrls, FIRECRAWL_API_KEY);
        Object.assign(scrapedContent, scraped);
      }

      if (mode === 'agent_message') {
        // Agent group message — split with smart header/footer merging
        // Default to properties vertical for rental agent posts
        const agentVertical = forceVertical || 'properties';
        const textItems = splitAgentMessage(rawText);
        console.log(`[INTAKE] Agent message split into ${textItems.length} items`);
        for (const text of textItems) {
          // Extract per-item image URLs (Yandex Disk, Google Drive, etc.)
          const itemUrls = extractUrls(text);
          // Try to resolve cloud storage links to actual image URLs
          const resolvedImages = await extractImagesFromCloudLinks(itemUrls, FIRECRAWL_API_KEY);
          const item = await processItem(text, itemUrls[0], resolvedImages, agentVertical, LOVABLE_API_KEY, verticals);
          items.push(item);
        }
      } else if (mode === 'bulk_text') {
        // Split into multiple items
        const textItems = splitBulkText(rawText);
        for (const text of textItems) {
          const item = await processItem(text, undefined, images || [], forceVertical, LOVABLE_API_KEY, verticals);
          items.push(item);
        }
      } else {
        // Single item - combine raw text with scraped content
        let combinedContent = rawText;
        for (const [url, content] of Object.entries(scrapedContent)) {
          combinedContent += `\n\n--- Content from ${url} ---\n${content.title}\n${content.content}`;
        }
        const item = await processItem(combinedContent, extractedUrls[0], images || [], forceVertical, LOVABLE_API_KEY, verticals);
        items.push(item);
      }
    } else {
      return new Response(
        JSON.stringify({ error: "No input provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate summary
    const byVertical: Record<string, number> = {};
    let totalConfidence = 0;
    let readyToApprove = 0;
    let needsReview = 0;

    for (const item of items) {
      byVertical[item.detectedVertical] = (byVertical[item.detectedVertical] || 0) + 1;
      totalConfidence += item.overallConfidence;
      if (item.overallConfidence >= 0.7 && item.missingRequiredFields.length === 0) {
        readyToApprove++;
      } else {
        needsReview++;
      }
    }

    const avgConfidence = items.length > 0 ? totalConfidence / items.length : 0;

    // Create or update session
    const newSessionId = sessionId || crypto.randomUUID();
    const { error: sessionError } = await supabase
      .from('ai_intake_sessions')
      .upsert({
        id: newSessionId,
        admin_id: userId,
        input_mode: mode,
        raw_input: rawText?.substring(0, 10000),
        uploaded_images: images,
        items_count: items.length,
        items: items,
        status: items.length > 0 ? 'ready' : 'failed',
        processed_count: items.length,
        updated_at: new Date().toISOString(),
      });

    if (sessionError) {
      console.error('[INTAKE] Failed to save session:', sessionError);
    }

    const response: IntakeResponse = {
      sessionId: newSessionId,
      status: items.length > 0 ? 'ready' : 'failed',
      items,
      summary: {
        total: items.length,
        byVertical,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        readyToApprove,
        needsReview,
      },
    };

    // Log usage to ai_agent_logs (async, non-blocking)
    if (agentConfig?.id) {
      (async () => {
        try {
          await supabase.from('ai_agent_logs').insert({
            agent_id: agentConfig.id,
            user_id: userId,
            session_id: newSessionId,
            response_time_ms: Date.now() - startTime,
            messages_count: items.length,
          });
        } catch (e) {
          console.error('[INTAKE] Failed to log usage:', e);
        }
      })();
    }

    console.log(`[INTAKE] Completed in ${Date.now() - startTime}ms: ${items.length} items processed`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[INTAKE] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
