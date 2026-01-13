/**
 * GET /api/ai/quota
 * Get user's AI query quota status
 */

import { requireAuthWithProfile } from '@/lib/utils/auth';
import { checkQuota } from '@/lib/utils/quota';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Require authentication
    const { user, profile } = await requireAuthWithProfile();

    // Check quota
    const quotaStatus = await checkQuota(profile);

    return NextResponse.json({
      used: quotaStatus.used,
      limit: quotaStatus.limit,
      remaining: quotaStatus.limit - quotaStatus.used,
      resetsAt: quotaStatus.resetsAt,
      tier: quotaStatus.tier,
      allowed: quotaStatus.allowed,
    });
  } catch (error: any) {
    console.error('Quota check error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
