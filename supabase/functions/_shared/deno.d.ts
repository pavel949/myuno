// Ambient declarations so the app TS project can typecheck Deno edge functions.
// Runtime resolution is handled by Deno, not by Vite/tsc.

declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    toObject(): Record<string, string>;
  };
}

declare module "npm:@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
}
