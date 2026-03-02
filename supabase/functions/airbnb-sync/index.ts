import { createClient } from '../_shared/supabase.ts';
// Deno.serve used (native edge runtime)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AirbnbListingData {
  title?: string;
  description?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  amenities?: string[];
  houseRules?: string;
  address?: string;
  lat?: number;
  lng?: number;
  photos?: Array<{ url: string; caption?: string }>;
  coverPhoto?: string;
  pricePerNight?: number;
  currency?: string;
  cleaningFee?: number;
  serviceFee?: number;
  icalUrl?: string;
  rating?: number;
  reviewCount?: number;
  cancellationPolicy?: string;
  instantBooking?: boolean;
  depositAmount?: number;
  depositCurrency?: string;
  checkInTime?: string;
  checkOutTime?: string;
  minStayNights?: number;
}

// Extract Airbnb listing ID from URL
function extractAirbnbListingId(url: string): string | null {
  const roomMatch = url.match(/airbnb\.[a-z.]+\/rooms\/(\d+)/);
  if (roomMatch) return roomMatch[1];
  
  const experienceMatch = url.match(/airbnb\.[a-z.]+\/h\/([a-zA-Z0-9-]+)/);
  if (experienceMatch) return experienceMatch[1];
  
  return null;
}

// Check if URL is a real property photo (not avatar, icon, map, or platform asset)
function isPropertyPhoto(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  
  // Must be from muscache CDN (Airbnb's image host)
  if (!lower.includes('muscache.com')) return false;
  
  // Exclude known non-property images
  if (lower.includes('/user/') || lower.includes('avatar') || lower.includes('profile')) return false;
  if (lower.includes('platform-assets') || lower.includes('search-bar')) return false;
  if (lower.includes('maps.') || lower.includes('mapfiles')) return false;
  if (lower.includes('icon') || lower.includes('logo')) return false;
  
  // Must be from hosting/listing images (high confidence)
  if (lower.includes('/hosting/') || lower.includes('/pictures/miso/')) return true;
  if (lower.includes('/im/pictures/') && !lower.includes('/user/')) return true;
  
  // Image must be a reasonable size (720+ width)
  if (lower.includes('im_w=720') || lower.includes('im_w=1200') || lower.includes('im_w=960')) return true;
  
  return false;
}

