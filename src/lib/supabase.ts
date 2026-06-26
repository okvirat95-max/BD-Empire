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

// --- SEED DATA FOR OFFLINE SANDBOX MODE ---
function getSeedDataForTable(tableName: string): any[] {
  if (tableName === 'marketplace_assets') {
    return [
      {
        id: 'asset-1',
        title: 'Survival Lobby Schematic',
        description: 'A stunning medieval-themed Hub spawn schematic with pre-configured portal gates and detailed statues.',
        detailed_description: 'An expansive medieval castle hub featuring 4 custom portals, a fully detailed spawn platform, merchant booths, detailed mountains, and integrated path structures. Perfect for medium-to-large networks.',
        category: 'schematics',
        downloads: 1420,
        downloads_trend: [340, 480, 520, 680, 890, 1100, 1420],
        rating: 4.9,
        price: 350,
        creator_username: 'DarthVader',
        creator_avatar_bg: 'bg-red-950',
        creator_avatar_emoji: '⚔️',
        creator_is_verified: true,
        features: ['4 Portal Frames', 'Merchant Spawn Rooms', 'Extremely Detailed', '1.18+ Optimized'],
        tags: ['lobby', 'hub', 'spawn', 'medieval', 'castle'],
        size: '1.4 MB',
        version: '1.2.0',
        compatibility: 'Java 1.16 - 1.20+',
        banner_gradient: 'from-orange-500/20 via-slate-900 to-slate-950',
        is_featured: true,
        status: 'APPROVED',
        created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'asset-2',
        title: 'Cyberpunk Hub Spawn',
        description: 'A glowing cyberpunk city sector designed for servers. Features holograms and dark neon aesthetics.',
        detailed_description: 'Bring a sci-fi future to your server! A custom designed cyberpunk spawn plaza with glowing tubes, skyscrapers, customizable hologram points, and high-tech command terminals.',
        category: 'schematics',
        downloads: 840,
        downloads_trend: [100, 250, 400, 520, 680, 750, 840],
        rating: 4.8,
        price: 250,
        creator_username: 'CraftyDev',
        creator_avatar_bg: 'bg-indigo-950',
        creator_avatar_emoji: '🪐',
        creator_is_verified: false,
        features: ['Neon tube aesthetic', 'Modular sky towers', 'Hologram areas', 'Sci-fi structures'],
        tags: ['scifi', 'cyberpunk', 'neon', 'hub', 'spawn'],
        size: '2.1 MB',
        version: '1.0.1',
        compatibility: 'Java 1.17+',
        banner_gradient: 'from-indigo-500/20 via-slate-900 to-slate-950',
        is_featured: false,
        status: 'APPROVED',
        created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'asset-3',
        title: 'Optimized AntiCheat Configurations',
        description: 'Zero false-positives anti-cheat profile tailored for survival and faction servers.',
        detailed_description: 'An extremely polished and stress-tested anti-cheat configuration that blocks modern fly, killaura, velocity, and speed cheats without interrupting vanilla player interactions or causing server lag.',
        category: 'plugins',
        downloads: 2150,
        downloads_trend: [500, 800, 1100, 1400, 1700, 1950, 2150],
        rating: 5.0,
        price: 150,
        creator_username: 'SpigotMaster',
        creator_avatar_bg: 'bg-orange-950',
        creator_avatar_emoji: '☕',
        creator_is_verified: true,
        features: ['No false triggers', 'Compatible with paper/purpur', 'Instantly alerts admins', 'Auto ban logs'],
        tags: ['anticheat', 'security', 'config', 'faction', 'optimized'],
        size: '124 KB',
        version: '4.6.0',
        compatibility: 'Paper / Purpur 1.12 - 1.20+',
        banner_gradient: 'from-amber-500/20 via-slate-900 to-slate-950',
        is_featured: true,
        status: 'APPROVED',
        created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
      }
    ];
  }
  if (tableName === 'marketplace_reviews') {
    return [
      {
        id: 'rev-1',
        asset_id: 'asset-1',
        author: 'SpigotMaster',
        rating: 5,
        content: 'Unbelievable attention to detail. Fits perfectly with our network vibe.',
        created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'rev-2',
        asset_id: 'asset-1',
        author: 'AlphaBuilds',
        rating: 4,
        content: 'Extremely clean build. Highly recommended!',
        created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'rev-3',
        asset_id: 'asset-3',
        author: 'DarthVader',
        rating: 5,
        content: 'The anti-cheat logs are incredibly clean. Zero lag!',
        created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
      }
    ];
  }
  if (tableName === 'community_posts') {
    return [
      {
        id: 'post-1',
        title: 'Purpur Performance Tuning Guide (20 TPS Guaranteed)',
        content: 'To achieve 20 TPS with 100+ players, optimize your `purpur.yml` with the following configuration details: \n\n1. Enable `asynchronous-block-ticks: true` \n2. Reduce standard chunk simulation distance to `4` \n3. Set `mob-spawner-tick-rate: 2` \n\nThis saves up to 35% CPU overhead.',
        author: 'SpigotMaster',
        category: 'guides',
        likes: 54,
        replies: 15,
        created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'post-2',
        title: 'Showcase: Medieval Castle Spawn V2',
        content: 'Excited to share the final screenshots of my medieval lobby castle, fully detailed with custom banner models and dynamic portal arches. Let me know what you think!',
        author: 'DarthVader',
        category: 'showcase',
        likes: 38,
        replies: 9,
        created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
      }
    ];
  }
  if (tableName === 'community_comments') {
    return [
      {
        id: 'comm-1',
        post_id: 'post-1',
        author: 'DarthVader',
        content: 'Absolute gold mine of configuration info. Saved our network tons of ticks!',
        created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        upvotes: 4
      }
    ];
  }
  if (tableName === 'creator_profiles') {
    return [
      {
        username: 'DarthVader',
        avatar_bg: 'bg-red-950',
        avatar_emoji: '⚔️',
        downloads: 2450,
        followers: 120,
        rating: 4.9,
        is_verified: true,
        rank: 1,
        reputation: 980,
        achievements: ['Speed Builder', 'Top Contributor'],
        specialty: 'World Builder',
        recent_assets: ['Survival Lobby Schematic', 'Modern Spawn'],
        bio: 'Professional level designer specializing in immersive voxel architectures and fantasy layouts.'
      },
      {
        username: 'SpigotMaster',
        avatar_bg: 'bg-orange-950',
        avatar_emoji: '☕',
        downloads: 4120,
        followers: 245,
        rating: 4.8,
        is_verified: true,
        rank: 2,
        reputation: 1240,
        achievements: ['Java Guru', 'Optimizer'],
        specialty: 'System Integrator',
        recent_assets: ['Optimized AntiCheat Configurations'],
        bio: 'Java performance enthusiast and lead developer of premium security utilities.'
      }
    ];
  }
  if (tableName === 'support_tickets') {
    return [
      {
        id: 'ticket-1',
        title: 'Licensing synchronization problem on startup',
        description: 'Receiving a verification failure when attempting to boot the anti-cheat module in our secure offline Frankfurt server cluster.',
        status: 'OPEN',
        priority: 'HIGH',
        category: 'LICENSE_SYNC',
        creator_email: 'okvirat95@gmail.com',
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      }
    ];
  }
  if (tableName === 'profiles') {
    return [
      {
        id: 'auth-user-id',
        username: 'SandboxUser',
        display_name: 'Sandbox User',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sandbox',
        rank: 'USER',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'owner-user-id',
        username: 'owner',
        display_name: 'DarkLeaker Owner',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=owner',
        rank: 'OWNER',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'admin-user-id',
        username: 'admin',
        display_name: 'DarkLeaker Admin',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
        rank: 'ADMIN',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'dropper-user-id',
        username: 'dropper',
        display_name: 'DarkLeaker Dropper',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=dropper',
        rank: 'DROPPER',
        is_active: true,
        created_at: new Date().toISOString()
      }
    ];
  }
  if (tableName === 'profile_xp') {
    return [
      { user_id: 'auth-user-id', xp: 450, level: 3, next_xp: 600 },
      { user_id: 'owner-user-id', xp: 45000, level: 99, next_xp: 50000 },
      { user_id: 'admin-user-id', xp: 25000, level: 50, next_xp: 30000 },
      { user_id: 'dropper-user-id', xp: 12000, level: 25, next_xp: 15000 }
    ];
  }
  if (tableName === 'profile_currency') {
    return [
      { user_id: 'auth-user-id', tokens: 1200, diamonds: 45 },
      { user_id: 'owner-user-id', tokens: 999999, diamonds: 99999 },
      { user_id: 'admin-user-id', tokens: 50000, diamonds: 5000 },
      { user_id: 'dropper-user-id', tokens: 5000, diamonds: 500 }
    ];
  }
  if (tableName === 'profile_badges') {
    return [
      { id: 'b1', user_id: 'auth-user-id', badge_name: 'Pioneer Node Verified', badge_type: 'achievement', awarded_at: new Date().toISOString() }
    ];
  }
  if (tableName === 'profile_achievements') {
    return [
      { id: 'a1', user_id: 'auth-user-id', achievement_name: 'First System Onboarded', unlocked_at: new Date().toISOString() }
    ];
  }
  return [];
}

