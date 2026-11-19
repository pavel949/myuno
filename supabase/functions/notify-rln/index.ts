/** Operator-only notification for an existing manual registration. No developer or lead contact is accepted. */
import { requireAuth } from "../_shared/auth-guard.ts";
import { createActorClient } from "../_shared/operating-space-auth.ts";
import { makeInternalRlnHandler } from "./handler.ts";

const pending = "internal_notice_pending";
const authCors = { "Access-Control-Allow-Origin": "*" };

Deno.serve(makeInternalRlnHandler({
  async authorize(req) {
    const auth = await requireAuth(req, authCors);
    if (auth instanceof Response) return false;
    const { data, error } = await createActorClient(req).rpc("devmod_is_broker_or_admin");
    return !error && data === true;
  },
  async getPending(req, id) {
    const { data, error } = await createActorClient(req).from("rln_events")
      .select("id,rln_number").eq("id", id).is("developer_id", null).eq("delivery_status", pending).maybeSingle();
    return error || !data ? null : { id: data.id, number: data.rln_number };
  },
  configuredInbox: () => Deno.env.get("BROKER_EMAIL") ?? "",
  async send(to, number) {
    const key = Deno.env.get("RESEND_API_KEY");
    if (!key) return false;
    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(8_000),
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `myuno-internal-rln/${number}`,
      },
      body: JSON.stringify({
        from: "myUNO Broker <notifications@myuno.app>",
        to: [to],
        subject: `myUNO: внутренняя регистрация ${number}`,
        text: `Внутренняя регистрация ${number}. Подробности доступны команде в кабинете myUNO.`,
      }),
    });
    if (!result.ok) return false;
    const value = await result.json().catch(() => null);
    return typeof value?.id === "string" && value.id.length > 0;
  },
  async recordAcceptance(req, id, to) {
    // Use normal actor RLS, with no service-role client or private data fetch.
    const { data, error } = await createActorClient(req).from("rln_events")
      .update({ sent_to_email: to, sent_at: new Date().toISOString(), delivery_status: "internal_notice_accepted" })
      .eq("id", id).is("developer_id", null).eq("delivery_status", pending).select("id").maybeSingle();
    return !error && data?.id === id;
  },
}));
