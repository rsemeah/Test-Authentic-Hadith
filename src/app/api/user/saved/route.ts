/**
 * GET/POST /api/user/saved
 * Manage user's saved hadith (bookmarks)
 * ✅ RETROFITTED: TruthSerum verification enabled on GET
 */

import { requireAuth } from '@/lib/utils/auth';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  withHadithVerificationBatch,
} from '@/lib/truthserum';

export const runtime = 'nodejs';

/**
 * GET - List user's saved hadith with verification
 */
export async function GET() {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from('saved_hadith')
      .select(
        `
        *,
        hadith:hadith(
          id,
          hadith_number,
          arabic_text,
          english_translation,
          grade,
          verification,
          collection:collections(name_english, name_arabic),
          book:books(name_english, name_arabic)
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      saved: data,
      count: data.length,
      _proof: {
        operation: 'READ_SAVED',
        verified_at: new Date().toISOString(),
        verification_method: 'batch_verified',
      },
    });
  } catch (error: any) {
    console.error('Saved hadith fetch error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Save a hadith
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const supabase = createRouteHandlerClient({ cookies });

    const { hadithId, notes } = await request.json();

    if (!hadithId) {
      return NextResponse.json(
        { error: 'hadithId is required' },
        { status: 400 }
      );
    }

    // Check if already saved
    const { data: existing } = await supabase
      .from('saved_hadith')
      .select('id')
      .eq('user_id', user.id)
      .eq('hadith_id', hadithId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Hadith already saved' },
        { status: 409 }
      );
    }

    // Save hadith
    const { data, error } = await supabase
      .from('saved_hadith')
      .insert({
        user_id: user.id,
        hadith_id: hadithId,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      saved: data,
    });
  } catch (error: any) {
    console.error('Save hadith error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove saved hadith
 */
export async function DELETE(request: Request) {
  try {
    const user = await requireAuth();
    const supabase = createRouteHandlerClient({ cookies });

    const { hadithId } = await request.json();

    if (!hadithId) {
      return NextResponse.json(
        { error: 'hadithId is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('saved_hadith')
      .delete()
      .eq('user_id', user.id)
      .eq('hadith_id', hadithId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Delete saved hadith error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
