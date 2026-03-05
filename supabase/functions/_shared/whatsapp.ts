/**
 * Shared WhatsApp sender via UltraMSG API
 * Used by multiple edge functions for consistent WhatsApp messaging.
 */

export interface WhatsAppMessage {
  to: string;       // Phone number with country code, no + prefix
  body: string;     // Message text (supports WhatsApp markdown)
}

/**
 * Send a WhatsApp message via UltraMSG.
 * Returns true if sent successfully, false if credentials missing or error.
 */
export async function sendWhatsApp(msg: WhatsAppMessage): Promise<boolean> {
  const instance = Deno.env.get("ULTRAMSG_INSTANCE");
  const token = Deno.env.get("ULTRAMSG_TOKEN");

  if (!instance || !token) {
    console.log("[WhatsApp] UltraMSG not configured. Message:", msg.body);
    return false;
  }

  try {
    const response = await fetch(
      `https://api.ultramsg.com/${instance}/messages/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token,
          to: msg.to.startsWith("+") ? msg.to : `+${msg.to}`,
          body: msg.body,
        }),
      }
    );
    const result = await response.json();
    console.log("[WhatsApp] UltraMSG response:", result);
    return response.ok;
  } catch (err) {
    console.error("[WhatsApp] Send error:", err);
    return false;
  }
}
