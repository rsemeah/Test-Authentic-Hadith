import {
  storeAuditLogEntry,
  TruthSerumContext,
  withHadithVerification,
  withReceiptEmission,
  withTruthSerum,
} from '@/lib/truthserum';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export const GET = withTruthSerum(
  async (request: NextRequest, context: TruthSerumContext) => {
    // Get daily hadith based on current date
    const today = new Date().toISOString().split('T')[0];
    const dayOfYear = Math.floor(
      (new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
    );

    // Query random hadith (or use day-based seed for consistency)
    const { data: hadith, error } = await supabase
      .from('hadith')
      .select('*, verification')
      .eq('is_verified', true)
      .limit(1)
      .offset(dayOfYear % 36000); // Distribute across the year

    if (error) throw error;

    let dailyHadith;

    if (!hadith || hadith.length === 0) {
      // Fallback to any verified hadith
      const { data: fallbackHadith, error: fallbackError } = await supabase
        .from('hadith')
        .select('*, verification')
        .eq('is_verified', true)
        .limit(1)
        .single();

      if (fallbackError) throw fallbackError;
      dailyHadith = fallbackHadith;
    } else {
      dailyHadith = hadith[0];
    }

    // ✅ ENFORCE: Verify before returning
    const verified = withHadithVerification(dailyHadith, context);

    // ✅ EMIT: Proof receipt
    const receipt = await withReceiptEmission(
      context,
      'GET_HADITH',
      { date: today, operation: 'daily_hadith' },
      {
        entity_ids: [verified.id],
        count: 1
      },
      storeAuditLogEntry
    );

    return NextResponse.json({
      hadith: verified,
      date: today,
      proof_receipt_id: receipt.receipt_id
    });
  }
)
