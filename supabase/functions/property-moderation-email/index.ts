// Deno.serve used (native edge runtime)
import { Resend } from 'npm:resend@2.0.0';
import { createClient } from '../_shared/supabase.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PropertyModerationRequest {
  propertyId: string;
  action: 'approved' | 'rejected';
  rejectionReason?: string;
}

const baseStyles = `
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 16px; }
    .content { padding: 32px 24px; }
    .property-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .property-image { width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 16px; }
    .property-title { font-size: 20px; font-weight: 700; color: #1f2937; margin: 0 0 8px 0; }
    .property-address { font-size: 14px; color: #6b7280; margin: 0; }
    .button { display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 16px 0; }
    .button-primary { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white !important; }
    .button-secondary { background: #f3f4f6; color: #374151 !important; border: 1px solid #d1d5db; }
    .footer { background: #1f2937; color: #9ca3af; padding: 24px; text-align: center; font-size: 14px; }
    .footer a { color: #a78bfa; }
    .success-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
    .warning-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
    .rejected-badge { display: inline-block; background: #fee2e2; color: #991b1b; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
    .info-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .warning-box { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .steps { margin: 24px 0; }
    .step { display: flex; align-items: flex-start; margin: 12px 0; }
    .step-number { background: #6366f1; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; margin-right: 12px; flex-shrink: 0; }
    .step-content { flex: 1; }
    .step-title { font-weight: 600; color: #1f2937; margin: 0; }
    .step-desc { font-size: 14px; color: #6b7280; margin: 4px 0 0 0; }
  </style>
`;

function generateApprovalEmail(property: any, ownerName: string, language: 'en' | 'ru' = 'ru') {
  const isRu = language === 'ru';
  const setupUrl = `https://uno.ae/owner/properties/${property.id}/setup`;
  
  const texts = {
    en: {
      subject: `🎉 Your property is approved! - ${property.title || property.title_en}`,
      greeting: `Congratulations, ${ownerName}!`,
      approved: 'Your property has been approved',
      publishedNote: 'Your property is now live on myUNO marketplace',
      protectionTitle: '48-Hour Protection Period',
      protectionText: 'For the first 48 hours, all bookings require your manual confirmation — even if Instant Booking is enabled. This gives you time to set up your calendar and prices.',
      nextSteps: 'Complete your setup',
      step1Title: 'Set your prices',
      step1Desc: 'Configure base price, discounts, and seasonal rates',
      step2Title: 'Block unavailable dates',
      step2Desc: 'Mark dates when your property is not available',
      step3Title: 'Review booking rules',
      step3Desc: 'Set check-in/out times, minimum stay, and policies',
      setupButton: 'Complete Setup →',
      viewProperty: 'View Property',
      footer: 'myUNO — Your Phuket Concierge',
    },
    ru: {
      subject: `🎉 Ваш объект одобрен! - ${property.title_ru || property.title}`,
      greeting: `Поздравляем, ${ownerName}!`,
      approved: 'Ваш объект одобрен',
      publishedNote: 'Ваш объект опубликован на платформе myUNO',
      protectionTitle: '48-часовой защитный период',
      protectionText: 'Первые 48 часов все бронирования требуют вашего подтверждения — даже если включено мгновенное бронирование. Это даёт вам время настроить календарь и цены.',
      nextSteps: 'Завершите настройку',
      step1Title: 'Установите цены',
      step1Desc: 'Настройте базовую цену, скидки и сезонные тарифы',
      step2Title: 'Заблокируйте недоступные даты',
      step2Desc: 'Отметьте даты, когда объект недоступен',
      step3Title: 'Проверьте правила бронирования',
      step3Desc: 'Настройте время заезда/выезда, минимальный срок и политики',
      setupButton: 'Завершить настройку →',
      viewProperty: 'Посмотреть объект',
      footer: 'myUNO — Ваш консьерж на Пхукете',
    },
  };
  
  const t = texts[language];
  const propertyTitle = isRu ? (property.title_ru || property.title) : (property.title || property.title_en);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white;">
          <h1>✓ ${t.approved}</h1>
          <p>${t.publishedNote}</p>
        </div>
        
        <div class="content">
          <p style="font-size: 18px;">${t.greeting}</p>
          
          <div class="property-card">
            ${property.cover_image ? `<img src="${property.cover_image}" alt="${propertyTitle}" class="property-image" />` : ''}
            <span class="success-badge">✓ ${isRu ? 'Опубликован' : 'Published'}</span>
            <h3 class="property-title" style="margin-top: 12px;">${propertyTitle}</h3>
            ${property.address ? `<p class="property-address">📍 ${property.address}</p>` : ''}
          </div>
          
          <div class="warning-box">
            <strong>⏱️ ${t.protectionTitle}</strong>
            <p style="margin: 8px 0 0 0; font-size: 14px;">${t.protectionText}</p>
          </div>
          
          <h3 style="margin-top: 32px;">${t.nextSteps}</h3>
          
          <div class="steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <p class="step-title">💰 ${t.step1Title}</p>
                <p class="step-desc">${t.step1Desc}</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <p class="step-title">📅 ${t.step2Title}</p>
                <p class="step-desc">${t.step2Desc}</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <p class="step-title">📋 ${t.step3Title}</p>
                <p class="step-desc">${t.step3Desc}</p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 24px;">
            <a href="${setupUrl}" class="button button-primary">${t.setupButton}</a>
          </div>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">${t.footer}</p>
          <p style="margin: 8px 0 0 0; font-size: 12px;">
            <a href="https://uno.ae">uno.ae</a> • 
            <a href="mailto:support@uno.ae">support@uno.ae</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject: t.subject, html };
}

