// Deno.serve used (native edge runtime)
import { createClient } from "../_shared/supabase.ts";
import { getCorsHeaders } from "../_shared/cors.ts";


// Allowed tables for bulk import - synchronized with src/lib/providerIdMapping.ts
const ALLOWED_TABLES = [
  // Core entities
  'providers',
  'marketplace_products',
  'marketplace_vendors',
  'vendor_services',
  
  // Vertical tables
  'yachts',
  'tours',
  'water_activities',
  'restaurants',
  'salons',
  'clinics',
  'gyms',
  'vehicles',
  'babysitters',
  'cleaning_providers',
  'pet_services',
  'lawyers',
  'education_centers',
  'properties',
  'owner_properties',
  'flower_shops',
  'bouquets',
  'user_listings',
  'listings',
  
  // Legacy (deprecated but may have data)
  'services',

  // CRM
  'crm_contacts',
];

// Provider ID field mapping - different tables use different FK fields
const PROVIDER_ID_FIELD: Record<string, string> = {
  'marketplace_products': 'vendor_id',
  'vendor_services': 'provider_id',
  'bouquets': 'shop_id',
  'owner_properties': 'owner_id',
  'user_listings': 'user_id',
  // All other tables use 'provider_id' as default
};

function getProviderField(table: string): string {
  return PROVIDER_ID_FIELD[table] || 'provider_id';
}

Deno.serve(async (req) => {
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

    // Check if user has admin/staff/uno_team role via user_roles table
    // (profiles.role does not exist — roles live in public.user_roles for RLS safety)
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('user_roles lookup failed:', rolesError);
      throw new Error('Authorization check failed');
    }

    const allowedRoles = ['admin', 'staff', 'uno_team'];
    const hasAccess = (roles ?? []).some((r: { role: string }) => allowedRoles.includes(r.role));
    if (!hasAccess) {
      throw new Error('Admin access required');
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
      inserted_ids: [] as string[],
      errors: [] as string[],
    };

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      // Add default values (table-specific)
      const processedBatch = batch.map((record: Record<string, any>) => {
        const base: Record<string, any> = {
          ...record,
          created_at: record.created_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        if (table === 'crm_contacts') {
          base.created_by = record.created_by ?? user.id;
        } else {
          base.is_active = record.is_active ?? true;
          base.created_by_uno_team = true;
          base.uno_team_creator_id = user.id;
        }
        return base;
      });

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
        if (Array.isArray(data)) {
          for (const row of data) {
            if (row?.id) results.inserted_ids.push(row.id as string);
          }
        }
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
