/**
 * Quota Management Utilities
 * Enforce tier-based usage limits for AI queries
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { type UserProfile, type UserRole } from './auth';

export const QUOTA_LIMITS: Record<UserRole, number> = {
  free: 5, // 5 AI queries per day
  premium: Infinity, // Unlimited
  lifetime: Infinity, // Unlimited
};

export interface QuotaStatus {
  allowed: boolean;
  used: number;
  limit: number;
  resetsAt: Date;
  tier: UserRole;
}

/**
 * Check if user has remaining quota
 */
export async function checkQuota(profile: UserProfile): Promise<QuotaStatus> {
  const limit = QUOTA_LIMITS[profile.tier];
  const used = profile.ai_queries_today;

  // Check if we need to reset (new day)
  const lastReset = new Date(profile.last_reset_date);
  const today = new Date();
  const needsReset = lastReset.toDateString() !== today.toDateString();

  if (needsReset) {
    // Reset quota
    const supabase = createRouteHandlerClient({ cookies });
    await supabase
      .from('profiles')
      .update({
        ai_queries_today: 0,
        last_reset_date: today.toISOString().split('T')[0],
      })
      .eq('id', profile.id);

    return {
      allowed: true,
      used: 0,
      limit,
      resetsAt: getNextResetTime(),
      tier: profile.tier,
    };
  }

  return {
    allowed: used < limit,
    used,
    limit,
    resetsAt: getNextResetTime(),
    tier: profile.tier,
  };
}

/**
 * Increment AI query count
 */
export async function incrementQuota(userId: string): Promise<void> {
  const supabase = createRouteHandlerClient({ cookies });

  await supabase.rpc('increment_ai_queries', { user_id: userId });
}

/**
 * Get next quota reset time (midnight UTC)
 */
function getNextResetTime(): Date {
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  return tomorrow;
}

/**
 * Get quota status for user
 */
export async function getQuotaStatus(userId: string): Promise<QuotaStatus> {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile) {
    throw new Error('Profile not found');
  }

  return checkQuota(profile);
}
