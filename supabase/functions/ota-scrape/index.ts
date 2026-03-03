import { createClient } from '../_shared/supabase.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ListingData {
  title?: string;
  title_ru?: string;
  description?: string;
  description_ru?: string;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  max_guests?: number;
  area_sqm?: number;
  floor?: number;
  view_type?: string;
  furnishing_level?: string;
  equipment?: string[];
  highlights?: string[];
  amenities?: string[]; // legacy, mapped to equipment
  house_rules?: string;
  pets_allowed?: boolean;
  smoking_allowed?: boolean;
  parties_allowed?: boolean;
  children_friendly?: boolean;
  check_in_time?: string;
  check_out_time?: string;
  address?: string;
  district?: string;
  lat?: number;
  lng?: number;
  photos?: Array<{ url: string; order?: number }>;
  cover_photo?: string;
  price_per_night?: number;
  currency?: string;
  min_stay_nights?: number;
  cancellation_policy?: string;
  instant_booking?: boolean;
  deposit_amount?: number;
  deposit_currency?: string;
  cleaning_fee?: number;
  service_fee?: number;
  pool_type?: string;
  parking_type?: string;
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
            content: `You are a property listing data extractor. Extract ALL available data from an OTA listing page.
Context: ${hint}

Return a JSON object with these fields (omit if not found):

## Basic Info
- title: string (property name/title in English, or original language if not English)
- title_ru: string (property name/title in Russian — translate if original is not Russian, or use original if it is Russian)
- description: string (main description in English, max 2000 chars — translate if original is not English)
- description_ru: string (main description in Russian, max 2000 chars — translate if original is not Russian, or use original if it is Russian)
- property_type: "apartment" | "villa" | "house" | "condo" | "studio" | "hotel_room" | "townhouse"
- bedrooms: number
- bathrooms: number
- max_guests: number
- area_sqm: number (total area in square meters)
- floor: number
- view_type: "sea" | "mountain" | "pool" | "garden" | "city" | "ocean" | "lake" | "forest" | "none"
- furnishing_level: "fully_furnished" | "partially_furnished" | "unfurnished"

## Location
- address: string (full address or area/district)
- district: string (neighborhood/area name)

## Pricing
- price_per_night: number (numeric only)
- currency: "THB" | "USD" | "EUR" | "RUB" | "GBP" (detect from symbols ฿$€₽£)
- min_stay_nights: number
- rating: number (e.g. 4.8)
- review_count: number

## Equipment (CRITICAL — extract ALL amenities into this array using EXACTLY these IDs):
### Essentials: wifi, ac, heating, hot_water, towels, bed_linens, extra_pillows, hangers, iron, closet
### Kitchen: kitchen, kitchenette, fridge, freezer, microwave, oven, stove, induction, dishwasher, coffee_machine, kettle, toaster, blender, rice_cooker, dishes, cookware, wine_glasses, dining_table, bar_counter
### Bathroom: bathtub, shower, rain_shower, hair_dryer, shampoo, body_soap, conditioner, bidet
### Laundry: washer, dryer, washer_dryer, drying_rack, ironing_board, laundry_detergent
### Entertainment: tv, smart_tv, netflix, youtube, cable_tv, sound_system, bluetooth_speaker, game_console, books, board_games
### Workspace: desk, office_chair, monitor, printer, fast_wifi
### Outdoor: balcony, terrace, patio, garden, rooftop, outdoor_furniture, bbq, outdoor_dining, sun_loungers, hammock
### Pool & Spa: private_pool, infinity_pool, plunge_pool, heated_pool, jacuzzi, sauna, steam_room
### Family: crib, high_chair, baby_bath, baby_monitor, kids_toys, kids_books, child_safety, pool_fence
### Fitness: home_gym, yoga_mat, weights, exercise_bike, treadmill
### Parking: free_parking, paid_parking, garage, covered_parking, ev_charger, bicycles, scooter
### Safety: safe, smoke_detector, carbon_detector, fire_extinguisher, first_aid, security_cameras, smart_lock
### Climate: ceiling_fan, portable_fan, dehumidifier, mosquito_net, blackout_curtains
### Policies: smoking_allowed, pets_allowed, events_allowed, long_term_stays

Return equipment as: equipment: string[] (array of matching IDs from the list above)

## Pool type (separate field)
- pool_type: "private" | "shared" | "rooftop" | "none"
- parking_type: "free" | "paid" | "none"

## Rental Terms & Conditions (CRITICAL — extract ALL booking conditions)
- cancellation_policy: "flexible" | "moderate" | "strict" | "super_strict" | "non_refundable" (map from host's cancellation rules: free cancellation = flexible, partial refund = moderate, no refund = strict/non_refundable)
- instant_booking: boolean (true if "Instant Book" / "Мгновенное бронирование" / "Book now" without host approval)
- deposit_amount: number (security deposit / залог / damage deposit, numeric only)
- deposit_currency: "THB" | "USD" | "EUR" | "RUB" | "GBP"
- cleaning_fee: number (cleaning fee / плата за уборку, numeric only)
- service_fee: number (service fee if shown separately)

## House Rules
- house_rules: string (summary of rules)
- pets_allowed: boolean
- smoking_allowed: boolean  
- parties_allowed: boolean
- children_friendly: boolean
- check_in_time: string (e.g. "14:00")
- check_out_time: string (e.g. "12:00")

## Highlights (CRITICAL — pick up to 12 most distinctive features using EXACTLY these IDs):
### Location & Views: beachfront, walk_to_beach, sea_view, mountain_view, garden_view, city_view, lake_view, panoramic_view
### Pool & Water: private_pool, pool, infinity_pool, rooftop_pool, jacuzzi, plunge_pool, kids_pool
### Indoor: wifi, air_conditioning, washer, dryer, dishwasher, smart_tv, workspace, fully_equipped_kitchen, coffee_machine, safe, king_bed, bathtub, rain_shower, iron
### Outdoor: parking, garage, garden, terrace, balcony, rooftop, bbq, outdoor_shower, sun_loungers, tropical_garden
### Security: gated_community, cctv, security_24h, smart_lock, keypad_entry, elevator
### Wellness: gym, spa, sauna, yoga_space, tennis
### Family: kid_friendly, pet_friendly, baby_crib, high_chair, playground
### Character: luxury, eco_friendly, new_build, renovated, traditional_thai, modern_design, minimalist
### Services: daily_cleaning, weekly_cleaning, concierge, airport_transfer, breakfast, laundry_service
### Nearby: near_restaurants, near_shopping, near_hospital, near_school, near_airport, golf_nearby

Return highlights as: highlights: string[] (array of matching IDs)

## District Detection (for Phuket properties):
Known districts: bang_tao, surin, kamala, patong, kata, karon, rawai, nai_harn, chalong, phuket_town, laguna, cherng_talay, mai_khao, nai_yang, cape_panwa, ao_po, thalang

IMPORTANT: Return ONLY valid JSON, no markdown code fences. Extract as many fields as possible.`,
          },
          {
            role: 'user',
            content: markdown.slice(0, 12000), // More context for better extraction
          },
        ],
        temperature: 0.1,
        max_tokens: 3000,
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

