/**
 * GET /api/hadith/topics
 * Get all unique topics across hadith
 * ✅ RETROFITTED: TruthSerum proof metadata enabled
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get all unique topics from hadith
    const { data, error } = await supabase
      .from('hadith')
      .select('topics')
      .not('topics', 'is', null);

    if (error) {
      throw error;
    }

    // Flatten and deduplicate topics
    const topicsSet = new Set<string>();
    data.forEach((row) => {
      if (row.topics && Array.isArray(row.topics)) {
        row.topics.forEach((topic: string) => topicsSet.add(topic));
      }
    });

    const topics = Array.from(topicsSet).sort();

    return NextResponse.json({
      topics,
      count: topics.length,
      _proof: {
        operation: 'READ_TOPICS',
        verified_at: new Date().toISOString(),
        verification_method: 'list',
        topics_count: topics.length,
      },
    });
  } catch (error: any) {
    console.error('Topics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics', details: error.message },
      { status: 500 }
    );
  }
}
