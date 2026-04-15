import { Resend } from 'npm:resend@2.0.0';
import { createServiceClient } from '../_shared/supabase.ts';
import { getAdminEmails, getAdminWhatsApp } from '../_shared/admin-config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://myuno.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface FastTrackBookingPayload {
  user_id: string;
  service_id: string;
  service_name: string;
  direction: 'arrival' | 'departure';
  flight_number: string;
  airline?: string;
  flight_date: string;
  flight_time: string;
  is_night_flight: boolean;
  contact_whatsapp?: string;
  contact_email?: string;
  preferred_language: string;
  special_notes?: string;
  base_price: number;
  night_surcharge: number;
  addons_total: number;
  total_price: number;
  currency: string;
  passengers: Array<{
    first_name: string;
    last_name: string;
    passport_number: string;
    nationality: string;
    date_of_birth: string;
    is_primary: boolean;
  }>;
  addon_ids: string[];
}

async function sendWhatsAppNotification(payload: FastTrackBookingPayload, bookingId: string): Promise<void> {
  try {
    const dirLabel = payload.direction === 'arrival' ? '✈️ Прилёт' : '🛫 Вылет';
    const passengerNames = payload.passengers.map(p => `${p.first_name} ${p.last_name}`).join(', ');

    const message = `✈️ *FAST TRACK BOOKING*

${dirLabel}
🎫 *Рейс:* ${payload.flight_number}${payload.airline ? ` (${payload.airline})` : ''}
📅 *Дата:* ${payload.flight_date} в ${payload.flight_time}
${payload.is_night_flight ? '🌙 *Ночной рейс*\n' : ''}
👥 *Пассажиры (${payload.passengers.length}):*
${passengerNames}

🏷️ *Услуга:* ${payload.service_name}
💰 *Итого:* ${payload.currency} ${payload.total_price.toLocaleString()}

📱 *WhatsApp:* ${payload.contact_whatsapp || '—'}
📧 *Email:* ${payload.contact_email || '—'}
🌐 *Язык:* ${payload.preferred_language}
${payload.special_notes ? `\n📝 *Заметки:* ${payload.special_notes}` : ''}

🔗 ID: ${bookingId}`;

    console.log('[WhatsApp] Fast Track notification for:', ADMIN_WHATSAPP);
    console.log('[WhatsApp] Message:', message);

    // Try UltraMsg if configured
    const ultraMsgInstance = Deno.env.get('ULTRAMSG_INSTANCE');
    const ultraMsgToken = Deno.env.get('ULTRAMSG_TOKEN');

    if (ultraMsgInstance && ultraMsgToken) {
      const response = await fetch(`https://api.ultramsg.com/${ultraMsgInstance}/messages/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: ultraMsgToken,
          to: `+${ADMIN_WHATSAPP}`,
          body: message,
        }),
      });
      const result = await response.json();
      console.log('[WhatsApp] UltraMsg response:', result);
    } else {
      console.log('[WhatsApp] No API configured, logged message only');
    }
  } catch (error) {
    console.error('[WhatsApp] Error:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ADMIN_EMAIL = (await getAdminEmails())[0];
  const ADMIN_WHATSAPP = await getAdminWhatsApp();

  try {
    const supabase = createServiceClient();
    const payload: FastTrackBookingPayload = await req.json();

    console.log('[FastTrack] Creating booking for flight:', payload.flight_number);

    // 1. Insert airport_bookings
    const { data: booking, error: bookingError } = await supabase
      .from('airport_bookings')
      .insert({
        user_id: payload.user_id,
        service_id: payload.service_id,
        direction: payload.direction,
        flight_number: payload.flight_number,
        airline: payload.airline || null,
        flight_date: payload.flight_date,
        flight_time: payload.flight_time,
        is_night_flight: payload.is_night_flight,
        contact_whatsapp: payload.contact_whatsapp || null,
        contact_email: payload.contact_email || null,
        preferred_language: payload.preferred_language,
        special_notes: payload.special_notes || null,
        base_price: payload.base_price,
        night_surcharge: payload.night_surcharge,
        addons_total: payload.addons_total,
        total_price: payload.total_price,
        currency: payload.currency,
        airport_code: 'HKT',
        status: 'pending',
      })
      .select('id')
      .single();

    if (bookingError) {
      console.error('[FastTrack] Booking insert error:', bookingError);
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    const bookingId = booking.id;
    console.log('[FastTrack] Booking created:', bookingId);

    // 2. Insert passengers
    const passengersToInsert = payload.passengers.map((p, i) => ({
      booking_id: bookingId,
      first_name: p.first_name,
      last_name: p.last_name,
      passport_number: p.passport_number,
      nationality: p.nationality,
      date_of_birth: p.date_of_birth,
      is_primary: i === 0,
      sort_order: i,
    }));

    const { error: passError } = await supabase
      .from('airport_passengers')
      .insert(passengersToInsert);

    if (passError) {
      console.error('[FastTrack] Passengers insert error:', passError);
      // Don't throw - booking is already created
    }

    // 3. Insert addon associations
    if (payload.addon_ids.length > 0) {
      const addonsToInsert = payload.addon_ids.map(addonId => ({
        booking_id: bookingId,
        addon_service_id: addonId,
        unit_price: 0, // Will be looked up
        total_price: 0,
      }));

      const { error: addonError } = await supabase
        .from('airport_booking_addons')
        .insert(addonsToInsert);

      if (addonError) {
        console.error('[FastTrack] Addons insert error:', addonError);
      }
    }

    // 4. Send WhatsApp (non-blocking)
    sendWhatsAppNotification(payload, bookingId).catch(err =>
      console.error('[WhatsApp] Failed:', err)
    );

    // 5. Send email notification
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        const dirLabel = payload.direction === 'arrival' ? '✈️ Arrival' : '🛫 Departure';
        const passengerRows = payload.passengers.map(p =>
          `<tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">${p.first_name} ${p.last_name}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${p.passport_number}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${p.nationality}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${p.date_of_birth}</td>
          </tr>`
        ).join('');

        const emailHtml = `
          <!DOCTYPE html><html><head><style>
            body{font-family:Arial,sans-serif;color:#333;line-height:1.6}
            .c{max-width:600px;margin:0 auto;padding:20px}
            .h{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;padding:20px;border-radius:10px 10px 0 0}
            .b{background:#f9fafb;padding:20px;border:1px solid #e5e7eb}
            .d{background:#fff;padding:15px;border-radius:8px;margin:12px 0}
            .l{font-weight:bold;color:#6b7280;font-size:12px;text-transform:uppercase}
            .t{font-size:24px;font-weight:bold;color:#059669}
            table{width:100%;border-collapse:collapse;margin-top:8px}
            th{background:#f3f4f6;padding:8px;border:1px solid #e5e7eb;text-align:left;font-size:13px}
          </style></head><body>
          <div class="c">
            <div class="h">
              <h1 style="margin:0">✈️ Fast Track Booking</h1>
              <p style="margin:4px 0 0;opacity:.9">${dirLabel} · ${payload.flight_number}</p>
            </div>
            <div class="b">
              <div class="d">
                <div class="l">Flight</div>
                <div style="font-size:18px;font-weight:bold">${payload.flight_number}${payload.airline ? ` — ${payload.airline}` : ''}</div>
                <div>📅 ${payload.flight_date} at ${payload.flight_time}${payload.is_night_flight ? ' 🌙 Night' : ''}</div>
              </div>
              <div class="d">
                <div class="l">Service</div>
                <div style="font-size:16px;font-weight:600">${payload.service_name}</div>
                <div class="t">${payload.currency} ${payload.total_price.toLocaleString()}</div>
              </div>
              <div class="d">
                <div class="l">Passengers (${payload.passengers.length})</div>
                <table>
                  <tr><th>Name</th><th>Passport</th><th>Nationality</th><th>DOB</th></tr>
                  ${passengerRows}
                </table>
              </div>
              <div class="d">
                <div class="l">Contact</div>
                <div>📱 ${payload.contact_whatsapp || '—'} · 📧 ${payload.contact_email || '—'}</div>
                <div>🌐 Language: ${payload.preferred_language}</div>
                ${payload.special_notes ? `<div>📝 ${payload.special_notes}</div>` : ''}
              </div>
              <div class="d">
                <div class="l">Booking ID</div>
                <div style="font-family:monospace">${bookingId}</div>
              </div>
            </div>
          </div>
          </body></html>`;

        await resend.emails.send({
          from: 'myUNO Fast Track <noreply@resend.dev>',
          to: [ADMIN_EMAIL],
          subject: `✈️ Fast Track ${dirLabel} — ${payload.flight_number} · ${payload.flight_date}`,
          html: emailHtml,
        });

        console.log('[Email] Sent to', ADMIN_EMAIL);
      } catch (emailErr) {
        console.error('[Email] Error:', emailErr);
      }
    } else {
      console.log('[Email] RESEND_API_KEY not configured');
    }

    return new Response(
      JSON.stringify({ success: true, booking_id: bookingId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[FastTrack] Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
