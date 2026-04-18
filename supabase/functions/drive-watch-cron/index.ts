/**
 * drive-watch-cron
 * Запускается ежедневно через pg_cron. Для всех project_drive_sources с watch_enabled=true
 * запускает повторный импорт (delta появится естественно — files уникальны по timestamp в имени,
 * можно дополнительно фильтровать по modifiedTime > last_sync_at в будущей версии).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const { data: sources, error } = await admin
      .from('project_drive_sources')
      .select('id, project_id, drive_url, access_mode')
      .eq('watch_enabled', true);
    if (error) throw error;

    const triggered: string[] = [];
    for (const src of sources || []) {
      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/drive-import-folder`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE}`,
          },
          body: JSON.stringify({
            sourceId: src.id,
            projectId: src.project_id,
            driveUrl: src.drive_url,
            accessMode: src.access_mode,
            triggerMode: 'watch',
          }),
        });
        if (r.ok) triggered.push(src.id);
      } catch (e) {
        console.error('Failed to trigger sync for source', src.id, e);
      }
    }

    return new Response(JSON.stringify({
      sources_checked: sources?.length || 0,
      sources_triggered: triggered.length,
      triggered_ids: triggered,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