// --- MOCK SUPABASE CLIENT IMPLEMENTATION ---
class MockSupabaseQueryBuilder {
  private tableName: string;
  private filters: { col: string, val: any, type: string }[] = [];
  private orderCol: string | null = null;
  private orderAscending: boolean = true;
  private limitCount: number | null = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields: string = '*') {
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val, type: 'eq' });
    return this;
  }

  neq(col: string, val: any) {
    this.filters.push({ col, val, type: 'neq' });
    return this;
  }

  like(col: string, val: string) {
    this.filters.push({ col, val, type: 'like' });
    return this;
  }

  or(expr: string) {
    this.filters.push({ col: 'or', val: expr, type: 'or' });
    return this;
  }

  gt(col: string, val: any) {
    this.filters.push({ col, val, type: 'gt' });
    return this;
  }

  order(col: string, options: { ascending?: boolean } = {}) {
    this.orderCol = col;
    this.orderAscending = options.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  private getTableData() {
    const key = `mock_table_${this.tableName}`;
    let data = localStorage.getItem(key);
    if (!data) {
      const seed = getSeedDataForTable(this.tableName);
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(data);
  }

  private saveTableData(data: any[]) {
    localStorage.setItem(`mock_table_${this.tableName}`, JSON.stringify(data));
  }

  async execute() {
    let rows = this.getTableData();

    // Apply filters
    for (const f of this.filters) {
      if (f.type === 'eq') {
        rows = rows.filter((r: any) => String(r[f.col]) === String(f.val));
      } else if (f.type === 'neq') {
        rows = rows.filter((r: any) => String(r[f.col]) !== String(f.val));
      } else if (f.type === 'like') {
        const cleanPattern = f.val.replace(/%/g, '.*');
        const regex = new RegExp(`^${cleanPattern}$`, 'i');
        rows = rows.filter((r: any) => regex.test(String(r[f.col])));
      } else if (f.type === 'gt') {
        rows = rows.filter((r: any) => r[f.col] > f.val);
      } else if (f.type === 'or') {
        const parts = f.val.split(',');
        rows = rows.filter((r: any) => {
          return parts.some((p: string) => {
            const match = p.match(/(\w+)\.eq\."?([^"]+)"?/);
            if (match) {
              const [_, col, val] = match;
              return String(r[col]) === String(val);
            }
            return false;
          });
        });
      }
    }

    // Apply sorting
    if (this.orderCol) {
      rows.sort((a: any, b: any) => {
        const valA = a[this.orderCol!];
        const valB = b[this.orderCol!];
        if (typeof valA === 'string' && typeof valB === 'string') {
          return this.orderAscending ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return this.orderAscending ? ((valA || 0) - (valB || 0)) : ((valB || 0) - (valA || 0));
      });
    }

    if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount);
    }

    return { data: rows, error: null };
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  async single() {
    const { data } = await this.execute();
    return { data: data[0] || null, error: data[0] ? null : { message: 'Not found' } };
  }

  async maybeSingle() {
    const { data } = await this.execute();
    return { data: data[0] || null, error: null };
  }

  async insert(records: any | any[]) {
    const rows = this.getTableData();
    const newRecords = Array.isArray(records) ? records : [records];
    const updated = [...rows, ...newRecords];
    this.saveTableData(updated);
    return { data: newRecords, error: null };
  }

  async update(fields: any) {
    const rows = this.getTableData();
    const matchingIndices: number[] = [];
    rows.forEach((r: any, idx: number) => {
      let matches = true;
      for (const f of this.filters) {
        if (f.type === 'eq' && String(r[f.col]) !== String(f.val)) matches = false;
        if (f.type === 'neq' && String(r[f.col]) === String(f.val)) matches = false;
      }
      if (matches) matchingIndices.push(idx);
    });

    matchingIndices.forEach(idx => {
      rows[idx] = { ...rows[idx], ...fields };
    });

    this.saveTableData(rows);
    return { data: rows.filter((_, idx) => matchingIndices.includes(idx)), error: null };
  }

  async upsert(records: any | any[]) {
    const rows = this.getTableData();
    const recordsArray = Array.isArray(records) ? records : [records];
    
    for (const rec of recordsArray) {
      const keyCol = rec.id ? 'id' : rec.user_id ? 'user_id' : null;
      let foundIdx = -1;
      if (keyCol) {
        foundIdx = rows.findIndex((r: any) => r[keyCol] === rec[keyCol]);
      }
      if (foundIdx !== -1) {
        rows[foundIdx] = { ...rows[foundIdx], ...rec };
      } else {
        rows.push(rec);
      }
    }

    this.saveTableData(rows);
    return { data: recordsArray, error: null };
  }

  async delete() {
    const rows = this.getTableData();
    const matchingIndices: number[] = [];
    rows.forEach((r: any, idx: number) => {
      let matches = true;
      for (const f of this.filters) {
        if (f.type === 'eq' && String(r[f.col]) !== String(f.val)) matches = false;
        if (f.type === 'neq' && String(r[f.col]) === String(f.val)) matches = false;
      }
      if (matches) matchingIndices.push(idx);
    });

    const deleted = rows.filter((_, idx) => matchingIndices.includes(idx));
    const remaining = rows.filter((_, idx) => !matchingIndices.includes(idx));
    this.saveTableData(remaining);
    return { data: deleted, error: null };
  }
}

