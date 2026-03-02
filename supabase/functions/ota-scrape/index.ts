import { createClient } from '../_shared/supabase.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ListingData {
  title?: string;
  description?: string;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  max_guests?: number;
  amenities?: string[];
  house_rules?: string;
  address?: string;
  photos?: Array<{ url: string; order?: number }>;
  cover_photo?: string;
  price_per_night?: number;
  currency?: string;
  rating?: number;
  review_count?: number;
}

// Platform-specific parsing hints for the AI
const PLATFORM_HINTS: Record<string, string> = {
  booking: 'Booking.com listing. Price usually shown as "THB X,XXX" or "US$XXX per night". Photos in high-res. Look for "Property highlights", "Facilities", and room configuration.',
  vrbo: 'VRBO/HomeAway listing. Look for property details in structured sections. Prices in USD unless specified. Amenities listed under "About this property".',
  expedia: 'Expedia hotel/vacation rental. Look for "About this area", "Rooms", "Amenities". Prices per night.',
  agoda: 'Agoda listing. Price often in THB or USD. Look for "Property highlights", "Facilities", room details. Photos from agoda CDN.',
  tripadvisor: 'TripAdvisor vacation rental. Look for rental details, reviews count, amenities list, nightly rate.',
  trip_com: 'Trip.com hotel listing. Look for room types, facilities, hotel policies. Prices often in USD or local currency.',
  ostrovok: 'Ostrovok.ru listing (Russian OTA). Content may be in Russian. Look for "Удобства", room configuration, price per night in RUB.',
  sutochno: 'Sutochno.ru listing (Russian short-term rental). Content in Russian. Look for "Описание", "Удобства", price "за сутки" in RUB.',
  avito: 'Avito.ru real estate listing. Content in Russian. Look for price, address, description, photos. Property specs in sidebar.',
  cian: 'CIAN.ru listing. Content in Russian. Look for price (руб/мес or сут), address, area, rooms count, floor.',
};

