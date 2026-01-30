import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Allowed tables for bulk import
const ALLOWED_TABLES = [
  'providers',
  'marketplace_products',
  'marketplace_vendors',
  'restaurants',
  'salons',
  'yachts',
  'tours',
  'services',
  'properties',
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client for bulk operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const allowedRoles = ['admin', 'staff', 'uno_team'];
    if (!profile || !allowedRoles.includes(profile.role)) {
      throw new Error("Admin access required");
    }

    // Parse request body
    const { table, records } = await req.json();

    // Validate table name
    if (!table || !ALLOWED_TABLES.includes(table)) {
      throw new Error(`Invalid table. Allowed: ${ALLOWED_TABLES.join(', ')}`);
    }

    // Validate records
    if (!records || !Array.isArray(records) || records.length === 0) {
      throw new Error("Records array is required");
    }

    if (records.length > 1000) {
      throw new Error("Maximum 1000 records per import");
    }

    console.log(`Bulk import: ${records.length} records to ${table}`);

    // Process in batches of 100
    const batchSize = 100;
    const results = {
      inserted: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      // Add default values + "Listed by UNO" tagging
      const processedBatch = batch.map((record: Record<string, any>) => ({
        ...record,
        is_active: record.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Tag as created by UNO team (admin import)
        created_by_uno_team: true,
        uno_team_creator_id: user.id,
      }));

      const { data, error } = await supabase
        .from(table)
        .insert(processedBatch)
        .select('id');

      if (error) {
        console.error(`Batch ${i / batchSize + 1} error:`, error);
        results.failed += batch.length;
        results.errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
      } else {
        results.inserted += data?.length || 0;
      }
    }

    console.log(`Import complete: ${results.inserted} inserted, ${results.failed} failed`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Bulk import error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: error.message === "Unauthorized" ? 401 : 400,
      }
    );
  }
});
