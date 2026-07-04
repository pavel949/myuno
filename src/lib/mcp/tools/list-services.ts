import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

/**
 * Browse the myUNO service catalog. Public — no auth required.
 */
export default defineTool({
  name: "list_services",
  title: "List services",
  description:
    "List services from the myUNO catalog. Optionally filter by category slug and free-text query.",
  inputSchema: {
    query: z.string().trim().max(200).optional(),
    category: z.string().trim().max(80).optional().describe("Category slug, e.g. 'legal'."),
    limit: z.number().int().min(1).max(50).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    let q = supabase.from("services").select("*").limit(limit);
    if (query) q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    if (category) q = q.eq("category_slug", category);

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
