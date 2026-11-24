import { configuredAdminContacts } from "../_shared/admin-notification-contacts.ts";
import { createRuntime } from "../_shared/consultation-outbox/runtime.mjs";
import { createServiceClient } from "../_shared/supabase.ts";

Deno.serve(createRuntime({
  schedulerSecret: Deno.env.get("CONSULTATION_OUTBOX_SCHEDULER_SECRET"),
  createServiceClient,
  configuredAdminContacts,
  providerConfig: {
    resendKey: Deno.env.get("RESEND_API_KEY"),
    emailFrom: Deno.env.get("CONSULTATION_OUTBOX_EMAIL_FROM"),
    ultraInstance: Deno.env.get("ULTRAMSG_INSTANCE"),
    ultraToken: Deno.env.get("ULTRAMSG_TOKEN"),
  },
  fetchApi: globalThis.fetch,
  cryptoApi: globalThis.crypto,
}));
