/**
 * POST /api/ai/explain
 * AI-powered hadith explanations with SafetyEngine + SilentEngine
 * ✅ RETROFITTED: TruthSerum verification and citation enforcement enabled
 * CRITICAL: SafetyEngine checks happen BEFORE any AI processing
 */

import { SafetyEngine } from '@/lib/safety-engine';
import { SilentEngine } from '@/lib/silent-engine';
import {
    calculateCitationCoverage,
    computeContentHash,
    createVerificationPrimitive,
    extractAndValidateCitations,
    storeAuditLogEntry,
    TruthSerumContext,
    withAIVerification,
    withHadithVerification,
    withReceiptEmission,
    withTruthSerum,
} from '@/lib/truthserum';
import { requireAuthWithProfile } from '@/lib/utils/auth';
import { checkQuota, incrementQuota } from '@/lib/utils/quota';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface ExplainRequest {
  hadithId: string;
  query: string;
}

export const POST = withTruthSerum(
  async (request: NextRequest, context: TruthSerumContext) => {
    // 1. Require authentication
    const { user, profile } = await requireAuthWithProfile();

    // 2. Parse request
    const { hadithId, query }: ExplainRequest = await request.json();

    if (!hadithId || !query) {
      return NextResponse.json(
        { error: 'hadithId and query are required' },
        { status: 400 }
      );
    }

    // 3. CRITICAL: SafetyEngine check (before anything else)
    const safetyCheck = SafetyEngine.evaluate(query);
    if (!safetyCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Query blocked by safety filter',
          category: safetyCheck.category,
          safeResponse: safetyCheck.safeResponse,
        },
        { status: 400 }
      );
    }

    // 4. Check quota
    const quotaStatus = await checkQuota(profile);
    if (!quotaStatus.allowed) {
      return NextResponse.json(
        {
          error: 'Daily AI quota exceeded',
          used: quotaStatus.used,
          limit: quotaStatus.limit,
          resetsAt: quotaStatus.resetsAt,
          upgradeUrl: '/pricing',
        },
        { status: 429 }
      );
    }

    // 5. Fetch hadith context
    const supabase = createRouteHandlerClient({ cookies });
    const { data: hadith, error: hadithError } = await supabase
      .from('hadith')
      .select(
        `
        *,
        verification,
        collection:collections(name_english, name_arabic),
        book:books(name_english, name_arabic)
      `
      )
      .eq('id', hadithId)
      .single();

    if (hadithError || !hadith) {
      return NextResponse.json({ error: 'Hadith not found' }, { status: 404 });
    }

    // ✅ ENFORCE: Verify hadith before using as source
    const verifiedHadith = withHadithVerification(hadith, context);

    // 6. SilentEngine routing (cost-optimized)
    const response = await SilentEngine.generate({
      messages: [
        {
          role: 'system',
          content: `You are an Islamic education assistant helping users understand hadith. Follow these rules strictly:

1. NEVER issue religious rulings (fatwas) or halal/haram determinations
2. NEVER provide medical, legal, or financial advice
3. Focus on historical context, linguistic meanings, and general teachings
4. If asked for a ruling, redirect to qualified scholars
5. Be respectful, educational, and academically rigorous
6. MUST cite specific parts of the hadith text in your explanation (required for verification)
7. Keep responses concise (200-300 words)

Your role is to educate, not to rule. Always ground your explanation in the hadith text provided.`,
        },
        {
          role: 'user',
          content: `Hadith:
"${verifiedHadith.english_translation}"

Collection: ${verifiedHadith.collection?.name_english}
Book: ${verifiedHadith.book?.name_english}
Grade: ${verifiedHadith.grade || 'Not graded'}

Question: ${query}

Provide an educational explanation focusing on context and meaning, not rulings. MUST cite the hadith text.`,
        },
      ],
      maxCost: 0.01, // Max $0.01 per query
      preferredCapabilities: ['low_cost', 'fast_latency'],
      temperature: 0.7,
      maxTokens: 500,
    });

    // ✅ ENFORCE: Extract and validate citations
    const citations = extractAndValidateCitations(
      response.text,
      [verifiedHadith],
      new Map([[verifiedHadith.id, verifiedHadith.verification.content_hash]])
    );

    const citationCoverage = calculateCitationCoverage(response.text, citations);

    // ✅ CREATE: AI explanation with verification
    const explanation = {
      id: context.request_id, // Use request ID as explanation ID
      hadith_id: hadithId,
      explanation: response.text,
      explanation_hash: computeContentHash(response.text),
      citations,
      citation_coverage: citationCoverage,
      model: response.model || 'gpt-3.5-turbo',
      model_version: '1.0',
      temperature: 0.7,
      tokens_used: response.tokensUsed || 0,
      safety_check: {
        passed: safetyCheck.allowed,
        patterns_triggered: [],
        blocked_content: undefined,
      },
      verification: createVerificationPrimitive(
        computeContentHash(response.text),
        `hadith:${hadithId}`,
        verifiedHadith.verification.content_hash,
        'system_generated'
      ),
      created_at: new Date().toISOString(),
      regenerated_count: 0,
    };

    // ✅ ENFORCE: Must have citations
    const verifiedExplanation = withAIVerification(explanation, context);

    // 7. Save query to history
    await supabase.from('ai_queries').insert({
      user_id: user.id,
      hadith_id: hadithId,
      query_text: query,
      response_text: response.text,
      tokens_used: response.tokensUsed,
      citations_count: citations.length,
      citation_coverage: citationCoverage,
    });

    // 8. Increment quota
    await incrementQuota(user.id);

    // ✅ EMIT: Proof receipt
    const receipt = await withReceiptEmission(
      context,
      'AI_EXPLAIN',
      {
        hadith_id: hadithId,
        query,
        query_hash: computeContentHash(query),
      },
      {
        entity_ids: [verifiedExplanation.id],
        count: 1,
      },
      storeAuditLogEntry
    );

    // 9. Return response with verification
    return NextResponse.json({
      response: verifiedExplanation.explanation,
      citations: verifiedExplanation.citations,
      citation_coverage: citationCoverage,
      cost: response.actualCost,
      provider: response.provider,
      model: response.model,
      latency: response.latencyMs,
      quotaRemaining: quotaStatus.limit - quotaStatus.used - 1,
      verification: {
        explanation_hash: verifiedExplanation.explanation_hash,
        sources_verified: true,
        proof_receipt_id: receipt.receipt_id,
      },
    });
  }
)
