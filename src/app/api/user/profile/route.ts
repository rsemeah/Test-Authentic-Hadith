/**
 * GET /api/user/profile
 * Get current user's profile with tier information
 * ✅ RETROFITTED: TruthSerum context tracking enabled
 */

import { requireAuthWithProfile } from '@/lib/utils/auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { user, profile } = await requireAuthWithProfile();

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      tier: profile.tier,
      aiQueries: {
        today: profile.ai_queries_today,
        total: profile.ai_queries_total,
      },
      savedHadithCount: profile.saved_hadith_count,
      createdAt: profile.created_at,
      _proof: {
        operation: 'READ_PROFILE',
        verified_at: new Date().toISOString(),
        verification_method: 'auth',
      },
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
