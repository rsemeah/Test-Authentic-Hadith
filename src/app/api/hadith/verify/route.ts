/**
 * API Route: Verify Hadith (Gated)
 * Constitutional gate: Only scholars and admins can verify
 */

import { gateAction, writeReceipt } from '@/lib/qbos/truth';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import type { ApiResponse, Verification, VerificationRequest } from '@/types/hadith';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body: VerificationRequest = await req.json();
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
    const gate = await gateAction('hadith.verify', {
      userId,
      userRole,
      sessionId: sessionId || undefined,
      metadata: {
        hadith_id: body.hadith_id,
      },
    });

    if (!gate.allowed) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: gate.reason || 'Permission denied: Only scholars can verify hadiths',
      }, { status: 403 });
    }

    // Validate required fields
    if (!body.hadith_id || !body.grade || !body.methodology) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Missing required fields: hadith_id, grade, methodology',
      }, { status: 400 });
    }

    // Verify hadith exists
    const supabase = createServerSupabaseClient();
    const { data: hadith, error: hadithError } = await supabase
      .from('hadiths')
      .select('*')
      .eq('id', body.hadith_id)
      .single();

    if (hadithError || !hadith) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Hadith not found',
      }, { status: 404 });
    }

    // Check if scholar already verified this hadith
    const { data: existingVerification } = await supabase
      .from('verifications')
      .select('id')
      .eq('hadith_id', body.hadith_id)
      .eq('scholar_id', userId)
      .single();

    if (existingVerification) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'You have already verified this hadith',
      }, { status: 400 });
    }

    // Insert verification
    const { data: verification, error: insertError } = await supabase
      .from('verifications')
      .insert({
        hadith_id: body.hadith_id,
        scholar_id: userId,
        grade: body.grade,
        methodology: body.methodology,
        reasoning: body.reasoning,
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Verification error:', insertError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to create verification',
      }, { status: 500 });
    }

    // Update hadith grade if this is a higher grade
    const gradeRanking = { mawdu: 0, daif: 1, hasan: 2, sahih: 3 };
    if (gradeRanking[body.grade] > gradeRanking[hadith.grade]) {
      await supabase
        .from('hadiths')
        .update({ grade: body.grade, status: 'verified' })
        .eq('id', body.hadith_id);
    }

    // WRITE RECEIPT: Proof of verification
    const receipt = await writeReceipt('hadith.verified', {
      sessionId: sessionId || 'unknown',
      hadithId: body.hadith_id,
      verificationId: verification.id,
      scholarId: userId,
      grade: body.grade,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiResponse<Verification>>({
      success: true,
      data: verification as Verification,
      receiptId: receipt.id,
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
