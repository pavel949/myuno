// Deno.serve used (native edge runtime)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { experience_id } = await req.json();
    if (!experience_id) {
      return new Response(JSON.stringify({ error: 'experience_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch experience
    const { data: exp, error: expErr } = await supabase
      .from('experiences')
      .select('id, slug, source_page_url, provider_id, notes')
      .eq('id', experience_id)
      .single();

    if (expErr || !exp) {
      return new Response(JSON.stringify({ error: 'Experience not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!exp.source_page_url) {
      return new Response(JSON.stringify({ error: 'No source_page_url set' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get provider slug for storage path
    const { data: provider } = await supabase
      .from('providers')
      .select('name')
      .eq('id', exp.provider_id)
      .single();

    const providerSlug = (provider?.name || 'unknown')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const experienceSlug = exp.slug || exp.id;

    console.log(`Fetching images from: ${exp.source_page_url}`);

    // Step 1: Fetch the page HTML directly (no Firecrawl dependency)
    let html = '';
    try {
      const pageResp = await fetch(exp.source_page_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; myUNO/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      if (!pageResp.ok) throw new Error(`HTTP ${pageResp.status}`);
      html = await pageResp.text();
    } catch (fetchErr) {
      // Mark as failed in notes
      const notes = (exp.notes as Record<string, unknown>) || {};
      notes.media_import = 'failed';
      notes.media_import_reason = `blocked_or_js: ${fetchErr}`;
      await supabase.from('experiences').update({ notes }).eq('id', experience_id);

      return new Response(JSON.stringify({ 
        error: 'Failed to fetch source page', 
        detail: String(fetchErr),
      }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Extract image URLs
    const imageUrls: string[] = [];
    const baseUrl = new URL(exp.source_page_url);

    // OG image
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (ogMatch) imageUrls.push(ogMatch[1]);

    // img tags
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      imageUrls.push(match[1]);
    }

    // srcset best candidates
    const srcsetRegex = /srcset=["']([^"']+)["']/gi;
    while ((match = srcsetRegex.exec(html)) !== null) {
      const candidates = match[1].split(',').map(s => s.trim().split(/\s+/));
      // Pick largest
      if (candidates.length > 0) {
        const sorted = candidates.sort((a, b) => {
          const aw = parseInt(a[1] || '0');
          const bw = parseInt(b[1] || '0');
          return bw - aw;
        });
        imageUrls.push(sorted[0][0]);
      }
    }

    // Normalize and filter
    const seen = new Set<string>();
    const filtered: string[] = [];
    for (const raw of imageUrls) {
      let url = raw;
      if (url.startsWith('//')) url = 'https:' + url;
      else if (url.startsWith('/')) url = baseUrl.origin + url;
      else if (!url.startsWith('http')) url = baseUrl.origin + '/' + url;

      const lower = url.toLowerCase();
      if (lower.includes('favicon') || lower.includes('icon') || lower.includes('logo') ||
          lower.includes('sprite') || lower.includes('1x1') || lower.includes('pixel') ||
          lower.includes('data:') || lower.includes('placeholder') ||
          lower.includes('.svg') || lower.includes('.gif')) continue;

      if (!seen.has(url)) {
        seen.add(url);
        filtered.push(url);
      }
      if (filtered.length >= 12) break;
    }

    console.log(`Found ${filtered.length} candidate images`);

    if (filtered.length === 0) {
      const notes = (exp.notes as Record<string, unknown>) || {};
      notes.media_import = 'no_images_found';
      await supabase.from('experiences').update({ notes }).eq('id', experience_id);

      return new Response(JSON.stringify({ 
        success: true, imported: 0, message: 'No suitable images found',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Download and store each image
    let imported = 0;
    const mediaRows: Array<{ experience_id: string; source_image_url: string; stored_path: string; alt_text: string; sort_order: number }> = [];

    for (let i = 0; i < filtered.length; i++) {
      const imgUrl = filtered[i];
      try {
        const imgResp = await fetch(imgUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; myUNO/1.0)' },
        });
        if (!imgResp.ok) continue;

        const contentType = imgResp.headers.get('content-type') || 'image/jpeg';
        if (!contentType.startsWith('image/')) continue;

        const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
        const blob = await imgResp.blob();
        
        // Skip tiny images (< 5KB likely icons)
        if (blob.size < 5000) continue;

        const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())))
          .map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 12);

        const storagePath = `tours/${providerSlug}/${experienceSlug}/${hash}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from('tour-media')
          .upload(storagePath, blob, {
            contentType,
            upsert: true,
          });

        if (uploadErr) {
          console.error(`Upload error for ${storagePath}:`, uploadErr);
          continue;
        }

        mediaRows.push({
          experience_id,
          source_image_url: imgUrl,
          stored_path: storagePath,
          alt_text: `${provider?.name || ''} - Image ${i + 1}`,
          sort_order: i,
        });
        imported++;
      } catch (dlErr) {
        console.error(`Failed to download ${imgUrl}:`, dlErr);
      }
    }

    // Step 4: Insert media rows
    if (mediaRows.length > 0) {
      // Clear old media for this experience first
      await supabase.from('experience_media').delete().eq('experience_id', experience_id);

      const { error: insertErr } = await supabase.from('experience_media').insert(mediaRows);
      if (insertErr) {
        console.error('Failed to insert media rows:', insertErr);
      }

      // Update cover_image on the experience to first stored image
      const { data: publicUrlData } = supabase.storage
        .from('tour-media')
        .getPublicUrl(mediaRows[0].stored_path);

      if (publicUrlData?.publicUrl) {
        await supabase.from('experiences').update({ 
          cover_image: publicUrlData.publicUrl,
          images: mediaRows.slice(1).map(r => {
            const { data } = supabase.storage.from('tour-media').getPublicUrl(r.stored_path);
            return data?.publicUrl || '';
          }).filter(Boolean),
        }).eq('id', experience_id);
      }

      // Update notes
      const notes = (exp.notes as Record<string, unknown>) || {};
      notes.media_import = 'success';
      notes.media_imported_at = new Date().toISOString();
      notes.media_count = imported;
      await supabase.from('experiences').update({ notes }).eq('id', experience_id);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      imported,
      total_candidates: filtered.length,
      storage_paths: mediaRows.map(r => r.stored_path),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('import-experience-media error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