// Extract structured data from scraped markdown using AI
async function extractWithAI(markdown: string, platform: string, platformName: string): Promise<ListingData> {
  const hint = PLATFORM_HINTS[platform] || `${platformName} listing page.`;
  
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    console.log('No LOVABLE_API_KEY, falling back to regex parsing');
    return parseWithRegex(markdown);
  }

  try {
    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a property listing data extractor. Extract structured data from an OTA listing page.
Context: ${hint}

Return a JSON object with these fields (omit if not found):
- title: string (property name/title)
- description: string (main description, max 2000 chars)  
- property_type: "apartment" | "villa" | "house" | "condo" | "studio" | "hotel_room" | "townhouse"
- bedrooms: number
- bathrooms: number
- max_guests: number
- amenities: string[] (standardized English names: wifi, kitchen, pool, air_conditioning, etc.)
- house_rules: string
- address: string (full address or area/district)
- price_per_night: number (numeric only, no currency symbol)
- currency: "THB" | "USD" | "EUR" | "RUB" | "GBP" (detect from symbols ฿$€₽£)
- rating: number (e.g. 4.8)
- review_count: number

IMPORTANT: Return ONLY valid JSON, no markdown code fences.`,
          },
          {
            role: 'user',
            content: markdown.slice(0, 8000),
          },
        ],
        temperature: 0.1,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return parseWithRegex(markdown);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';
    
    // Clean and parse JSON
    const jsonStr = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    return parsed as ListingData;
  } catch (err) {
    console.error('AI extraction failed, falling back to regex:', err);
    return parseWithRegex(markdown);
  }
}

// Fallback regex-based parser (multilingual)
function parseWithRegex(markdown: string): ListingData {
  const data: ListingData = {};
  
  // Title
  const titleMatch = markdown.match(/^#\s*(.+?)$/m) || markdown.match(/\*\*(.{10,80}?)\*\*/);
  if (titleMatch) data.title = titleMatch[1].trim();
  
  // Guests
  const guestMatch = markdown.match(/(\d+)\s*(?:guests?|гост[а-яё]*|человек)/i);
  if (guestMatch) data.max_guests = parseInt(guestMatch[1]);
  
  // Bedrooms
  const bedroomMatch = markdown.match(/(\d+)\s*(?:bedrooms?|спальн[а-яё]*|комнат[а-яё]*)/i);
  if (bedroomMatch) data.bedrooms = parseInt(bedroomMatch[1]);
  
  // Bathrooms
  const bathMatch = markdown.match(/(\d+\.?\d*)\s*(?:baths?|bathrooms?|ванн[а-яё]*|санузл[а-яё]*)/i);
  if (bathMatch) data.bathrooms = parseFloat(bathMatch[1]);
  
  // Price
  const pricePatterns = [
    /[฿$€£₽]\s*([\d\s,]+)\s*(?:\/?\s*(?:night|ночь|сутки|за ночь|за сутки))/i,
    /([\d\s,]+)\s*[฿$€£₽]\s*(?:\/?\s*(?:night|ночь|сутки))/i,
    /([\d\s,]+)\s*(?:руб|₽)\s*(?:\/?\s*(?:ночь|сутки|мес))/i,
  ];
  for (const p of pricePatterns) {
    const m = markdown.match(p);
    if (m) {
      data.price_per_night = parseFloat(m[1].replace(/[\s,]/g, ''));
      if (markdown.includes('฿')) data.currency = 'THB';
      else if (markdown.includes('₽') || markdown.includes('руб')) data.currency = 'RUB';
      else if (markdown.includes('$')) data.currency = 'USD';
      else if (markdown.includes('€')) data.currency = 'EUR';
      break;
    }
  }
  
  // Description
  const descMatch = markdown.match(/(?:description|описание|about|о жилье|об этом)\s*\n+([\s\S]{50,2000}?)(?=\n#|\n\*\*|$)/i);
  if (descMatch) data.description = descMatch[1].trim().slice(0, 2000);
  
  // Amenities
  const amenityKeywords = [
    'wifi', 'kitchen', 'pool', 'air conditioning', 'parking', 'washer', 'tv',
    'balcony', 'gym', 'elevator', 'dishwasher', 'microwave',
    'бассейн', 'кухня', 'кондиционер', 'парковка', 'лифт', 'балкон',
  ];
  const lower = markdown.toLowerCase();
  data.amenities = amenityKeywords.filter(a => lower.includes(a));
  
  return data;
}

// Extract photos from scraped data
function extractPhotos(scrapeData: any, platform: string): Array<{ url: string; order: number }> {
  const photos: Array<{ url: string; order: number }> = [];
  const seen = new Set<string>();
  
  // From links
  const links: string[] = scrapeData.data?.links || [];
  const imageExtensions = /\.(jpg|jpeg|png|webp)(\?|$)/i;
  
  for (const link of links) {
    if (!imageExtensions.test(link)) continue;
    
    // Filter out small icons, avatars, logos
    const lower = link.toLowerCase();
    if (lower.includes('avatar') || lower.includes('icon') || lower.includes('logo')) continue;
    if (lower.includes('flag') || lower.includes('badge') || lower.includes('sprite')) continue;
    if (lower.includes('1x1') || lower.includes('pixel')) continue;
    
    // Platform-specific photo CDN detection
    const isPropertyPhoto = 
      (platform === 'booking' && (lower.includes('bstatic.com') || lower.includes('booking.com/photos'))) ||
      (platform === 'agoda' && lower.includes('agoda')) ||
      (platform === 'vrbo' && (lower.includes('vrbo.com') || lower.includes('expedia'))) ||
      (platform === 'expedia' && lower.includes('expedia')) ||
      (platform === 'tripadvisor' && lower.includes('tripadvisor')) ||
      (platform === 'trip_com' && lower.includes('trip.com')) ||
      (platform === 'ostrovok' && lower.includes('ostrovok')) ||
      (platform === 'sutochno' && lower.includes('sutochno')) ||
      (platform === 'avito' && (lower.includes('avito') || lower.includes('avatars'))) ||
      (platform === 'cian' && lower.includes('cian')) ||
      imageExtensions.test(link); // fallback: any image
    
    if (isPropertyPhoto) {
      const baseUrl = link.split('?')[0];
      if (!seen.has(baseUrl)) {
        seen.add(baseUrl);
        photos.push({ url: link, order: photos.length });
      }
    }
    
    if (photos.length >= 30) break;
  }
  
  // Also check markdown for inline images
  const markdown = scrapeData.data?.markdown || '';
  const imgMatches = markdown.matchAll(/!\[.*?\]\((https:\/\/[^\)]+)\)/g);
  for (const m of imgMatches) {
    const baseUrl = m[1].split('?')[0];
    if (!seen.has(baseUrl) && photos.length < 30) {
      seen.add(baseUrl);
      photos.push({ url: m[1], order: photos.length });
    }
  }
  
  return photos;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, platform, platform_name } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log(`Scraping ${platform_name || platform} listing: ${formattedUrl}`);

    // Scrape the page
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'links'],
        onlyMainContent: true,
        waitFor: 5000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      const errMsg = scrapeData.error || `Scrape failed: ${scrapeResponse.status}`;
      console.error('Firecrawl error:', errMsg);
      return new Response(
        JSON.stringify({ success: false, error: errMsg }),
        { status: scrapeResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = scrapeData.data?.markdown || '';
    console.log(`Scraped ${markdown.length} chars from ${platform_name}`);

    // Extract listing data (AI-enhanced or regex fallback)
    const listing = await extractWithAI(markdown, platform || 'generic', platform_name || 'OTA');

    // Extract photos
    const photos = extractPhotos(scrapeData, platform);
    if (photos.length > 0) {
      listing.photos = photos;
      listing.cover_photo = photos[0].url;
    }

    console.log('Extracted listing:', JSON.stringify({
      title: listing.title,
      bedrooms: listing.bedrooms,
      price_per_night: listing.price_per_night,
      photosCount: photos.length,
      amenitiesCount: listing.amenities?.length || 0,
    }));

    return new Response(
      JSON.stringify({ success: true, listing }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('OTA scrape error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to scrape';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
