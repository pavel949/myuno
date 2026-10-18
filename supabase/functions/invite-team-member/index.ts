import { createServiceClient } from '../_shared/supabase.ts';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://myuno.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MODULES = ['properties', 'finance', 'crm', 'tasks', 'bookings', 'reports', 'staff'];

const ROLE_DEFAULT_PERMISSIONS: Record<string, { can_view: boolean; can_edit: boolean }> = {
  director: { can_view: true, can_edit: true },
  admin: { can_view: true, can_edit: true },
  manager: { can_view: true, can_edit: true },
  accountant: { can_view: true, can_edit: false },
  staff: { can_view: true, can_edit: false },
};

// Accountant only sees finance + reports
const ACCOUNTANT_MODULES = ['finance', 'reports'];

function generatePassword(length = 16): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';
  const all = upper + lower + digits + symbols;
  const crypto = globalThis.crypto;
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  // Ensure at least one of each type
  const result = [
    upper[array[0] % upper.length],
    lower[array[1] % lower.length],
    digits[array[2] % digits.length],
    symbols[array[3] % symbols.length],
  ];
  for (let i = 4; i < length; i++) {
    result.push(all[array[i] % all.length]);
  }
  // Shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = array[i] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.join('');
}

const EMAIL_ASCII_REGEX = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;

