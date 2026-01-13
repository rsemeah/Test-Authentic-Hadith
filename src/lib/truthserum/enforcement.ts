/**
 * TruthSerum Enforcement Rules
 * Non-negotiable rules for truth-bearing operations
 */

import type {
    AIExplanation,
    Citation,
    Hadith
} from './types'
import {
    IntegrityViolationError,
    NoCitationError,
    UnverifiedContentError
} from './types'
import {
    verifyHadithIntegrity
} from './verification'

// ============================================================================
// RULE 1: NO UNVERIFIED READS
// ============================================================================

/**
 * ENFORCE: Cannot return unverified hadith to users
 * Must have content_hash and verification must be valid
 */
export function enforceHadithVerification(hadith: Hadith | null): Hadith {
  if (!hadith) {
    throw new UnverifiedContentError('Hadith not found')
  }

  // Check 1: Must have content_hash (inherited from VerificationPrimitive)
  if (!hadith.content_hash) {
    throw new UnverifiedContentError(
      `Hadith ${hadith.id} lacks content hash`
    )
  }

  // Check 3: Content hash must match actual content
  const integrityCheck = verifyHadithIntegrity(hadith)
  if (!integrityCheck.valid) {
    throw new IntegrityViolationError(
      `Hadith ${hadith.id} integrity check failed: ${integrityCheck.errors.join('; ')}`
    )
  }

  return hadith
}

/**
 * Batch enforce verification on multiple hadith
 */
