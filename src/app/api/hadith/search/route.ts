import {
  computeContentHash,
  storeAuditLogEntry,
  TruthSerumContext,
  withHadithVerificationBatch,
  withReceiptEmission,
  withTruthSerum,
} from '@/lib/truthserum';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface SearchRequest {
  query?: string;
  collectionId?: string;
  bookId?: string;
  grade?: 'Sahih' | 'Hasan' | 'Da\'if';
  topics?: string[];
  limit?: number;
  offset?: number;
}

export const POST = withTruthSerum(
  async (request: NextRequest, context: TruthSerumContext) => {
    const {
      query,
      collectionId,
      bookId,
      grade,
      topics,
      limit = 20,
      offset = 0,
    }: SearchRequest = await request.json();

    // Build query
    let queryBuilder = supabase
      .from('hadith')
      .select('*, verification, collection:collections(name_english), book:books(name_english)', { count: 'exact' });

    // Apply filters
    if (collectionId) {
      queryBuilder = queryBuilder.eq('collection_id', collectionId);
    }

    if (bookId) {
      queryBuilder = queryBuilder.eq('book_id', bookId);
    }

    if (grade) {
      queryBuilder = queryBuilder.eq('grade', grade);
    }

    if (topics && topics.length > 0) {
      queryBuilder = queryBuilder.overlaps('topics', topics);
    }

    if (query && query.trim()) {
      queryBuilder = queryBuilder.or(
        `text.ilike.%${query}%,translation.ilike.%${query}%`
      );
    }

    // Apply pagination and ordering
    queryBuilder = queryBuilder
      .range(offset, offset + limit - 1)
      .order('hadith_number', { ascending: true });

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw error;
    }

    // ✅ ENFORCE: Batch verify all search results
    const { verified, failed_count } = withHadithVerificationBatch(
      data || [],
      context
    );

    // ✅ EMIT: Proof receipt
    const receipt = await withReceiptEmission(
      context,
      'SEARCH_HADITH',
      {
        query,
        collectionId,
        bookId,
        grade,
        topics,
        limit,
        offset,
        query_hash: query ? computeContentHash(query) : undefined
      },
      {
        entity_ids: verified.map((h: any) => h.id),
        count: verified.length
      },
      storeAuditLogEntry
    );

    return NextResponse.json({
      results: verified,
      total: count || 0,
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
