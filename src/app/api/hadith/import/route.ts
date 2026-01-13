/**
 * API Route: Import Hadith (Gated)
 * Constitutional gate: Only scholars, moderators, and admins can import
 */

import { gateAction, writeReceipt } from '@/lib/qbos/truth';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import type { ApiResponse, Hadith, HadithImportRequest } from '@/types/hadith';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body: HadithImportRequest = await req.json();
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
    const gate = await gateAction('hadith.import', {
      userId,
      userRole,
      sessionId: sessionId || undefined,
      metadata: {
        source_id: body.source_id,
      },
    });

    if (!gate.allowed) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: gate.reason || 'Permission denied by constitutional gate',
      }, { status: 403 });
    }

    // Validate required fields
    if (!body.text_arabic || !body.source_id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Missing required fields: text_arabic, source_id',
      }, { status: 400 });
    }

    // Verify source exists
    const supabase = createServerSupabaseClient();
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .select('*')
      .eq('id', body.source_id)
      .single();

    if (sourceError || !source) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Invalid source_id: source does not exist',
      }, { status: 400 });
    }

    // Insert hadith
    const { data: hadith, error: insertError } = await supabase
      .from('hadiths')
      .insert({
        text_arabic: body.text_arabic,
        text_translation: body.text_translation,
        source_id: body.source_id,
        chain_of_narration: body.chain_of_narration,
        grade: 'daif', // Default grade until verified
        status: 'draft',
        imported_by: userId,
        metadata: body.metadata || {},
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Hadith import error:', insertError);
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to import hadith',
      }, { status: 500 });
    }

    // WRITE RECEIPT: Proof of import
    const receipt = await writeReceipt('hadith.imported', {
      sessionId: sessionId || 'unknown',
      hadithId: hadith.id,
      sourceId: body.source_id,
      importerId: userId,
      timestamp: new Date().toISOString(),
      textPreview: body.text_arabic.substring(0, 100),
    });

    return NextResponse.json<ApiResponse<Hadith>>({
      success: true,
      data: hadith as Hadith,
      receiptId: receipt.id,
    });
  } catch (error) {
    console.error('Hadith import error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