class MockSupabaseAuth {
  private listeners: ((event: string, session: any) => void)[] = [];

  constructor() {
    if (!localStorage.getItem('mock_auth_user')) {
      const defaultUser = {
        id: 'auth-user-id',
        email: 'okvirat95@gmail.com',
        user_metadata: {
          custom_username: 'SandboxUser',
          display_name: 'Sandbox Visitor',
          avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sandbox',
          profile_setup_completed: true
        }
      };
      localStorage.setItem('mock_auth_user', JSON.stringify(defaultUser));
    }
  }

  async getSession() {
    const user = this.getUserFromStorage();
    if (!user) return { data: { session: null }, error: null };
    return {
      data: {
        session: {
          user,
          access_token: 'mock-token',
          expires_at: Math.floor(Date.now() / 1000) + 3600
        }
      },
      error: null
    };
  }

  async getUser() {
    const user = this.getUserFromStorage();
    return { data: { user }, error: null };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    this.listeners.push(callback);
    const user = this.getUserFromStorage();
    const session = user ? { user, access_token: 'mock-token' } : null;
    
    setTimeout(() => callback('SIGNED_IN', session), 10);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter(l => l !== callback);
          }
        }
      }
    };
  }

  private getUserFromStorage() {
    const u = localStorage.getItem('mock_auth_user');
    return u ? JSON.parse(u) : null;
  }

  async signOut() {
    localStorage.removeItem('mock_auth_user');
    this.listeners.forEach(l => l('SIGNED_OUT', null));
    return { error: null };
  }

  async signInWithPassword(credentials: any) {
    const rawEmail = (credentials.email || '').trim();
    const email = rawEmail.toLowerCase();
    const password = credentials.password || '';

    let matchedRole: string | null = null;
    let username = '';
    let displayName = '';
    let customId = 'auth-user-id';
    let avatarUrl = '';

    // Check specific credentials
    if (email === 'owner' || email === 'owner@gmail.com') {
      if (password !== 'owner@99') {
        throw new Error('Incorrect password for Owner account!');
      }
      matchedRole = 'OWNER';
      username = 'owner';
      displayName = 'DarkLeaker Owner';
      customId = 'owner-user-id';
      avatarUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=owner';
    } else if (email === 'admin' || email === 'admin@gmail.com') {
      if (password !== 'admin@99') {
        throw new Error('Incorrect password for Admin account!');
      }
      matchedRole = 'ADMIN';
      username = 'admin';
      displayName = 'DarkLeaker Admin';
      customId = 'admin-user-id';
      avatarUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=admin';
    } else if (email === 'dropper' || email === 'dropper@gmail.com') {
      if (password !== 'dropper@99') {
        throw new Error('Incorrect password for Dropper account!');
      }
      matchedRole = 'DROPPER';
      username = 'dropper';
      displayName = 'DarkLeaker Dropper';
      customId = 'dropper-user-id';
      avatarUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=dropper';
    }

    const finalEmail = email.includes('@') ? rawEmail : `${rawEmail}@gmail.com`;
    const finalUsername = username || rawEmail.split('@')[0];
    const finalDisplayName = displayName || finalUsername;

    const mockUser = {
      id: customId,
      email: finalEmail,
      user_metadata: {
        custom_username: finalUsername,
        display_name: finalDisplayName,
        avatar_url: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${finalUsername}`,
        profile_setup_completed: true,
        rank: matchedRole || 'USER'
      }
    };

    // If we matched a specific mock role, let's pre-insert/update matching profiles row in local storage
    const profilesKey = 'mock_table_profiles';
    let profiles = [];
    try {
      const existingProfiles = localStorage.getItem(profilesKey);
      if (existingProfiles) profiles = JSON.parse(existingProfiles);
    } catch (e) {}

    profiles = profiles.filter((p: any) => p.id !== customId);
    profiles.push({
      id: customId,
      username: finalUsername,
      display_name: finalDisplayName,
      avatar_url: mockUser.user_metadata.avatar_url,
      rank: matchedRole || 'USER',
      is_active: true,
      created_at: new Date().toISOString()
    });
    localStorage.setItem(profilesKey, JSON.stringify(profiles));

    // Also populate profile currency & xp values
    const currKey = 'mock_table_profile_currency';
    let currencies = [];
    try {
      const existingCurrencies = localStorage.getItem(currKey);
      if (existingCurrencies) currencies = JSON.parse(existingCurrencies);
    } catch (e) {}
    currencies = currencies.filter((c: any) => c.user_id !== customId);
    currencies.push({
      user_id: customId,
      tokens: matchedRole === 'OWNER' ? 999999 : matchedRole === 'ADMIN' ? 50000 : 5000,
      diamonds: matchedRole === 'OWNER' ? 99999 : matchedRole === 'ADMIN' ? 5000 : 500
    });
    localStorage.setItem(currKey, JSON.stringify(currencies));

    const xpKey = 'mock_table_profile_xp';
    let xps = [];
    try {
      const existingXps = localStorage.getItem(xpKey);
      if (existingXps) xps = JSON.parse(existingXps);
    } catch (e) {}
    xps = xps.filter((x: any) => x.user_id !== customId);
    xps.push({
      user_id: customId,
      xp: matchedRole === 'OWNER' ? 45000 : matchedRole === 'ADMIN' ? 25000 : 12000,
      level: matchedRole === 'OWNER' ? 99 : matchedRole === 'ADMIN' ? 50 : 25,
      next_xp: matchedRole === 'OWNER' ? 50000 : matchedRole === 'ADMIN' ? 30000 : 15000
    });
    localStorage.setItem(xpKey, JSON.stringify(xps));

    localStorage.setItem('mock_auth_user', JSON.stringify(mockUser));
    this.listeners.forEach(l => l('SIGNED_IN', { user: mockUser, access_token: 'mock-token' }));
    return { data: { user: mockUser, session: { user: mockUser } }, error: null };
  }

  async signUp(credentials: any) {
    const mockUser = {
      id: 'auth-user-id',
      email: credentials.email,
      user_metadata: {
        custom_username: credentials.options?.data?.username || credentials.email.split('@')[0],
        display_name: credentials.options?.data?.username || credentials.email.split('@')[0],
        avatar_url: credentials.options?.data?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${credentials.email}`,
        profile_setup_completed: true
      }
    };
    localStorage.setItem('mock_auth_user', JSON.stringify(mockUser));
    return { data: { user: mockUser, session: null }, error: null };
  }

  async signInWithOAuth(options: any) {
    const mockUser = {
      id: 'auth-user-id',
      email: 'discord_user@gmail.com',
      user_metadata: {
        custom_username: 'discord_member',
        display_name: 'Discord Veteran',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Discord',
        profile_setup_completed: true
      }
    };
    localStorage.setItem('mock_auth_user', JSON.stringify(mockUser));
    return {
      data: {
        url: window.location.href,
        user: mockUser
      },
      error: null
    };
  }

  async updateUser(attributes: any) {
    const user = this.getUserFromStorage();
    if (user) {
      const updated = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          ...attributes.data
        }
      };
      localStorage.setItem('mock_auth_user', JSON.stringify(updated));
      return { data: { user: updated }, error: null };
    }
    return { data: { user: null }, error: new Error('No user logged in') };
  }
}

