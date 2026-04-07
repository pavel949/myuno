/**
 * Monthly Owner Statement Generator (Cron)
 * 
 * Runs on the 1st of each month. For every active MC:
 * 1. Aggregates financials per property for the previous month
 * 2. Creates a property_reports row
 * 3. Sends the report via send-property-report function
 */

import { createServiceClient } from "../_shared/supabase.ts";
import { requireInternalSecret } from '../_shared/internal-secret.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-internal-secret",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Internal/cron guard
    const guardResponse = requireInternalSecret(req, corsHeaders);
    if (guardResponse) return guardResponse;
    
    const supabase = createServiceClient();

    // Calculate previous month range
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0); // last day of prev month
    const periodStartStr = periodStart.toISOString().split("T")[0];
    const periodEndStr = periodEnd.toISOString().split("T")[0];

    console.log(`Generating monthly statements for ${periodStartStr} — ${periodEndStr}`);

    // Get all active MCs with auto-send enabled properties
    const { data: mcs, error: mcError } = await supabase
      .from("management_companies")
      .select("id, name, contact_email")
      .eq("is_verified", true);

    if (mcError) throw mcError;

    let generated = 0;
    let errors = 0;

    for (const mc of mcs || []) {
      try {
        // Get all properties managed by this MC
        const { data: properties } = await supabase
          .from("properties")
          .select("id, title_en, title_ru")
          .eq("management_company_id", mc.id)
          .eq("is_active", true);

        if (!properties?.length) continue;

        const propertyIds = properties.map((p: any) => p.id);

        // Aggregate financials for each property
        const { data: financials } = await supabase
          .from("property_financials")
          .select("property_id, transaction_type, amount, category")
          .in("property_id", propertyIds)
          .gte("transaction_date", periodStartStr)
          .lte("transaction_date", periodEndStr);

        // Aggregate bookings
        const { data: bookings } = await supabase
          .from("property_bookings")
          .select("property_id, check_in, check_out, total_amount, status")
          .in("property_id", propertyIds)
          .gte("check_in", periodStartStr)
          .lte("check_in", periodEndStr)
          .in("status", ["confirmed", "completed"]);

        // Group by property — each property wrapped in try/catch so one failure doesn't stop others
        for (const prop of properties) {
          try {
          const propFinancials = (financials || []).filter(
            (f: any) => f.property_id === prop.id
          );
          const propBookings = (bookings || []).filter(
            (b: any) => b.property_id === prop.id
          );

          const income = propFinancials
            .filter((f: any) => f.transaction_type === "income")
            .reduce((sum: number, f: any) => sum + (f.amount || 0), 0);

          const expenses = propFinancials
            .filter((f: any) => f.transaction_type === "expense")
            .reduce((sum: number, f: any) => sum + (f.amount || 0), 0);

          // Calculate occupancy
          const daysInMonth =
            (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24) + 1;
          let occupiedNights = 0;
          for (const b of propBookings) {
            const ci = new Date(b.check_in);
            const co = new Date(b.check_out);
            const nights = Math.max(
              0,
              (co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24)
            );
            occupiedNights += nights;
          }
          const occupancyRate = Math.round(
            (occupiedNights / daysInMonth) * 100
          );

          const reportData = {
            income: { total: income },
            expenses: { total: expenses },
            net_income: income - expenses,
            occupancy: {
              rate: occupancyRate,
              bookings_count: propBookings.length,
              occupied_nights: occupiedNights,
              total_nights: daysInMonth,
            },
            generated_at: new Date().toISOString(),
          };

          // Get property owner
          const { data: ownerProp } = await supabase
            .from("properties")
            .select("owner_id")
            .eq("id", prop.id)
            .maybeSingle();

          // Create report record
          const { data: report, error: reportError } = await supabase
            .from("property_reports")
            .insert({
              property_id: prop.id,
              report_type: "monthly",
              period_start: periodStartStr,
              period_end: periodEndStr,
              data: reportData,
              status: "generated",
              auto_generated: true,
              created_by: ownerProp?.owner_id || null,
            })
            .select("id")
            .single();

          if (reportError) {
            console.error(`Failed to create report for ${prop.id}:`, reportError);
            errors++;
            continue;
          }

          // Check if owner has email for auto-send
          if (ownerProp?.owner_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", ownerProp.owner_id)
              .maybeSingle();

            if (profile?.email) {
              // Invoke send-property-report
              try {
                const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
                const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

                await fetch(`${supabaseUrl}/functions/v1/send-property-report`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseKey}`,
                  },
                  body: JSON.stringify({
                    reportId: report.id,
                    recipientEmails: [profile.email],
                    language: "ru",
                  }),
                });
              } catch (sendErr) {
                console.error(`Failed to send report email for ${prop.id}:`, sendErr);
              }
            }
          }

          generated++;
          } catch (propErr) {
            console.error(`Error processing property ${prop.id}:`, propErr);
            errors++;
          }
        }
      } catch (mcErr) {
        console.error(`Error processing MC ${mc.id}:`, mcErr);
        errors++;
      }
    }

    console.log(`Monthly statements complete: ${generated} generated, ${errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        generated,
        errors,
        period: `${periodStartStr} — ${periodEndStr}`,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Monthly statement generation failed:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
