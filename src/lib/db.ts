import { supabase } from './supabase';
import { Profile, Resource, Review, AuditLog, Announcement, DownloadLog } from '../types';

// Helper to determine if we should fallback to LocalStorage
let useFallbackCache = false;

// Check if tables are available by doing a fast probe on profiles table
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error && (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.code === '42P01')) {
      useFallbackCache = true;
      return false;
    }
    useFallbackCache = false;
    return true;
  } catch {
    useFallbackCache = true;
    return false;
  }
}

// Storage keys
const STORAGE_KEYS = {
  PROFILES: 'darkleaker_profiles',
  RESOURCES: 'darkleaker_resources',
  REVIEWS: 'darkleaker_reviews',
  AUDIT_LOGS: 'darkleaker_audit_logs',
  ANNOUNCEMENTS: 'darkleaker_announcements',
  CURRENT_USER: 'darkleaker_current_user',
  DOWNLOAD_LOGS: 'darkleaker_download_logs',
};

// Initialize LocalStorage with empty or standard configurations if they don't exist
function getLocalStorage<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

function setLocalStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Global subscription listeners (simulated realtime trigger list)
type RealtimeCallback = (payload: any) => void;
const subscribers: Record<string, RealtimeCallback[]> = {};

export function subscribeToRealtime(event: string, callback: RealtimeCallback) {
  let channel: any = null;
  if (!useFallbackCache) {
    try {
      const tableName = event === 'statistics' ? 'resources' : event;
      const targetTable = tableName === 'announcements' ? 'system_settings' : tableName;
      
      if (['resources', 'profiles', 'reviews', 'audit_logs', 'system_settings'].includes(targetTable)) {
        channel = supabase
          .channel(`realtime-${event}-${crypto.randomUUID()}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: targetTable },
            (payload) => {
              callback(payload);
            }
          )
          .subscribe();
      }
    } catch (e) {
      console.warn('Supabase Realtime subscription failed, falling back', e);
    }
  }

  if (!subscribers[event]) {
    subscribers[event] = [];
  }
  subscribers[event].push(callback);
  return () => {
    subscribers[event] = subscribers[event].filter(cb => cb !== callback);
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn('Failed to remove realtime channel', e);
      }
    }
  };
}

function emitRealtimeEvent(event: string, payload: any) {
  if (subscribers[event]) {
    subscribers[event].forEach(cb => cb(payload));
  }
}

// ========================================================
// CORE PROFILE SERVICE METHODS
// ========================================================

export function mapProfileRole(p: any): Profile {
  if (!p) return p;
  const role: 'user' | 'admin' | 'owner' = p.role || (p.discord_id === '382103405908230144' ? 'owner' : (p.is_admin ? 'admin' : 'user'));
  return { ...p, role };
}

export async function getProfileById(id: string): Promise<Profile | null> {
  if (!useFallbackCache) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (!error && data) return mapProfileRole(data);
  }
  const profiles = getLocalStorage<Profile[]>(STORAGE_KEYS.PROFILES, []);
  const found = profiles.find(p => p.id === id) || null;
  return found ? mapProfileRole(found) : null;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (!useFallbackCache) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (!error && data) {
          // Sync role properly
          const dbRole = data.role || (data.discord_id === '382103405908230144' ? 'owner' : (data.is_admin ? 'admin' : 'user'));
          data.role = dbRole;
          
          // Hard security guard: OWNER (Discord ID 382103405908230144) is always elevated to owner and never locked
          if (data.discord_id === '382103405908230144' && (data.role !== 'owner' || data.is_banned)) {
            data.role = 'owner';
            data.is_banned = false;
            await supabase.from('profiles').update({ role: 'owner', is_banned: false }).eq('id', user.id);
          }
          return data as Profile;
        }
      }
      
      // Fallback or user metadata mapping
      const profiles = getLocalStorage<Profile[]>(STORAGE_KEYS.PROFILES, []);
      let profile = profiles.find(p => p.id === user.id);
      if (!profile) {
        const discordIdVal = user.user_metadata?.provider_id || user.user_metadata?.discord_id || null;
        const isOwner = discordIdVal === '382103405908230144';
        const initialRole = isOwner ? 'owner' : 'user';
        
        profile = {
          id: user.id,
          username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Minecraftian',
          avatar_url: user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&q=80&w=200',
          discord_id: discordIdVal,
          is_premium: isOwner,
          role: initialRole, 
          is_banned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        profiles.push(profile);
        setLocalStorage(STORAGE_KEYS.PROFILES, profiles);
        emitRealtimeEvent('profiles', { action: 'insert', data: profile });
      } else {
        // Enforce OWNER constraints even in local arrays
        if (profile.discord_id === '382103405908230144' && (profile.role !== 'owner' || profile.is_banned)) {
          profile.role = 'owner';
          profile.is_banned = false;
          setLocalStorage(STORAGE_KEYS.PROFILES, profiles);
        }
      }
      return profile;
    }
  } catch (err) {
    console.error('Error fetching real user', err);
  }

  // Fallback Local Storage Active Session checking
  const sessionUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (sessionUser) {
    try {
      const userObj = JSON.parse(sessionUser) as Profile;
      const profiles = getLocalStorage<Profile[]>(STORAGE_KEYS.PROFILES, []);
      const matched = profiles.find(p => p.id === userObj.id);
      if (matched) {
        // Safe check for OWNER in local store session
        const dbRole = matched.role || (matched.discord_id === '382103405908230144' ? 'owner' : 'user');
        matched.role = dbRole;
        if (matched.discord_id === '382103405908230144' && (matched.role !== 'owner' || matched.is_banned)) {
          matched.role = 'owner';
          matched.is_banned = false;
          setLocalStorage(STORAGE_KEYS.PROFILES, profiles);
        }
        return matched;
      }
      return {
        ...userObj,
        role: userObj.role || (userObj.discord_id === '382103405908230144' ? 'owner' : 'user')
      };
    } catch {
      return null;
    }
  }
  return null;
}

export async function loginDiscordUser(discordId: string, username: string, avatarUrl?: string): Promise<Profile> {
  const profiles = getLocalStorage<Profile[]>(STORAGE_KEYS.PROFILES, []);
  const userId = `discord-user-${discordId}`;
  let profile = profiles.find(p => p.id === userId);
  const isOwner = discordId === '382103405908230144';
  const userRole = isOwner ? 'owner' : 'user';
  
  if (!profile) {
    profile = {
      id: userId,
      username: username,
      avatar_url: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      discord_id: discordId,
      is_premium: isOwner,
      role: userRole, 
      is_banned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    profiles.push(profile);
  } else {
    profile.username = username;
    if (avatarUrl) profile.avatar_url = avatarUrl;
    profile.discord_id = discordId;
    profile.role = profile.role || userRole;
    if (isOwner) {
      profile.role = 'owner';
      profile.is_banned = false;
    }
  }
  
  setLocalStorage(STORAGE_KEYS.PROFILES, profiles);
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(profile));
  emitRealtimeEvent('profiles', { action: 'insert', data: profile });
  return profile;
}

export async function logoutUser(): Promise<void> {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  await supabase.auth.signOut();
}

export async function getAllProfiles(): Promise<Profile[]> {
  if (!useFallbackCache) {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (!error && data) return data.map(mapProfileRole);
  }
  return getLocalStorage<Profile[]>(STORAGE_KEYS.PROFILES, []).map(mapProfileRole);
}

export async function updateProfileStatus(id: string, updates: Partial<Profile>): Promise<Profile | null> {
  const current = await getCurrentProfile();
  if (!current) throw new Error('Unauthenticated operation requested');

  // Fetch target profile prior to updates
  const targetProfile = await getProfileById(id);
  if (!targetProfile) throw new Error('Target user account not found');

  // Strict checks of roles
  const isOwner = current.role === 'owner';
  
  // Rule 3: "Nobody can self-promote or modify their own role"
  if (current.id === id) {
    if (updates.role !== undefined && updates.role !== targetProfile.role) {
      throw new Error('Security Violation: You are forbidden from modifying your own role permissions.');
    }
  }

  // Rule 2: "Only OWNER can create admins, remove admins, ban users, unban users"
  if (updates.role !== undefined && updates.role !== targetProfile.role) {
    if (!isOwner) {
      throw new Error('Security Violation: Only the PLATFORM OWNER can grant or revoke Administrative access.');
    }
    // Cannot strip owner or make anyone else owner
    if (targetProfile.role === 'owner' && updates.role !== 'owner') {
      throw new Error('Security Violation: The primary platform owner role cannot be stripped.');
    }
    if (updates.role === 'owner' && targetProfile.id !== current.id) {
      throw new Error('Security Violation: Cannot promote other users to OWNER role.');
    }
  }

  if (updates.is_banned !== undefined && updates.is_banned !== targetProfile.is_banned) {
    if (!isOwner) {
      throw new Error('Security Violation: Only the PLATFORM OWNER can ban or unban users.');
    }
    if (targetProfile.role === 'owner') {
      throw new Error('Security Violation: The primary platform owner cannot be banned.');
    }
  }

  // Backwards compatibility sync for databases that only have is_admin column:
  const dbUpdates: any = { ...updates };
  if (updates.role !== undefined) {
    dbUpdates.is_admin = (updates.role === 'admin' || updates.role === 'owner');
  }

  if (!useFallbackCache) {
    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) {
      const mapped = mapProfileRole(data);
      if (updates.role !== undefined) {
        await logAction(updates.role === 'admin' ? 'grant_admin' : 'revoke_admin', current?.id || null, { target_id: id, username: mapped.username });
      }
      if (updates.is_premium !== undefined) {
        await logAction(updates.is_premium ? 'grant_premium' : 'revoke_premium', current?.id || null, { target_id: id, username: mapped.username });
      }
      if (updates.is_banned !== undefined) {
        await logAction(updates.is_banned ? 'ban_user' : 'unban_user', current?.id || null, { target_id: id, username: mapped.username, reason: updates.banned_reason });
      }
      emitRealtimeEvent('profiles', { action: 'update', data: mapped });
      return mapped;
    }
  }

  // Local sync
  const profiles = getLocalStorage<Profile[]>(STORAGE_KEYS.PROFILES, []);
  const index = profiles.findIndex(p => p.id === id);
  if (index !== -1) {
    profiles[index] = mapProfileRole({ ...profiles[index], ...updates, updated_at: new Date().toISOString() });
    setLocalStorage(STORAGE_KEYS.PROFILES, profiles);
    const updated = profiles[index];
    
    if (updates.role !== undefined) {
      await logAction(updates.role === 'admin' ? 'grant_admin' : 'revoke_admin', current?.id || null, { target_id: id, username: updated.username });
    }
    if (updates.is_premium !== undefined) {
      await logAction(updates.is_premium ? 'grant_premium' : 'revoke_premium', current?.id || null, { target_id: id, username: updated.username });
    }
    if (updates.is_banned !== undefined) {
      await logAction(updates.is_banned ? 'ban_user' : 'unban_user', current?.id || null, { target_id: id, username: updated.username, reason: updates.banned_reason });
    }
    emitRealtimeEvent('profiles', { action: 'update', data: updated });

    // If we updated currently logged in user, refresh their session storage too
    const currentSession = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (currentSession) {
      const parsedSess = JSON.parse(currentSession) as Profile;
      if (parsedSess.id === id) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
      }
    }
    return updated;
  }
  return null;
}

// ========================================================
// RESOURCE MARKETPLACE SERVICE METHODS
// ========================================================

export async function getResources(options?: {
  category?: string;
  sortBy?: 'latest' | 'downloads' | 'views' | 'top_rated';
  searchQuery?: string;
  includeUnapproved?: boolean;
}): Promise<Resource[]> {
  const query = options?.searchQuery?.toLowerCase() || '';
  const category = options?.category || 'all';
  const sortBy = options?.sortBy || 'latest';
  const includeUnapproved = options?.includeUnapproved || false;

  // Real database fetch
  if (!useFallbackCache) {
    try {
      let q = supabase.from('resources').select('*, profiles:author_id(*)');
      
      if (!includeUnapproved) {
        q = q.eq('status', 'approved');
      }
      
      if (category && category !== 'all') {
        q = q.eq('category', category);
      }
      
      const { data, error } = await q;
      if (!error && data) {
        let list: Resource[] = data;
        
        // local query filtering for search in Supabase if we want
        if (query) {
          list = list.filter(r => 
            r.title.toLowerCase().includes(query) || 
            r.description.toLowerCase().includes(query) ||
            r.tags?.some(t => t.toLowerCase().includes(query)) ||
            (r.profiles?.username && r.profiles.username.toLowerCase().includes(query))
          );
        }
        
        // Sorting
        if (sortBy === 'latest') {
          list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else if (sortBy === 'downloads') {
          list.sort((a, b) => b.downloads - a.downloads);
        } else if (sortBy === 'views') {
          list.sort((a, b) => b.views - a.views);
        } else if (sortBy === 'top_rated') {
          // average reviews logic is simplified here or sorted locally
          list.sort((a, b) => b.downloads - a.downloads); // fallback to downloads
        }
        
        return list;
      }
    } catch (e) {
      console.warn('Failed to query Supabase resources, falling back', e);
    }
  }

  // FALLBACK LOCALSTORAGE
  // Starts empty based on constraint: "Marketplace starts empty. DO NOT generate fake resources."
  const list = getLocalStorage<Resource[]>(STORAGE_KEYS.RESOURCES, []);
  const profiles = getLocalStorage<Profile[]>(STORAGE_KEYS.PROFILES, []);
  
  // Join author profile manually
  let filtered = list.map(res => ({
    ...res,
    profiles: profiles.find(p => p.id === res.author_id)
  }));

  // Filtering
  if (!includeUnapproved) {
    filtered = filtered.filter(r => r.status === 'approved');
  }
  
  if (category && category !== 'all') {
    filtered = filtered.filter(r => r.category === category);
  }

  if (query) {
    filtered = filtered.filter(r => 
      r.title.toLowerCase().includes(query) || 
      r.description.toLowerCase().includes(query) ||
      r.tags?.some(t => t.toLowerCase().includes(query)) ||
      (r.profiles?.username && r.profiles.username.toLowerCase().includes(query))
    );
  }

  // Sorting
  if (sortBy === 'latest') {
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (sortBy === 'downloads') {
    filtered.sort((a, b) => b.downloads - a.downloads);
  } else if (sortBy === 'views') {
    filtered.sort((a, b) => b.views - a.views);
  } else if (sortBy === 'top_rated') {
    filtered.sort((a, b) => b.downloads - a.downloads);
  }

  return filtered;
}

export async function getResourceById(id: string): Promise<Resource | null> {
  if (!useFallbackCache) {
    const { data, error } = await supabase
      .from('resources')
      .select('*, profiles:author_id(*)')
      .eq('id', id)
      .single();
    if (!error && data) return data;
  }

  const list = getLocalStorage<Resource[]>(STORAGE_KEYS.RESOURCES, []);
  const profiles = getLocalStorage<Profile[]>(STORAGE_KEYS.PROFILES, []);
  const resource = list.find(r => r.id === id);
  if (resource) {
    return {
      ...resource,
      profiles: profiles.find(p => p.id === resource.author_id)
    };
  }
  return null;
}

export async function createResource(resourceData: Omit<Resource, 'id' | 'views' | 'downloads' | 'created_at' | 'updated_at' | 'status'> & { id?: string }): Promise<Resource | null> {
  const current = await getCurrentProfile();
  if (!current) throw new Error('You must be logged in to upload resources');
  if (current.is_banned) throw new Error('Your account is banned and cannot perform this action');

  const newResource: Resource = {
    ...resourceData,
    id: resourceData.id || crypto.randomUUID(),
    views: 0,
    downloads: 0,
    status: (current.role === 'admin' || current.role === 'owner') ? 'approved' : 'pending', // Auto-approve admin/owner uploads
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!useFallbackCache) {
    const { data, error } = await supabase
      .from('resources')
      .insert({
        id: newResource.id,
        title: newResource.title,
        description: newResource.description,
        category: newResource.category,
        tags: newResource.tags,
        thumbnail_url: newResource.thumbnail_url,
        mediafire_url: newResource.mediafire_url,
        is_premium: newResource.is_premium,
        is_featured: false,
        status: newResource.status,
        author_id: newResource.author_id,
        views: 0,
        downloads: 0
      })
      .select()
      .single();
    if (!error && data) {
      await logAction('create_resource', current.id, { title: newResource.title, id: data.id });
      emitRealtimeEvent('resources', { action: 'insert', data: data });
      return data;
    }
  }

  const list = getLocalStorage<Resource[]>(STORAGE_KEYS.RESOURCES, []);
  list.push(newResource);
  setLocalStorage(STORAGE_KEYS.RESOURCES, list);
  
  await logAction('create_resource', current.id, { title: newResource.title, id: newResource.id });
  emitRealtimeEvent('resources', { action: 'insert', data: newResource });
  return newResource;
}

export async function updateResource(id: string, updates: Partial<Resource>): Promise<Resource | null> {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile) throw new Error('Unauthenticated operation requested');

  const existingResource = await getResourceById(id);
  if (!existingResource) throw new Error('Resource not found');

  const isAdminOrOwner = currentProfile.role === 'admin' || currentProfile.role === 'owner';
  const isCreator = existingResource.author_id === currentProfile.id;

  // Only admin/owner can change status or featured state
  if (updates.status !== undefined && updates.status !== existingResource.status) {
    if (!isAdminOrOwner) {
      throw new Error('Security Violation: Only Administrators can approve or reject resources.');
    }
  }

  if (updates.is_featured !== undefined && updates.is_featured !== existingResource.is_featured) {
    if (!isAdminOrOwner) {
      throw new Error('Security Violation: Only Administrators can feature resources.');
    }
  }

  if (!isAdminOrOwner && !isCreator) {
    throw new Error('Security Violation: You do not possess editing clearance for this resource.');
  }
  
  if (!useFallbackCache) {
    const { data, error } = await supabase
      .from('resources')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) {
      if (updates.status === 'approved') {
        await logAction('approve_resource', currentProfile?.id || null, { target_id: id, title: data.title });
      } else if (updates.status === 'rejected') {
        await logAction('reject_resource', currentProfile?.id || null, { target_id: id, title: data.title, reason: updates.rejection_reason });
      }
      emitRealtimeEvent('resources', { action: 'update', data });
      return data;
    }
  }

  const list = getLocalStorage<Resource[]>(STORAGE_KEYS.RESOURCES, []);
  const idx = list.findIndex(r => r.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    setLocalStorage(STORAGE_KEYS.RESOURCES, list);
    const updated = list[idx];
    
    if (updates.status === 'approved') {
      await logAction('approve_resource', currentProfile?.id || null, { target_id: id, title: updated.title });
    } else if (updates.status === 'rejected') {
      await logAction('reject_resource', currentProfile?.id || null, { target_id: id, title: updated.title, reason: updates.rejection_reason });
    }
    
    emitRealtimeEvent('resources', { action: 'update', data: updated });
    return updated;
  }
  return null;
}

export async function deleteResource(id: string): Promise<boolean> {
  if (!useFallbackCache) {
    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (!error) {
      emitRealtimeEvent('resources', { action: 'delete', id });
      return true;
    }
  }

  const list = getLocalStorage<Resource[]>(STORAGE_KEYS.RESOURCES, []);
  const filtered = list.filter(r => r.id !== id);
  setLocalStorage(STORAGE_KEYS.RESOURCES, filtered);
  emitRealtimeEvent('resources', { action: 'delete', id });
  return true;
}

export async function incrementResourceDownload(id: string): Promise<void> {
  const current = await getCurrentProfile();
  let resourceTitle = 'Unknown Resource';

  if (!useFallbackCache) {
    try {
      await supabase.rpc('increment_downloads', { resource_id: id });
    } catch {
      // fallback manual update in Supabase
      const res = await getResourceById(id);
      if (res) {
        await supabase.from('resources').update({ downloads: (res.downloads || 0) + 1 }).eq('id', id);
      }
    }
    const res = await getResourceById(id);
    if (res) {
      resourceTitle = res.title;
    }
    try {
      // Create exact download log record in Supabase
      await supabase.from('download_logs').insert({
        resource_id: id,
        user_id: current?.id || null,
        downloaded_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error inserting Supabase download_logs', e);
    }
  }

  // Update fallback store counter
  const list = getLocalStorage<Resource[]>(STORAGE_KEYS.RESOURCES, []);
  const idx = list.findIndex(r => r.id === id);
  if (idx !== -1) {
    list[idx].downloads += 1;
    setLocalStorage(STORAGE_KEYS.RESOURCES, list);
    resourceTitle = list[idx].title;
  }

  // Insert to local download_logs
  const localLogs = getLocalStorage<DownloadLog[]>(STORAGE_KEYS.DOWNLOAD_LOGS, []);
  localLogs.push({
    id: `dl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    resource_id: id,
    user_id: current?.id || null,
    downloaded_at: new Date().toISOString()
  });
  setLocalStorage(STORAGE_KEYS.DOWNLOAD_LOGS, localLogs);

  // Guaranteed Audit log entry representing the file acquisition
  await logAction('download', current?.id || null, { 
    resource_id: id, 
    title: resourceTitle, 
    username: current?.username || 'Guest' 
  });
  
  emitRealtimeEvent('statistics', { action: 'download', data: { id, title: resourceTitle } });
  emitRealtimeEvent('resources', { action: 'update', data: { id } });
}

export async function incrementResourceView(id: string): Promise<void> {
  if (!useFallbackCache) {
    try {
      await supabase.rpc('increment_views', { resource_id: id });
    } catch {
      const res = await getResourceById(id);
      if (res) {
        await supabase.from('resources').update({ views: res.views + 1 }).eq('id', id);
      }
    }
  }

  // Update fallback store counter
  const list = getLocalStorage<Resource[]>(STORAGE_KEYS.RESOURCES, []);
  const idx = list.findIndex(r => r.id === id);
  if (idx !== -1) {
    list[idx].views += 1;
    setLocalStorage(STORAGE_KEYS.RESOURCES, list);
    emitRealtimeEvent('resources', { action: 'update', data: list[idx] });
  }
}

// ========================================================
// REVIEWS SERVICE METHODS
// ========================================================

export async function getReviews(resourceId: string): Promise<Review[]> {
  if (!useFallbackCache) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles:user_id(*)')
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false });
    if (!error && data) return data;
  }

  const list = getLocalStorage<Review[]>(STORAGE_KEYS.REVIEWS, []);
  const profiles = getLocalStorage<Profile[]>(STORAGE_KEYS.PROFILES, []);
  
  return list
    .filter(r => r.resource_id === resourceId)
    .map(rev => ({
      ...rev,
      profiles: profiles.find(p => p.id === rev.user_id)
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function addReview(reviewData: Omit<Review, 'id' | 'created_at'>): Promise<Review | null> {
  const current = await getCurrentProfile();
  if (!current) throw new Error('Log in to submit a review');
  if (current.is_banned) throw new Error('Banned profiles are prohibited from submitting feedback');

  const newReview: Review = {
    ...reviewData,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString()
  };

  if (!useFallbackCache) {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        id: newReview.id,
        resource_id: newReview.resource_id,
        user_id: newReview.user_id,
        rating: newReview.rating,
        comment: newReview.comment
      })
      .select()
      .single();
    if (!error && data) {
      emitRealtimeEvent('reviews', { action: 'insert', data: data });
      return data;
    }
  }

  const list = getLocalStorage<Review[]>(STORAGE_KEYS.REVIEWS, []);
  // Ensure uniqueness
  const filtered = list.filter(r => !(r.resource_id === reviewData.resource_id && r.user_id === reviewData.user_id));
  filtered.push(newReview);
  setLocalStorage(STORAGE_KEYS.REVIEWS, filtered);
  
  emitRealtimeEvent('reviews', { action: 'insert', data: newReview });
  return newReview;
}

// ========================================================
// AUDIT LOGS SERVICE METHODS
// ========================================================

export async function getAuditLogs(): Promise<AuditLog[]> {
  if (!useFallbackCache) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, profiles:user_id(*)')
      .order('created_at', { ascending: false });
    if (!error && data) return data;
  }

  const logs = getLocalStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  const profiles = getLocalStorage<Profile[]>(STORAGE_KEYS.PROFILES, []);
  
  return logs.map(l => ({
    ...l,
    profiles: profiles.find(p => p.id === l.user_id)
  })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function logAction(
  action: AuditLog['action'], 
  userId: string | null, 
  details: Record<string, any>
): Promise<void> {
  const newLog: AuditLog = {
    id: crypto.randomUUID(),
    action,
    user_id: userId,
    details,
    created_at: new Date().toISOString()
  };

  if (!useFallbackCache) {
    await supabase.from('audit_logs').insert({
      id: newLog.id,
      action: newLog.action,
      user_id: newLog.user_id,
      details: newLog.details
    });
  }

  const logs = getLocalStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  logs.push(newLog);
  setLocalStorage(STORAGE_KEYS.AUDIT_LOGS, logs);
  
  emitRealtimeEvent('audit_logs', { action: 'insert', data: newLog });
}

export async function getAllReviewsCount(): Promise<number> {
  if (!useFallbackCache) {
    try {
      const { count, error } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });
      if (!error && count !== null) return count;
    } catch (e) {
      console.error('Error fetching global reviews count', e);
    }
  }
  const list = getLocalStorage<Review[]>(STORAGE_KEYS.REVIEWS, []);
  return list.length;
}

