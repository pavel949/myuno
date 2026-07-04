import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchPropertiesTool from "./tools/search-properties";
import listServicesTool from "./tools/list-services";
import whoamiTool from "./tools/whoami";

// Direct Supabase host is required for the OAuth issuer (RFC 8414 §3.3).
// Read from the Vite-inlined project id so this file stays import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "myuno-mcp",
  title: "myUNO",
  version: "0.1.0",
  instructions:
    "Tools for myUNO — a Phuket SuperApp for foreigners. Use `search_properties` to browse property listings, `list_services` to browse the service catalog, and `whoami` to identify the signed-in user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchPropertiesTool, listServicesTool, whoamiTool],
});
