// Voice transcription proxy → Lovable AI Gateway (openai/gpt-4o-mini-transcribe).
// Accepts multipart/form-data with `file` (audio blob) and optional `language`.
// Returns { text: string }.
import { getCorsHeaders } from "../_shared/cors.ts";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/audio/transcriptions";
const DEFAULT_MODEL = "openai/gpt-4o-mini-transcribe";
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const MIN_BYTES = 1024; // 1 KB — anything smaller is definitely empty/silent

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return new Response(
      JSON.stringify({ error: "Expected multipart/form-data" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: `Invalid form data: ${(e as Error).message}` }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File) && !(file instanceof Blob)) {
    return new Response(JSON.stringify({ error: "Missing 'file' field" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const size = (file as Blob).size;
  if (size < MIN_BYTES) {
    return new Response(
      JSON.stringify({ error: "Audio is empty or too short" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
  if (size > MAX_BYTES) {
    return new Response(
      JSON.stringify({ error: "Audio exceeds 20 MB limit" }),
      { status: 413, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  // Build upstream multipart request. Preserve filename so provider infers container.
  const upstream = new FormData();
  const filename =
    (file instanceof File && file.name) ||
    inferFilename((file as Blob).type || "audio/webm");
  upstream.append("file", file as Blob, filename);
  upstream.append("model", DEFAULT_MODEL);

  const language = form.get("language");
  if (typeof language === "string" && /^[a-z]{2}$/i.test(language)) {
    upstream.append("language", language.toLowerCase());
  }

  let gatewayRes: Response;
  try {
    gatewayRes = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: `Gateway unreachable: ${(e as Error).message}` }),
      { status: 502, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  const bodyText = await gatewayRes.text();

  if (!gatewayRes.ok) {
    let message = bodyText;
    try {
      const j = JSON.parse(bodyText);
      message = j?.error?.message ?? j?.error ?? bodyText;
    } catch { /* not json */ }

    if (gatewayRes.status === 402) {
      return new Response(
        JSON.stringify({
          error: "AI credits exhausted. Please top up in Settings → Plans.",
        }),
        { status: 402, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }
    if (gatewayRes.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limited — please try again shortly." }),
        { status: 429, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({ error: `Transcription failed: ${message}` }),
      {
        status: gatewayRes.status,
        headers: { ...cors, "Content-Type": "application/json" },
      },
    );
  }

  let text = "";
  try {
    const parsed = JSON.parse(bodyText);
    text = typeof parsed?.text === "string" ? parsed.text : "";
  } catch {
    text = bodyText;
  }

  return new Response(JSON.stringify({ text }), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});

function inferFilename(mime: string): string {
  const base = mime.split(";")[0].trim().toLowerCase();
  const ext = ({
    "audio/webm": "webm",
    "audio/mp4": "mp4",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/ogg": "ogg",
    "audio/aac": "aac",
    "audio/flac": "flac",
  } as Record<string, string>)[base] ?? "webm";
  return `recording.${ext}`;
}