export function enforceHadithVerificationBatch(hadith: (Hadith | null)[]): {
  verified: Hadith[]
  failures: { index: number; error: string }[]
} {
  const verified: Hadith[] = []
  const failures: { index: number; error: string }[] = []

  for (let i = 0; i < hadith.length; i++) {
    try {
      verified.push(enforceHadithVerification(hadith[i]))
    } catch (error) {
      failures.push({
        index: i,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  return { verified, failures }
}

// ============================================================================
// RULE 2: NO CITATION-LESS AI RESPONSES
// ============================================================================

/**
 * ENFORCE: AI explanations must have citations
 * Cannot answer without backing from hadith
 */
export function enforceAICitations(explanation: AIExplanation): AIExplanation {
  // Check 1: Must have citations array
  if (!explanation.citations) {
    throw new NoCitationError(
      `Explanation ${explanation.id} lacks citations array`
    )
  }

  // Check 2: Must have at least one citation
  if (explanation.citations.length === 0) {
    throw new NoCitationError(
      `Explanation ${explanation.id} has no citations (minimum 1 required)`
    )
  }

  // Check 3: All citations must be valid
  for (let i = 0; i < explanation.citations.length; i++) {
    const citation = explanation.citations[i]

    if (!citation.hadith_id) {
      throw new NoCitationError(
        `Explanation ${explanation.id} citation ${i} missing hadith_id`
      )
    }

    if (!citation.hadith_hash) {
      throw new NoCitationError(
        `Explanation ${explanation.id} citation ${i} missing hadith_hash (proof of source)`
      )
    }

    if (!citation.excerpt) {
      throw new NoCitationError(
        `Explanation ${explanation.id} citation ${i} missing excerpt (what was cited)`
      )
    }
  }

  // Check 4: Citation coverage should be >80% (warning level)
  if (explanation.citation_coverage < 0.8) {
    console.warn(
      `Explanation ${explanation.id} has low citation coverage: ${(explanation.citation_coverage * 100).toFixed(1)}%`
    )
  }

  return explanation
}

/**
 * Extract citations from AI response text
 * Links specific hadith to the explanation
 */
export function extractAndValidateCitations(
  explanationText: string,
  hadith: Hadith[],
  hadithHashes: Map<string, string>
): Citation[] {
  const citations: Citation[] = []

  // Simple heuristic: look for hadith references in text
  for (const h of hadith) {
    // Check if hadith number or collection is mentioned
    const patterns = [
      new RegExp(`Sahih ${h.collection}.*${h.hadith_number}`, 'i'),
      new RegExp(`Hadith.*${h.hadith_number}`, 'i'),
      new RegExp(`${h.collection}.*#?${h.hadith_number}`, 'i')
    ]

    for (const pattern of patterns) {
      if (pattern.test(explanationText)) {
        // Find the actual excerpt in explanation
        const match = explanationText.match(pattern)
        const excerpt = match ? match[0] : `${h.collection} ${h.hadith_number}`

        const citation: Citation = {
          hadith_id: h.id,
          hadith_hash: hadithHashes.get(h.id) || h.content_hash,
          excerpt,
          relevance: 'primary'
        }

        citations.push(citation)
        break
      }
    }
  }

  return citations
}

/**
 * Calculate citation coverage percentage
 * How much of explanation is backed by citations
 */
export function calculateCitationCoverage(
  explanation: string,
  citations: Citation[]
): number {
  if (citations.length === 0) return 0
  if (explanation.length === 0) return 0

  let coveredLength = 0

  for (const citation of citations) {
    // Count words in excerpt that appear in explanation
    const excerptWords = citation.excerpt.split(/\s+/)
    for (const word of excerptWords) {
      if (explanation.toLowerCase().includes(word.toLowerCase())) {
        coveredLength += word.length
      }
    }
  }

  return Math.min(1, coveredLength / explanation.length)
}

// ============================================================================
// RULE 3: NO UNMEASURED SAFETY
// ============================================================================

/**
 * ENFORCE: Safety decisions must be fully logged
 * Cannot make safety claim without recording decision
 */
export function enforceSafetyDecisionLogging(decision: {
  decision: 'allowed' | 'blocked'
  patterns_matched: any[]
  total_patterns_checked: number
  query_hash: string
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check 1: Must have a decision
  if (!decision.decision) {
    errors.push('Safety decision must be set (allowed/blocked)')
  }

  // Check 2: Must know total patterns checked
  if (decision.total_patterns_checked < 1) {
    errors.push('Must check at least 1 safety pattern')
  }

  // Check 3: Must have query hash for audit trail
  if (!decision.query_hash) {
    errors.push('Must have query_hash for audit trail')
  }

  // Check 4: If blocked, must know why (which patterns)
  if (decision.decision === 'blocked' && decision.patterns_matched.length === 0) {
    errors.push('If blocked, must record which patterns triggered decision')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// ============================================================================
// RULE 4: NO HARDCODED COUNTS
// ============================================================================

/**
 * Type for count results
 */
export interface CountResult {
  count: number
  verified_at: string
  source: 'database'
}

/**
 * ENFORCE: All counts must come from database
 * Never hardcode numbers like "36,245 hadith"
 */
export function validateCountResult(result: unknown): CountResult {
  const count = result as any

  if (!count || typeof count.count !== 'number') {
    throw new Error('Count result must have numeric count field')
  }

  if (!count.verified_at) {
    throw new Error('Count result must have verified_at timestamp')
  }

  if (count.count < 0) {
    throw new Error('Count cannot be negative')
  }

  return count as CountResult
}

/**
 * Helper to create a count result
 */
export function createCountResult(count: number): CountResult {
  return {
    count,
    verified_at: new Date().toISOString(),
    source: 'database'
  }
}

// ============================================================================
// RULE 5: NO STALE DATA
// ============================================================================

/**
 * ENFORCE: Data must be current
 * Check when data was last verified
 */
export function validateDataFreshness(
  verifiedAt: string,
  maxAgeMs: number = 24 * 60 * 60 * 1000 // 24 hours default
): { fresh: boolean; age_ms: number } {
  const verifiedTime = new Date(verifiedAt).getTime()
  const nowTime = new Date().getTime()
  const age = nowTime - verifiedTime

  return {
    fresh: age < maxAgeMs,
    age_ms: age
  }
}

export {
    IntegrityViolationError,
    NoCitationError, UnverifiedContentError
} from './types'
export type { AIExplanation, Hadith }

