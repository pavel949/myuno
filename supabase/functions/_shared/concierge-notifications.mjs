import { createWorker } from './consultation-outbox/worker.mjs';
import { schedulerAuthorization } from './consultation-outbox/adapters.mjs';

export const conciergeOutboxEnabled = value => value === 'true';
export function stampConciergeTransport(sourceData, enabled) {
  return {...(sourceData ?? {}), concierge_notification_transport: enabled ? 'outbox_v1' : 'legacy'};
}

export const CONCIERGE_RECIPIENTS = Object.freeze(['66630827085', '66954243332']);
const clean = (value, max) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max);
export function conciergeMessage(lead) {
  if (!/^[0-9a-f-]{36}$/i.test(lead.id)) throw new Error('invalid_receipt');
  return [
    'myUNO concierge request', `Topic: ${clean(lead.topic, 40)}`,
    `Subject: ${clean(lead.subject, 200)}`, `Language: ${clean(lead.language, 5)}`,
    `Priority: ${clean(lead.urgency, 10)}`, `Phone: ${clean(lead.phone, 40)}`,
    `Email: ${clean(lead.email, 255)}`, clean(lead.message, 2400),
    `https://myuno.app/admin/inbox?source=help_requests&request=${lead.id}`,
  ].join('\n');
}
export function conciergeSender({ ultraInstance, ultraToken }, fetchApi = fetch) {
  if (typeof ultraInstance !== 'string' || !/^instance\d+$/.test(ultraInstance) || !ultraToken) return {};
  return { whatsapp: async ({lead, signal}) => {
    if (!CONCIERGE_RECIPIENTS.includes(lead.recipient)) return {}; // fixed server allowlist
    const response = await fetchApi(`https://api.ultramsg.com/${ultraInstance}/messages/chat`, {
      method:'POST', signal, redirect:'error', headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({token:ultraToken,to:`+${lead.recipient}`,body:conciergeMessage(lead)}),
    });
    const result = await response.json();
    const reference = result && ['string','number'].includes(typeof result.id) ? String(result.id) : '';
    return response.ok && !result?.error && ['true',true].includes(result?.sent) && reference && reference !== '0'
      ? {accepted:true,reference} : {};
  }};
}
export function createConciergeRuntime({schedulerSecret,createServiceClient,providerConfig,fetchApi,cryptoApi}) {
  return createWorker({
    authorize:schedulerAuthorization(schedulerSecret,cryptoApi),
    openStore:async()=> {
      const client=createServiceClient();
      return {
        claim:async()=> {const {data,error}=await client.rpc('claim_concierge_notifications');if(error||!Array.isArray(data))throw new Error('claim_unconfirmed');return data;},
        finish:async(id,token,outcome,reference)=> {const {data,error}=await client.rpc('finish_concierge_notification',{p_id:id,p_token:token,p_outcome:outcome,p_reference:reference});if(error)throw new Error('finish_unconfirmed');return data===true;},
      };
    },
    readContacts:async()=>({whatsapp:'fixed-concierge-recipients'}),
    send:conciergeSender(providerConfig,fetchApi),
  });
}
