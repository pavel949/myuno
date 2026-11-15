// Manual RUB receipt: protected admin or explicitly delegated object approver.
// The actor-bound SQL writer owns FX evidence, receipt identity, balance and ledger.
import { Resend } from 'npm:resend@2.0.0';
import { createClient, createServiceClient } from '../_shared/supabase.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
interface Payload {
  request_id: string; amount_rub_actual: number; fx_rate_rub_per_thb: number;
  approved_total_thb: number; receipt_reference: string; payment_method: string; proof_file_path: string;
}
Deno.serve(async (req) => {
  const corsHeaders=getCorsHeaders(req);
  const reply=(body:Record<string,unknown>,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
  if(req.method==='OPTIONS')return new Response(null,{headers:corsHeaders});
  if(req.method!=='POST')return reply({error:'Method not allowed'},405);
  try {
    const authHeader=req.headers.get('Authorization')||'';
    if(!/^Bearer\s+\S+/i.test(authHeader))return reply({error:'Unauthorized'},401);
    const userClient=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authHeader}}});
    const {data:userResult,error:userError}=await userClient.auth.getUser();
    if(userError||!userResult.user)return reply({error:'Unauthorized'},401);
    const body=await req.json() as Payload;
    const {request_id,amount_rub_actual,fx_rate_rub_per_thb,approved_total_thb,receipt_reference,payment_method,proof_file_path}=body;
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(request_id??'')
      ||![amount_rub_actual,fx_rate_rub_per_thb,approved_total_thb].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>0)
      ||typeof receipt_reference!=='string'||receipt_reference.trim().length<3
      ||typeof proof_file_path!=='string'||!proof_file_path.startsWith(`${request_id}/`)
      ||!['sbp','ru_card','cash','other'].includes(payment_method))return reply({error:'Receipt, approved total, exchange rate and document are required'},400);
    const {data:allowed,error:accessError}=await userClient.rpc('can_confirm_manual_receipt',{p_request_id:request_id});
    if(accessError)return reply({ok:false,code:'manual_payment_unavailable',error:'Manual receipt confirmation is temporarily unavailable'},503);
    if(allowed!==true)return reply({error:'Forbidden'},403);
    const {data:result,error:receiptError}=await userClient.rpc('confirm_manual_receipt_checked',{
      p_request_id:request_id,p_amount_rub_actual:amount_rub_actual,p_fx_rate_rub_per_thb:fx_rate_rub_per_thb,
      p_approved_total_thb:approved_total_thb,p_receipt_reference:receipt_reference.trim(),
      p_payment_method:payment_method,p_proof_file_path:proof_file_path,
    });
    if(receiptError)return reply({ok:false,code:receiptError.code,error:'Receipt confirmation was not completed. Check the request before retrying.'},['PGRST202','42883'].includes(receiptError.code)?503:409);
    const outcomes=['settled','partial','overpayment_requires_reconciliation','legacy_receipt_requires_reconciliation','recipient_requires_reconciliation','inventory_requires_reconciliation'];
    if(!result||!outcomes.includes(result.outcome)||!result.order_id)return reply({ok:false,error:'Receipt acknowledgement is missing. Check the request before retrying.'},503);
    if(result.already||result.outcome!=='settled')return reply({ok:true,...result});

    // Side effects follow committed full settlement, never provisional receipt or FX.
    const sb=createServiceClient();
    const {data:mpr,error:mprError}=await sb.from('manual_payment_requests').select('user_id,guest_name,guest_email').eq('id',request_id).single();
    if(mprError||!mpr)return reply({ok:true,...result,delivery_pending:true});
    const orderId=result.order_id as string;
    const orderNumber=result.order_number as string;
    // 3. Notify guest in-app
    await sb.from('notifications').insert({
      user_id: (mpr as any).user_id,
      title: 'Оплата подтверждена',
      body: `Бронирование #${orderNumber} подтверждено.`,
      type: 'booking',
      is_read: false,
      data: { order_id: orderId, order_number: orderNumber, channel: 'rub_manual' },
    });

    // 4. Email guest (best effort)
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const guestEmail = (mpr as any).guest_email as string;
    const guestName = String(mpr.guest_name ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]!));
    if (resendKey && guestEmail) {
      try {
        const resend = new Resend(resendKey);
        const html = `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;line-height:1.5;color:#222;background:#fafafa;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#10b981;padding:24px;color:#fff">
      <h1 style="margin:0;font-size:20px">✓ Оплата подтверждена</h1>
      <p style="margin:6px 0 0;opacity:.9;font-size:14px">Booking #${orderNumber}</p>
    </div>
    <div style="padding:24px;font-size:14px">
      <p>Здравствуйте, ${guestName}!</p>
      <p>Мы получили вашу оплату <strong>${amount_rub_actual.toLocaleString('ru-RU')} ₽</strong> и подтвердили бронирование.</p>
      <p>Ваучер и детали будут направлены отдельным письмом / в личном кабинете.</p>
      <p style="margin-top:24px"><a href="https://myuno.app/bookings/${orderId}" style="display:inline-block;padding:10px 18px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Открыть бронирование</a></p>
    </div>
  </div>
</body></html>`;
        await resend.emails.send({
          from: 'myUNO <noreply@notify.myuno.app>',
          to: [guestEmail],
          subject: `✓ Оплата подтверждена · Booking #${orderNumber}`,
          html,
        });
      } catch (e) {
        console.error('[confirm-manual-payment] email error:', e);
      }
    }

    // 5. Generate voucher (non-blocking)
    sb.functions.invoke('generate-booking-voucher', { body: { orderId } })
      .catch((e) => console.error('[confirm-manual-payment] voucher gen:', e));

    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch {
    return reply({ok:false,error:'Receipt confirmation is unavailable. Check the request before retrying.'},503);
  }
});
