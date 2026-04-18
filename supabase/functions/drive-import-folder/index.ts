/**
 * drive-import-folder
 * Импортирует файлы из Google Drive папки в project-documents bucket,
 * классифицирует через Lovable AI, создаёт записи в project_documents,
 * и извлекает метаданные проекта + юниты для ревью.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3';
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
  'construction', 'floor_plans', 'contracts', 'marketing', 'other'
] as const;

function extractFolderId(url: string): string | null {
  // Поддерживаем форматы:
  //   https://drive.google.com/drive/folders/<ID>
  //   https://drive.google.com/drive/u/0/folders/<ID>
  //   просто <ID>
  if (!url.includes('/')) return url.trim();
  const m = url.match(/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

async function listDriveFilesPublic(folderId: string, apiKey: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed=false`,
      key: apiKey,
      fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink)',
      pageSize: '1000',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const r = await fetch(`${GOOGLE_DRIVE_API}/files?${params}`);
    if (!r.ok) throw new Error(`Drive API ${r.status}: ${await r.text()}`);
    const data = await r.json();
    files.push(...(data.files || []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return files;
}

async function downloadDriveFile(fileId: string, apiKey: string): Promise<ArrayBuffer> {
  const r = await fetch(`${GOOGLE_DRIVE_API}/files/${fileId}?alt=media&key=${apiKey}`);
  if (!r.ok) throw new Error(`Download failed ${r.status}`);
  return await r.arrayBuffer();
}

async function classifyFile(name: string, mimeType: string, lovableKey: string): Promise<{ category: string; title: string; description: string }> {
  const prompt = `Классифицируй файл недвижимостного проекта по ClearView категориям.
Файл: "${name}" (${mimeType})

Категории:
- land_title: документы на землю (chanote, NS3, lease)
- permits: разрешения (EIA, EHIA, building permit, construction permit)
- corporate: корпоративные документы застройщика
- financial: финансовые отчёты, аудиты, эскроу
- construction: фото/видео прогресса, отчёты подрядчика
- floor_plans: планировки, master plan, типовые этажи
- contracts: SPA, reservation agreement, шаблоны договоров
- marketing: брошюры, рендеры, презентации, прайслисты
- other: всё остальное

Верни JSON: { "category": "...", "title": "короткое имя файла", "description": "1 предложение что внутри" }`;

  const r = await fetch(LOVABLE_AI_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableKey}`,
      'Content-Type': 'application/json',
    },
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
  if (!r.ok) {
    return { category: 'other', title: name, description: '' };
  }
  const data = await r.json();
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  try {
    return JSON.parse(args);
  } catch {
    return { category: 'other', title: name, description: '' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { sourceId, projectId, driveUrl, accessMode, triggerMode = 'manual' } = await req.json();

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_DRIVE_API_KEY = Deno.env.get('GOOGLE_DRIVE_API_KEY');

    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const folderId = extractFolderId(driveUrl);
    if (!folderId) throw new Error('Invalid Google Drive URL');

    // Создаём source если ещё нет
    let actualSourceId = sourceId;
    if (!actualSourceId) {
      const { data: src, error } = await admin
        .from('project_drive_sources')
        .upsert({
          project_id: projectId,
          drive_url: driveUrl,
          folder_id: folderId,
          access_mode: accessMode || 'public',
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

      try {
        if (accessMode !== 'public') {
          throw new Error('Connector mode not yet implemented. Use public folder for now.');
        }
        if (!GOOGLE_DRIVE_API_KEY) {
          throw new Error('GOOGLE_DRIVE_API_KEY not configured. Add it in project secrets.');
        }

        const files = await listDriveFilesPublic(folderId, GOOGLE_DRIVE_API_KEY);
        await admin.from('drive_import_jobs').update({ files_total: files.length }).eq('id', job.id);

        for (const file of files) {
          if (file.mimeType.startsWith('application/vnd.google-apps')) {
            skipped++;
            continue; // skip Google Docs/Sheets — нужен экспорт, добавим позже
          }
          try {
            const buf = await downloadDriveFile(file.id, GOOGLE_DRIVE_API_KEY);
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

            processed++;
            await admin.from('drive_import_jobs')
              .update({ files_processed: processed, files_failed: failed, files_skipped: skipped })
              .eq('id', job.id);
          } catch (e: any) {
            failed++;
            errorLog.push({ file: file.name, error: e.message });
          }
        }

        await admin.from('drive_import_jobs').update({
          status: failed > 0 && processed === 0 ? 'failed' : (failed > 0 ? 'partial' : 'completed'),
          files_processed: processed,
          files_failed: failed,
          files_skipped: skipped,
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