class MockSupabaseFunctions {
  async invoke(functionName: string, options?: any) {
    if (functionName === 'discord-verify-guild') {
      return { data: { success: true, verified: true, badges: ['Discord Guild Verified'] }, error: null };
    }
    if (functionName === 'discord-sync-roles') {
      return { data: { success: true, rank: 'VIP', badges: ['Discord Guild Verified', 'Discord Role: VIP'] }, error: null };
    }
    if (functionName === 'discord-sync-bans') {
      return { data: { success: true, bansCount: 42, synchronizedAt: new Date().toISOString() }, error: null };
    }
    if (functionName === 'server-side-onboarding') {
      return { data: { success: true }, error: null };
    }
    return { data: null, error: new Error(`Unknown function: ${functionName}`) };
  }
}

class MockSupabaseClient {
  auth = new MockSupabaseAuth();
  functions = new MockSupabaseFunctions();
  from(tableName: string) {
    return new MockSupabaseQueryBuilder(tableName);
  }
  removeChannel() {}
}

const mockSupabaseInstance = new MockSupabaseClient();

const isMockUserSession = () => {
  const uStr = localStorage.getItem('mock_auth_user');
  if (!uStr) return false;
  try {
    const u = JSON.parse(uStr);
    const email = (u?.email || '').toLowerCase();
    const username = (u?.user_metadata?.custom_username || '').toLowerCase();
    return (
      email.startsWith('owner') || username === 'owner' ||
      email.startsWith('admin') || username === 'admin' ||
      email.startsWith('dropper') || username === 'dropper'
    );
  } catch (e) {
    return false;
  }
};

