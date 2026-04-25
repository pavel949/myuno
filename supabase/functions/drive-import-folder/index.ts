/**
 * drive-import-folder
 * Импортирует файлы из Google Drive папки в project-documents bucket,
 * классифицирует через Lovable AI (Gemini), извлекает метаданные проекта и объекты
 * из брошюр/прайслистов (multimodal vision) — все данные складывает в drive_import_jobs
 * для ревью пользователем.
 *
 * Поддерживаемые режимы доступа:
 *   - public:    через GOOGLE_DRIVE_API_KEY (Anyone with link)
 *   - connector: через Google Drive OAuth connector gateway
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3';
const GATEWAY_DRIVE_API = 'https://connector-gateway.lovable.dev/google_drive/drive/v3';
const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

const CLEARVIEW_CATEGORIES = [
  'land_title', 'permits', 'corporate', 'financial',
  'construction', 'floor_plans', 'contracts', 'marketing', 'other',
] as const;

function extractFolderId(url: string): string | null {
  if (!url) return null;
  if (!url.includes('/')) return url.trim();
  const m = url.match(/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

interface DriveAuth {
  mode: 'public' | 'connector';
  apiKey?: string;          // public mode: Drive API key
  lovableKey?: string;      // connector mode: Lovable gateway key
  connectorKey?: string;    // connector mode: GOOGLE_DRIVE_API_KEY (gateway connection key)
}

async function listDriveFiles(folderId: string, auth: DriveAuth): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink)',
      pageSize: '1000',
    });
    if (pageToken) params.set('pageToken', pageToken);

    let response: Response;
    if (auth.mode === 'public') {
      params.set('key', auth.apiKey!);
      response = await fetch(`${GOOGLE_DRIVE_API}/files?${params}`);
    } else {
      response = await fetch(`${GATEWAY_DRIVE_API}/files?${params}`, {
        headers: {
          'Authorization': `Bearer ${auth.lovableKey}`,
          'X-Connection-Api-Key': auth.connectorKey!,
        },
      });
    }
    if (!response.ok) {
      throw new Error(`Drive list failed [${response.status}]: ${await response.text()}`);
    }
    const data = await response.json();
    files.push(...(data.files || []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return files;
}

async function downloadDriveFile(fileId: string, auth: DriveAuth): Promise<ArrayBuffer> {
  let response: Response;
  if (auth.mode === 'public') {
    response = await fetch(`${GOOGLE_DRIVE_API}/files/${fileId}?alt=media&key=${auth.apiKey}`);
  } else {
    response = await fetch(`${GATEWAY_DRIVE_API}/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${auth.lovableKey}`,
        'X-Connection-Api-Key': auth.connectorKey!,
      },
    });
  }
  if (!response.ok) throw new Error(`Drive download failed [${response.status}]`);
  return await response.arrayBuffer();
}

async function classifyFile(
  name: string,
  mimeType: string,
  lovableKey: string,
): Promise<{ category: string; title: string; description: string }> {
  const prompt = `Классифицируй файл недвижимостного проекта по ClearView-категориям.
Файл: "${name}" (${mimeType})

Категории:
- land_title: документы на землю (chanote, NS3, lease)
- permits: разрешения (EIA, EHIA, building/construction permit)
- corporate: корпоративные документы застройщика
- financial: финансовые отчёты, аудиты, эскроу
- construction: фото/видео прогресса, отчёты подрядчика
- floor_plans: планировки, master plan, типовые этажи
- contracts: SPA, reservation agreement, шаблоны договоров
- marketing: брошюры, рендеры, презентации, прайслисты
- other: всё остальное

Верни JSON: { "category": "...", "title": "короткое имя", "description": "1 предложение" }`;

  const r = await fetch(LOVABLE_AI_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-lite',
      messages: [{ role: 'user', content: prompt }],
      tools: [{
        type: 'function',
        function: {
          name: 'classify',
          parameters: {
            type: 'object',
            properties: {
              category: { type: 'string', enum: [...CLEARVIEW_CATEGORIES] },
              title: { type: 'string' },
              description: { type: 'string' },
            },
            required: ['category', 'title', 'description'],
          },
        },
      }],
      tool_choice: { type: 'function', function: { name: 'classify' } },
    }),
  });
  if (!r.ok) return { category: 'other', title: name, description: '' };
  const data = await r.json();
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  try { return JSON.parse(args); } catch { return { category: 'other', title: name, description: '' }; }
}

async function bufferToBase64DataUrl(buf: ArrayBuffer, mimeType: string): Promise<string> {
  const bytes = new Uint8Array(buf);
  // Chunked base64 encoding to avoid stack overflow on large files
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

/**
 * Извлекает поля проекта из брошюры (PDF/изображение) через Gemini vision.
 */
