/**
 * Extract Images from URL Edge Function
 * AUTH_REQUIRED: Fetches external URLs (SSRF risk). Requires authentication.
 */
// Deno.serve used (native edge runtime)
import { requireAuth } from "../_shared/auth-guard.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ImageResult {
  url: string;
  preview?: string;
  name?: string;
}

// Handle Yandex Disk URLs
async function extractFromYandexDisk(publicUrl: string): Promise<ImageResult[]> {
  console.log('Extracting from Yandex Disk:', publicUrl);
  
  const apiUrl = `https://cloud-api.yandex.net/v1/disk/public/resources?public_key=${encodeURIComponent(publicUrl)}&limit=100&preview_size=M`;
  
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Yandex Disk API error:', error);
    throw new Error(`Yandex Disk API error: ${response.status}`);
  }
  
  const data = await response.json();
  const images: ImageResult[] = [];
  
  // If it's a folder - get list of files
  if (data._embedded?.items) {
    console.log(`Found ${data._embedded.items.length} items in folder`);
    
    for (const item of data._embedded.items) {
      if (item.media_type === 'image') {
        // Get download link for each image
        const downloadApiUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(publicUrl)}&path=${encodeURIComponent(item.path)}`;
        
        try {
          const downloadResp = await fetch(downloadApiUrl);
          if (downloadResp.ok) {
            const downloadData = await downloadResp.json();
            images.push({
              url: downloadData.href,
              preview: item.preview || downloadData.href,
              name: item.name
            });
          }
        } catch (e) {
          console.error(`Failed to get download link for ${item.name}:`, e);
          // Still add with preview if available
          if (item.preview) {
            images.push({
              url: item.preview,
              preview: item.preview,
              name: item.name
            });
          }
        }
      }
    }
  }
  // If it's a single file
  else if (data.media_type === 'image') {
    console.log('Found single image file');
    
    const downloadApiUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(publicUrl)}`;
    
    try {
      const downloadResp = await fetch(downloadApiUrl);
      if (downloadResp.ok) {
        const downloadData = await downloadResp.json();
        images.push({
          url: downloadData.href,
          preview: data.preview || downloadData.href,
          name: data.name
        });
      }
    } catch (e) {
      console.error('Failed to get download link:', e);
      if (data.preview) {
        images.push({
          url: data.preview,
          preview: data.preview,
          name: data.name
        });
      }
    }
  }
  
  console.log(`Extracted ${images.length} images from Yandex Disk`);
  return images;
}

// Handle regular websites via Firecrawl
async function extractFromWebsite(url: string, apiKey: string): Promise<ImageResult[]> {
  console.log('Extracting images from website:', url);

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: url,
      formats: ['html', 'links'],
      onlyMainContent: false,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Firecrawl API error:', data);
    throw new Error(data.error || `Request failed with status ${response.status}`);
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
        const urlObj = new URL(url);
        absoluteUrl = urlObj.origin + src;
      } else if (!src.startsWith('http')) {
        const urlObj = new URL(url);
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
          const urlObj = new URL(url);
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
        const urlObj = new URL(url);
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
  const filteredImages = imageUrls.filter(imgUrl => {
    const lowerUrl = imgUrl.toLowerCase();
    return !lowerUrl.includes('favicon') && 
           !lowerUrl.includes('icon') &&
           !lowerUrl.includes('logo') &&
           !lowerUrl.includes('sprite') &&
           !lowerUrl.includes('1x1') &&
           !lowerUrl.includes('pixel');
  });

  return filteredImages.map(imgUrl => ({ url: imgUrl }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit
  const rlResponse = await withRateLimit(req, 'extract-images-from-url', RATE_LIMITS.ai, corsHeaders);
  if (rlResponse) return rlResponse;

  // Auth required: fetches external URLs
  const authResult = await requireAuth(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Processing URL:', formattedUrl);

    // Check if it's a Yandex Disk URL
    const isYandexDisk = formattedUrl.includes('disk.yandex.ru') || 
                         formattedUrl.includes('yadi.sk');

    let images: ImageResult[];
    let pageTitle = '';

    if (isYandexDisk) {
      console.log('Detected Yandex Disk URL');
      images = await extractFromYandexDisk(formattedUrl);
      pageTitle = 'Yandex Disk';
    } else {
      // Use Firecrawl for regular websites
      const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (!apiKey) {
        console.error('FIRECRAWL_API_KEY not configured');
        return new Response(
          JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      images = await extractFromWebsite(formattedUrl, apiKey);
      
      // Try to extract page title from the URL for context
      try {
        const urlObj = new URL(formattedUrl);
        pageTitle = urlObj.hostname;
      } catch {
        pageTitle = '';
      }
    }

    console.log(`Found ${images.length} images`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        images: images.slice(0, 50), // Limit to 50 images
        pageTitle,
        totalFound: images.length,
        source: isYandexDisk ? 'yandex_disk' : 'firecrawl'
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
