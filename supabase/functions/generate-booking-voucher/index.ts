// Deno.serve used (native edge runtime)
import { createClient } from "../_shared/supabase.ts";
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';

import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
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

    const { orderId, bookingId, language = 'en' } = await req.json();

    const entityId = orderId || bookingId;
    if (!entityId) {
      throw new Error('orderId or bookingId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const isRu = language === 'ru';
    let voucherData: any = null;
    let entityType = 'order';

    // Try fetching as order first
    if (orderId) {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (!orderError && order) {
        // Fetch participants
        const { data: participants } = await supabase
          .from('order_participants')
          .select('*')
          .eq('order_id', orderId)
          .eq('role', 'primary')
          .single();

        // Fetch items
        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);

        // Get property details if applicable
        let property = null;
        const propertyId = order.metadata?.property_id;
        if (propertyId) {
          const { data } = await supabase
            .from('owner_properties')
            .select('title_en, title_ru, address')
            .eq('id', propertyId)
            .single();
          property = data;
        }

        voucherData = {
          voucher_number: order.order_number,
          booking_type: order.order_type,
          title: property 
            ? (isRu ? property.title_ru : property.title_en) || 'Property'
            : items?.[0]?.item_name || order.order_type,
          subtitle: items?.map((i: any) => i.item_name).join(', '),
          date: order.start_at?.split('T')[0] || order.metadata?.check_in,
          time: order.start_at?.split('T')[1]?.slice(0, 5) || order.metadata?.time,
          location: property?.address || order.metadata?.location,
          guest_name: participants?.name,
          guests_count: order.metadata?.guests_count || 1,
          amount: order.total_amount,
          currency: order.currency,
          status: order.status === 'completed' ? 'used' : 
                  order.status === 'cancelled' ? 'cancelled' : 'active',
          order_id: orderId,
          created_at: order.created_at,
        };
      }
    }

    // Try fetching as property booking if no order found
    if (!voucherData && bookingId) {
      const { data: booking, error: bookingError } = await supabase
        .from('property_bookings')
        .select(`
          *,
          owner_properties(title_en, title_ru, address)
        `)
        .eq('id', bookingId)
        .single();

      if (!bookingError && booking) {
        entityType = 'property_booking';
        const property = booking.owner_properties;
        
        voucherData = {
          voucher_number: booking.booking_code || `BK-${bookingId.slice(0, 8).toUpperCase()}`,
          booking_type: 'property',
          title: isRu 
            ? (property?.title_ru || property?.title_en || 'Property') 
            : (property?.title_en || 'Property'),
          date: booking.check_in,
          time: '14:00',
          end_date: booking.check_out,
          end_time: '11:00',
          location: property?.address,
          guest_name: booking.guest_name,
          guests_count: booking.guests || 1,
          amount: booking.total_amount,
          currency: booking.currency || 'THB',
          status: booking.status === 'completed' ? 'used' : 
                  booking.status === 'cancelled' ? 'cancelled' : 'active',
          booking_id: bookingId,
          created_at: booking.created_at,
        };
      }
    }

    if (!voucherData) {
      throw new Error('Order or booking not found');
    }

    // Generate QR code data - contains verification URL
    const qrCodeData = JSON.stringify({
      type: entityType,
      id: entityId,
      number: voucherData.voucher_number,
      verify: `${supabaseUrl.replace('.supabase.co', '.uno.ae')}/verify/${voucherData.voucher_number}`,
    });

    // Create or update voucher record
    const { data: existingVoucher } = await supabase
      .from('booking_vouchers')
      .select('id')
      .eq(entityType === 'order' ? 'order_id' : 'booking_id', entityId)
      .single();

    if (!existingVoucher) {
      // Get user_id from order or booking
      let userId = null;
      if (orderId) {
        const { data } = await supabase.from('orders').select('customer_user_id').eq('id', orderId).single();
        userId = data?.customer_user_id;
      } else if (bookingId) {
        const { data } = await supabase.from('property_bookings').select('user_id').eq('id', bookingId).single();
        userId = data?.user_id;
      }

      if (userId) {
        await supabase.from('booking_vouchers').insert({
          order_id: orderId || null,
          booking_id: bookingId || null,
          booking_type: voucherData.booking_type,
          voucher_number: voucherData.voucher_number,
          qr_code_data: qrCodeData,
          user_id: userId,
          valid_from: voucherData.date || new Date().toISOString(),
          valid_until: voucherData.end_date || null,
          status: voucherData.status,
          metadata: {
            guest_name: voucherData.guest_name,
            guests_count: voucherData.guests_count,
            amount: voucherData.amount,
            currency: voucherData.currency,
          },
        });
      }
    }

    // Generate HTML voucher
    const voucherHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            padding: 24px; 
            max-width: 420px; 
            margin: 0 auto;
            background: #f8fafc;
          }
          .voucher { 
            background: white; 
            border-radius: 16px; 
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          }
          .header { 
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
            padding: 24px;
            color: white;
          }
          .logo { 
            font-size: 20px; 
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .voucher-type { 
            font-size: 11px; 
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.8;
            margin-top: 4px;
          }
          .voucher-number { 
            font-family: monospace;
            font-size: 13px;
            background: rgba(255,255,255,0.2);
            padding: 4px 10px;
            border-radius: 6px;
            display: inline-block;
            margin-top: 12px;
          }
          .content { padding: 24px; }
          .title { 
            font-size: 20px; 
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .subtitle { 
            font-size: 14px; 
            color: #64748b;
            margin-bottom: 20px;
          }
          .grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 16px;
            margin-bottom: 20px;
          }
          .field-label { 
            font-size: 11px; 
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .field-value { 
            font-size: 15px; 
            font-weight: 500;
            color: #1e293b;
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0;
            border-top: 1px solid #e2e8f0;
            margin-top: 8px;
          }
          .amount { 
            font-size: 24px; 
            color: #0ea5e9; 
            font-weight: 700;
          }
          .status {
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
          }
          .status-active { background: #dcfce7; color: #16a34a; }
          .status-used { background: #f1f5f9; color: #64748b; }
          .status-cancelled { background: #fee2e2; color: #dc2626; }
          .qr-section { 
            text-align: center;
            padding: 20px;
            border-top: 1px dashed #e2e8f0;
          }
          .qr-code { 
            width: 140px; 
            height: 140px; 
            margin: 0 auto 12px;
          }
          .qr-hint {
            font-size: 12px;
            color: #94a3b8;
          }
          .footer { 
            text-align: center; 
            padding: 16px;
            background: #f8fafc;
            font-size: 11px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="voucher">
          <div class="header">
            <div class="logo">myUNO</div>
            <div class="voucher-type">${isRu ? 'Ваучер' : 'Voucher'} • ${voucherData.booking_type}</div>
            <div class="voucher-number">#${voucherData.voucher_number}</div>
          </div>
          
          <div class="content">
            <div class="title">${voucherData.title}</div>
            ${voucherData.subtitle ? `<div class="subtitle">${voucherData.subtitle}</div>` : ''}
            
            <div class="grid">
              ${voucherData.date ? `
                <div>
                  <div class="field-label">${isRu ? 'Дата' : 'Date'}</div>
                  <div class="field-value">${voucherData.date}</div>
                </div>
              ` : ''}
              ${voucherData.time ? `
                <div>
                  <div class="field-label">${isRu ? 'Время' : 'Time'}</div>
                  <div class="field-value">${voucherData.time}</div>
                </div>
              ` : ''}
              ${voucherData.guest_name ? `
                <div>
                  <div class="field-label">${isRu ? 'Гость' : 'Guest'}</div>
                  <div class="field-value">${voucherData.guest_name}</div>
                </div>
              ` : ''}
              ${voucherData.guests_count > 1 ? `
                <div>
                  <div class="field-label">${isRu ? 'Гостей' : 'Guests'}</div>
                  <div class="field-value">${voucherData.guests_count}</div>
                </div>
              ` : ''}
            </div>

            ${voucherData.location ? `
              <div style="margin-bottom: 16px;">
                <div class="field-label">${isRu ? 'Адрес' : 'Location'}</div>
                <div class="field-value">${voucherData.location}</div>
              </div>
            ` : ''}
            
            <div class="amount-row">
              <div class="amount">${voucherData.currency} ${voucherData.amount?.toLocaleString()}</div>
              <div class="status status-${voucherData.status}">
                ${voucherData.status === 'active' ? (isRu ? 'Активен' : 'Active') :
                  voucherData.status === 'used' ? (isRu ? 'Использован' : 'Used') :
                  (isRu ? 'Отменён' : 'Cancelled')}
              </div>
            </div>
          </div>
          
          <div class="qr-section">
            <img 
              class="qr-code" 
              src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}" 
              alt="QR Code"
            />
            <div class="qr-hint">${isRu ? 'Покажите при регистрации' : 'Show at check-in'}</div>
          </div>
          
          <div class="footer">
            ${isRu ? 'Создано myUNO' : 'Generated by myUNO'} • uno.ae • support@uno.ae
          </div>
        </div>
      </body>
      </html>
    `;

    // Convert to base64
    const pdfBase64 = btoa(unescape(encodeURIComponent(voucherHtml)));

    return new Response(
      JSON.stringify({ 
        success: true, 
        voucher: voucherData,
        qr_code_data: qrCodeData,
        html: pdfBase64,
        content_type: 'text/html',
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
