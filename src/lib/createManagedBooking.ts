import { supabase } from '@/integrations/supabase/client';
import type { CreateBookingInput } from '@/hooks/usePropertyBookings';

/** Narrow additive RPC contract; the existing actor-bound client remains authority. */
type BookingWriter = (name: 'create_managed_property_booking_checked', args: {p_input: CreateBookingInput}) => PromiseLike<{
 data: {success?:boolean;order?:{id:string;start_at:string;end_at:string;status:string;created_at:string;updated_at:string}} | null;
 error: {code?:string;message:string} | null;
}>;
export async function createManagedBooking(input: CreateBookingInput) {
 const rpc=supabase.rpc.bind(supabase) as unknown as BookingWriter;
 const {data,error}=await rpc('create_managed_property_booking_checked',{p_input:input});
 if(error){
  if(['PGRST202','42883','55000'].includes(error.code??'')) throw new Error('Booking is temporarily unavailable. Contact an administrator.');
  throw new Error(error.message);
 }
 if(data?.success!==true || !data.order?.id || !data.order.start_at || !data.order.end_at) {
  throw new Error('Booking acknowledgement is missing. Check the booking list before submitting again.');
 }
 return data.order;
}
