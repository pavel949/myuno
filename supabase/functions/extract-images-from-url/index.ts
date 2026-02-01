import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Extracting images from URL:', formattedUrl);

    // Use Firecrawl to scrape the page and get links (which includes images)
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['html', 'links'],
        onlyMainContent: false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract image URLs from the HTML content
    const html = data.data?.html || data.html || '';
    const imageUrls: string[] = [];
    
    // Extract from img tags
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[1];
      if (src && !src.startsWith('data:') && !src.includes('placeholder')) {
        // Convert relative URLs to absolute
        let absoluteUrl = src;
        if (src.startsWith('//')) {
          absoluteUrl = 'https:' + src;
        } else if (src.startsWith('/')) {
          const urlObj = new URL(formattedUrl);
          absoluteUrl = urlObj.origin + src;
        } else if (!src.startsWith('http')) {
          const urlObj = new URL(formattedUrl);
          absoluteUrl = urlObj.origin + '/' + src;
        }
        
        // Filter for actual images
        if (/\.(jpg|jpeg|png|gif|webp|avif)/i.test(absoluteUrl) || absoluteUrl.includes('/image')) {
          if (!imageUrls.includes(absoluteUrl)) {
            imageUrls.push(absoluteUrl);
          }
        }
      }
    }

    // Also extract from srcset
    const srcsetRegex = /srcset=["']([^"']+)["']/gi;
    while ((match = srcsetRegex.exec(html)) !== null) {
      const srcset = match[1];
      const urls = srcset.split(',').map(s => s.trim().split(/\s+/)[0]);
      for (const src of urls) {
        if (src && !src.startsWith('data:')) {
          let absoluteUrl = src;
          if (src.startsWith('//')) {
            absoluteUrl = 'https:' + src;
          } else if (src.startsWith('/')) {
            const urlObj = new URL(formattedUrl);
            absoluteUrl = urlObj.origin + src;
          }
          
          if (/\.(jpg|jpeg|png|gif|webp|avif)/i.test(absoluteUrl)) {
            if (!imageUrls.includes(absoluteUrl)) {
              imageUrls.push(absoluteUrl);
            }
          }
        }
      }
    }

    // Extract from background-image styles
    const bgRegex = /background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi;
    while ((match = bgRegex.exec(html)) !== null) {
      const src = match[1];
      if (src && !src.startsWith('data:')) {
        let absoluteUrl = src;
        if (src.startsWith('//')) {
          absoluteUrl = 'https:' + src;
        } else if (src.startsWith('/')) {
          const urlObj = new URL(formattedUrl);
          absoluteUrl = urlObj.origin + src;
        }
        
        if (/\.(jpg|jpeg|png|gif|webp|avif)/i.test(absoluteUrl)) {
          if (!imageUrls.includes(absoluteUrl)) {
            imageUrls.push(absoluteUrl);
          }
        }
      }
    }

    // Filter out small icons and favicons
    const filteredImages = imageUrls.filter(url => {
      const lowerUrl = url.toLowerCase();
      return !lowerUrl.includes('favicon') && 
             !lowerUrl.includes('icon') &&
             !lowerUrl.includes('logo') &&
             !lowerUrl.includes('sprite') &&
             !lowerUrl.includes('1x1') &&
             !lowerUrl.includes('pixel');
    });

    // Get page title for context
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : '';

    console.log(`Found ${filteredImages.length} images`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        images: filteredImages.slice(0, 50), // Limit to 50 images
        pageTitle,
        totalFound: imageUrls.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error extracting images:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to extract images';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
