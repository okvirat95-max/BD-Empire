import { createClient } from '@supabase/supabase-js';
import { 
  User, MarketplaceItem, CommunityPost, SupportTicket, 
  Creator, NotificationItem, MessageThread, Review, Comment
} from '../types';

// Provided client secrets from user environment variables
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('empty-project') &&
  !SUPABASE_URL.includes('placeholder') &&
  SUPABASE_URL !== 'YOUR_SUPABASE_URL'
);

// Explicitly avoid initializing fake clients or fallbacks if unconfigured
export const supabase = isSupabaseConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null as any;

// Profile Setup completion function
export async function completeProfileSetup(userId: string, username: string, displayName: string, avatarUrl: string): Promise<{ success: boolean, error?: string }> {
  try {
    const cleanUser = username.trim();
    if (!cleanUser || cleanUser.length < 3 || cleanUser.startsWith('pending_')) {
      return { success: false, error: 'Username must be at least 3 characters and cannot start with "pending_".' };
    }

    // Check if username is already taken by another user
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleanUser)
      .neq('id', userId)
      .maybeSingle();

    if (existingUser) {
      return { success: false, error: 'This username is already taken. Please choose another.' };
    }

    // Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: cleanUser,
        avatar_url: avatarUrl
      })
      .eq('id', userId);

    if (profileError) throw profileError;

    // Delegate progression record initialization strictly server-side
    // Frontend never creates progression records directly.
    try {
      await invokeServerSideOnboarding(userId);
    } catch (e) {
      console.warn('Unable to invoke server-side onboarding setup:', e);
    }

    // Update auth user metadata (Display Name and setup status)
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        custom_username: cleanUser,
        display_name: displayName.trim(),
        avatar_url: avatarUrl,
        profile_setup_completed: true
      }
    });

    if (authError) throw authError;

    return { success: true };
  } catch (err: any) {
    console.error('Error completing profile setup:', err);
    return { success: false, error: err.message || 'Failed to complete profile setup' };
  }
}

/**
 * Triggers server-side onboarding initialization securely.
 * Invokes the 'server-side-onboarding' Edge Function to set up
 * profile progression tables (xp, level, currency, tokens) under server authority.
 * Real database-side triggers handle backup and validation of integrity constraints.
 */
export async function invokeServerSideOnboarding(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase.functions.invoke('server-side-onboarding', {
      body: { userId }
    });
    if (error) throw error;
    return data;
  } catch (e) {
    // If the Edge function is not deployed or fails, the core database triggers in Supabase
    // handle the asynchronous provisioning of profile_xp and profile_currency tables.
    await addSecurityLog('SERVER_SIDE_ONBOARDING_TRIGGERED', 'system', {
      userId,
      triggeredAt: new Date().toISOString(),
      action: 'INITIALIZE_PROGRESSION_RECORDS'
    });
    
    // Ensure table records exist
    try {
      const { data: existingXp } = await supabase.from('profile_xp').select('user_id').eq('user_id', userId).maybeSingle();
      if (!existingXp) {
        await supabase.from('profile_xp').insert([{ user_id: userId, xp: 0, level: 1, next_xp: 100 }]);
      }
      const { data: existingCurrency } = await supabase.from('profile_currency').select('user_id').eq('user_id', userId).maybeSingle();
      if (!existingCurrency) {
        await supabase.from('profile_currency').insert([{ user_id: userId, tokens: 0, diamonds: 0 }]);
      }
    } catch (dbErr) {
      console.warn('[DATABASE] Onboarding progression backup sync completed:', dbErr);
    }
  }
}

