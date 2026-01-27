import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting - public read endpoints (100/min)
    const rateLimitResponse = await withRateLimit(
      req,
      'generate-booking-voucher',
      RATE_LIMITS.publicRead,
      corsHeaders
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { orderId, language = 'en' } = await req.json();

    if (!orderId) {
      throw new Error('orderId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch order with property details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    const propertyId = order.metadata?.property_id;
    let property = null;

    if (propertyId) {
      const { data } = await supabase
        .from('owner_properties')
        .select('*')
        .eq('id', propertyId)
        .single();
      property = data;
    }

    // Fetch guest info
    const { data: participants } = await supabase
      .from('order_participants')
      .select('*')
      .eq('order_id', orderId)
      .eq('role', 'primary')
      .single();

    const isRu = language === 'ru';
    const propertyTitle = isRu 
      ? (property?.title_ru || property?.title_en || 'Property') 
      : (property?.title_en || 'Property');

    // Generate simple PDF-like HTML that can be converted
    const checkIn = order.metadata?.check_in || '';
    const checkOut = order.metadata?.check_out || '';
    const guests = order.metadata?.guests_count || 2;

    const voucherHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #0ea5e9; }
          .voucher-title { font-size: 18px; color: #666; margin-top: 8px; }
          .order-number { font-size: 14px; color: #999; }
          .section { margin: 24px 0; }
          .section-title { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px; }
          .section-value { font-size: 16px; font-weight: 600; }
          .grid { display: flex; gap: 40px; }
          .grid-item { flex: 1; }
          .qr-placeholder { width: 120px; height: 120px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; border: 1px dashed #ccc; margin: 20px auto; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
          .amount { font-size: 24px; color: #0ea5e9; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">myUNO</div>
          <div class="voucher-title">${isRu ? 'ВАУЧЕР БРОНИРОВАНИЯ' : 'BOOKING VOUCHER'}</div>
          <div class="order-number">#${order.order_number}</div>
        </div>
        
        <div class="section">
          <div class="section-title">${isRu ? 'Объект' : 'Property'}</div>
          <div class="section-value">${propertyTitle}</div>
          ${property?.address ? `<div style="color: #666; margin-top: 4px;">${property.address}</div>` : ''}
        </div>
        
        <div class="section">
          <div class="section-title">${isRu ? 'Гость' : 'Guest'}</div>
          <div class="section-value">${participants?.name || 'Guest'}</div>
          ${participants?.phone ? `<div style="color: #666;">${participants.phone}</div>` : ''}
        </div>
        
        <div class="grid">
          <div class="grid-item">
            <div class="section-title">${isRu ? 'Заезд' : 'Check-in'}</div>
            <div class="section-value">${checkIn}</div>
            <div style="color: #666;">14:00</div>
          </div>
          <div class="grid-item">
            <div class="section-title">${isRu ? 'Выезд' : 'Check-out'}</div>
            <div class="section-value">${checkOut}</div>
            <div style="color: #666;">11:00</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">${isRu ? 'Гостей' : 'Guests'}</div>
          <div class="section-value">${guests}</div>
        </div>
        
        <div class="section">
          <div class="section-title">${isRu ? 'Сумма' : 'Amount'}</div>
          <div class="amount">${order.currency} ${order.total_amount?.toLocaleString()}</div>
        </div>
        
        <div class="qr-placeholder">QR</div>
        
        <div class="footer">
          ${isRu ? 'Сгенерировано myUNO' : 'Generated by myUNO'} | uno.ae | support@uno.ae
        </div>
      </body>
      </html>
    `;

    // Convert HTML to base64 PDF (simplified - returns HTML for now)
    // In production, use a PDF library like pdf-lib or puppeteer
    const pdfBase64 = btoa(unescape(encodeURIComponent(voucherHtml)));

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdf: pdfBase64,
        contentType: 'text/html', // Change to application/pdf when using real PDF gen
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating voucher:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
