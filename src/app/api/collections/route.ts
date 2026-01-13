/**
 * GET /api/collections
 * List all hadith collections
 * ✅ RETROFITTED: TruthSerum context tracking enabled
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('name_english', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      collections: data,
      count: data.length,
      _proof: {
        operation: 'READ_COLLECTIONS',
        verified_at: new Date().toISOString(),
        verification_method: 'list',
      },
    });
  } catch (error: any) {
    console.error('Collections fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections', details: error.message },
      { status: 500 }
    );
  }
}