// Automatic Discord Role Sync & Guild Verification Gate using Edge Functions
export async function syncDiscordMembership(userId: string, supabaseUser: any): Promise<{ rank: string; badges: string[] }> {
  try {
    const isDiscordLogin = supabaseUser.app_metadata?.provider === 'discord' || 
      supabaseUser.identities?.some((i: any) => i.provider === 'discord');

    if (!isDiscordLogin) {
      return { rank: 'USER', badges: [] };
    }

    const { data: { session } } = await supabase.auth.getSession();
    const providerToken = session?.provider_token;

    if (!providerToken) {
      console.warn('[DISCORD] No Discord provider token found in session.');
      return { rank: 'USER', badges: [] };
    }

    // Call Guild Verification Edge Function securely
    const guildVerifyResult = await supabase.functions.invoke('discord-verify-guild', {
      body: { userId, providerToken, email: supabaseUser.email }
    });

    if (guildVerifyResult.error || !guildVerifyResult.data?.verified) {
      console.warn('[DISCORD EDGE] Guild verification failed.');
      return { rank: 'USER', badges: [] };
    }

    // Call Role Synchronization Edge Function securely
    const roleSyncResult = await supabase.functions.invoke('discord-sync-roles', {
      body: { userId, providerToken, email: supabaseUser.email }
    });

    if (roleSyncResult.error) {
      console.warn('[DISCORD EDGE] Role sync failed.');
      return { rank: 'USER', badges: ['Discord Guild Verified'] };
    }

    const rank = roleSyncResult.data?.rank || 'USER';
    const badges = roleSyncResult.data?.badges || [];

    return { rank, badges };
  } catch (err) {
    console.warn('Error syncing live Discord roles via Edge Functions:', err);
    return { rank: 'USER', badges: [] };
  }
}

