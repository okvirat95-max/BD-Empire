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

    // Fetch user's guild member object to verify their roles in the guild
    const memberRes = await fetch(`https://discord.com/api/v10/users/@me/guilds/${guildId}/member`, {
      headers: {
        Authorization: `Bearer ${providerToken}`
      }
    });

    if (!memberRes.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch guild member details from Discord API: ${memberRes.statusText}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const memberData = await memberRes.json();
    const roleIds: string[] = memberData.roles || [];

    // Map roles exclusively based on configured Role IDs
    let hasOwner = roleIds.includes(OWNER_ID);
    let hasAdmin = roleIds.includes(ADMIN_ID);
    let hasMod = roleIds.includes(MOD_ID);
    let hasVip = roleIds.includes(VIP_ID);

    // Also check for guild ownership via users guilds
    const guildsRes = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${providerToken}`
      }
    });
    if (guildsRes.ok) {
      const guilds: any[] = await guildsRes.json();
      const targetGuild = guilds.find((g) => g.id === guildId);
      if (targetGuild?.owner) {
        hasOwner = true;
      }
    }

    let mappedRank = "USER";
    if (hasOwner) {
      mappedRank = "OWNER";
    } else if (hasAdmin) {
      mappedRank = "ADMIN";
    } else if (hasMod) {
      mappedRank = "MODERATOR";
    } else if (hasVip) {
      mappedRank = "VIP";
    }

    // Connect to Supabase using Service Role Key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update the rank in profiles table
    await supabase.from("profiles").update({ rank: mappedRank }).eq("id", userId);

    // Fetch current badges to rewrite role badges
    let badgesArray: string[] = [];
    const { data: badgesData } = await supabase
      .from("profile_badges")
      .select("badge_name")
      .eq("user_id", userId);

    if (badgesData) {
      badgesArray = badgesData.map((b: any) => b.badge_name);
    }

    // Filter out old role badges from the local representation
    badgesArray = badgesArray.filter((b) => !b.startsWith("Discord Role:"));

    // Delete existing Discord Role badges from database
    await supabase
      .from("profile_badges")
      .delete()
      .eq("user_id", userId)
      .like("badge_name", "Discord Role:%");

    if (mappedRank !== "USER") {
      const targetBadgeName = `Discord Role: ${mappedRank}`;
      badgesArray.push(targetBadgeName);

      const badgeId = `badge-${userId}-${encodeURIComponent(targetBadgeName)}`;
      await supabase.from("profile_badges").insert({
        badge_id: badgeId,
        user_id: userId,
        badge_type: "discord",
        badge_name: targetBadgeName,
        awarded_at: new Date().toISOString(),
        awarded_by: "Discord API Edge Function"
      });
    }

    // Log the security event
    await supabase.from("security_logs").insert({
      event_type: "DISCORD_ROLE_SYNCED",
      actor: email || "anonymous",
      metadata: { userId, role: mappedRank },
      created_at: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ success: true, rank: mappedRank, badges: badgesArray }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
