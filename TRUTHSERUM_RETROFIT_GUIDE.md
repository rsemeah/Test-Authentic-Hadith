/**
 * TruthSerum Retrofit Guide
 * Examples of how to integrate TruthSerum into existing API routes
 * 
 * This file demonstrates the retrofit pattern for all three major operations:
 * 1. Reading hadith (with verification)
 * 2. Searching (with verification batch)
 * 3. AI explanations (with citations)
 */

// ============================================================================
// EXAMPLE 1: GET /api/hadith/[id] - Single Hadith Read
// ============================================================================

/**
 * BEFORE (without TruthSerum):
 * 
 * export async function GET(
 *   request: Request,
 *   { params }: { params: { id: string } }
 * ) {
 *   const hadith = await db.hadith.findById(params.id)
 *   return NextResponse.json(hadith)  // ❌ Unverified!
 * }
 */

/**
 * AFTER (with TruthSerum):
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  withTruthSerum,
  withHadithVerification,
  withReceiptEmission,
  TruthSerumContext,
  storeAuditLogEntry
} from '@/lib/truthserum'

export const GET = withTruthSerum(
  async (request: NextRequest, context: TruthSerumContext) => {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    // Get hadith from database
    const hadith = await db.hadith.findById(id)

    // ✅ ENFORCE: Must verify before returning
    const verified = withHadithVerification(hadith, context)

    // ✅ EMIT: Proof receipt
    const receipt = await withReceiptEmission(
      context,
      'GET_HADITH',
      { id },
      verified,
      storeAuditLogEntry
    )

    // ✅ RETURN: Verified data with receipt
    return NextResponse.json({
      data: verified,
      proof: receipt
    })
  }
)

// ============================================================================
// EXAMPLE 2: GET /api/hadith/search - Search with Batch Verification
// ============================================================================

/**
 * BEFORE (without TruthSerum):
 * 
 * export async function GET(request: Request) {
 *   const query = new URL(request.url).searchParams.get('q')
 *   const results = await db.hadith.search(query)
 *   return NextResponse.json(results)  // ❌ No verification, no audit!
 * }
 */

/**
 * AFTER (with TruthSerum):
 */
import { withHadithVerificationBatch } from '@/lib/truthserum'

export const GET_SEARCH = withTruthSerum(
  async (request: NextRequest, context: TruthSerumContext) => {
    const searchParams = new URL(request.url).searchParams
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query) {
      return NextResponse.json(
        { error: 'Search query required' },
        { status: 400 }
      )
    }

    // Search database
    const results = await db.hadith.search(query, limit)

    // ✅ ENFORCE: Batch verify all results
    const { verified, failed_count } = withHadithVerificationBatch(
      results,
      context
    )

    // ✅ EMIT: Receipt with batch stats
    const receipt = await withReceiptEmission(
      context,
      'SEARCH_HADITH',
      { query, limit },
      {
        entity_ids: verified.map(h => h.id),
        count: verified.length
      },
      storeAuditLogEntry
    )

    // ✅ RETURN: Verified results with statistics
    return NextResponse.json({
      data: verified,
      stats: {
        total: verified.length,
        verified: verified.length,
        failed: failed_count
      },
      proof: receipt
    })
  }
)

// ============================================================================
// EXAMPLE 3: POST /api/ai/explain - AI Explanation with Citations
// ============================================================================

/**
 * BEFORE (without TruthSerum):
 * 
 * export async function POST(request: Request) {
 *   const { hadithId, question } = await request.json()
 *   const hadith = await db.hadith.findById(hadithId)
 *   
 *   const explanation = await openai.createCompletion({
 *     prompt: `Explain ${hadith.arabic_text}`
 *   })
 *   
 *   return NextResponse.json({ explanation })  // ❌ No citations, no source tracking!
 * }
 */

/**
 * AFTER (with TruthSerum):
 */
import {
  withAIVerification,
  enforceAICitations,
  extractAndValidateCitations,
  calculateCitationCoverage
} from '@/lib/truthserum'

