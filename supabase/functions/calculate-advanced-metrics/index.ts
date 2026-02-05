import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const targetDate = body.date ? new Date(body.date) : new Date();
    targetDate.setDate(targetDate.getDate() - 1); // Yesterday by default
    const dateStr = targetDate.toISOString().split("T")[0];

    console.log(`Calculating advanced metrics for ${dateStr}`);

    // Parallel fetch all needed data
    const [
      ordersResult,
      usersResult,
      providersResult,
      propertiesResult,
      toursResult,
      yachtsResult,
      profilesResult,
    ] = await Promise.all([
      supabase.from("orders").select("*").gte("created_at", `${dateStr}T00:00:00`).lt("created_at", `${dateStr}T23:59:59`),
      supabase.from("profiles").select("id, created_at"),
      supabase.from("providers").select("id, business_category, is_active, created_at"),
      supabase.from("properties").select("id, is_active, price_per_night"),
      supabase.from("tours").select("id, is_active, rating, price"),
      supabase.from("yachts").select("id, is_active, price_per_day"),
      supabase.from("profiles").select("id, created_at").gte("created_at", `${dateStr}T00:00:00`).lt("created_at", `${dateStr}T23:59:59`),
    ]);

    const orders = ordersResult.data || [];
    const users = usersResult.data || [];
    const providers = providersResult.data || [];
    const properties = propertiesResult.data || [];
    const tours = toursResult.data || [];
    const yachts = yachtsResult.data || [];
    const newUsers = profilesResult.data || [];

    // Calculate basic metrics
    const totalGMV = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalGMV / orders.length : 0;
    const dau = new Set(orders.map(o => o.customer_id)).size;

    // Calculate repeat purchase rate (users with 2+ orders)
    const { data: repeatUsers } = await supabase
      .from("orders")
      .select("customer_id")
      .eq("status", "completed");
    
    const userOrderCounts: Record<string, number> = {};
    (repeatUsers || []).forEach(o => {
      userOrderCounts[o.customer_id] = (userOrderCounts[o.customer_id] || 0) + 1;
    });
    const usersWithOrders = Object.keys(userOrderCounts).length;
    const repeatPurchaseUsers = Object.values(userOrderCounts).filter(c => c >= 2).length;
    const repeatPurchaseRate = usersWithOrders > 0 ? (repeatPurchaseUsers / usersWithOrders) * 100 : 0;

    // Calculate cross-sell rate (users using 2+ verticals)
    const { data: userVerticals } = await supabase
      .from("orders")
      .select("customer_id, vertical")
      .eq("status", "completed");
    
    const userVerticalSet: Record<string, Set<string>> = {};
    (userVerticals || []).forEach(o => {
      if (!userVerticalSet[o.customer_id]) userVerticalSet[o.customer_id] = new Set();
      userVerticalSet[o.customer_id].add(o.vertical);
    });
    const crossSellUsers = Object.values(userVerticalSet).filter(v => v.size >= 2).length;
    const crossSellRate = usersWithOrders > 0 ? (crossSellUsers / usersWithOrders) * 100 : 0;

    // Calculate LTV (total revenue / total users with orders)
    const { data: allCompletedOrders } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("status", "completed");
    
    const totalRevenue = (allCompletedOrders || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const ltv = usersWithOrders > 0 ? totalRevenue / usersWithOrders : 0;

    // Property-specific metrics
    const activeProperties = properties.filter(p => p.is_active).length;
    const propertyOrders = orders.filter(o => o.vertical === 'property');
    const propertyGMV = propertyOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const propertyADR = propertyOrders.length > 0 ? propertyGMV / propertyOrders.length : 0;
    const occupancyRate = activeProperties > 0 ? (propertyOrders.length / activeProperties) * 100 : 0;

    // Tours metrics
    const activeTours = tours.filter(t => t.is_active).length;
    const tourOrders = orders.filter(o => o.vertical === 'tour');
    const toursGMV = tourOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const toursAvgRating = tours.reduce((sum, t) => sum + (t.rating || 0), 0) / (tours.length || 1);

    // Yachts metrics
    const activeYachts = yachts.filter(y => y.is_active).length;
    const yachtOrders = orders.filter(o => o.vertical === 'yacht');
    const yachtsGMV = yachtOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Calculate take rate and gross margin
    const avgTakeRate = 10; // 10% platform commission
    const platformRevenue = totalGMV * (avgTakeRate / 100);
    const grossMargin = totalGMV > 0 ? (platformRevenue / totalGMV) * 100 : 0;

    // Update platform_metrics
    await supabase.from("platform_metrics").upsert({
      date: dateStr,
      avg_order_value: avgOrderValue,
      repeat_purchase_rate: repeatPurchaseRate,
      cross_sell_rate: crossSellRate,
      dau: dau,
      property_listings_count: activeProperties,
      property_occupancy_rate: occupancyRate,
      property_adr: propertyADR,
      property_gmv: propertyGMV,
      tours_count: activeTours,
      tours_gmv: toursGMV,
      tours_avg_rating: toursAvgRating,
      yachts_count: activeYachts,
      yachts_gmv: yachtsGMV,
      avg_take_rate: avgTakeRate,
      gross_margin: grossMargin,
      ltv: ltv,
      ltv_cac_ratio: ltv > 0 ? ltv / 50 : 0, // Assuming $50 CAC
    }, { onConflict: "date" });

    // Calculate vertical metrics
    const verticals = ['property', 'tour', 'yacht', 'restaurant', 'beauty', 'cleaning', 'transport', 'medical', 'education', 'legal', 'fitness', 'flowers', 'pets', 'events'];
    
    for (const vertical of verticals) {
      const verticalOrders = orders.filter(o => o.vertical === vertical);
      const verticalGMV = verticalOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const verticalAOV = verticalOrders.length > 0 ? verticalGMV / verticalOrders.length : 0;
      const verticalProviders = providers.filter(p => p.business_category === vertical && p.is_active).length;

      await supabase.from("vertical_metrics").upsert({
        date: dateStr,
        vertical: vertical,
        bookings_count: verticalOrders.length,
        gmv: verticalGMV,
        avg_order_value: verticalAOV,
        providers_count: verticalProviders,
        take_rate: avgTakeRate,
        revenue: verticalGMV * (avgTakeRate / 100),
      }, { onConflict: "date,vertical" });
    }

    // Calculate cohort metrics for users who joined on this date
    const cohortUsers = newUsers.length;
    if (cohortUsers > 0) {
      // Get retention data for this cohort
      const cohortUserIds = newUsers.map(u => u.id);
      
      const d1Date = new Date(targetDate);
      d1Date.setDate(d1Date.getDate() + 1);
      const d7Date = new Date(targetDate);
      d7Date.setDate(d7Date.getDate() + 7);
      const d30Date = new Date(targetDate);
      d30Date.setDate(d30Date.getDate() + 30);

      // Check D1 retention
      const { data: d1Orders } = await supabase
        .from("orders")
        .select("customer_id")
        .in("customer_id", cohortUserIds)
        .gte("created_at", d1Date.toISOString().split("T")[0])
        .lt("created_at", `${d1Date.toISOString().split("T")[0]}T23:59:59`);

      const d1Retained = new Set((d1Orders || []).map(o => o.customer_id)).size;

      await supabase.from("cohort_metrics").upsert({
        cohort_date: dateStr,
        cohort_size: cohortUsers,
        d1_retained: d1Retained,
        d1_retention_rate: cohortUsers > 0 ? (d1Retained / cohortUsers) * 100 : 0,
      }, { onConflict: "cohort_date" });
    }

    // Calculate cross-sell matrix
    const fromToMap: Record<string, Record<string, number>> = {};
    
    Object.entries(userVerticalSet).forEach(([userId, verticalSet]) => {
      const verticalsArr = Array.from(verticalSet);
      for (let i = 0; i < verticalsArr.length; i++) {
        for (let j = 0; j < verticalsArr.length; j++) {
          if (i !== j) {
            const from = verticalsArr[i];
            const to = verticalsArr[j];
            if (!fromToMap[from]) fromToMap[from] = {};
            fromToMap[from][to] = (fromToMap[from][to] || 0) + 1;
          }
        }
      }
    });

    for (const [from, toMap] of Object.entries(fromToMap)) {
      for (const [to, count] of Object.entries(toMap)) {
        const fromUsers = Object.values(userVerticalSet).filter(v => v.has(from)).length;
        const conversionRate = fromUsers > 0 ? (count / fromUsers) * 100 : 0;
        
        await supabase.from("cross_sell_metrics").upsert({
          date: dateStr,
          from_vertical: from,
          to_vertical: to,
          users_count: count,
          conversion_rate: conversionRate,
        }, { onConflict: "date,from_vertical,to_vertical" });
      }
    }

    const result = {
      date: dateStr,
      metrics: {
        avgOrderValue,
        repeatPurchaseRate,
        crossSellRate,
        dau,
        ltv,
        propertyListings: activeProperties,
        propertyOccupancy: occupancyRate,
        propertyADR,
        propertyGMV,
        toursCount: activeTours,
        toursGMV,
        yachtsCount: activeYachts,
        yachtsGMV,
        grossMargin,
      },
    };

    console.log("Advanced metrics calculated:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error calculating advanced metrics:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
