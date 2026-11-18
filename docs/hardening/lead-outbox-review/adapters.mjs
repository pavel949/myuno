// Pinned application Supabase client is injected after scheduler admission.
// No dynamic table reads, caller-selected IDs, recipient data or secrets in errors.
export function createSupabaseStore(client) {
 return {
  async claim() { const {data,error}=await client.rpc('claim_consultation_notifications'); if(error||!Array.isArray(data))throw new Error('claim_unconfirmed'); return data; },
  async finish(id,token,outcome,reference) { const {data,error}=await client.rpc('finish_consultation_notification',{p_id:id,p_token:token,p_outcome:outcome,p_reference:reference});if(error)throw new Error('finish_unconfirmed');return data===true; },
 };
}
// Dedicated secret, never a normal user JWT or user metadata. Compare fixed-size digests.
export function schedulerAuthorization(secret,cryptoApi=globalThis.crypto) {
 return async req=>{
  const received=req.headers.get('x-scheduler-secret');
  if(typeof secret!=='string'||secret.length<32||!received||received.length>512)return false;
  const hash=async s=>new Uint8Array(await cryptoApi.subtle.digest('SHA-256',new TextEncoder().encode(s)));
  const [a,b]=await Promise.all([hash(secret),hash(received)]);let difference=0;
  for(let i=0;i<a.length;i++)difference|=a[i]^b[i];return difference===0;
 };
}