// Parse Airbnb listing from scraped markdown (supports RU and EN)
function parseAirbnbListing(markdown: string, url: string): AirbnbListingData {
  const data: AirbnbListingData = {};
  
  // Extract title - first heading or first bold text
  const titleMatch = markdown.match(/^#\s*(.+?)$/m) || markdown.match(/\*\*(.{10,80}?)\*\*/);
  if (titleMatch) {
    data.title = titleMatch[1].trim();
  }
  
  // ── Bedrooms / Bathrooms / Guests (multilingual) ──
  // EN: "4 guests · 2 bedrooms · 2 beds · 1 bath"
  // RU: "4 гостя · 2 спальни · 2 кровати · 1 ванная"
  
  // Guests
  const guestMatch = markdown.match(/(\d+)\s*(?:guests?|гост[а-яё]*)/i);
  if (guestMatch) data.maxGuests = parseInt(guestMatch[1]);
  
  // Bedrooms
  const bedroomMatch = markdown.match(/(\d+)\s*(?:bedrooms?|спальн[а-яё]*)/i);
  if (bedroomMatch) data.bedrooms = parseInt(bedroomMatch[1]);
  
  // Bathrooms
  const bathMatch = markdown.match(/(\d+\.?\d*)\s*(?:baths?|bathrooms?|ванн[а-яё]*)/i);
  if (bathMatch) data.bathrooms = parseFloat(bathMatch[1]);
  
  // Beds
  const bedMatch = markdown.match(/(\d+)\s*(?:beds?|кроват[а-яё]*)/i);
  // Use beds as fallback for bedrooms if not found
  if (!data.bedrooms && bedMatch) data.bedrooms = Math.ceil(parseInt(bedMatch[1]) / 2);

  // ── Property type (multilingual) ──
  const typePatterns = [
    /(?:entire|целик[а-яё]*)\s+(?:apartment|квартир[а-яё]*|апартамент[а-яё]*|house|дом|villa|вилл[а-яё]*|condo|loft|studio|студи[а-яё]*|cottage|cabin|bungalow|townhouse)/i,
    /(?:private|отдельн[а-яё]*)\s+(?:room|комнат[а-яё]*)/i,
  ];
  for (const pattern of typePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const t = match[0].toLowerCase();
      if (t.includes('villa') || t.includes('вилл')) data.propertyType = 'villa';
      else if (t.includes('house') || t.includes('дом')) data.propertyType = 'house';
      else if (t.includes('studio') || t.includes('студи')) data.propertyType = 'studio';
      else if (t.includes('apartment') || t.includes('квартир') || t.includes('апартамент')) data.propertyType = 'apartment';
      else if (t.includes('condo')) data.propertyType = 'condo';
      else data.propertyType = t;
      break;
    }
  }
  
  // ── Price (multilingual) ──
  // EN: "$150 / night" or "฿4,500 night"
  // RU: "₽ 5 000 за ночь" or "4 500 ₽ / ночь" or "฿4,500 за ночь"
  const pricePatterns = [
    /[฿$€£₽]\s*([\d\s,]+)\s*(?:\/?\s*(?:night|ночь|за ночь))/i,
    /([\d\s,]+)\s*[฿$€£₽]\s*(?:\/?\s*(?:night|ночь|за ночь))/i,
    /(?:за ночь|per night|\/\s*night)\s*[฿$€£₽]?\s*([\d\s,]+)/i,
  ];
  for (const pattern of pricePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      data.pricePerNight = parseFloat(match[1].replace(/[\s,]/g, ''));
      if (markdown.includes('฿')) data.currency = 'THB';
      else if (markdown.includes('₽')) data.currency = 'RUB';
      else if (markdown.includes('$')) data.currency = 'USD';
      else if (markdown.includes('€')) data.currency = 'EUR';
      else if (markdown.includes('£')) data.currency = 'GBP';
      break;
    }
  }
  
  // ── Rating ──
  const ratingMatch = markdown.match(/(\d+[.,]\d+)\s*★|★\s*(\d+[.,]\d+)|(\d+[.,]\d+)\s*·\s*\d+\s*(?:reviews?|отзыв)/i);
  if (ratingMatch) {
    data.rating = parseFloat((ratingMatch[1] || ratingMatch[2] || ratingMatch[3]).replace(',', '.'));
  }
  
  // ── Review count ──
  const reviewMatch = markdown.match(/(\d+)\s*(?:reviews?|отзыв[а-яё]*)/i);
  if (reviewMatch) data.reviewCount = parseInt(reviewMatch[1]);
  
  // ── Description ──
  const descPatterns = [
    /(?:about this (?:space|place)|the space|об этом жилье|о жилье)\s*\n+([\s\S]*?)(?=\n#|\n\*\*|where you|что вас ждёт|удобства)/i,
    /(?:описание|description)\s*\n+([\s\S]*?)(?=\n#|\n\*\*)/i,
  ];
  for (const pattern of descPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      data.description = match[1].trim().slice(0, 2000);
      break;
    }
  }
  
  // ── Equipment (map amenities to standardized equipment IDs) ──
  const equipmentMap: Record<string, string[]> = {
    'wifi': ['wifi'], 'wi-fi': ['wifi'], 'вай-фай': ['wifi'], 'интернет': ['wifi'],
    'air conditioning': ['ac'], 'кондиционер': ['ac'],
    'heating': ['heating'], 'отопление': ['heating'],
    'kitchen': ['kitchen'], 'кухня': ['kitchen'],
    'refrigerator': ['fridge'], 'холодильник': ['fridge'],
    'microwave': ['microwave'], 'микроволнов': ['microwave'],
    'oven': ['oven'], 'духовка': ['oven'],
    'dishwasher': ['dishwasher'], 'посудомоечн': ['dishwasher'],
    'coffee maker': ['coffee_machine'], 'кофемашин': ['coffee_machine'], 'кофеварк': ['coffee_machine'],
    'washer': ['washer'], 'стиральная': ['washer'],
    'dryer': ['dryer'], 'сушильная': ['dryer'],
    'free parking': ['free_parking'], 'парковка': ['free_parking'],
    'ev charger': ['ev_charger'],
    'gym': ['home_gym'], 'спортзал': ['home_gym'],
    'hot tub': ['jacuzzi'], 'джакузи': ['jacuzzi'],
    'pool': ['private_pool'], 'бассейн': ['private_pool'],
    'bbq': ['bbq'], 'барбекю': ['bbq'], 'гриль': ['bbq'],
    'patio': ['patio'],
    'balcony': ['balcony'], 'балкон': ['balcony'],
    'garden': ['garden'], 'сад': ['garden'],
    'fireplace': ['heating'],
    'workspace': ['desk'], 'рабочее место': ['desk'],
    'tv': ['tv'], 'телевизор': ['tv'],
    'beach access': ['private_pool'], // no exact match, best proxy
  };
  
  const foundEquipment = new Set<string>();
  const lower = markdown.toLowerCase();
  for (const [keyword, ids] of Object.entries(equipmentMap)) {
    if (lower.includes(keyword)) {
      ids.forEach(id => foundEquipment.add(id));
    }
  }
  data.amenities = Array.from(foundEquipment); // Store as amenities, will be mapped to equipment on frontend
  
  // ── House rules ──
  const rulesMatch = markdown.match(/(?:house rules|правила дома|правила проживания|things to know|что нужно знать)\s*\n+([\s\S]*?)(?=\n#|\n\*\*|safety|безопасность|cancellation|отмена)/i);
  if (rulesMatch) {
    data.houseRules = rulesMatch[1].trim().slice(0, 1000);
  }
  
  // ── Cancellation policy ──
  const cancelSection = markdown.match(/(?:cancellation|отмена|правила отмены|cancellation policy)\s*\n+([\s\S]*?)(?=\n#|\n\*\*|$)/i);
  const cancelText = (cancelSection?.[1] || lower).toLowerCase();
  if (cancelText.includes('free cancellation') || cancelText.includes('бесплатная отмена') || cancelText.includes('full refund') || cancelText.includes('полный возврат')) {
    data.cancellationPolicy = 'flexible';
  } else if (cancelText.includes('partial') || cancelText.includes('частичн') || cancelText.includes('50%') || cancelText.includes('moderate')) {
    data.cancellationPolicy = 'moderate';
  } else if (cancelText.includes('non-refundable') || cancelText.includes('невозвратн') || cancelText.includes('no refund') || cancelText.includes('без возврата')) {
    data.cancellationPolicy = 'non_refundable';
  } else if (cancelText.includes('strict') || cancelText.includes('строг')) {
    data.cancellationPolicy = 'strict';
  }
  
  // ── Instant booking ──
  if (lower.includes('instant book') || lower.includes('мгновенное бронирование') || lower.includes('reserve') && lower.includes('without') && lower.includes('approval')) {
    data.instantBooking = true;
  }
  
  // ── Deposit / damage deposit ──
  const depositMatch = markdown.match(/(?:security deposit|damage deposit|залог|страховой депозит|deposit)[:\s]*[฿$€£₽]?\s*([\d\s,]+)/i);
  if (depositMatch) {
    data.depositAmount = parseFloat(depositMatch[1].replace(/[\s,]/g, ''));
    data.depositCurrency = data.currency;
  }
  
  // ── Cleaning fee ──
  const cleanFeeMatch = markdown.match(/(?:cleaning fee|плата за уборку|уборка|сбор за уборку)[:\s]*[฿$€£₽]?\s*([\d\s,]+)/i);
  if (cleanFeeMatch) {
    data.cleaningFee = parseFloat(cleanFeeMatch[1].replace(/[\s,]/g, ''));
  }
  
  // ── Service fee ──
  const serviceFeeMatch = markdown.match(/(?:service fee|сервисный сбор)[:\s]*[฿$€£₽]?\s*([\d\s,]+)/i);
  if (serviceFeeMatch) {
    data.serviceFee = parseFloat(serviceFeeMatch[1].replace(/[\s,]/g, ''));
  }
  
  // ── Check-in / Check-out times ──
  const checkInMatch = markdown.match(/(?:check.?in|заезд|заселение)[:\s]*(?:после|after|from)?\s*(\d{1,2}[:.]\d{2}|\d{1,2}\s*(?:am|pm|:00))/i);
  if (checkInMatch) data.checkInTime = checkInMatch[1].replace('.', ':');
  
  const checkOutMatch = markdown.match(/(?:check.?out|выезд|выселение)[:\s]*(?:до|before|by)?\s*(\d{1,2}[:.]\d{2}|\d{1,2}\s*(?:am|pm|:00))/i);
  if (checkOutMatch) data.checkOutTime = checkOutMatch[1].replace('.', ':');
  
  // ── Min stay ──
  const minStayMatch = markdown.match(/(?:minimum stay|мин[а-яё]*\s*(?:срок|проживание|ночей))[:\s]*(\d+)\s*(?:night|ноч)/i);
  if (minStayMatch) data.minStayNights = parseInt(minStayMatch[1]);
  
  // ── Location/address ──
  const locationMatch = markdown.match(/(?:where you.ll be|location|где вы будете жить|местоположение)\s*\n+([^\n]+)/i);
  if (locationMatch) {
    data.address = locationMatch[1].trim();
  }
  
  // ── Images from markdown ──
  const imageMatches = markdown.matchAll(/!\[.*?\]\((https:\/\/[^\)]+)\)/g);
  const photos: Array<{ url: string; caption?: string }> = [];
  for (const match of imageMatches) {
    if (match[1] && isPropertyPhoto(match[1])) {
      photos.push({ url: match[1] });
    }
  }
  if (photos.length > 0) {
    data.photos = photos;
    data.coverPhoto = photos[0].url;
  }
  
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { connection_id, listing_url, sync_type = 'full' } = await req.json();

    if (!connection_id && !listing_url) {
      return new Response(
        JSON.stringify({ success: false, error: 'connection_id or listing_url required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();
    let connectionId = connection_id;
    let url = listing_url;
    let ownerId: string | null = null;

    // If connection_id provided, fetch the connection
    if (connection_id) {
      const { data: connection, error: connError } = await supabase
        .from('ota_listing_connections')
        .select('*')
        .eq('id', connection_id)
        .single();

      if (connError || !connection) {
        return new Response(
          JSON.stringify({ success: false, error: 'Connection not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      url = connection.listing_url;
      ownerId = connection.owner_id;
    }

    // Extract listing ID
    const listingId = extractAirbnbListingId(url);
    console.log(`Syncing Airbnb listing: ${url} (ID: ${listingId})`);

    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from('ota_sync_logs')
      .insert({
        connection_id: connectionId,
        sync_type,
        status: 'started',
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating sync log:', logError);
    }

    // Scrape the Airbnb listing using Firecrawl
    console.log('Calling Firecrawl API...');
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'links', 'screenshot'],
        onlyMainContent: true,
        waitFor: 5000, // Wait longer for Airbnb JS to load
      }),
    });

    const scrapeData = await scrapeResponse.json();
    
    if (!scrapeResponse.ok || !scrapeData.success) {
      const rawError = scrapeData.error || `Scrape failed: ${scrapeResponse.status}`;
      console.error('Firecrawl error:', rawError);
      
      const isBlocklisted = rawError.toLowerCase().includes('blocklisted') || 
                           rawError.toLowerCase().includes('blocked');
      
      const errorMessage = isBlocklisted ? 'OTA_BLOCKED' : rawError;
      
      if (syncLog) {
        await supabase
          .from('ota_sync_logs')
          .update({
            status: 'failed',
            error_message: rawError,
            duration_ms: Date.now() - startTime,
            completed_at: new Date().toISOString(),
          })
          .eq('id', syncLog.id);
      }

      if (connectionId) {
        await supabase
          .from('ota_listing_connections')
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'failed',
            sync_error: rawError,
          })
          .eq('id', connectionId);
      }

      return new Response(
        JSON.stringify({ success: false, error: errorMessage, isBlocklisted }),
        { status: isBlocklisted ? 403 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = scrapeData.data?.markdown || '';
    console.log(`Scraped ${markdown.length} chars of content`);

    // Parse the listing data
    const listingData = parseAirbnbListing(markdown, url);

    // Extract property photos from links (filtered)
    const links: string[] = scrapeData.data?.links || [];
    const propertyImageLinks = links.filter((link: string) => isPropertyPhoto(link)).slice(0, 30);

    // If we found better photos from links, use them
    if (propertyImageLinks.length > 0) {
      // Deduplicate by base URL (ignore query params)
      const seen = new Set<string>();
      const uniquePhotos: Array<{ url: string; order: number }> = [];
      for (const link of propertyImageLinks) {
        const baseUrl = link.split('?')[0];
        if (!seen.has(baseUrl)) {
          seen.add(baseUrl);
          uniquePhotos.push({ url: link, order: uniquePhotos.length });
        }
      }
      
      if (uniquePhotos.length > 0) {
        listingData.photos = uniquePhotos;
        listingData.coverPhoto = uniquePhotos[0].url;
      }
    }

    // If still no photos but we have inline markdown images
    if (!listingData.photos || listingData.photos.length === 0) {
      const allImageLinks = links.filter((link: string) => {
        if (!link.includes('muscache.com')) return false;
        return link.includes('im_w=720') || link.includes('im_w=1200');
      }).slice(0, 20);
      
      if (allImageLinks.length > 0) {
        listingData.photos = allImageLinks.map((url: string, i: number) => ({ url, order: i }));
        listingData.coverPhoto = allImageLinks[0];
      }
    }

    console.log('Parsed listing data:', JSON.stringify({
      title: listingData.title,
      bedrooms: listingData.bedrooms,
      bathrooms: listingData.bathrooms,
      maxGuests: listingData.maxGuests,
      pricePerNight: listingData.pricePerNight,
      currency: listingData.currency,
      propertyType: listingData.propertyType,
      rating: listingData.rating,
      photosCount: listingData.photos?.length || 0,
      amenitiesCount: listingData.amenities?.length || 0,
    }));

    // Save synced listing data
    const syncedData = {
      connection_id: connectionId,
      raw_data: scrapeData.data,
      title: listingData.title,
      description: listingData.description,
      property_type: listingData.propertyType,
      bedrooms: listingData.bedrooms,
      bathrooms: listingData.bathrooms,
      max_guests: listingData.maxGuests,
      amenities: listingData.amenities,
      house_rules: listingData.houseRules,
      address: listingData.address,
      lat: listingData.lat,
      lng: listingData.lng,
      photos: listingData.photos,
      cover_photo: listingData.coverPhoto,
      price_per_night: listingData.pricePerNight,
      currency: listingData.currency || 'THB',
      cleaning_fee: listingData.cleaningFee,
      ical_url: listingData.icalUrl,
      rating: listingData.rating,
      review_count: listingData.reviewCount,
      synced_at: new Date().toISOString(),
      parsed_at: new Date().toISOString(),
    };

    // Upsert synced listing
    const { error: upsertError } = await supabase
      .from('ota_synced_listings')
      .upsert(syncedData, { onConflict: 'connection_id' });

    if (upsertError) {
      console.error('Error saving synced listing:', upsertError);
    }

    // Update sync log
    const itemsSynced = {
      title: !!listingData.title,
      description: !!listingData.description,
      photos: listingData.photos?.length || 0,
      amenities: listingData.amenities?.length || 0,
      pricing: !!listingData.pricePerNight,
      bedrooms: !!listingData.bedrooms,
      bathrooms: !!listingData.bathrooms,
      maxGuests: !!listingData.maxGuests,
    };

    if (syncLog) {
      await supabase
        .from('ota_sync_logs')
        .update({
          status: 'success',
          items_synced: itemsSynced,
          duration_ms: Date.now() - startTime,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id);
    }

    // Update connection status
    if (connectionId) {
      await supabase
        .from('ota_listing_connections')
        .update({
          listing_id: listingId,
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'success',
          sync_error: null,
        })
        .eq('id', connectionId);
    }

    console.log(`Sync complete in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        listing: listingData,
        items_synced: itemsSynced,
        duration_ms: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Airbnb sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