function generateRejectionEmail(property: any, ownerName: string, reason: string, language: 'en' | 'ru' = 'ru') {
  const isRu = language === 'ru';
  const editUrl = `https://uno.ae/owner/properties/${property.id}`;
  
  const texts = {
    en: {
      subject: `Action required: ${property.title || property.title_en}`,
      greeting: `Hi ${ownerName},`,
      rejected: 'Your property needs revision',
      reviewNote: 'Our team has reviewed your listing and found some issues that need to be addressed before we can publish it.',
      reason: 'Reason',
      whatToDo: 'What to do next',
      step1: 'Review the feedback above',
      step2: 'Make the necessary changes to your listing',
      step3: 'Save changes — we\'ll automatically review again',
      editButton: 'Edit Property →',
      helpText: 'Need help? Contact our support team',
      footer: 'myUNO — Your Phuket Concierge',
    },
    ru: {
      subject: `Требуется доработка: ${property.title_ru || property.title}`,
      greeting: `Привет, ${ownerName}!`,
      rejected: 'Ваш объект требует доработки',
      reviewNote: 'Наша команда проверила ваше объявление и обнаружила некоторые моменты, которые необходимо исправить перед публикацией.',
      reason: 'Причина',
      whatToDo: 'Что делать дальше',
      step1: 'Изучите комментарий выше',
      step2: 'Внесите необходимые изменения в объявление',
      step3: 'Сохраните изменения — мы автоматически проверим снова',
      editButton: 'Редактировать объект →',
      helpText: 'Нужна помощь? Свяжитесь с нашей поддержкой',
      footer: 'myUNO — Ваш консьерж на Пхукете',
    },
  };
  
  const t = texts[language];
  const propertyTitle = isRu ? (property.title_ru || property.title) : (property.title || property.title_en);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
          <h1>📝 ${t.rejected}</h1>
        </div>
        
        <div class="content">
          <p style="font-size: 18px;">${t.greeting}</p>
          
          <p style="color: #6b7280;">${t.reviewNote}</p>
          
          <div class="property-card">
            ${property.cover_image ? `<img src="${property.cover_image}" alt="${propertyTitle}" class="property-image" />` : ''}
            <span class="warning-badge">⚠️ ${isRu ? 'Требует доработки' : 'Needs Revision'}</span>
            <h3 class="property-title" style="margin-top: 12px;">${propertyTitle}</h3>
            ${property.address ? `<p class="property-address">📍 ${property.address}</p>` : ''}
          </div>
          
          <div class="info-box" style="background: #fef2f2; border-color: #fecaca;">
            <strong style="color: #991b1b;">💬 ${t.reason}:</strong>
            <p style="margin: 8px 0 0 0; color: #7f1d1d;">${reason || (isRu ? 'Не указана' : 'Not specified')}</p>
          </div>
          
          <h3 style="margin-top: 32px;">${t.whatToDo}</h3>
          
          <div class="steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <p class="step-title">${t.step1}</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <p class="step-title">${t.step2}</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <p class="step-title">${t.step3}</p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 24px;">
            <a href="${editUrl}" class="button button-primary">${t.editButton}</a>
          </div>
          
          <p style="color: #6b7280; text-align: center; margin-top: 24px; font-size: 14px;">
            ${t.helpText}: <a href="mailto:support@uno.ae" style="color: #6366f1;">support@uno.ae</a>
          </p>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">${t.footer}</p>
          <p style="margin: 8px 0 0 0; font-size: 12px;">
            <a href="https://uno.ae">uno.ae</a> • 
            <a href="mailto:support@uno.ae">support@uno.ae</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject: t.subject, html };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyId, action, rejectionReason }: PropertyModerationRequest = await req.json();

    if (!propertyId || !action) {
      throw new Error("Missing propertyId or action");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get property details
    const { data: property, error: propertyError } = await supabase
      .from("owner_properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (propertyError || !property) {
      throw new Error(`Property not found: ${propertyError?.message}`);
    }

    // Get owner profile
    const { data: owner, error: ownerError } = await supabase
      .from("profiles")
      .select("full_name, email, preferred_language")
      .eq("id", property.owner_id)
      .single();

    if (ownerError || !owner?.email) {
      throw new Error(`Owner not found or no email: ${ownerError?.message}`);
    }

    const language = (owner.preferred_language === 'en' ? 'en' : 'ru') as 'en' | 'ru';
    const ownerName = owner.full_name || (language === 'ru' ? 'Владелец' : 'Owner');

    let emailContent;
    if (action === 'approved') {
      emailContent = generateApprovalEmail(property, ownerName, language);
    } else {
      emailContent = generateRejectionEmail(property, ownerName, rejectionReason || '', language);
    }

    // Send email
    const emailResponse = await resend.emails.send({
      from: "myUNO <notifications@uno.ae>",
      to: [owner.email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Property moderation email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: (emailResponse as any).id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in property-moderation-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

Deno.serve(handler);