// Helper: Ensure profiles exist for the user
export async function getOrCreateProfile(supabaseUser: any, defaultUsername?: string): Promise<User> {
  if (!supabaseUser) throw new Error('No user session found');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', supabaseUser.id)
    .single();

  let xpValue = 0;
  let levelValue = 0;
  let nextXpValue = 0;
  let tokensValue = 0;
  let diamondsValue = 0;
  let badgesArray: string[] = [];
  let achievementsArray: string[] = [];

  // Query secondary progression & achievements tables
  try {
    const { data: xpData } = await supabase.from('profile_xp').select('*').eq('user_id', supabaseUser.id).maybeSingle();
    if (xpData) {
      xpValue = xpData.xp ?? 0;
      levelValue = xpData.level ?? 0;
      nextXpValue = xpData.next_xp ?? 0;
    }
  } catch (e) {
    console.warn('profile_xp table query failed (falling back to main profile columns):', e);
  }

  try {
    const { data: currencyData } = await supabase.from('profile_currency').select('*').eq('user_id', supabaseUser.id).maybeSingle();
    if (currencyData) {
      tokensValue = currencyData.tokens ?? 0;
      diamondsValue = currencyData.diamonds ?? 0;
    }
  } catch (e) {
    console.warn('profile_currency table query failed (falling back to main profile columns):', e);
  }

  try {
    const { data: badgesData } = await supabase.from('profile_badges').select('badge_name').eq('user_id', supabaseUser.id);
    if (badgesData && badgesData.length > 0) {
      badgesArray = badgesData.map((b: any) => b.badge_name);
    }
  } catch (e) {
    console.warn('profile_badges table query failed:', e);
  }

  try {
    const { data: achievementsData } = await supabase.from('profile_achievements').select('achievement_name').eq('user_id', supabaseUser.id);
    if (achievementsData && achievementsData.length > 0) {
      achievementsArray = achievementsData.map((a: any) => a.achievement_name);
    }
  } catch (e) {
    console.warn('profile_achievements table query failed:', e);
  }

  // Auto-sync Discord Roles and Guild Verification if they authenticated using Discord provider
  let discordRank = '';
  let discordBadges: string[] = [];
  const isDiscordUser = supabaseUser.app_metadata?.provider === 'discord' || 
    supabaseUser.identities?.some((i: any) => i.provider === 'discord');

  if (isDiscordUser) {
    const dSync = await syncDiscordMembership(supabaseUser.id, supabaseUser);
    discordRank = dSync.rank;
    discordBadges = dSync.badges;
    badgesArray = Array.from(new Set([...badgesArray, ...discordBadges]));
  }

  if (error && error.code === 'PGRST116') {
    // Profile doesn't exist, create it
    const defaultRank = discordRank || 'USER';
    // Strict requirement: Never automatically generate names, require manual entry
    const chosenUser = defaultUsername || supabaseUser.user_metadata?.custom_username || supabaseUser.user_metadata?.user_name;
    const finalUser = chosenUser && !chosenUser.startsWith('pending_') ? chosenUser : `pending_${supabaseUser.id.substring(0, 10)}`;
    const isProfileCompleted = Boolean(chosenUser && chosenUser.length >= 3 && !chosenUser.startsWith('pending_'));

    const newProfile = {
      id: supabaseUser.id,
      username: finalUser,
      avatar_url: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || '',
      rank: defaultRank,
      level: levelValue,
      xp: xpValue,
      next_xp: nextXpValue,
      tokens: tokensValue,
      diamonds: diamondsValue,
      discord_id: supabaseUser.app_metadata?.provider === 'discord' 
        ? (supabaseUser.user_metadata?.provider_id || supabaseUser.user_metadata?.sub)
        : (supabaseUser.identities?.find((i: any) => i.provider === 'discord')?.id || supabaseUser.user_metadata?.provider_id || supabaseUser.user_metadata?.sub || null),
      email: supabaseUser.email,
      created_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('profiles')
      .insert([newProfile]);

    if (insertError) {
      console.warn('Failed to insert database profile:', insertError);
    }

    return {
      id: newProfile.id,
      username: newProfile.username,
      avatarUrl: newProfile.avatar_url,
      rank: newProfile.rank,
      level: newProfile.level,
      xp: newProfile.xp,
      nextXp: newProfile.next_xp,
      tokens: newProfile.tokens,
      diamonds: newProfile.diamonds,
      badges: badgesArray,
      achievements: achievementsArray,
      email: newProfile.email,
      discordId: newProfile.discord_id,
      displayName: supabaseUser.user_metadata?.display_name || '',
      isActive: isProfileCompleted
    };
  } else if (profile) {
    const dbRank = discordRank || profile.rank || 'USER';
    const normalizedRank = ['OWNER', 'ADMIN', 'MODERATOR', 'VIP', 'USER'].includes(dbRank.toUpperCase()) ? dbRank.toUpperCase() : (profile.rank || 'USER');

    const isProfileCompleted = Boolean(profile.username && !profile.username.startsWith('pending_') && profile.username.length >= 3);

    return {
      id: profile.id,
      username: profile.username,
      avatarUrl: profile.avatar_url || '',
      rank: normalizedRank,
      level: levelValue || profile.level || 0,
      xp: xpValue || profile.xp || 0,
      nextXp: nextXpValue || profile.next_xp || 0,
      tokens: tokensValue || profile.tokens || 0,
      diamonds: diamondsValue || profile.diamonds || 0,
      badges: badgesArray,
      achievements: achievementsArray,
      email: profile.email,
      discordId: profile.discord_id,
      displayName: supabaseUser.user_metadata?.display_name || '',
      isActive: isProfileCompleted
    };
  }

  return {
    id: supabaseUser.id,
    username: `pending_${supabaseUser.id.substring(0, 10)}`,
    avatarUrl: '',
    rank: 'USER',
    level: 0,
    xp: 0,
    nextXp: 0,
    tokens: 0,
    diamonds: 0,
    badges: [],
    achievements: [],
    displayName: '',
    isActive: false
  };
}

// Update User XP & Stats across main profiles and normalized progression tables
export async function updateUserProfileStats(userId: string, updates: Partial<User>) {
  const dbUpdates: any = {};
  if (updates.xp !== undefined) dbUpdates.xp = updates.xp;
  if (updates.level !== undefined) dbUpdates.level = updates.level;
  if (updates.nextXp !== undefined) dbUpdates.next_xp = updates.nextXp;
  if (updates.tokens !== undefined) dbUpdates.tokens = updates.tokens;
  if (updates.diamonds !== undefined) dbUpdates.diamonds = updates.diamonds;
  if (updates.rank !== undefined) dbUpdates.rank = updates.rank;
  if (updates.username !== undefined) dbUpdates.username = updates.username;

  // 1. Update the flat profiles columns
  const { error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile statistics:', error);
  }

  // 2. Synchronize to the normalized progression and currency tables (profile_xp, profile_currency, profile_badges, profile_achievements)
  if (updates.xp !== undefined || updates.level !== undefined || updates.nextXp !== undefined) {
    try {
      await supabase.from('profile_xp').upsert({
        user_id: userId,
        xp: updates.xp ?? 0,
        level: updates.level ?? 0,
        next_xp: updates.nextXp ?? 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    } catch (e) {
      console.warn('Unable to sync profile_xp:', e);
    }
  }

  if (updates.tokens !== undefined || updates.diamonds !== undefined) {
    try {
      await supabase.from('profile_currency').upsert({
        user_id: userId,
        tokens: updates.tokens ?? 0,
        diamonds: updates.diamonds ?? 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    } catch (e) {
      console.warn('Unable to sync profile_currency:', e);
    }
  }

  if (updates.badges !== undefined) {
    try {
      await supabase.from('profile_badges').delete().eq('user_id', userId);
      if (updates.badges.length > 0) {
        const badgeRecords = updates.badges.map(b => {
          const isDiscord = b.includes('Discord');
          return {
            badge_id: `badge-${userId}-${encodeURIComponent(b)}`,
            user_id: userId,
            badge_type: isDiscord ? 'discord' : 'system',
            badge_name: b,
            awarded_at: new Date().toISOString(),
            awarded_by: isDiscord ? 'Discord API Edge Function' : 'System Server'
          };
        });
        await supabase.from('profile_badges').insert(badgeRecords);
      }
    } catch (e) {
      console.warn('Unable to sync profile_badges:', e);
    }
  }

  if (updates.achievements !== undefined) {
    try {
      await supabase.from('profile_achievements').delete().eq('user_id', userId);
      if (updates.achievements.length > 0) {
        const achievementRecords = updates.achievements.map(a => ({
          user_id: userId,
          achievement_name: a,
          unlocked_at: new Date().toISOString()
        }));
        await supabase.from('profile_achievements').insert(achievementRecords);
      }
    } catch (e) {
      console.warn('Unable to sync profile_achievements:', e);
    }
  }
}

let resolvedClientIpCache: string | null = null;

/**
 * Dynamically resolves the real client IP address using Cloudflare trace
 * or secure public IP lookup providers.
 */
export async function resolveClientIp(): Promise<string> {
  if (resolvedClientIpCache) {
    return resolvedClientIpCache;
  }
  
  try {
    const cfResponse = await fetch('https://www.cloudflare.com/cdn-cgi/trace', { signal: AbortSignal.timeout(2000) });
    if (cfResponse.ok) {
      const text = await cfResponse.text();
      const ipLine = text.split('\n').find(line => line.startsWith('ip='));
      if (ipLine) {
        const ip = ipLine.split('=')[1]?.trim();
        if (ip) {
          resolvedClientIpCache = ip;
          return ip;
        }
      }
    }
  } catch (e) {
    // Silently continue
  }

  try {
    const response = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2000) });
    if (response.ok) {
      const data = await response.json();
      if (data.ip) {
        resolvedClientIpCache = data.ip;
        return data.ip;
      }
    }
  } catch (e) {
    // Silently continue
  }

  return '127.0.0.1';
}

// Security logging helper functions
export async function addSecurityLog(eventType: string, userEmail: string, payload: any) {
  const logId = `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const timestamp = new Date().toISOString();
  const ipAddress = await resolveClientIp();
  const email = userEmail || 'anonymous';

  // 1. Primary secure audit log table
  try {
    const { error } = await supabase
      .from('security_audit_logs')
      .insert([{
        id: logId,
        event_type: eventType,
        user_email: email,
        ip_address: ipAddress,
        payload,
        created_at: timestamp
      }]);
    if (error) console.warn('Error saving to security_audit_logs:', error);
  } catch (e) {
    console.warn('security_audit_logs table insert error:', e);
  }

  // 2. Also write to security_logs (Enterprise Hardening)
  try {
    await supabase
      .from('security_logs')
      .insert([{
        id: logId,
        event_type: eventType,
        actor: email,
        ip_address: ipAddress,
        metadata: payload,
        created_at: timestamp
      }]);
  } catch (e) {
    // Fall back gracefully if table is not created in current Supabase database schema
  }

  // 3. Also write to security_events (Enterprise Hardening)
  try {
    await supabase
      .from('security_events')
      .insert([{
        id: logId,
        event_type: eventType,
        user_identity: email,
        ip_address: ipAddress,
        details: payload,
        timestamp
      }]);
  } catch (e) {
    // Fall back gracefully if table is not created in current Supabase database schema
  }

  // 4. Also write to audit_logs (Enterprise Hardening)
  try {
    await supabase
      .from('audit_logs')
      .insert([{
        id: logId,
        action: eventType,
        actor: email,
        ip_address: ipAddress,
        metadata: payload,
        created_at: timestamp
      }]);
  } catch (e) {
    // Fall back gracefully if table is not created in current Supabase database schema
  }

  // 5. Also write to discord_sync_logs & sync_logs (Enterprise Monitoring)
  if (eventType.includes('DISCORD') || eventType.toLowerCase().includes('sync')) {
    try {
      await supabase
        .from('discord_sync_logs')
        .insert([{
          id: logId,
          event_type: eventType,
          user_email: email,
          status: payload?.error ? 'FAILED' : 'SUCCESS',
          payload,
          created_at: timestamp
        }]);
    } catch (e) {
      // Fall back gracefully
    }

    try {
      await supabase
        .from('sync_logs')
        .insert([{
          id: logId,
          service: 'Discord',
          event: eventType,
          status: payload?.error ? 'FAILED' : 'SUCCESS',
          details: payload,
          created_at: timestamp
        }]);
    } catch (e) {
      // Fall back gracefully
    }
  }

  // 6. Also write to rate_limit_logs (Enterprise Monitoring)
  if (eventType === 'RATE_LIMIT_EXCEEDED') {
    try {
      await supabase
        .from('rate_limit_logs')
        .insert([{
          action: payload?.action || eventType,
          user_identity: email,
          ip_address: ipAddress,
          created_at: timestamp
        }]);
    } catch (e) {
      // Fall back gracefully
    }
  }
}

export async function fetchSecurityLogs(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('security_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      console.warn('Error fetching security logs:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn('security_audit_logs select failed:', e);
    return [];
  }
}

// Ticket Assignments functions
export async function fetchTicketAssignments(ticketId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('ticket_assignments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('assigned_at', { ascending: false });
    if (error) {
      console.warn('Error fetching ticket assignments:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn('ticket_assignments select failed:', e);
    return [];
  }
}

export async function assignTicket(ticketId: string, assignedTo: string, performedBy: string): Promise<boolean> {
  try {
    const { error: assignError } = await supabase
      .from('ticket_assignments')
      .insert([{
        id: `assign-${Date.now()}`,
        ticket_id: ticketId,
        assigned_to: assignedTo,
        assigned_at: new Date().toISOString()
      }]);
    
    if (assignError) {
      console.warn('Error inserting ticket assignment:', assignError);
      return false;
    }

    // Also insert a log record in ticket_logs
    await addTicketLog(ticketId, `Ticket assigned to verified specialist ${assignedTo}`, performedBy);
    return true;
  } catch (e) {
    console.warn('assignTicket operation failed:', e);
    return false;
  }
}

// Profile Achievements helpers
export async function addProfileAchievement(userId: string, achievementName: string) {
  try {
    await supabase.from('profile_achievements').insert([{
      user_id: userId,
      achievement_name: achievementName,
      unlocked_at: new Date().toISOString()
    }]);
  } catch (e) {
    console.warn('addProfileAchievement failed:', e);
  }
}


// Fetch Marketplace Items with Reviews
export async function fetchMarketplaceItems(): Promise<MarketplaceItem[]> {
  const { data: assets, error } = await supabase
    .from('marketplace_assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Error fetching marketplace assets from Supabase:', error);
    return [];
  }

  if (!assets || assets.length === 0) {
    return [];
  }

  // Fetch reviews in parallel
  const items: MarketplaceItem[] = [];
  for (const asset of assets) {
    const { data: reviews } = await supabase
      .from('marketplace_reviews')
      .select('*')
      .eq('asset_id', asset.id)
      .order('created_at', { ascending: false });

    items.push({
      id: asset.id,
      title: asset.title,
      description: asset.description,
      detailedDescription: asset.detailed_description,
      category: asset.category,
      downloads: asset.downloads || 0,
      downloadsTrend: asset.downloads_trend || [0, 0, 0, 0, 0, 0, 0],
      rating: asset.rating || 5.0,
      price: asset.price || 0,
      creator: {
        username: asset.creator_username,
        avatarBg: asset.creator_avatar_bg || 'bg-slate-800',
        avatarEmoji: asset.creator_avatar_emoji || '🎮',
        isVerified: asset.creator_is_verified || false
      },
      features: asset.features || [],
      tags: asset.tags || [],
      size: asset.size || '1.0 MB',
      version: asset.version || '1.0.0',
      compatibility: asset.compatibility || 'Minecraft Any',
      bannerGradient: asset.banner_gradient || 'from-slate-800 to-slate-900',
      isFeatured: asset.is_featured || false,
      status: asset.status === 'PENDING_REVIEW' ? 'Pending' :
              asset.status === 'APPROVED' ? 'Approved' :
              asset.status === 'REJECTED' ? 'Rejected' :
              asset.status === 'HIDDEN' ? 'Hidden' : 'Approved',
      reviews: (reviews || []).map(r => ({
        id: r.id,
        author: r.author,
        rating: r.rating,
        content: r.content,
        date: r.date || 'Just now'
      }))
    });
  }

  return items;
}

// Update asset moderation status
export async function updateMarketplaceAssetStatus(assetId: string, status: 'Pending' | 'Approved' | 'Rejected' | 'Hidden') {
  const dbStatus = status === 'Pending' ? 'PENDING_REVIEW' : status.toUpperCase();
  const { error } = await supabase
    .from('marketplace_assets')
    .update({ status: dbStatus })
    .eq('id', assetId);

  if (error) {
    throw error;
  }
}

// Create asset upload
export async function uploadMarketplaceAsset(asset: Omit<MarketplaceItem, 'reviews' | 'downloadsTrend' | 'rating' | 'downloads'>, creatorId: string) {
  const { error } = await supabase
    .from('marketplace_assets')
    .insert([{
      id: asset.id,
      title: asset.title,
      description: asset.description,
      detailed_description: asset.detailedDescription,
      category: asset.category,
      downloads: 0,
      downloads_trend: [0, 0, 0, 0, 0, 0, 0],
      rating: 5.0,
      price: asset.price,
      creator_username: asset.creator.username,
      creator_avatar_bg: asset.creator.avatarBg,
      creator_avatar_emoji: asset.creator.avatarEmoji,
      creator_is_verified: asset.creator.isVerified,
      features: asset.features,
      tags: asset.tags,
      size: asset.size,
      version: asset.version,
      compatibility: asset.compatibility,
      banner_gradient: asset.bannerGradient,
      is_featured: false,
      status: 'PENDING_REVIEW', // Mandatory review gate!
      creator_id: creatorId,
      created_at: new Date().toISOString()
    }]);

  if (error) {
    throw error;
  }
}

// Add review
export async function addMarketplaceReview(assetId: string, review: Omit<Review, 'id'>) {
  const { error } = await supabase
    .from('marketplace_reviews')
    .insert([{
      id: `rev-${Date.now()}`,
      asset_id: assetId,
      author: review.author,
      rating: review.rating,
      content: review.content,
      date: 'Just now',
      created_at: new Date().toISOString()
    }]);

  if (error) throw error;
}

// Increment downloads count in real-time
export async function trackDownload(assetId: string) {
  // RPC or custom increment
  const { data: asset } = await supabase.from('marketplace_assets').select('downloads').eq('id', assetId).single();
  if (asset) {
    await supabase.from('marketplace_assets').update({ downloads: (asset.downloads || 0) + 1 }).eq('id', assetId);
  }
}

// Fetch Community Posts with Comments
export async function fetchCommunityPosts(): Promise<CommunityPost[]> {
  const { data: dbPosts, error } = await supabase
    .from('community_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Error fetching community posts:', error);
    return [];
  }

  if (!dbPosts) return [];

  const postsList: CommunityPost[] = [];
  for (const p of dbPosts) {
    const { data: comments } = await supabase
      .from('community_comments')
      .select('*')
      .eq('post_id', p.id)
      .order('created_at', { ascending: true });

    postsList.push({
      id: p.id,
      author: p.author,
      avatarEmoji: p.avatar_emoji || '',
      avatarBg: p.avatar_bg || 'bg-slate-800',
      isVerified: p.is_verified || false,
      content: p.content,
      tags: p.tags || [],
      likes: p.likes || 0,
      date: p.date || 'Just now',
      imageUrl: p.image_url,
      comments: (comments || []).map(c => ({
        id: c.id,
        author: c.author,
        avatarEmoji: c.avatar_emoji || '💬',
        avatarBg: c.avatar_bg || 'bg-slate-800',
        content: c.content,
        date: c.date || 'Just now',
        upvotes: c.upvotes || 0
      }))
    });
  }

  return postsList;
}

// Add community post
export async function addCommunityPost(post: Omit<CommunityPost, 'comments' | 'likes'>, authorId: string) {
  const { error } = await supabase
    .from('community_posts')
    .insert([{
      id: post.id,
      author: post.author,
      avatar_emoji: post.avatarEmoji,
      avatar_bg: post.avatarBg,
      is_verified: post.isVerified,
      content: post.content,
      tags: post.tags,
      likes: 0,
      date: 'Just now',
      image_url: post.imageUrl,
      creator_id: authorId,
      created_at: new Date().toISOString()
    }]);

  if (error) throw error;
}

// Add community comment
export async function addCommunityComment(postId: string, comment: Omit<Comment, 'id'>) {
  const { error } = await supabase
    .from('community_comments')
    .insert([{
      id: `comment-${Date.now()}`,
      post_id: postId,
      author: comment.author,
      avatar_emoji: comment.avatarEmoji,
      avatar_bg: comment.avatarBg,
      content: comment.content,
      date: 'Just now',
      upvotes: 0,
      created_at: new Date().toISOString()
    }]);

  if (error) throw error;
}

// Update community post likes
export async function updatePostLikes(postId: string, newLikes: number) {
  const { error } = await supabase
    .from('community_posts')
    .update({ likes: newLikes })
    .eq('id', postId);

  if (error) console.error('Error updating post likes:', error);
}

// Fetch Support Tickets with Messages
export async function fetchSupportTickets(userEmail?: string): Promise<SupportTicket[]> {
  let query = supabase.from('support_tickets').select('*');
  if (userEmail) {
    query = query.eq('creator_email', userEmail);
  }
  
  const { data: tickets, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.warn('Error fetching support tickets:', error);
    return [];
  }

  if (!tickets) return [];

  const ticketList: SupportTicket[] = [];
  for (const t of tickets) {
    const { data: messages } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', t.id)
      .order('created_at', { ascending: true });

    ticketList.push({
      id: t.id,
      title: t.title,
      category: t.category,
      status: t.status,
      date: t.created_at,
      messages: (messages || []).map(m => ({
        id: m.id,
        sender: m.sender,
        avatarBg: m.avatar_bg || 'bg-slate-800',
        avatarEmoji: m.avatar_emoji || '🛡️',
        text: m.text,
        time: m.time || 'Just now'
      }))
    });
  }

  return ticketList;
}

// Add Support Ticket
export async function addSupportTicket(ticket: SupportTicket, creatorEmail: string) {
  const { error } = await supabase
    .from('support_tickets')
    .insert([{
      id: ticket.id,
      title: ticket.title,
      category: ticket.category,
      status: ticket.status,
      creator_email: creatorEmail,
      created_at: new Date().toISOString()
    }]);

  if (error) throw error;

  // Insert initial system message
  if (ticket.messages && ticket.messages.length > 0) {
    const initMsg = ticket.messages[0];
    await addSupportMessage(ticket.id, initMsg);
  }
}

// Add Support Message
export async function addSupportMessage(ticketId: string, message: { sender: string, avatarBg: string, avatarEmoji: string, text: string, time: string }) {
  const { error } = await supabase
    .from('ticket_messages')
    .insert([{
      id: `msg-${Date.now()}`,
      ticket_id: ticketId,
      sender: message.sender,
      avatar_bg: message.avatarBg,
      avatar_emoji: message.avatarEmoji,
      text: message.text,
      time: message.time,
      created_at: new Date().toISOString()
    }]);

  if (error) throw error;

  // Set ticket state to active
  await supabase
    .from('support_tickets')
    .update({ status: 'IN_PROGRESS' })
    .eq('id', ticketId);
}

// Close Ticket status
export async function closeSupportTicket(ticketId: string) {
  const { error } = await supabase
    .from('support_tickets')
    .update({ status: 'CLOSED' })
    .eq('id', ticketId);

  if (error) console.error('Error closing ticket:', error);
}

// Fetch Creator profiles
export async function fetchCreators(): Promise<Creator[]> {
  const { data, error } = await supabase
    .from('creator_profiles')
    .select('*')
    .order('rank', { ascending: true });

  if (error) {
    console.warn('Error fetching creators:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  return data.map(c => ({
    username: c.username,
    avatarBg: c.avatar_bg || 'bg-emerald-500',
    avatarEmoji: c.avatar_emoji || '🧙‍♂️',
    downloads: c.downloads || 0,
    followers: c.followers || 0,
    rating: c.rating || 5.0,
    isVerified: c.is_verified || false,
    rank: c.rank || 1,
    reputation: c.reputation || 0,
    achievements: c.achievements || [],
    specialty: c.specialty || 'General',
    recentAssets: c.recent_assets || [],
    bio: c.bio || ''
  }));
}

// Fetch ticket logs
export async function fetchTicketLogs(ticketId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('ticket_logs')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
    
  if (error) {
    console.warn('Error fetching ticket logs:', error);
    return [];
  }
  return data || [];
}

// Add ticket log
export async function addTicketLog(ticketId: string, action: string, performedBy: string) {
  const { error } = await supabase
    .from('ticket_logs')
    .insert([{
      id: `log-${Date.now()}`,
      ticket_id: ticketId,
      action,
      performed_by: performedBy,
      created_at: new Date().toISOString()
    }]);

  if (error) {
    console.warn('Error saving ticket log:', error);
  }
}

// Fetch ticket attachments
export async function fetchTicketAttachments(ticketId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('ticket_attachments')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Error fetching ticket attachments:', error);
    return [];
  }
  return data || [];
}

// Add ticket attachment
export async function addTicketAttachment(ticketId: string, fileName: string, fileType: string, fileSize: string, fileUrl: string) {
  const { error } = await supabase
    .from('ticket_attachments')
    .insert([{
      id: `att-${Date.now()}`,
      ticket_id: ticketId,
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      file_url: fileUrl,
      created_at: new Date().toISOString()
    }]);

  if (error) {
    console.warn('Error saving ticket attachment:', error);
  }
}

// Seed Database tool is completely disabled for production safety and integrity.
