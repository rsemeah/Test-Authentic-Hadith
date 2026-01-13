/**
 * Authentication Utilities
 * Helpers for Supabase Auth session management
 */

import { createRouteHandlerClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { type User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export type UserRole = 'free' | 'premium' | 'lifetime';

export interface UserProfile {
  id: string;
  email: string;
  tier: UserRole;
  ai_queries_today: number;
  ai_queries_total: number;
  saved_hadith_count: number;
  last_reset_date: string;
  created_at: string;
}

/**
 * Get current user from server component
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get current user from route handler
 */
export async function getCurrentUserFromRoute(): Promise<User | null> {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get user profile with tier information
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * Require authentication (throw if not authenticated)
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUserFromRoute();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * Require authentication and return profile
 */
export async function requireAuthWithProfile(): Promise<{
  user: User;
  profile: UserProfile;
}> {
  const user = await requireAuth();
  const profile = await getUserProfile(user.id);

  if (!profile) {
    throw new Error('Profile not found');
  }

  return { user, profile };
}

/**
 * Check if user has specific tier or higher
 */
export function hasTier(userTier: UserRole, requiredTier: UserRole): boolean {
  const tierHierarchy: Record<UserRole, number> = {
    free: 0,
    premium: 1,
    lifetime: 2,
  };

  return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
}
