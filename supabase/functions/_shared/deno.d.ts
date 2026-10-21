// Ambient declarations so the app TS project can typecheck Deno edge functions.
// Runtime resolution is handled by Deno, not by Vite/tsc.

declare namespace Deno {
  // Minimal server entrypoint used by Edge modules imported in synthetic tests.
  // This ambient surface is for the app's tsc project, not a runtime polyfill.
  export function serve(handler: (request: Request) => Response | Promise<Response>): unknown;

  export const env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    toObject(): Record<string, string>;
  };
}

declare module "npm:@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
}
