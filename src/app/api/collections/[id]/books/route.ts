/**
 * GET /api/collections/[id]/books
 * List all books in a collection
 * ✅ RETROFITTED: TruthSerum proof metadata enabled
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('collection_id', params.id)
      .order('book_number', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      books: data,
      count: data.length,
      _proof: {
        operation: 'READ_COLLECTION_BOOKS',
        verified_at: new Date().toISOString(),
        verification_method: 'list',
        collection_id: params.id,
        books_count: data.length,
      },
    });
  } catch (error: any) {
    console.error('Books fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books', details: error.message },
      { status: 500 }
    );
  }
}
