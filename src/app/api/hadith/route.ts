/**
 * GET /api/hadith
 * List hadith with pagination
 * Supports filtering by collection and book
 * ✅ RETROFITTED: TruthSerum verification enabled
 */

import {
    storeAuditLogEntry,
    TruthSerumContext,
    withHadithVerificationBatch,
    withReceiptEmission,
    withTruthSerum,
} from '@/lib/truthserum';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export const GET = withTruthSerum(
  async (request: NextRequest, context: TruthSerumContext) => {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collection');
    const bookId = searchParams.get('book');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createRouteHandlerClient({ cookies });

    let queryBuilder = supabase
      .from('hadith')
      .select(
        `
        id,
        hadith_number,
        arabic_text,
        english_translation,
        grade,
        topics,
        verification,
        collection:collections(id, name_english, name_arabic),
        book:books(id, book_number, name_english, name_arabic)
      `,
        { count: 'exact' }
      )
      .order('hadith_number', { ascending: true });

    // Apply filters
    if (collectionId) {
      queryBuilder = queryBuilder.eq('collection_id', collectionId);
    }

    if (bookId) {
      queryBuilder = queryBuilder.eq('book_id', bookId);
    }

    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw error;
    }

    // ✅ ENFORCE: Batch verify all hadith
    const { verified, failed_count } = withHadithVerificationBatch(
      data || [],
      context
    );

    // ✅ EMIT: Proof receipt
    const receipt = await withReceiptEmission(
      context,
      'SEARCH_HADITH',
      { collection: collectionId, book: bookId, limit, offset },
      {
        entity_ids: verified.map((h: any) => h.id),
        count: verified.length
      },
      storeAuditLogEntry
    );

    return NextResponse.json({
      hadith: verified,
      total: count,
      limit,
      offset,
      verification: {
        verified_count: verified.length,
        failed_count,
        proof_receipt_id: receipt.receipt_id
      }
    });
  }
)