// Fallback regex-based parser (multilingual) — maps to equipment IDs
function parseWithRegex(markdown: string): ListingData {
  const data: ListingData = {};
  const lower = markdown.toLowerCase();
  
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
  
  // Area
  const areaMatch = markdown.match(/(\d+)\s*(?:sq\.?\s*m|м²|кв\.?\s*м|square\s*met)/i);
  if (areaMatch) data.area_sqm = parseInt(areaMatch[1]);
  
  // Floor
  const floorMatch = markdown.match(/(\d+)\s*(?:floor|этаж)/i);
  if (floorMatch) data.floor = parseInt(floorMatch[1]);
  
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
  
  // Equipment — map keywords to equipment IDs
  const equipmentMap: Record<string, string[]> = {
    'wifi': ['wifi'], 'wi-fi': ['wifi'], 'вай-фай': ['wifi'], 'интернет': ['wifi'],
    'air conditioning': ['ac'], 'кондиционер': ['ac'], 'aircon': ['ac'],
    'heating': ['heating'], 'отопление': ['heating'],
    'hot water': ['hot_water'], 'горячая вода': ['hot_water'],
    'kitchen': ['kitchen'], 'кухня': ['kitchen'], 'full kitchen': ['kitchen'],
    'kitchenette': ['kitchenette'], 'мини-кухня': ['kitchenette'],
    'refrigerator': ['fridge'], 'холодильник': ['fridge'], 'fridge': ['fridge'],
    'microwave': ['microwave'], 'микроволнов': ['microwave'],
    'oven': ['oven'], 'духовка': ['oven'],
    'dishwasher': ['dishwasher'], 'посудомоечн': ['dishwasher'],
    'coffee': ['coffee_machine'], 'кофемашин': ['coffee_machine'], 'кофеварк': ['coffee_machine'],
    'kettle': ['kettle'], 'чайник': ['kettle'],
    'washer': ['washer'], 'washing machine': ['washer'], 'стиральн': ['washer'],
    'dryer': ['dryer'], 'сушильн': ['dryer'],
    'iron': ['iron'], 'утюг': ['iron'],
    'tv': ['tv'], 'телевизор': ['tv'], 'television': ['tv'],
    'smart tv': ['smart_tv'],
    'netflix': ['netflix'],
    'balcony': ['balcony'], 'балкон': ['balcony'],
    'terrace': ['terrace'], 'терраса': ['terrace'],
    'pool': ['private_pool'], 'бассейн': ['private_pool'],
    'jacuzzi': ['jacuzzi'], 'джакузи': ['jacuzzi'], 'hot tub': ['jacuzzi'],
    'sauna': ['sauna'], 'сауна': ['sauna'],
    'gym': ['home_gym'], 'спортзал': ['home_gym'], 'fitness': ['home_gym'],
    'parking': ['free_parking'], 'парковка': ['free_parking'],
    'safe': ['safe'], 'сейф': ['safe'],
    'hair dryer': ['hair_dryer'], 'фен': ['hair_dryer'],
    'bathtub': ['bathtub'], 'ванна': ['bathtub'],
    'shower': ['shower'], 'душ': ['shower'],
    'bbq': ['bbq'], 'гриль': ['bbq'], 'барбекю': ['bbq'],
    'desk': ['desk'], 'рабочее место': ['desk'], 'workspace': ['desk'],
    'elevator': ['elevator_access'], 'лифт': ['elevator_access'],
    'fan': ['ceiling_fan'], 'вентилятор': ['ceiling_fan'],
  };
  
  const foundEquipment = new Set<string>();
  for (const [keyword, ids] of Object.entries(equipmentMap)) {
    if (lower.includes(keyword)) {
      ids.forEach(id => foundEquipment.add(id));
    }
  }
  data.equipment = Array.from(foundEquipment);
  
  // Pool detection
  if (lower.includes('private pool') || lower.includes('частный бассейн')) data.pool_type = 'private';
  else if (lower.includes('pool') || lower.includes('бассейн')) data.pool_type = 'shared';
  
  // House rules detection
  data.pets_allowed = lower.includes('pets allowed') || lower.includes('можно с животными') || lower.includes('pet-friendly');
  data.children_friendly = !lower.includes('no children') && !lower.includes('adults only');
  
  // Cancellation policy detection
  if (lower.includes('free cancellation') || lower.includes('бесплатная отмена') || lower.includes('full refund')) {
    (data as any).cancellation_policy = 'flexible';
  } else if (lower.includes('partial refund') || lower.includes('частичный возврат') || lower.includes('50%')) {
    (data as any).cancellation_policy = 'moderate';
  } else if (lower.includes('non-refundable') || lower.includes('невозвратн') || lower.includes('no refund')) {
    (data as any).cancellation_policy = 'non_refundable';
  } else if (lower.includes('strict') || lower.includes('строг')) {
    (data as any).cancellation_policy = 'strict';
  }
  
  // Instant booking
  if (lower.includes('instant book') || lower.includes('мгновенное бронирование') || lower.includes('book now')) {
    (data as any).instant_booking = true;
  }
  
  // Deposit
  const depositMatch = markdown.match(/(?:deposit|залог|damage deposit|страховой депозит)[:\s]*[฿$€£₽]?\s*([\d\s,]+)/i);
  if (depositMatch) {
    (data as any).deposit_amount = parseFloat(depositMatch[1].replace(/[\s,]/g, ''));
  }
  
  // Cleaning fee
  const cleaningFeeMatch = markdown.match(/(?:cleaning fee|плата за уборку|уборка)[:\s]*[฿$€£₽]?\s*([\d\s,]+)/i);
  if (cleaningFeeMatch) {
    (data as any).cleaning_fee = parseFloat(cleaningFeeMatch[1].replace(/[\s,]/g, ''));
  }
  
  // Check-in/out times
  const checkInMatch = markdown.match(/(?:check.?in|заезд|заселение)[:\s]*(?:после|after|from)?\s*(\d{1,2}[:.]\d{2}|\d{1,2}\s*(?:am|pm|:00))/i);
  if (checkInMatch) data.check_in_time = checkInMatch[1].replace('.', ':');
  
  const checkOutMatch = markdown.match(/(?:check.?out|выезд|выселение)[:\s]*(?:до|before|by)?\s*(\d{1,2}[:.]\d{2}|\d{1,2}\s*(?:am|pm|:00))/i);
  if (checkOutMatch) data.check_out_time = checkOutMatch[1].replace('.', ':');
  
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
