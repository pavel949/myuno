import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all BLY yachts with empty images array
    const { data: yachts, error: fetchError } = await supabase
      .from('yachts')
      .select('id, name_en, cover_image')
      .eq('provider_id', 'b2000001-0001-4000-a000-000000000001')
      .or('images.is.null,images.eq.{}');

    if (fetchError) throw fetchError;

    console.log(`Found ${yachts?.length || 0} yachts without gallery images`);

    // Map yacht names to their charter-listing slugs
    const slugMap: Record<string, string> = {
      'Iron Blonde': 'iron-blonde',
      'Purpose': 'purpose',
      'Northern Sun': 'northern-sun',
      'Song of Song': 'song-of-song',
      'Benetti 132': 'benetti-132',
      'Octave': 'octave',
      'Spacecat': 'spacecat',
      'Party Catamaran 111': 'party-catamaran-111',
      'Astondoa 102': 'astondoa-102-2',
      'Bilgin 98': 'bilgin-98',
      'Sunseeker 90': 'sunseeker-90-2',
      'Technema 89': 'technema-89',
      'Monte Carlo Yacht 86': 'monte-carlo-yacht-86',
      'Ferretti 80': 'ferretti-80-2',
      'Azimut 76': 'azimut-76-2',
      'Party Catamaran 78': 'party-catamaran-78',
      'Princess 78 W.J.Lip': 'princess-78-w-j-lip',
      'Princess 78 Ariel': 'princess-78-ariel',
      'Blue Lagoon 70': 'blue-lagoon-70-ft',
      'Sunseeker 64': 'sunseeker-64-2',
      'Azimut 64': 'azimut-64-2',
      'Princess S65': 'princess-s65-2',
      'Princess 65': 'princess-65-2',
      'Sunseeker 62': 'sunseeker-62',
      'Active 5800': 'active-5800',
      'Sunreef 60 Eco': 'sunreef-60-eco',
      'Princess F55': 'princess-f55',
      'Azimut 60': 'azimut-60',
      'Princess 56': 'princess-56-2',
      'Party Catamaran 55': 'party-catamaran-55',
      'Integrity 55': 'integrity-55-2',
      'My Sky 53': 'my-sky-53',
      'Leopard 53': 'leopard-53-ft',
      'Princess 54': 'princess-54-3',
      'SACS 15': 'sacs-15',
      'Leopard 51': 'leopard-51-ft',
      'De Antinio D50': 'de-antinio-d50',
      'Leopard 43': 'leopard-43-ft',
      'Leopard 40': 'leopard-40-ft',
      'Princess V39': 'princess-v39',
      'Cap Camarat 40': 'cap-camarat-40',
      'Jeanneau DB37': 'jeanneau-db37',
      'Prince 38': 'prince-38-2',
      'Nimbus T11': 'nimbus-t11',
      'Axopar 37': 'axopar-37',
      'Fountaine Pajot 40': 'fountaine-pajot-40',
      'SACS 11': 'sacs-11',
      'Merry Fisher 34': 'merry-fisher-34',
      'Cap Camarat 29': 'cap-camarat-29',
      'Axopar 28': 'axopar-28',
    };

    const results: Array<{ name: string; count: number; error?: string }> = [];

    for (const yacht of yachts || []) {
      const slug = slugMap[yacht.name_en];
      if (!slug) {
        results.push({ name: yacht.name_en, count: 0, error: 'No slug mapping' });
        continue;
      }

      try {
        const url = `https://www.boatlagoonyachting.com/charter-listing/${slug}/`;
        console.log(`Scraping: ${url}`);

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html',
          },
        });

        if (!response.ok) {
          results.push({ name: yacht.name_en, count: 0, error: `HTTP ${response.status}` });
          continue;
        }

        const html = await response.text();

        // Extract gallery image URLs from <a class="uk-inline" href="..."> tags
        const galleryRegex = /<a\s+class="uk-inline"\s+href="([^"]+)"/g;
        const images: string[] = [];
        let match;
        while ((match = galleryRegex.exec(html)) !== null) {
          const imgUrl = match[1];
          if (imgUrl.includes('/wp-content/uploads/') && !images.includes(imgUrl)) {
            images.push(imgUrl);
          }
        }

        if (images.length > 0) {
          // Also add cover_image as first if not already included
          const finalImages = yacht.cover_image && !images.includes(yacht.cover_image)
            ? [yacht.cover_image, ...images]
            : images;

          const { error: updateError } = await supabase
            .from('yachts')
            .update({ images: finalImages })
            .eq('id', yacht.id);

          if (updateError) {
            results.push({ name: yacht.name_en, count: 0, error: updateError.message });
          } else {
            results.push({ name: yacht.name_en, count: finalImages.length });
          }
        } else {
          // Fallback: use cover_image as single image
          if (yacht.cover_image) {
            await supabase
              .from('yachts')
              .update({ images: [yacht.cover_image] })
              .eq('id', yacht.id);
          }
          results.push({ name: yacht.name_en, count: 1, error: 'No gallery found, used cover' });
        }

        // Small delay to be polite
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        results.push({ name: yacht.name_en, count: 0, error: String(err) });
      }
    }

    const totalImages = results.reduce((sum, r) => sum + r.count, 0);
    console.log(`Done! Total images: ${totalImages} across ${results.length} yachts`);

    return new Response(
      JSON.stringify({
        success: true,
        yachtsProcessed: results.length,
        totalImages,
        details: results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
