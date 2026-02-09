import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const IGNATEV_PROVIDER_ID = 'b4ab9e1d-6915-4782-93e1-720fea87b91b';
const BUCKET = 'property-images';
const BATCH_SIZE = 3;
const BATCH_DELAY_MS = 500;

async function downloadAndUpload(
  supabase: any,
  imageUrl: string,
  propertyId: string,
  index: number
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://www.ignatevestate.ru/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      console.error(`Failed to download ${imageUrl}: ${response.status}`);
      return null;
    }

    const blob = await response.blob();
    const ext = imageUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)?.[1]?.toLowerCase() || 'jpg';
    const filePath = `ignatev/${propertyId}/${index}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error(`Upload error for ${filePath}:`, uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (e) {
    console.error(`Image cache error for ${imageUrl}:`, e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { propertyId, limit = 14 } = body;

    const supabase = createServiceClient();

    // Get properties with external images
    let query = supabase
      .from('properties')
      .select('id, title_en, cover_image, images')
      .eq('provider_id', IGNATEV_PROVIDER_ID)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (propertyId) {
      query = query.eq('id', propertyId);
    }

    const { data: properties, error: fetchError } = await query;
    if (fetchError) throw fetchError;
    if (!properties || properties.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No properties to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing images for ${properties.length} properties`);
    const results: any[] = [];

    for (const prop of properties) {
      const allImages: string[] = prop.images || [];
      const externalImages = allImages.filter((url: string) =>
        url.startsWith('https://www.ignatevestate.ru')
      );

      if (externalImages.length === 0) {
        results.push({ id: prop.id, title: prop.title_en, status: 'skipped', reason: 'no external images' });
        continue;
      }

      console.log(`${prop.title_en}: caching ${externalImages.length} images...`);

      const cachedUrls: (string | null)[] = [];

      // Process images in small batches
      for (let i = 0; i < externalImages.length; i += BATCH_SIZE) {
        const batch = externalImages.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map((url: string, idx: number) =>
            downloadAndUpload(supabase, url, prop.id, i + idx)
          )
        );
        cachedUrls.push(...batchResults);

        if (i + BATCH_SIZE < externalImages.length) {
          await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
        }
      }

      // Build new images array: replace external URLs with cached ones
      const newImages = allImages.map((url: string) => {
        const extIdx = externalImages.indexOf(url);
        if (extIdx >= 0 && cachedUrls[extIdx]) {
          return cachedUrls[extIdx];
        }
        return url;
      });

      // Update cover_image too
      let newCover = prop.cover_image;
      if (prop.cover_image?.startsWith('https://www.ignatevestate.ru')) {
        const coverIdx = externalImages.indexOf(prop.cover_image);
        if (coverIdx >= 0 && cachedUrls[coverIdx]) {
          newCover = cachedUrls[coverIdx];
        } else {
          // Cover might not be in images array, cache it separately
          const cachedCover = await downloadAndUpload(supabase, prop.cover_image, prop.id, 999);
          if (cachedCover) newCover = cachedCover;
        }
      }

      const successCount = cachedUrls.filter(Boolean).length;

      // Update property record
      const { error: updateError } = await supabase
        .from('properties')
        .update({
          images: newImages,
          cover_image: newCover,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prop.id);

      if (updateError) {
        console.error(`Update error for ${prop.id}:`, updateError);
        results.push({ id: prop.id, title: prop.title_en, status: 'update_failed', error: updateError.message });
      } else {
        console.log(`${prop.title_en}: ${successCount}/${externalImages.length} images cached`);
        results.push({
          id: prop.id,
          title: prop.title_en,
          status: 'cached',
          total: externalImages.length,
          cached: successCount,
          failed: externalImages.length - successCount,
        });
      }
    }

    const totalCached = results.reduce((s, r) => s + (r.cached || 0), 0);
    const totalFailed = results.reduce((s, r) => s + (r.failed || 0), 0);

    return new Response(
      JSON.stringify({
        success: true,
        summary: { properties: properties.length, totalCached, totalFailed },
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Image cache error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
