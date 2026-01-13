/**
 * GET /api/user/history
 * Get user's AI query history
 */

import { requireAuth } from '@/lib/utils/auth';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const supabase = createRouteHandlerClient({ cookies });

    // Parse query params for pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data, error, count } = await supabase
      .from('ai_queries')
      .select(
        `
        *,
        hadith:hadith(
          id,
          hadith_number,
          english_translation,
          collection:collections(name_english)
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      history: data,
      total: count,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('History fetch error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
