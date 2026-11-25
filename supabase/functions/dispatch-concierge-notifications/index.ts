// Coordinated rollout only: docs/hardening/concierge-crm-routing/README.md.
import { createServiceClient } from '../_shared/supabase.ts';
import { createConciergeRuntime } from '../_shared/concierge-notifications.mjs';
Deno.serve(createConciergeRuntime({
  schedulerSecret:Deno.env.get('CONCIERGE_OUTBOX_SCHEDULER_SECRET'),
  createServiceClient,
  providerConfig:{ultraInstance:Deno.env.get('ULTRAMSG_INSTANCE'),ultraToken:Deno.env.get('ULTRAMSG_TOKEN')},
}));
