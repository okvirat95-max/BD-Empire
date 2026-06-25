import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const OWNER_ID = Deno.env.get("DISCORD_OWNER_ROLE_ID");
    const ADMIN_ID = Deno.env.get("DISCORD_ADMIN_ROLE_ID");
    const MOD_ID = Deno.env.get("DISCORD_MODERATOR_ROLE_ID");
    const VIP_ID = Deno.env.get("DISCORD_VIP_ROLE_ID");
    const DISCORD_GUILD_ID = Deno.env.get("DISCORD_GUILD_ID");

    if (!OWNER_ID || !ADMIN_ID || !MOD_ID || !VIP_ID || !DISCORD_GUILD_ID) {
      return new Response(
        JSON.stringify({ error: "Configuration Error: Required Discord environment variables (roles or DISCORD_GUILD_ID) are missing on the server." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId, providerToken, email } = await req.json();

    if (!userId || !providerToken) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters (userId, providerToken)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Guild ID must come exclusively from environment variables.
    let guildId = DISCORD_GUILD_ID;

    // Fetch user's guilds to verify membership
    const guildsRes = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${providerToken}`
      }
    });

    if (!guildsRes.ok) {
      return new Response(
        JSON.stringify({ error: `Discord API returned error: ${guildsRes.statusText}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const guilds: any[] = await guildsRes.json();
    const targetGuild = guilds.find((g) => g.id === guildId);

    if (!targetGuild) {
      return new Response(
        JSON.stringify({ success: false, verified: false, message: "User is not a member of the official Discord guild." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Connect to Supabase using Service Role Key for secure server-side writing
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch current badges from profile_badges table
    let badgesArray: string[] = [];
    const { data: badgesData } = await supabase
      .from("profile_badges")
      .select("badge_name")
      .eq("user_id", userId);

    if (badgesData) {
      badgesArray = badgesData.map((b: any) => b.badge_name);
    }

    if (!badgesArray.includes("Discord Guild Verified")) {
      badgesArray.push("Discord Guild Verified");

      // Use profile_badges as the single source of truth (do not write to profiles.badges)
      // Delete old and write new badge
      await supabase.from("profile_badges").delete().eq("user_id", userId).eq("badge_name", "Discord Guild Verified");
      
      const badgeId = `badge-${userId}-${encodeURIComponent("Discord Guild Verified")}`;
      await supabase.from("profile_badges").insert({
        badge_id: badgeId,
        user_id: userId,
        badge_type: "discord",
        badge_name: "Discord Guild Verified",
        awarded_at: new Date().toISOString(),
        awarded_by: "Discord API Edge Function"
      });
    }

    // Create a security event log
    await supabase.from("security_logs").insert({
      event_type: "DISCORD_GUILD_VERIFIED",
      actor: email || "anonymous",
      metadata: { userId },
      created_at: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ success: true, verified: true, badges: badgesArray }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
