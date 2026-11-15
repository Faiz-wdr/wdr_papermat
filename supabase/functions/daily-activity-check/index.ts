import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-activity-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Verify Secret Token
    const configuredSecret = Deno.env.get("ACTIVITY_CHECK_SECRET");
    if (!configuredSecret) {
      console.error("[daily-activity-check] Server configuration error: ACTIVITY_CHECK_SECRET secret is not set.");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: ACTIVITY_CHECK_SECRET is missing.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Inspect Authorization header (Bearer <token>) or x-activity-key header
    const authHeader = req.headers.get("Authorization");
    const customKeyHeader = req.headers.get("x-activity-key");

    let providedToken: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      providedToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    } else if (customKeyHeader) {
      providedToken = customKeyHeader.trim();
    }

    if (!providedToken || providedToken !== configuredSecret) {
      console.warn("[daily-activity-check] Unauthorized attempt blocked.");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Perform minimal read-only query against database
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[daily-activity-check] Missing SUPABASE_URL or API key in runtime environment.");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing database connection credentials in Edge Function environment.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const startTime = performance.now();

    // Query 1 row from existing safe table: business_settings
    // This executes an authentic PostgreSQL read without any writes or overhead.
    const { data, error } = await supabase
      .from("business_settings")
      .select("id, updated_at")
      .limit(1);

    const queryDurationMs = Math.round(performance.now() - startTime);

    if (error) {
      console.error("[daily-activity-check] Database query failed:", error.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          duration_ms: queryDurationMs,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Return lightweight success response
    const payload = {
      success: true,
      status: "active",
      timestamp: new Date().toISOString(),
      rows_checked: data?.length || 0,
      query_duration_ms: queryDurationMs,
      message: "Database activity check completed successfully.",
    };

    console.info(`[daily-activity-check] Success in ${queryDurationMs}ms at ${payload.timestamp}`);

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[daily-activity-check] Unhandled exception:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
