const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Entry = { id: string; number: string };
type Ports = {
  authorize: (req: Request) => Promise<boolean>;
  getPending: (req: Request, id: string) => Promise<Entry | null>;
  configuredInbox: () => string;
  send: (to: string, number: string) => Promise<boolean>;
  recordAcceptance: (req: Request, id: string, to: string) => Promise<boolean>;
};

const respond = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), {
  status, headers: { ...headers, "Content-Type": "application/json" },
});

export function makeInternalRlnHandler(ports: Ports) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (req.method !== "POST") return respond(405, { error: "Method not allowed" });

    try {
      // The old public/cached payload is never translated into a dispatch.
      const input: unknown = await req.json();
      if (!input || typeof input !== "object" || Array.isArray(input) ||
          Object.keys(input).length !== 1 || !("event_id" in input) ||
          typeof input.event_id !== "string" ||
          !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(input.event_id)) {
        return respond(400, { error: "Only a registered event reference is accepted" });
      }
      if (!await ports.authorize(req)) return respond(403, { error: "Forbidden" });
      const event = await ports.getPending(req, input.event_id);
      if (!event || event.id !== input.event_id || !/^RLN-\d{4}-\d{5,}$/.test(event.number)) {
        return respond(404, { error: "Pending registration unavailable" });
      }
      const to = ports.configuredInbox().trim();
      if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(to)) {
        return respond(503, { error: "Internal inbox unavailable" });
      }
      if (!await ports.send(to, event.number)) return respond(502, { error: "Notice not confirmed" });
      const recorded = await ports.recordAcceptance(req, event.id, to).catch(() => false);
      // The provider accepting a notice is not proof of inbox delivery.
      return respond(200, { accepted: true, recorded });
    } catch (error) {
      if (error instanceof SyntaxError) return respond(400, { error: "Invalid JSON" });
      return respond(503, { error: "Internal notice unavailable" });
    }
  };
}
