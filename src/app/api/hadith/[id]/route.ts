/**
 * GET /api/hadith/[id]
 * Fetch single hadith with full details
 * ✅ RETROFITTED: TruthSerum verification enabled
 */

import {
    storeAuditLogEntry,
    TruthSerumContext,
    withHadithVerification,
    withReceiptEmission,
} from '@/lib/truthserum';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: hadith, error } = await supabase
      .from('hadith')
      .select(
        `
        *,
        collection:collections(
          id,
          name_english,
          name_arabic,
          description,
          hadith_count
        ),
        book:books(
          id,
          book_number,
          name_english,
          name_arabic,
          hadith_count
        )
      `
      )
      .eq('id', params.id)
      .single();

    if (error || !hadith) {
      return NextResponse.json(
        { error: 'Hadith not found' },
        { status: 404 }
      );
    }

    // ✅ ENFORCE: Verify hadith
    const context: TruthSerumContext = {
      request_id: crypto.randomUUID(),
      start_time: Date.now(),
      receipt_data: {
        operation: 'HADITH_DETAIL',
        inputs: { hadith_id: params.id },
        verified_count: 1,
        unverified_count: 0,
      },
    };

    const verifiedHadith = withHadithVerification(hadith, context);

    // ✅ EMIT: Proof receipt
    const receipt = await withReceiptEmission(
      context,
      'HADITH_DETAIL',
      { hadith_id: params.id },
      { entity_ids: [verifiedHadith.id], count: 1 },
      storeAuditLogEntry
    );

    return NextResponse.json({
      hadith: verifiedHadith,
      verification: {
        verified: true,
        proof_receipt_id: receipt.receipt_id,
      },
    });
  } catch (error: any) {
    console.error('Hadith fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hadith', details: error.message },
      { status: 500 }
    );
  }
}
