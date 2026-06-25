import { supabase, addSecurityLog, resolveClientIp } from './supabase';

export interface RateLimitResult {
  allowed: boolean;
  message?: string;
  retryAfterSeconds?: number;
}

// Enterprise Hardened Rate Limits
const LIMITS: { [key: string]: { max: number; windowMs: number; label: string } } = {
  login: { max: 5, windowMs: 60 * 1000, label: 'Login Attempts' }, // 5 logins per minute
  upload: { max: 2, windowMs: 5 * 60 * 1000, label: 'Asset Uploads' }, // 2 uploads per 5 minutes
  review: { max: 3, windowMs: 60 * 1000, label: 'Asset Reviews' }, // 3 reviews per minute
  ticket: { max: 2, windowMs: 5 * 60 * 1000, label: 'Ticket Creations' }, // 2 tickets per 5 minutes
  comment: { max: 5, windowMs: 2 * 60 * 1000, label: 'Comments/Replies' }, // 5 comments per 2 minutes
};

// Local active rate tracking memory when database is temporarily unreachable
const activeRateLimitStore: { [key: string]: number[] } = {};

/**
 * Enterprise Hardened Rate Limiter.
 * Uses real Supabase rate_limit_logs table, tracking both IP addresses and authenticated user identities.
 * Completely isolates the client from deciding, mutating, or persisting the rate limit state.
 */
export async function checkRateLimit(
  action: 'login' | 'upload' | 'review' | 'ticket' | 'comment',
  identity: string = 'anonymous'
): Promise<RateLimitResult> {
  const limit = LIMITS[action];
  if (!limit) {
    return { allowed: true };
  }

  const now = Date.now();
  const windowStart = now - limit.windowMs;
  const windowStartIso = new Date(windowStart).toISOString();
  
  const ipAddress = await resolveClientIp();
  const userKey = identity || 'anonymous';

  let attemptsCount = 0;
  let oldestTimestamp = now;

  try {
    // 1. Query the real Supabase rate_limit_logs table
    const { data: dbLogs, error } = await supabase
      .from('rate_limit_logs')
      .select('created_at')
      .eq('action', action)
      .or(`user_identity.eq."${userKey}",ip_address.eq."${ipAddress}"`)
      .gt('created_at', windowStartIso);

    if (error) {
      throw error;
    }

    attemptsCount = dbLogs ? dbLogs.length : 0;
    if (attemptsCount > 0 && dbLogs) {
      const dates = dbLogs.map(l => new Date(l.created_at).getTime()).sort((a, b) => a - b);
      oldestTimestamp = dates[0];
    }
  } catch (dbError) {
    // 2. In-memory rate tracking fallback if database table is temporarily unreachable
    const memKey = `${action}_${userKey}_${ipAddress}`;
    if (!activeRateLimitStore[memKey]) {
      activeRateLimitStore[memKey] = [];
    }
    activeRateLimitStore[memKey] = activeRateLimitStore[memKey].filter(t => t > windowStart);
    attemptsCount = activeRateLimitStore[memKey].length;
    if (attemptsCount > 0) {
      oldestTimestamp = activeRateLimitStore[memKey][0];
    }
    activeRateLimitStore[memKey].push(now);
  }

  // 3. Evaluate limits
  if (attemptsCount >= limit.max) {
    const msSinceOldest = now - oldestTimestamp;
    const retryAfterSeconds = Math.ceil((limit.windowMs - msSinceOldest) / 1000);
    const errorMessage = `Rate Limit Exceeded: You have reached the maximum of ${limit.max} ${limit.label.toLowerCase()} in the last ${limit.windowMs / 1000 / 60} minutes. Please retry in ${retryAfterSeconds}s.`;

    // Write audit event to real security_logs
    await addSecurityLog('RATE_LIMIT_EXCEEDED', userKey, {
      action,
      limitMax: limit.max,
      windowSeconds: limit.windowMs / 1000,
      attemptsCount: attemptsCount + 1,
      retryAfterSeconds,
      ipAddress,
      message: errorMessage,
    });

    return {
      allowed: false,
      message: errorMessage,
      retryAfterSeconds,
    };
  }

  // 4. Record new rate limit log to the Supabase tracking table
  try {
    await supabase
      .from('rate_limit_logs')
      .insert([{
        action,
        user_identity: userKey,
        ip_address: ipAddress,
        created_at: new Date().toISOString()
      }]);
  } catch (e) {
    // Ignore insertion errors if logging table is undergoing active migration
  }

  return { allowed: true };
}
