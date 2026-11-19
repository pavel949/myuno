// Review-only composition. No listener, environment reads, credentials or auto-activation.
// Inject the existing createServiceClient and configuredAdminContacts from #261.
import { createWorker } from './worker.mjs';
import { createSupabaseStore, schedulerAuthorization } from './adapters.mjs';
import { providerAdapters } from './providers.mjs';

export function createRuntime({ schedulerSecret, createServiceClient, configuredAdminContacts, providerConfig, fetchApi, cryptoApi }) {
  const authorize = schedulerAuthorization(schedulerSecret, cryptoApi);
  const send = providerAdapters(providerConfig, fetchApi);
  // State belongs to this request, never shared across concurrent invocations.
  return async request => {
    let client;
    return createWorker({
      authorize,
      openStore: async () => { client = createServiceClient(); return createSupabaseStore(client); },
      readContacts: async () => {
        const { data, error } = await client.from('system_settings')
          .select('key, value').in('key', ['admin_emails', 'admin_whatsapp']);
        if (error || !Array.isArray(data)) throw new Error('contacts_unavailable');
        // Reject ambiguous settings; never pick a last duplicate recipient silently.
        const keys = data.map(row => row.key);
        if (keys.some(key => !['admin_emails', 'admin_whatsapp'].includes(key)) || new Set(keys).size !== keys.length)
          throw new Error('contacts_ambiguous');
        return configuredAdminContacts(data);
      },
      send,
    })(request);
  };
}
