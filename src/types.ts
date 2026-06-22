export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  discord_id: string | null;
  is_premium: boolean;
  role: 'user' | 'admin' | 'owner';
  is_banned: boolean;
  banned_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: 'plugin' | 'skript' | 'config' | 'map' | 'setup' | 'resource_pack' | 'other';
  tags: string[];
  thumbnail_url: string | null;
  mediafire_url: string;
  is_premium: boolean;
  is_featured: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  author_id: string;
  views: number;
  downloads: number;
  created_at: string;
  updated_at: string;
  // Joined relation fields for UI convenience
  profiles?: Profile;
}

export interface Review {
  id: string;
  resource_id: string;
  user_id: string;
  rating: number; // 1-5
  comment: string;
  created_at: string;
  // Joined relation fields for UI convenience
  profiles?: Profile;
}

export interface AuditLog {
  id: string;
  action: 'download' | 'ban_user' | 'unban_user' | 'grant_premium' | 'revoke_premium' | 'approve_resource' | 'reject_resource' | 'create_resource' | 'grant_admin' | 'revoke_admin';
  user_id: string | null;
  details: Record<string, any>;
  created_at: string;
  // Joined relation fields for UI
  profiles?: Profile;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  created_at: string;
}

export interface SystemSettings {
  announcements: Announcement[];
  maintenance_mode: boolean;
}

export interface DownloadLog {
  id: string;
  resource_id: string;
  user_id: string | null;
  downloaded_at: string;
}

