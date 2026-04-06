import { Resend } from 'npm:resend@2.0.0';
import { getAdminEmails } from '../_shared/admin-config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SignupNotificationPayload {
  user_email: string;
  user_name?: string;
  user_phone?: string;
  referral_code?: string;
  signup_source?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendKey);
    const payload: SignupNotificationPayload = await req.json();

    console.log('[NOTIFY-SIGNUP] New user registration:', payload.user_email);

    const signupTime = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Bangkok',
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { background: #374151; color: white; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; }
          .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; }
          .value { font-size: 16px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🎉 New User Registration!</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">A new user just signed up on myUNO</p>
          </div>
          
          <div class="content">
            <div class="details">
              <div class="label">Email</div>
              <div class="value">📧 ${payload.user_email}</div>
              
              ${payload.user_name ? `
              <div class="label">Name</div>
              <div class="value">👤 ${payload.user_name}</div>
              ` : ''}
              
              ${payload.user_phone ? `
              <div class="label">Phone</div>
              <div class="value">📱 ${payload.user_phone}</div>
              ` : ''}

              ${payload.referral_code ? `
              <div class="label">Referral Code</div>
              <div class="value">🎁 ${payload.referral_code}</div>
              ` : ''}
              
              <div class="label">Registration Time (Bangkok)</div>
              <div class="value">🕐 ${signupTime}</div>

              ${payload.signup_source ? `
              <div class="label">Source</div>
              <div class="value">📍 ${payload.signup_source}</div>
              ` : ''}
            </div>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">myUNO Platform</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.7;">Automated registration notification</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const adminEmails = await getAdminEmails();
    const emailResponse = await resend.emails.send({
      from: 'myUNO <orders@resend.dev>',
      to: adminEmails,
      subject: `🎉 New User: ${payload.user_name || payload.user_email}`,
      html: emailHtml,
    });

    console.log('[NOTIFY-SIGNUP] Email sent:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, email_id: emailResponse.data?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[NOTIFY-SIGNUP] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