async function extractProjectMetaFromFile(
  buf: ArrayBuffer,
  mimeType: string,
  lovableKey: string,
): Promise<Record<string, any> | null> {
  // Gemini поддерживает PDF/PNG/JPEG/WEBP напрямую
  if (!/^(application\/pdf|image\/(png|jpeg|jpg|webp))$/i.test(mimeType)) return null;
  if (buf.byteLength > 15_000_000) return null; // skip огромные файлы

  const dataUrl = await bufferToBase64DataUrl(buf, mimeType);

  const r = await fetch(LOVABLE_AI_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Извлеки поля проекта недвижимости из этой брошюры/документа. Если поле не найдено — оставь null. Возвращай только JSON.' },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      }],
      tools: [{
        type: 'function',
        function: {
          name: 'extract_project',
          parameters: {
            type: 'object',
            properties: {
              name_en: { type: ['string', 'null'] },
              tagline: { type: ['string', 'null'] },
              description_en: { type: ['string', 'null'] },
              developer_name: { type: ['string', 'null'] },
              district: { type: ['string', 'null'] },
              address: { type: ['string', 'null'] },
              completion_date: { type: ['string', 'null'], description: 'YYYY-MM-DD or null' },
              total_units: { type: ['integer', 'null'] },
              price_from: { type: ['number', 'null'] },
              price_to: { type: ['number', 'null'] },
              project_status: { type: ['string', 'null'], enum: ['offplan', 'under_construction', 'ready', null] },
              amenities: { type: 'array', items: { type: 'string' } },
              unit_types: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      }],
      tool_choice: { type: 'function', function: { name: 'extract_project' } },
    }),
  });
  if (!r.ok) return null;
  const data = await r.json();
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  try { return JSON.parse(args); } catch { return null; }
}

/**
 * Извлекает массив объектов из прайслиста (PDF/изображение/Excel-export).
 */
