/**
 * PEYLAA Nurture Drip — Edge Function
 *
 * Scheduled cron (daily at 10:00 UTC+7 = 03:00 UTC) that sends
 * the next message in a 7-step WhatsApp nurture sequence to leads
 * who haven't converted yet.
 *
 * Sequence (days after lead creation):
 *   Day 1  → Welcome + project overview (sent immediately by peylaa-lead-notify)
 *   Day 2  → Top 3 units matching their preference
 *   Day 4  → ROI calculator results + rental income data
 *   Day 6  → Payment plan breakdown + financing options
 *   Day 8  → Marriott Bonvoy benefits + lifestyle
 *   Day 11 → Social proof: recent sales + scarcity
 *   Day 14 → Final offer: private viewing invitation
 *
 * Deploy: supabase functions deploy peylaa-nurture
 * Schedule: via Supabase cron or external scheduler
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PEYLAA_URL = Deno.env.get("PEYLAA_SUPABASE_URL") ?? "https://bhmvnorkswapjkmbvykk.supabase.co";
const PEYLAA_SERVICE_KEY = Deno.env.get("PEYLAA_SUPABASE_SERVICE_KEY") ?? "";
const ULTRAMSG_INSTANCE = Deno.env.get("ULTRAMSG_INSTANCE") ?? "";
const ULTRAMSG_TOKEN = Deno.env.get("ULTRAMSG_TOKEN") ?? "";

interface NurtureMessage {
  day: number;
  step: number;
  template: (lead: any) => string;
}

const NURTURE_SEQUENCE: NurtureMessage[] = [
  {
    day: 2,
    step: 2,
    template: (lead) => {
      const br = lead.bedrooms_interest || 1;
      return `${lead.full_name.split(" ")[0]}, подобрал для вас ТОП-3 юнита в PEYLAA! 🏠

${br === 2 ? `*2BR Corner Unit (83м²)*
• Этаж 5, вид на сад и бассейн
• ฿9.2M (~$263K)
• Угловая планировка, 2 балкона

*2BR Middle Unit (83м²)*
• Этаж 3, вид на горы
• ฿8.5M (~$243K)
• Оптимальное соотношение цена/вид

*2BR Corner Unit (86м²)*
• Этаж 6, вид на море (частично)
• ฿10.1M (~$289K)
• Самая большая планировка` :
`*1BR Studio (45м²)*
• Этаж 4, вид на бассейн
• ฿7.1M (~$203K)
• Идеально для инвестиций

*1BR Premium (45м²)*
• Этаж 6, вид на горы
• ฿7.8M (~$223K)
• Высокий этаж, лучший вид

*1BR Corner (45м²)*
• Этаж 2, вид на сад
• ฿6.8M (~$194K)
• Лучшая цена в проекте`}

Хотите забронировать просмотр? Резервация от ฿100K.

_Актуальность цен уточняйте — юниты уходят быстро._`;
    },
  },
  {
    day: 4,
    step: 3,
    template: (lead) => `📊 *Расчёт доходности PEYLAA для вас*

Средние показатели branded residences в Bang Tao:

🔹 Средняя заполняемость: 75-80%
🔹 ADR (средний тариф): ฿4,500-6,000/ночь
🔹 Годовой доход (1BR): ฿900K-1.1M
🔹 Годовой доход (2BR): ฿1.4M-1.8M

*Пример: 1BR за ฿7.5M*
• Годовой доход: ~฿1M
• Расходы (PM + обслуживание): ~฿350K
• Чистая доходность: ~8.7% годовых
• Рост стоимости: +5-8% в год

За 5 лет: ~65-85% суммарной доходности 📈

Хотите точный расчёт под ваш бюджет?
👉 Калькулятор: https://myuno.app/peylaa#roi`,
  },
  {
    day: 6,
    step: 4,
    template: (lead) => `💰 *Условия покупки PEYLAA*

Рассрочка привязана к этапам строительства:

1️⃣ Резервация: ฿100-300K
2️⃣ Контракт (30 дней): 30%
3️⃣ Сваи: 10%
4️⃣ Каркас: 10%
5️⃣ Стены/полы: 10%
6️⃣ Ключи (Q4 2027): 40%

🏦 *Финансирование для иностранцев:*
Capital Link Credit Foncier
• До 50% от стоимости
• До 15 лет
• ~9% годовых
• Без платы за оформление

📌 Дополнительные расходы:
• Sinking Fund: ฿700/м² (единоразово)
• Обслуживание: ฿120/м²/мес
• Transfer Fee: 2% (50/50 с застройщиком)

Готовы обсудить условия подробнее?`,
  },
  {
    day: 8,
    step: 5,
    template: (lead) => `👑 *Привилегии владельца PEYLAA*

Как собственник резиденции Autograph Collection вы получаете:

🌟 *Marriott Bonvoy Gold Elite*
• Повышение категории номера (при наличии)
• Поздний выезд до 14:00
• Приветственный подарок
• +25% бонусных баллов
• Скидки в 30+ отелях сети на Пхукете

🏊 *Инфраструктура уровня 5-звёздочного отеля:*
• 3 бассейна (25м + детский + rooftop)
• Фитнес-центр и теннисный корт
• Сауна, ледяная ванна, SPA
• Ресторан полного дня
• Банкетный зал и лобби-лаунж
• Co-working и библиотека
• Консьерж-сервис 24/7

🏖 *Локация Bang Tao:*
1.5 км до пляжа | Boat Avenue 500м | Laguna 1 км

Это не просто инвестиция — это стиль жизни. Хотите посмотреть шоу-рум?`,
  },
  {
    day: 11,
    step: 6,
    template: (lead) => `📈 *PEYLAA — что происходит на рынке*

Несколько фактов:

✅ Branded residences на Пхукете: рост цен +12% за 2025
✅ Bang Tao — самая быстрорастущая зона острова
✅ PEYLAA: уже продано 170+ из 408 юнитов
✅ Следующий этап повышения цен — при завершении свайных работ

⚡ *Осталось ~230 юнитов.* Лучшие этажи и виды уходят первыми.

Застройщик фиксирует цену только при подписании контракта. Резервация (возвратная) — от ฿100K.

Хотите зафиксировать цену на интересующий юнит?`,
  },
  {
    day: 14,
    step: 7,
    template: (lead) => `🎯 *Персональное приглашение*

${lead.full_name.split(" ")[0]}, за 2 недели я подготовил для вас полный пакет информации о PEYLAA.

Предлагаю финальный шаг:

🏗 *Приватный просмотр площадки*
• Шоу-рум и макет проекта
• Обход стройплощадки
• Обсуждение конкретных юнитов
• Финальный расчёт с учётом ваших пожеланий

📅 Могу организовать на удобное вам время.
🚗 Трансфер из любой точки Пхукета включён.

Если вы не на острове — проведу виртуальный тур по Zoom/WhatsApp видеозвонку.

Напишите удобную дату и время 👇

_Павел Игнатьев | Ignatev Capital_
_Эксклюзивный консультант PEYLAA Phuket_`,
  },
];

async function sendWhatsApp(to: string, body: string): Promise<boolean> {
  if (!ULTRAMSG_INSTANCE || !ULTRAMSG_TOKEN) {
    console.log("[Nurture WA] Not configured. To:", to);
    return false;
  }

  try {
    const response = await fetch(
      `https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token: ULTRAMSG_TOKEN,
          to: to.startsWith("+") ? to : `+${to}`,
          body,
        }),
      }
    );
    return response.ok;
  } catch (err) {
    console.error("[Nurture WA] Error:", err);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (!PEYLAA_SERVICE_KEY) {
    return new Response(
      JSON.stringify({ error: "PEYLAA_SUPABASE_SERVICE_KEY not set" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const db = createClient(PEYLAA_URL, PEYLAA_SERVICE_KEY);

  try {
    // Get all active leads that need nurture messages
    const { data: leads, error } = await db
      .from("leads")
      .select("*")
      .in("status", ["new", "contacted", "nurturing"])
      .order("created_at", { ascending: true });

    if (error) throw error;
    if (!leads || leads.length === 0) {
      return new Response(
        JSON.stringify({ message: "No leads to nurture", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    let sent = 0;
    const results: Array<{ lead_id: string; step: number; success: boolean }> = [];

    for (const lead of leads) {
      const createdAt = new Date(lead.created_at);
      const daysSinceCreation = Math.floor(
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const currentStep = lead.nurture_step || 1; // step 1 = welcome (already sent)

      // Find the next message to send
      const nextMessage = NURTURE_SEQUENCE.find(
        (m) => m.step === currentStep + 1 && daysSinceCreation >= m.day
      );

      if (!nextMessage) continue;

      // Send the message
      const phone = lead.phone.replace(/[^0-9]/g, "");
      const body = nextMessage.template(lead);
      const success = await sendWhatsApp(phone, body);

      if (success) {
        // Update lead nurture step
        await db
          .from("leads")
          .update({
            nurture_step: nextMessage.step,
            status: "nurturing",
            last_nurture_at: now.toISOString(),
          })
          .eq("id", lead.id);

        sent++;
      }

      results.push({
        lead_id: lead.id,
        step: nextMessage.step,
        success,
      });
    }

    console.log(`[Nurture] Processed ${leads.length} leads, sent ${sent} messages`);

    return new Response(
      JSON.stringify({
        processed: leads.length,
        sent,
        results,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("[Nurture] Error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
