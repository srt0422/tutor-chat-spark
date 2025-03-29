
// Follow this pattern to use Supabase client in your Edge Functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default
      Deno.env.get("SUPABASE_URL") ?? "",
      // Supabase API ANON KEY - env var exported by default
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      // Create client with Auth context of the user that called the function
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
      }
    );

    // Get request body
    const { levelId, timeSpent } = await req.json();

    // Optional: Record timer stats in Supabase
    const { data, error } = await supabaseClient
      .from("coding_sessions")
      .insert([
        {
          level_id: levelId,
          time_spent: timeSpent,
          completed_at: new Date().toISOString(),
        },
      ]);

    if (error) throw error;

    // Calculate average time for this level
    const { data: avgData, error: avgError } = await supabaseClient
      .from("coding_sessions")
      .select("time_spent")
      .eq("level_id", levelId);

    if (avgError) throw avgError;

    const avgTime = avgData.length > 0 
      ? avgData.reduce((sum, session) => sum + session.time_spent, 0) / avgData.length 
      : 0;

    return new Response(
      JSON.stringify({
        message: "Timer stats recorded successfully",
        data: data,
        averageTime: avgTime,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
