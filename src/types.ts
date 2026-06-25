export type ThemeMode = 'midnight' | 'nebula' | 'sunrise';
export type WeatherType = 'clear' | 'cyber-rain' | 'cosmic-snow' | 'portal-storm';

export interface User {
  id?: string;
  email?: string;
  discordId?: string;
  username: string;
  avatarUrl: string;
  rank: string;
  level: number;
  xp: number;
  nextXp: number;
  tokens: number;
  diamonds: number;
  badges: string[];
  achievements?: string[];
  displayName?: string;
  isActive?: boolean;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  content: string;
  date: string;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  category: 'server-setups' | 'configs' | 'models' | 'plugins' | 'skripts' | 'maps' | 'resource-packs' | 'discord-systems' | 'bot-systems' | 'web-panels';
  downloads: number;
  downloadsTrend: number[];
  rating: number;
  price: number; // 0 for free
  creator: {
    username: string;
    avatarBg: string;
    avatarEmoji: string;
    isVerified: boolean;
  };
  features: string[];
  tags: string[];
  reviews: Review[];
  size: string;
  version: string;
  compatibility: string;
  bannerGradient: string;
  isFeatured?: boolean;
  uploadType?: 'file' | 'mediafire' | 'gdrive' | 'mega' | 'external';
  downloadUrl?: string;
  fileName?: string;
  status?: 'Pending' | 'Approved' | 'Rejected' | 'Hidden';
}

export interface Creator {
  username: string;
  avatarBg: string;
  avatarEmoji: string;
  downloads: number;
  followers: number;
  rating: number;
  isVerified: boolean;
  rank: number;
  reputation: number;
  achievements: string[];
  specialty: string;
  recentAssets: string[];
  bio: string;
}

export interface Comment {
  id: string;
  author: string;
  avatarEmoji: string;
  avatarBg: string;
  content: string;
  date: string;
  upvotes: number;
}

export interface CommunityPost {
  id: string;
  author: string;
  avatarEmoji: string;
  avatarBg: string;
  isVerified?: boolean;
  content: string;
  tags: string[];
  likes: number;
  comments: Comment[];
  hasLiked?: boolean;
  hasDisliked?: boolean;
  date: string;
  imageUrl?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'alert' | 'update';
  date: string;
  read: boolean;
}

export interface MessageThread {
  id: string;
  sender: string;
  avatarEmoji: string;
  avatarBg: string;
  lastMessage: string;
  date: string;
  unread: boolean;
  messages: Array<{
    sender: 'user' | 'other';
    text: string;
    time: string;
  }>;
}

export interface SupportTicket {
  id: string;
  title: string;
  category: 'Bug Report' | 'Appeals' | 'Marketplace Inquiry' | 'Creator Verification';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'CLOSED';
  date: string;
  messages: Array<{
    id: string;
    sender: string;
    avatarBg: string;
    avatarEmoji: string;
    text: string;
    time: string;
  }>;
}

// SEED DATA FOR DARKLEAKER Ecosystem

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_MESSAGES: MessageThread[] = [];

export const INITIAL_CREATORS: Creator[] = [];

export const INITIAL_MARKETPLACE: MarketplaceItem[] = [];

export const INITIAL_COMMUNITY_FEED: CommunityPost[] = [];

export const INITIAL_TICKETS: SupportTicket[] = [];

export const FREQUENT_QUESTIONS = [
  {
    q: 'How do I download my purchased resources?',
    a: 'Once a purchase is confirmed, your resource is unlocked permanently. Go to the Dashboard or click directly on the Resource in the Marketplace to see the live "Download" button. Make sure to be logged into your account.'
  },
  {
    q: 'What is the role synchronization utility?',
    a: 'Our Discord Sync tool matches your forum achievements and premium licenses directly to your Discord account. Syncing takes 2 seconds and awards you exclusive status badges, chat color, and private channels.'
  },
  {
    q: 'Can I publish my own schematics and plugins?',
    a: 'Absolutely! Click the "Publish Resource" button in the Marketplace dashboard. Provide your source files, descriptions, pricing, and visual covers. Our automated scanner will verify safety within minutes, and then it goes live.'
  },
  {
    q: 'Are these mods compatible with fabric or forge?',
    a: 'Every marketplace asset displays its platform compatibility on its details modal. Most of our mod overhauls support both modern Forge and Fabric loaders, and plugins are optimized for Paper/Purpur.'
  }
];