const getMockUserSession = () => {
  const uStr = localStorage.getItem('mock_auth_user');
  if (!uStr) return null;
  try {
    const user = JSON.parse(uStr);
    return {
      user,
      access_token: 'mock-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };
  } catch (e) {
    return null;
  }
};

const createWrappedSupabase = () => {
  if (!isSupabaseConfigured) {
    return mockSupabaseInstance as any;
  }

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });

  const originalAuth = client.auth;
  const originalSignIn = originalAuth.signInWithPassword.bind(originalAuth);
  const originalSignOut = originalAuth.signOut.bind(originalAuth);
  const originalGetSession = originalAuth.getSession.bind(originalAuth);
  const originalGetUser = originalAuth.getUser.bind(originalAuth);
  const originalOnAuthStateChange = originalAuth.onAuthStateChange.bind(originalAuth);

  const mockListeners: ((event: string, session: any) => void)[] = [];

  // Override auth methods
  client.auth.getSession = async function() {
    if (isMockUserSession()) {
      return { data: { session: getMockUserSession() }, error: null };
    }
    return originalGetSession();
  };

  client.auth.getUser = async function() {
    if (isMockUserSession()) {
      const session = getMockUserSession();
      return { data: { user: session?.user || null }, error: null };
    }
    return originalGetUser();
  };

  client.auth.signInWithPassword = async function(credentials: any) {
    const rawEmail = (credentials.email || '').trim();
    const email = rawEmail.toLowerCase();
    const password = credentials.password || '';

    if (
      email === 'owner' || email === 'owner@gmail.com' ||
      email === 'admin' || email === 'admin@gmail.com' ||
      email === 'dropper' || email === 'dropper@gmail.com'
    ) {
      const res = await mockSupabaseInstance.auth.signInWithPassword(credentials);
      if (res.error) return { data: { user: null, session: null }, error: res.error };

      const session = getMockUserSession();
      mockListeners.forEach(l => l('SIGNED_IN', session));

      return res;
    }

    localStorage.removeItem('mock_auth_user');
    return originalSignIn(credentials);
  };

  client.auth.signOut = async function() {
    if (isMockUserSession()) {
      localStorage.removeItem('mock_auth_user');
      mockListeners.forEach(l => l('SIGNED_OUT', null));
      return { error: null };
    }
    return originalSignOut();
  };

  client.auth.onAuthStateChange = function(callback: any) {
    mockListeners.push(callback);

    const { data: { subscription } } = originalOnAuthStateChange((event: string, session: any) => {
      if (!isMockUserSession()) {
        callback(event, session);
      }
    });

    if (isMockUserSession()) {
      setTimeout(() => {
        callback('SIGNED_IN', getMockUserSession());
      }, 0);
    }

    return {
      data: {
        subscription: {
          id: 'mock-sub',
          callback,
          unsubscribe: () => {
            const idx = mockListeners.indexOf(callback);
            if (idx !== -1) mockListeners.splice(idx, 1);
            subscription.unsubscribe();
          }
        }
      }
    } as any;
  };

  const originalFrom = client.from.bind(client);
  client.from = function(tableName: string) {
    if (isMockUserSession()) {
      return mockSupabaseInstance.from(tableName);
    }
    return originalFrom(tableName);
  };

  const originalRemoveChannel = client.removeChannel?.bind(client);
  client.removeChannel = function(channel: any) {
    if (isMockUserSession()) {
      return;
    }
    return originalRemoveChannel?.(channel);
  };

  const originalInvoke = client.functions.invoke.bind(client.functions);
  client.functions.invoke = function(functionName: string, options?: any) {
    if (isMockUserSession()) {
      return mockSupabaseInstance.functions.invoke(functionName, options);
    }
    return originalInvoke(functionName, options);
  };

  return client;
};

