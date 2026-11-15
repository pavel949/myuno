import { supabase } from '@/integrations/supabase/client';
import { manualPropertyIntentFingerprint, type ManualPropertyIntent } from '../../supabase/functions/_shared/manual-request-key';
const volatileKeys=new Map<string,string>();
export interface ManualPropertyRequest extends ManualPropertyIntent {
 property_title:string;nights:number;total_amount:number;deposit_amount:number;cleaning_fee?:number;
}
export async function requestManualPropertyPayment(input:ManualPropertyRequest) {
 const {data,error:authError}=await supabase.auth.getUser();
 if(authError||!data.user)throw new Error('Please sign in to continue');
 const fingerprint=await manualPropertyIntentFingerprint(input);
 const storageKey=`myuno:manual-payment-intake:${data.user.id}:${fingerprint}`;
 let requestKey=volatileKeys.get(storageKey);
 try{requestKey=sessionStorage.getItem(storageKey)??requestKey;}catch{/* A blocked store must not authorize anything. */}
 if(!requestKey||!/^[0-9a-f-]{36}$/i.test(requestKey))requestKey=crypto.randomUUID();
 volatileKeys.set(storageKey,requestKey);
 try{sessionStorage.setItem(storageKey,requestKey);}catch{/* In-memory key still permits unchanged retries. */}
 const {data:receipt,error}=await supabase.functions.invoke('create-property-deposit-checkout',{
  body:{...input,payment_channel:'rub_manual',request_key:requestKey},
 });
 if(error)throw error;
 if(receipt?.success!==true||typeof receipt.order_id!=='string'||typeof receipt.request_id!=='string') {
  throw new Error('Request acknowledgement is missing. Check your bookings before submitting again.');
 }
 return receipt as {success:true;already:boolean;order_id:string;request_id:string};
}

/** Narrow additive read contract; the authenticated server helper decides authority. */
export async function readManualReceiptApproval(requestId: string): Promise<boolean> {
 type ApprovalReader=(name:'can_confirm_manual_receipt',args:{p_request_id:string})=>PromiseLike<{data:unknown;error:unknown}>;
 const rpc=supabase.rpc.bind(supabase) as unknown as ApprovalReader;
 try {
  const {data,error}=await rpc('can_confirm_manual_receipt',{p_request_id:requestId});
  return !error && data===true;
 } catch { return false; }
}