async function extractUnitsFromFile(
  buf: ArrayBuffer,
  mimeType: string,
  lovableKey: string,
): Promise<any[] | null> {
  if (!/^(application\/pdf|image\/(png|jpeg|jpg|webp))$/i.test(mimeType)) return null;
  if (buf.byteLength > 15_000_000) return null;

  const dataUrl = await bufferToBase64DataUrl(buf, mimeType);

  const r = await fetch(LOVABLE_AI_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Это прайслист квартир/вилл застройщика. Извлеки каждый объект с полями. Если файл не прайслист — верни пустой массив.' },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      }],
      tools: [{
        type: 'function',
        function: {
          name: 'extract_units',
          parameters: {
            type: 'object',
            properties: {
              units: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    unit_code: { type: ['string', 'null'] },
                    unit_type: { type: 'string', description: 'studio/1BR/2BR/villa/penthouse' },
                    bedrooms: { type: ['integer', 'null'] },
                    bathrooms: { type: ['integer', 'null'] },
                    area_sqm: { type: ['number', 'null'] },
                    floor: { type: ['integer', 'null'] },
                    price: { type: ['number', 'null'] },
                    currency: { type: 'string', enum: ['THB', 'USD', 'EUR', 'RUB'] },
                    view_type: { type: ['string', 'null'] },
                    status: { type: 'string', enum: ['available', 'reserved', 'sold', 'held'] },
                  },
                  required: ['unit_type'],
                },
              },
            },
            required: ['units'],
          },
        },
      }],
      tool_choice: { type: 'function', function: { name: 'extract_units' } },
    }),
  });
  if (!r.ok) return null;
  const data = await r.json();
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  try {
    const parsed = JSON.parse(args);
    return parsed.units || [];
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { sourceId, projectId, driveUrl, accessMode = 'public', triggerMode = 'manual' } = await req.json();

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_DRIVE_API_KEY = Deno.env.get('GOOGLE_DRIVE_API_KEY');

    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const folderId = extractFolderId(driveUrl);
    if (!folderId) throw new Error('Invalid Google Drive URL');

    // Подготовим auth
    const auth: DriveAuth = accessMode === 'connector'
      ? { mode: 'connector', lovableKey: LOVABLE_API_KEY, connectorKey: GOOGLE_DRIVE_API_KEY }
      : { mode: 'public', apiKey: GOOGLE_DRIVE_API_KEY };

    if (accessMode === 'public' && !GOOGLE_DRIVE_API_KEY) {
      throw new Error('GOOGLE_DRIVE_API_KEY не задан. Добавь его в секреты проекта.');
    }
    if (accessMode === 'connector' && !GOOGLE_DRIVE_API_KEY) {
      throw new Error('Google Drive connector не подключён.');
    }

    // Создаём source если ещё нет
    let actualSourceId = sourceId;
    if (!actualSourceId) {
      const { data: src, error } = await admin
        .from('project_drive_sources')
        .upsert({
          project_id: projectId,
          drive_url: driveUrl,
          folder_id: folderId,
          access_mode: accessMode,
        }, { onConflict: 'project_id,folder_id' })
        .select('id')
        .single();
      if (error) throw error;
      actualSourceId = src.id;
    }

    // Создаём job
    const { data: job, error: jobErr } = await admin
      .from('drive_import_jobs')
      .insert({
        source_id: actualSourceId,
        project_id: projectId,
        status: 'running',
        trigger_mode: triggerMode,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (jobErr) throw jobErr;

    // Возвращаем job сразу, дальше работаем в фоне
    EdgeRuntime.waitUntil((async () => {
      const errorLog: any[] = [];
      let processed = 0;
      let failed = 0;
      let skipped = 0;
      const aggregatedUnits: any[] = [];
      let aggregatedProjectMeta: Record<string, any> | null = null;

      try {
        const files = await listDriveFiles(folderId, auth);
        await admin.from('drive_import_jobs')
          .update({ files_total: files.length })
          .eq('id', job.id);

        for (const file of files) {
          if (file.mimeType.startsWith('application/vnd.google-apps')) {
            skipped++;
            continue; // Google Docs/Sheets — нужен экспорт, в v2
          }
          try {
            const buf = await downloadDriveFile(file.id, auth);
            const cls = await classifyFile(file.name, file.mimeType, LOVABLE_API_KEY);

            const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const path = `${projectId}/${cls.category}/${safeName}`;

            const { error: upErr } = await admin.storage
              .from('project-documents')
              .upload(path, new Uint8Array(buf), {
                contentType: file.mimeType,
                upsert: false,
              });
            if (upErr) throw upErr;

            const { data: signed } = await admin.storage
              .from('project-documents')
              .createSignedUrl(path, 60 * 60 * 24 * 365);

            await admin.from('project_documents').insert({
              project_id: projectId,
              category: cls.category,
              title: cls.title,
              description: cls.description,
              file_url: signed?.signedUrl || path,
              file_size_bytes: parseInt(file.size || '0', 10) || null,
              mime_type: file.mimeType,
              visibility: 'kyc',
              version: 1,
            });

            // Параллельная AI-extraction для маркетинговых файлов
            if (cls.category === 'marketing') {
              if (!aggregatedProjectMeta) {
                const meta = await extractProjectMetaFromFile(buf, file.mimeType, LOVABLE_API_KEY);
                if (meta) aggregatedProjectMeta = meta;
              }
              const units = await extractUnitsFromFile(buf, file.mimeType, LOVABLE_API_KEY);
              if (units && units.length > 0) {
                aggregatedUnits.push(...units);
              }
            }

            processed++;
            await admin.from('drive_import_jobs')
              .update({
                files_processed: processed,
                files_failed: failed,
                files_skipped: skipped,
              })
              .eq('id', job.id);
          } catch (e: any) {
            failed++;
            errorLog.push({ file: file.name, error: e.message });
          }
        }

        // Финал: записываем извлечённые AI-данные для ревью
        const finalStatus = failed > 0 && processed === 0 ? 'failed' : (failed > 0 ? 'partial' : 'completed');
        await admin.from('drive_import_jobs').update({
          status: finalStatus,
          files_processed: processed,
          files_failed: failed,
          files_skipped: skipped,
          ai_project_patch: aggregatedProjectMeta,
          ai_extracted_units: aggregatedUnits.length > 0 ? aggregatedUnits : null,
          error_log: errorLog.length ? errorLog : null,
          completed_at: new Date().toISOString(),
        }).eq('id', job.id);

        await admin.from('project_drive_sources').update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: failed > 0 ? 'partial' : 'ok',
          file_count: processed,
        }).eq('id', actualSourceId);
      } catch (e: any) {
        await admin.from('drive_import_jobs').update({
          status: 'failed',
          error_log: [{ error: e.message }],
          completed_at: new Date().toISOString(),
        }).eq('id', job.id);
      }
    })());

    return new Response(JSON.stringify({ jobId: job.id, sourceId: actualSourceId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('drive-import-folder error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
