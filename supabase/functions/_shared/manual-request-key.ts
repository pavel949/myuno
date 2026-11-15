/** Same bounded intent in browser and Edge. No price/FX claim becomes authority. */
export interface ManualPropertyIntent {
 property_id:string;check_in:string;check_out:string;guests:number;
 guest_name:string;guest_phone?:string;guest_email?:string;
}
export async function manualPropertyIntentFingerprint(input:ManualPropertyIntent,cryptoApi:Crypto=globalThis.crypto) {
 const text=JSON.stringify([input.property_id,input.check_in,input.check_out,input.guests,input.guest_name,input.guest_phone??'',input.guest_email??'']);
 const bytes=await cryptoApi.subtle.digest('SHA-256',new TextEncoder().encode(text));
 return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