function normalizeEmail(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

async function findUserByEmail(supabase: ReturnType<typeof createServiceClient>, email: string) {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const users = data?.users || [];
    const user = users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (users.length < 1000) return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createServiceClient();

    // Verify caller
    const { createClient } = await import('../_shared/supabase.ts');
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: callerUser }, error: userError } = await anonClient.auth.getUser();
    if (userError || !callerUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const callerId = callerUser.id;

    const body = await req.json();
    const { company_id, full_name, email, phone, role, action } = body;
    const normalizedEmail = normalizeEmail(email);

    if (!company_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }

    // Check caller is director/admin
    const { data: callerMember } = await supabase
      .from('management_company_members')
      .select('role')
      .eq('user_id', callerId)
      .eq('company_id', company_id)
      .eq('is_active', true)
      .single();

    if (!callerMember || !['director', 'admin'].includes(callerMember.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403, headers: corsHeaders });
    }

    // Read-only rollout probe: authenticate and authorize before advertising support.
    // Never resolve/create an invited identity or mutate any state on this path.
    if (action === 'capabilities') {
      return new Response(JSON.stringify({ contract_version: 2 }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!company_id || !full_name || !normalizedEmail || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }

    if (!EMAIL_ASCII_REGEX.test(normalizedEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format. Please use a valid latin email like name@example.com' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof role !== 'string' || !Object.hasOwn(ROLE_DEFAULT_PERMISSIONS, role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), { status: 400, headers: corsHeaders });
    }

    // Resolve only Auth identity. Directory rows are independent employment records.
    const tempPassword = generatePassword(16);
    let resolvedUser = await findUserByEmail(supabase, normalizedEmail);
    let isNewUser = false;
    if (!resolvedUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name },
      });
      if (error) {
        // A concurrent invitation may have created the Auth identity.
        if (!['email_exists', 'user_already_exists'].includes(error.code || '')) throw error;
        resolvedUser = await findUserByEmail(supabase, normalizedEmail);
      } else {
        resolvedUser = data.user;
        isNewUser = true;
      }
    }
    if (!resolvedUser) throw new Error('Failed to resolve team member user id');
    const newUserId = resolvedUser.id;

    const readMember = async () => {
      const { data, error } = await supabase.from('management_company_members')
        .select('id, is_active').eq('company_id', company_id).eq('user_id', newUserId).maybeSingle();
      if (error) throw error;
      return data;
    };
    let member = await readMember();
    let createdMembership = false;
    if (!member) {
      const { data, error } = await supabase.from('management_company_members').insert({
        company_id, user_id: newUserId, role, is_active: true,
      }).select('id, is_active').single();
      if (error) {
        if (error.code !== '23505') throw error;
        member = await readMember();
      } else {
        member = data;
        createdMembership = true;
      }
    }
    if (!member) throw new Error('Failed to persist company membership');
    if (!member.is_active) {
      return new Response(JSON.stringify({ error: 'Existing company membership is inactive' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Repeated invitations must not reset roles, profiles, or custom permissions.
    if (!createdMembership) {
      return new Response(JSON.stringify({ user_id: newUserId, company_member_id: member.id,
        email_sent: false, created_new_user: isNewUser }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (isNewUser) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: newUserId, full_name, phone: phone || null,
      }, { onConflict: 'id' });
      if (profileError) throw profileError;
      const { error: roleError } = await supabase.from('user_roles').upsert({
        user_id: newUserId, role: 'staff',
      }, { onConflict: 'user_id,role' });
      if (roleError) throw roleError;
    }
    const defaultPerms = ROLE_DEFAULT_PERMISSIONS[role];
    const permModules = role === 'accountant' ? ACCOUNTANT_MODULES : MODULES;
    const permRows = permModules.map(module => ({
      company_id, user_id: newUserId, module,
      can_view: defaultPerms.can_view, can_edit: defaultPerms.can_edit, granted_by: callerId,
    }));
    const { error: permissionsError } = await supabase.from('team_member_permissions')
      .upsert(permRows, { onConflict: 'company_id,user_id,module', ignoreDuplicates: true });
    if (permissionsError) throw permissionsError;

    // Get company name for email
    const { data: company } = await supabase
      .from('management_companies')
      .select('name_en, name_ru')
      .eq('id', company_id)
      .single();

    const companyName = company?.name_en || company?.name_ru || 'myUNO';

    // Send welcome email via Resend
    let emailSent = false;
    try {
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

      const subject = isNewUser
        ? `Welcome to ${companyName} — Your Account`
        : `You were added to ${companyName}`;

      const bodyHtml = isNewUser
        ? `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  body { font-family: 'Space Grotesk', 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background: #f8f9fc; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
  .header { background: linear-gradient(135deg, #4A5899 0%, #6B7DC3 100%); color: white; padding: 32px 24px; text-align: center; }
  .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
  .content { padding: 32px 24px; }
  .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0; }
  .label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .value { font-size: 16px; color: #1f2937; margin-bottom: 16px; font-weight: 600; }
  .btn { display: inline-block; background: linear-gradient(135deg, #4A5899 0%, #6B7DC3 100%); color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; }
  .footer { background: #1f2937; color: #9ca3af; padding: 24px; text-align: center; font-size: 13px; }
  .warning { background: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 16px; margin: 16px 0; font-size: 14px; color: #92400e; }
</style></head>
<body><div class="container">
  <div class="header">
    <h1>👋 Welcome to ${companyName}</h1>
    <p style="margin:8px 0 0;opacity:0.9">Your team account has been created</p>
  </div>
  <div class="content">
    <p>Hi ${full_name},</p>
    <p>You've been added to <strong>${companyName}</strong> as <strong>${role}</strong>. Here are your login credentials:</p>
    <div class="card">
      <div class="label">Email (Login)</div>
      <div class="value">${normalizedEmail}</div>
      <div class="label">Temporary Password</div>
      <div class="value" style="font-family:monospace;letter-spacing:1px">${tempPassword}</div>
    </div>
    <div class="warning">⚠️ Please change your password after your first login for security.</div>
    <div style="text-align:center;margin-top:24px">
      <a href="https://myuno.app" class="btn">Log In to myUNO →</a>
    </div>
  </div>
  <div class="footer">
    <p style="margin:0">myUNO — Property Management Platform</p>
  </div>
</div></body></html>`
        : `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
<p>Hi ${full_name},</p>
<p>You were added to <strong>${companyName}</strong> as <strong>${role}</strong>.</p>
<p>Your account already exists, so you can log in using your current password.</p>
<p><a href="https://myuno.app">Log in to myUNO</a></p>
</body></html>`;

      const { error: emailError } = await resend.emails.send({
        from: 'myUNO <noreply@myuno.app>',
        to: [normalizedEmail],
        subject,
        html: bodyHtml,
      });
      if (emailError) throw emailError;
      emailSent = true;
    } catch (emailErr) {
      console.error('Failed to send welcome email:', emailErr);
      // Don't fail the whole operation if email fails
    }

    return new Response(JSON.stringify({ user_id: newUserId, company_member_id: member.id, email_sent: emailSent, created_new_user: isNewUser }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('invite-team-member error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