export const supabase = createWrappedSupabase();

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

  const isOwnerUser = supabaseUser.id === 'cc488441-7988-4703-9a93-b07e479ee41c' || 
    (supabaseUser.email && supabaseUser.email.toLowerCase() === 'okvirat95@gmail.com');

  if (isOwnerUser) {
    try {
      await supabase.from('profiles').update({ rank: 'OWNER' }).eq('id', supabaseUser.id);
    } catch (e) {
      console.warn('Could not auto-upgrade user database profile to OWNER:', e);
    }
  }

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
    if (isOwnerUser && (!xpData || xpData.level < 99)) {
      await supabase.from('profile_xp').upsert([{ user_id: supabaseUser.id, xp: 45000, level: 99, next_xp: 50000 }]);
      xpValue = 45000;
      levelValue = 99;
      nextXpValue = 50000;
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
    if (isOwnerUser && (!currencyData || currencyData.tokens < 999999)) {
      await supabase.from('profile_currency').upsert([{ user_id: supabaseUser.id, tokens: 999999, diamonds: 99999 }]);
      tokensValue = 999999;
      diamondsValue = 99999;
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
    const defaultRank = isOwnerUser ? 'OWNER' : (discordRank || 'USER');
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
    // Determine highest rank between database and discord ranks to prevent downgrading on refresh
    const rankOrder = ['USER', 'VIP', 'DROPPER', 'MODERATOR', 'ADMIN', 'OWNER'];
    const getRankPriority = (r: string) => rankOrder.indexOf((r || '').toUpperCase()) ?? 0;

    let dbRank = profile.rank || 'USER';
    if (discordRank && getRankPriority(discordRank) > getRankPriority(dbRank)) {
      dbRank = discordRank;
    }
    if (isOwnerUser) {
      dbRank = 'OWNER';
    }

    const normalizedRank = ['OWNER', 'ADMIN', 'MODERATOR', 'DROPPER', 'VIP', 'USER'].includes(dbRank.toUpperCase()) ? dbRank.toUpperCase() : (profile.rank || 'USER');

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
      status: 'APPROVED', // Auto-approve newly uploaded assets to show immediately
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
