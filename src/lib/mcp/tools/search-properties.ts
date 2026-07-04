import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

/**
 * Public search over myUNO properties. Uses anon key — RLS restricts to
 * publicly listed properties. No auth required.
 */
export default defineTool({
  name: "search_properties",
  title: "Search properties",
  description:
    "Search myUNO property listings on Phuket. Filter by city, min/max price (USD/THB stored as numeric) and bedrooms. Returns up to `limit` rows.",
  inputSchema: {
    query: z
      .string()
      .trim()
      .max(200)
      .optional()
      .describe("Free-text query matched against title/description."),
    city: z.string().trim().max(80).optional().describe("City filter, e.g. 'Phuket'."),
    minPrice: z.number().nonnegative().optional(),
    maxPrice: z.number().nonnegative().optional(),
    bedrooms: z.number().int().nonnegative().max(20).optional(),
    limit: z.number().int().min(1).max(50).default(10),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, city, minPrice, maxPrice, bedrooms, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    let q = supabase.from("properties").select("*").limit(limit);
    if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    if (city) q = q.ilike("city", `%${city}%`);
    if (typeof minPrice === "number") q = q.gte("price", minPrice);
    if (typeof maxPrice === "number") q = q.lte("price", maxPrice);
    if (typeof bedrooms === "number") q = q.eq("bedrooms", bedrooms);

    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { rows: data ?? [] },
    };
  },
});
