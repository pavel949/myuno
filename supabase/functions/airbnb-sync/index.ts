import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  icalUrl?: string;
  rating?: number;
  reviewCount?: number;
}

// Extract Airbnb listing ID from URL
function extractAirbnbListingId(url: string): string | null {
  // Matches patterns like:
  // https://www.airbnb.com/rooms/12345678
  // https://www.airbnb.com/rooms/12345678?adults=1
  // https://airbnb.com/h/nice-apartment (experience homes)
  const roomMatch = url.match(/airbnb\.com\/rooms\/(\d+)/);
  if (roomMatch) return roomMatch[1];
  
  const experienceMatch = url.match(/airbnb\.com\/h\/([a-zA-Z0-9-]+)/);
  if (experienceMatch) return experienceMatch[1];
  
  return null;
}

// Parse Airbnb listing from scraped markdown
function parseAirbnbListing(markdown: string, url: string): AirbnbListingData {
  const data: AirbnbListingData = {};
  
  // Extract title (usually the first heading)
  const titleMatch = markdown.match(/^#\s*(.+?)$/m);
  if (titleMatch) {
    data.title = titleMatch[1].trim();
  }
  
  // Extract bedrooms, bathrooms, guests from "X guests · X bedrooms · X beds · X baths" pattern
  const capacityMatch = markdown.match(/(\d+)\s*guests?.*?(\d+)\s*bedroom.*?(\d+)\s*bath/i);
  if (capacityMatch) {
    data.maxGuests = parseInt(capacityMatch[1]);
    data.bedrooms = parseInt(capacityMatch[2]);
    data.bathrooms = parseFloat(capacityMatch[3]);
  }
  
  // Alternative pattern: "2 bedrooms · 4 beds · 2 baths"
  const bedroomMatch = markdown.match(/(\d+)\s*bedroom/i);
  const bathMatch = markdown.match(/(\d+\.?\d*)\s*bath/i);
  const guestMatch = markdown.match(/(\d+)\s*guest/i);
  
  if (!data.bedrooms && bedroomMatch) data.bedrooms = parseInt(bedroomMatch[1]);
  if (!data.bathrooms && bathMatch) data.bathrooms = parseFloat(bathMatch[1]);
  if (!data.maxGuests && guestMatch) data.maxGuests = parseInt(guestMatch[1]);
  
  // Extract property type
  const typePatterns = [
    /entire\s+(apartment|house|villa|condo|loft|studio|cottage|cabin|bungalow|townhouse)/i,
    /private\s+room/i,
    /shared\s+room/i,
  ];
  for (const pattern of typePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      data.propertyType = match[0].toLowerCase();
      break;
    }
  }
  
  // Extract price
  const priceMatch = markdown.match(/[฿$€£]\s*([\d,]+)\s*(?:\/\s*night|per\s*night|night)/i);
  if (priceMatch) {
    data.pricePerNight = parseFloat(priceMatch[1].replace(/,/g, ''));
    // Detect currency
    if (markdown.includes('฿')) data.currency = 'THB';
    else if (markdown.includes('$')) data.currency = 'USD';
    else if (markdown.includes('€')) data.currency = 'EUR';
    else if (markdown.includes('£')) data.currency = 'GBP';
  }
  
  // Extract rating
  const ratingMatch = markdown.match(/(\d+\.?\d*)\s*★|★\s*(\d+\.?\d*)/);
  if (ratingMatch) {
    data.rating = parseFloat(ratingMatch[1] || ratingMatch[2]);
  }
  
  // Extract review count
  const reviewMatch = markdown.match(/(\d+)\s*reviews?/i);
  if (reviewMatch) {
    data.reviewCount = parseInt(reviewMatch[1]);
  }
  
  // Extract description (text after "About this space" or similar)
  const descMatch = markdown.match(/(?:about this (?:space|place)|the space)\s*\n+([\s\S]*?)(?=\n#|\n\*\*|where you|what this place)/i);
  if (descMatch) {
    data.description = descMatch[1].trim().slice(0, 2000);
  }
  
  // Extract amenities (look for common patterns)
  const amenityPatterns = [
    'wifi', 'kitchen', 'pool', 'air conditioning', 'heating', 'washer', 'dryer',
    'free parking', 'ev charger', 'gym', 'hot tub', 'bbq', 'patio', 'balcony',
    'garden', 'beach access', 'waterfront', 'ski-in', 'fireplace', 'workspace',
    'tv', 'coffee maker', 'dishwasher', 'refrigerator', 'microwave', 'oven'
  ];
  
  const foundAmenities: string[] = [];
  for (const amenity of amenityPatterns) {
    if (markdown.toLowerCase().includes(amenity)) {
      foundAmenities.push(amenity);
    }
  }
  data.amenities = foundAmenities;
  
  // Extract house rules
  const rulesMatch = markdown.match(/(?:house rules|things to know)\s*\n+([\s\S]*?)(?=\n#|\n\*\*|safety|cancellation)/i);
  if (rulesMatch) {
    data.houseRules = rulesMatch[1].trim().slice(0, 1000);
  }
  
  // Extract location/address
  const locationMatch = markdown.match(/(?:where you.ll be|location)\s*\n+([^\n]+)/i);
  if (locationMatch) {
    data.address = locationMatch[1].trim();
  }
  
  // Extract images from markdown
  const imageMatches = markdown.matchAll(/!\[.*?\]\((https:\/\/[^\)]+)\)/g);
  const photos: Array<{ url: string; caption?: string }> = [];
  for (const match of imageMatches) {
    if (match[1] && !match[1].includes('avatar') && !match[1].includes('profile')) {
      photos.push({ url: match[1] });
    }
  }
  if (photos.length > 0) {
    data.photos = photos;
    data.coverPhoto = photos[0].url;
  }
  
  return data;
}

serve(async (req) => {
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
        formats: ['markdown', 'html', 'links'],
        onlyMainContent: true,
        waitFor: 3000, // Wait for JS to load
      }),
    });

    const scrapeData = await scrapeResponse.json();
    
    if (!scrapeResponse.ok || !scrapeData.success) {
      const errorMessage = scrapeData.error || `Scrape failed: ${scrapeResponse.status}`;
      console.error('Firecrawl error:', errorMessage);
      
      // Update sync log with error
      if (syncLog) {
        await supabase
          .from('ota_sync_logs')
          .update({
            status: 'failed',
            error_message: errorMessage,
            duration_ms: Date.now() - startTime,
            completed_at: new Date().toISOString(),
          })
          .eq('id', syncLog.id);
      }

      // Update connection with error
      if (connectionId) {
        await supabase
          .from('ota_listing_connections')
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'failed',
            sync_error: errorMessage,
          })
          .eq('id', connectionId);
      }

      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = scrapeData.data?.markdown || '';
    console.log(`Scraped ${markdown.length} chars of content`);

    // Parse the listing data
    const listingData = parseAirbnbListing(markdown, url);
    console.log('Parsed listing data:', JSON.stringify(listingData, null, 2));

    // Extract image URLs from links (Airbnb images are usually in links)
    const links = scrapeData.data?.links || [];
    const imageLinks = links.filter((link: string) => 
      link.includes('a0.muscache.com') || 
      link.includes('pictures/') ||
      (link.match(/\.(jpg|jpeg|png|webp)/) && link.includes('airbnb'))
    ).slice(0, 30);

    if (imageLinks.length > 0 && (!listingData.photos || listingData.photos.length === 0)) {
      listingData.photos = imageLinks.map((url: string, i: number) => ({ url, order: i }));
      listingData.coverPhoto = imageLinks[0];
    }

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