export interface DownloadStats {
  totalDownloads: number;
  downloadsToday: number;
  downloadsLast24h: number;
  downloadsLast7Days: number;
}

export async function getDownloadStatistics(): Promise<DownloadStats> {
  let totalDownloads = 0;
  let downloadsToday = 0;
  let downloadsLast24h = 0;
  let downloadsLast7Days = 0;

  if (!useFallbackCache) {
    try {
      // Query real download_logs
      const { data: dlLogs, error: dlError } = await supabase
        .from('download_logs')
        .select('*');

      if (!dlError && dlLogs) {
        totalDownloads = dlLogs.length;
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        dlLogs.forEach((log: any) => {
          const timestamp = new Date(log.downloaded_at || log.created_at);
          if (timestamp >= startOfDay) {
            downloadsToday++;
          }
          if (timestamp >= past24h) {
            downloadsLast24h++;
          }
          if (timestamp >= past7Days) {
            downloadsLast7Days++;
          }
        });
      }
    } catch (e) {
      console.error('Error fetching deep download stats from Supabase', e);
    }
  } else {
    // Local storage fallback calculation
    const logs = getLocalStorage<any[]>(STORAGE_KEYS.DOWNLOAD_LOGS, []);
    totalDownloads = logs.length;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    logs.forEach(log => {
      const timestamp = new Date(log.downloaded_at || log.created_at || new Date());
      if (timestamp >= startOfDay) {
        downloadsToday++;
      }
      if (timestamp >= past24h) {
        downloadsLast24h++;
      }
      if (timestamp >= past7Days) {
        downloadsLast7Days++;
      }
    });
  }

  return {
    totalDownloads,
    downloadsToday,
    downloadsLast24h,
    downloadsLast7Days
  };
}

