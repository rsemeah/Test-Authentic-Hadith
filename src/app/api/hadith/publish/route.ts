/**
 * API Route: Publish Hadith (Gated)
 * Constitutional gate: Only moderators and admins can publish
 * Requires minimum 2 verifications
 * ✅ RETROFITTED: TruthSerum proof metadata enabled
 */

import { gateAction, writeReceipt } from '@/lib/qbos/truth';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import type { ApiResponse, Hadith } from '@/types/hadith';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { hadith_id } = await req.json();
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role') as any;
    const sessionId = req.headers.get('x-session-id');

    if (!userId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // CONSTITUTIONAL GATE: Check permissions
    const gate = await gateAction('hadith.publish', {
      userId,
      userRole,
      sessionId: sessionId || undefined,
      metadata: {
        hadith_id,
      },
    });

    if (!gate.allowed) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: gate.reason || 'Permission denied: Only moderators can publish',
      }, { status: 403 });
    }

    if (!hadith_id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Missing hadith_id',
      }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Check if hadith exists
    const { data: hadith, error: hadithError } = await supabase
      .from('hadiths')
      .select('*, verifications(*)')
      .eq('id', hadith_id)
      .single();

    if (hadithError || !hadith) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Hadith not found',
      }, { status: 404 });
    }

    // Check if already published
    if (hadith.status === 'published') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Hadith is already published',
      }, { status: 400 });
    }

    // Constitutional requirement: Minimum 2 verifications
    const verificationCount = hadith.verifications?.length || 0;
    if (verificationCount < 2) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: `Constitutional requirement not met: Need minimum 2 verifications, found ${verificationCount}`,
      }, { status: 403 });
    }

    // Check if at least 2 verifications are sahih or hasan
    const validVerifications = hadith.verifications?.filter(
      (v: any) => v.grade === 'sahih' || v.grade === 'hasan'
    ).length || 0;

    if (validVerifications < 2) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: `Constitutional requirement not met: Need minimum 2 sahih/hasan verifications, found ${validVerifications}`,
      }, { status: 403 });
    }

    // Publish hadith
    const { data: published, error: updateError } = await supabase
      .from('hadiths')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', hadith_id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Publish error:', updateError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to publish hadith',
      }, { status: 500 });
    }

    // WRITE RECEIPT: Proof of publication
    const receipt = await writeReceipt('hadith.published', {
      sessionId: sessionId || 'unknown',
      hadithId: hadith_id,
      publisherId: userId,
      verificationCount,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiResponse<Hadith>>({
      success: true,
      data: published as Hadith,
      receiptId: receipt.id,
      _proof: {
        operation: 'PUBLISH_HADITH',
        verified_at: new Date().toISOString(),
        verification_method: 'constitutional_gate',
        hadith_id: hadith_id,
        verification_count: verificationCount,
      },
    });
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