export const POST_AI = withTruthSerum(
  async (request: NextRequest, context: TruthSerumContext) => {
    const { hadithId, question } = await request.json()

    // Get and verify source hadith
    const hadith = await db.hadith.findById(hadithId)
    const verifiedHadith = withHadithVerification(hadith, context)

    // Get AI explanation
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You MUST cite specific parts of the hadith text in your explanation. Always reference which parts of the original text your explanation is based on.`
        },
        {
          role: 'user',
          content: `Explain this hadith: "${verifiedHadith.arabic_text}". Question: ${question}`
        }
      ]
    })

    const explanationText = response.choices[0].message.content

    // ✅ EXTRACT: Citations from response
    const citations = extractAndValidateCitations(
      explanationText,
      [verifiedHadith],
      new Map([[verifiedHadith.id, verifiedHadith.verification.content_hash]])
    )

    // ✅ ENFORCE: Must have citations
    const explanation = {
      id: crypto.randomUUID(),
      hadith_id: hadithId,
      explanation: explanationText,
      explanation_hash: computeContentHash(explanationText),
      citations,
      citation_coverage: calculateCitationCoverage(explanationText, citations),
      model: 'gpt-4',
      model_version: response.model,
      temperature: 0.7,
      tokens_used: response.usage.total_tokens,
      safety_check: { passed: true, patterns_triggered: [] },
      verification: createVerificationPrimitive(
        computeContentHash(explanationText),
        `hadith:${hadithId}`,
        verifiedHadith.verification.content_hash,
        'system_generated'
      ),
      created_at: new Date().toISOString(),
      regenerated_count: 0
    }

    // This will throw if citations missing
    const verified = withAIVerification(explanation, context)

    // ✅ EMIT: Receipt proving citations exist
    const receipt = await withReceiptEmission(
      context,
      'AI_EXPLAIN',
      { hadith_id: hadithId, question },
      verified,
      storeAuditLogEntry
    )

    // ✅ RETURN: Explanation with citations and proof
    return NextResponse.json({
      data: verified,
      proof: receipt
    })
  }
)

// ============================================================================
// EXAMPLE 4: Safety Logging
// ============================================================================

/**
 * BEFORE (without TruthSerum):
 * 
 * const query = await getQuery()
 * if (blockedPatterns.some(p => p.test(query))) {
 *   return { allowed: false }  // ❌ No logging, no metrics!
 * }
 */

/**
 * AFTER (with TruthSerum):
 */
import { withSafetyLogging, storeSafetyDecision } from '@/lib/truthserum'

async function checkQuerySafety(query: string, userId?: string) {
  const patterns = await loadSafetyPatterns()
  const matched = patterns.filter(p => p.regex.test(query))

  const decision = matched.length > 0 ? 'blocked' : 'allowed'

  // ✅ LOG: Every decision for metrics
  await storeSafetyDecision(
    query,
    computeContentHash(query),
    decision,
    matched,
    patterns.length,
    userId,
    getSessionId()
  )

  return { allowed: decision === 'allowed' }
}

// ============================================================================
// RETROFIT CHECKLIST
// ============================================================================

/**
 * For each API route, apply these steps:
 * 
 * 1. ADD IMPORTS
 *    ✅ withTruthSerum, withHadithVerification, withReceiptEmission
 *    ✅ storeAuditLogEntry for audit log storage
 * 
 * 2. WRAP HANDLER
 *    ✅ Change: export async function GET(req, params)
 *    ✅ To:      export const GET = withTruthSerum(async (req, context) => ...)
 * 
 * 3. FETCH DATA
 *    ✅ const hadith = await db.hadith.findById(id)
 * 
 * 4. VERIFY BEFORE RETURNING
 *    ✅ const verified = withHadithVerification(hadith, context)
 * 
 * 5. EMIT RECEIPT
 *    ✅ const receipt = await withReceiptEmission(
 *       context, 'GET_HADITH', inputs, outputs, storeAuditLogEntry
 *    )
 * 
 * 6. RETURN WITH PROOF
 *    ✅ return NextResponse.json({ data: verified, proof: receipt })
 */