export async function getDownloadStatisticsForResource(resourceId: string): Promise<{ downloadsToday: number; downloadsLast24h: number }> {
  let downloadsToday = 0;
  let downloadsLast24h = 0;

  if (!useFallbackCache) {
    try {
      const { data: dlLogs, error: dlError } = await supabase
        .from('download_logs')
        .select('*')
        .eq('resource_id', resourceId);

      if (!dlError && dlLogs) {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        dlLogs.forEach((log: any) => {
          const timestamp = new Date(log.downloaded_at || log.created_at);
          if (timestamp >= startOfDay) {
            downloadsToday++;
          }
          if (timestamp >= past24h) {
            downloadsLast24h++;
          }
        });
      }
    } catch (e) {
      console.error('Error fetching resource download stats from Supabase', e);
    }
  } else {
    const logs = getLocalStorage<any[]>(STORAGE_KEYS.DOWNLOAD_LOGS, []);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    logs.forEach(log => {
      if (log.resource_id === resourceId) {
        const timestamp = new Date(log.downloaded_at);
        if (timestamp >= startOfDay) {
          downloadsToday++;
        }
        if (timestamp >= past24h) {
          downloadsLast24h++;
        }
      }
    });
  }

  return {
    downloadsToday,
    downloadsLast24h
  };
}

// ========================================================
// SYSTEM ANNOUNCEMENTS SERVICE METHODS
// ========================================================

export async function getAnnouncements(): Promise<Announcement[]> {
  return getLocalStorage<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
}

export async function createAnnouncement(announcementData: Omit<Announcement, 'id' | 'created_at'>): Promise<Announcement> {
  const list = getLocalStorage<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
  const newAnn: Announcement = {
    ...announcementData,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString()
  };
  list.push(newAnn);
  setLocalStorage(STORAGE_KEYS.ANNOUNCEMENTS, list);
  emitRealtimeEvent('announcements', { action: 'insert', data: newAnn });
  return newAnn;
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  const list = getLocalStorage<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
  const filtered = list.filter(a => a.id !== id);
  setLocalStorage(STORAGE_KEYS.ANNOUNCEMENTS, filtered);
  emitRealtimeEvent('announcements', { action: 'delete', id });
  return true;
}

// Trigger connection probe immediately
testSupabaseConnection();
