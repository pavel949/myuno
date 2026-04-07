// Deno.serve used (native edge runtime)
import { createClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

const ETAGI_CATALOG_URL = "https://phuket.etagi.com/zastr/";
const STORAGE_BUCKET = "property-images";
const STORAGE_PATH_PREFIX = "etagi";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .substring(0, 80);
}

function parsePrice(priceStr: string): number | null {
  const cleaned = priceStr.replace(/[^\d]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) || num < 100000 ? null : num;
}

function parseCompletionDate(dateStr: string): string | null {
  const quarterMatch = dateStr.match(/(\d)\s*(?:кв|q)/i);
  const yearMatch = dateStr.match(/(20\d{2})/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    if (quarterMatch) {
      const quarter = parseInt(quarterMatch[1]);
      const month = quarter * 3;
      const lastDay = new Date(year, month, 0).getDate();
      return `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
    }
    return `${year}-12-31`;
  }
  return null;
}

function determineStatus(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("сдан") || lower.includes("готов")) return "completed";
  if (lower.includes("строи")) return "under_construction";
  return "offplan";
}

interface ParsedProject {
  name: string;
  address: string;
  priceFrom: number | null;
  completionDate: string | null;
  status: string;
  coverImageUrl: string | null;
}

/**
 * Parse projects from Etagi catalog markdown.
 * Each project block follows the pattern:
 *   [![](imageUrl)\\\n\\\n1/N](projectUrl) [data\\\nот \\\n\\\nPRICETHB\\\n\\\nDATE\\\n\\\nNAME\\\n\\\nADDRESS\\\n...](projectUrl)
 */
function parseProjectsFromMarkdown(markdown: string): ParsedProject[] {
  const projects: ParsedProject[] = [];

  // Split by project card pattern: starts with [![]( 
  const blocks = markdown.split(/\n\n(?=\[!\[)/);

  for (const block of blocks) {
    try {
      // Extract cover image URL
      const imgMatch = block.match(/\[!\[\]\((https:\/\/cdn\.esoft\.digital\/[^\s)]+)\)/);
      const coverImageUrl = imgMatch?.[1] || null;

      // Extract the text content between [ and ](url) — the second link block
      // Pattern: ] [content](url)  
      const contentMatch = block.match(/\]\([^\)]+\)\s*\[([^\]]+)\]\(/);
      if (!contentMatch) continue;

      const content = contentMatch[1];
      // Split by \\  (backslash-backslash which is the line separator in this format)
      const lines = content
        .split(/\\\s*\n\s*\\?\s*\n?/)
        .map((l: string) => l.replace(/\\\s*$/, "").trim())
        .filter((l: string) => l.length > 0);

      if (lines.length < 4) continue;

      // Find price line (contains THB)
      let priceFrom: number | null = null;
      let completionLine = "";
      let name = "";
      let address = "";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Price: line containing THB with digits
        if (/\d.*THB/i.test(line) && !priceFrom && !/м2/i.test(line)) {
          priceFrom = parsePrice(line);
          continue;
        }

        // Completion date: line with "кв. 20XX"
        if (/\d\s*кв\.\s*20\d{2}/i.test(line) && !completionLine) {
          completionLine = line;
          continue;
        }

        // Name: typically ALL CAPS or mixed case, after price+date, before address
        if (!name && priceFrom && completionLine && line.length > 3 && !/^(Студии|1к|2к|3к|4к|\d+\s*предлож|Показать|Квартиры|от\s)/i.test(line)) {
          name = line.replace(/[‑–—]/g, "-");
          continue;
        }

        // Address: line starting with "ул." or after name
        if (name && !address && /^ул\./i.test(line)) {
          address = line;
          continue;
        }
      }

      // Fallback: try to find name as the prominent text
      if (!name) {
        // Look for a line that looks like a project name (mixed/upper case, no digits at start)
        for (const line of lines) {
          if (
            line.length > 3 &&
            line.length < 60 &&
            !/^(Студии|1к|2к|3к|4к|\d|от |Квартиры|Показать|ул\.)/i.test(line) &&
            !/THB/i.test(line) &&
            !/кв\./i.test(line) &&
            !/предлож/i.test(line)
          ) {
            name = line.replace(/[‑–—]/g, "-");
            break;
          }
        }
      }

      if (!name || name.length < 3) continue;

      projects.push({
        name,
        address: address || "",
        priceFrom,
        completionDate: parseCompletionDate(completionLine),
        status: determineStatus(completionLine),
        coverImageUrl,
      });
    } catch {
      // Skip unparseable blocks
    }
  }

  return projects;
}

async function downloadAndUploadImage(
  supabase: any,
  imageUrl: string,
  storagePath: string
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "image/*,*/*",
      },
    });
    if (!response.ok) {
      console.error(`Failed to download image: ${response.status}`);
      return null;
    }
    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, imageData, { contentType, upsert: true });

    if (error) {
      console.error(`Upload error: ${error.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error(`Image error:`, err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY not configured");
    }

    // Parse page range from request body or query
    let startPage = 1;
    let endPage = 1;
    try {
      if (req.method === "POST") {
        const body = await req.json();
        startPage = body.startPage || 1;
        endPage = body.endPage || startPage;
      } else {
        const url = new URL(req.url);
        startPage = parseInt(url.searchParams.get("startPage") || "1");
        endPage = parseInt(url.searchParams.get("endPage") || String(startPage));
      }
    } catch { /* defaults */ }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    let allParsedProjects: ParsedProject[] = [];

    for (let page = startPage; page <= endPage; page++) {
      const pageUrl = page === 1 ? ETAGI_CATALOG_URL : `${ETAGI_CATALOG_URL}?page=${page}`;
      console.log(`Scraping page ${page}: ${pageUrl}`);

      const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: pageUrl,
          formats: ["markdown"],
          onlyMainContent: true,
          waitFor: 3000,
        }),
      });

      const scrapeData = await scrapeResponse.json();
      if (!scrapeResponse.ok || !scrapeData.success) {
        console.error(`Page ${page} failed:`, JSON.stringify(scrapeData));
        continue;
      }

      const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
      console.log(`Page ${page}: ${markdown.length} chars`);

      const pageProjects = parseProjectsFromMarkdown(markdown);
      console.log(`Page ${page}: parsed ${pageProjects.length} projects`);
      allParsedProjects = allParsedProjects.concat(pageProjects);
    }

    console.log(`Total parsed across all pages: ${allParsedProjects.length} projects`);

    if (allParsedProjects.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No projects parsed. Page structure may have changed." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsedProjects = allParsedProjects;

    const results = { processed: 0, upserted: 0, images_uploaded: 0, errors: [] as string[] };

    for (const project of parsedProjects) {
      try {
        const slug = slugify(project.name);

        // Download cover image
        let coverImageUrl: string | null = null;
        if (project.coverImageUrl) {
          const ext = project.coverImageUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || "jpg";
          const storagePath = `${STORAGE_PATH_PREFIX}/${slug}.${ext}`;
          coverImageUrl = await downloadAndUploadImage(supabase, project.coverImageUrl, storagePath);
          if (coverImageUrl) results.images_uploaded++;
        }

        const projectData = {
          name_en: project.name,
          name_ru: project.name,
          address: project.address || null,
          district: "Phuket",
          price_from: project.priceFrom,
          completion_date: project.completionDate,
          project_status: project.status,
          cover_image: coverImageUrl,
          images: coverImageUrl ? [coverImageUrl] : null,
          is_active: true,
          updated_at: new Date().toISOString(),
        };

        // Upsert by name
        const { data: existing } = await supabase
          .from("property_projects")
          .select("id")
          .eq("name_en", project.name)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase.from("property_projects").update(projectData).eq("id", existing.id);
          if (error) results.errors.push(`Update ${project.name}: ${error.message}`);
          else results.upserted++;
        } else {
          const { error } = await supabase.from("property_projects").insert(projectData);
          if (error) results.errors.push(`Insert ${project.name}: ${error.message}`);
          else results.upserted++;
        }
        results.processed++;
      } catch (err) {
        results.errors.push(`${project.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    console.log(`Done: ${results.upserted} upserted, ${results.images_uploaded} images, ${results.errors.length} errors`);

    return new Response(
      JSON.stringify({ success: true, ...results, total_parsed: parsedProjects.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Etagi scrape error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
