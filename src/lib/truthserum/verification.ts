/**
 * TruthSerum Verification Functions
 * Content hashing, verification, and signature generation
 */

import { createHash, createHmac } from 'crypto'
import { Hadith, VerificationMethod, VerificationPrimitive } from './types'

const VERIFICATION_SECRET = process.env.TRUTHSERUM_SECRET || 'default-secret-change-in-production'

// ============================================================================
// HASH FUNCTIONS (Deterministic)
// ============================================================================

/**
 * Compute deterministic SHA-256 hash of any content
 * Rules: UTF-8 encoding, sorted keys, normalize whitespace
 */
export function computeContentHash(content: unknown): string {
  // Normalize: stringify with sorted keys
  const normalized = JSON.stringify(
    content,
    Object.keys(content as any).sort(),
    0
  )

  // Hash with SHA-256
  const hash = createHash('sha256')
  hash.update(normalized, 'utf8')
  return hash.digest('hex')
}

/**
 * Compute hadith content hash (deterministic)
 * Only includes immutable fields, ignores metadata
 */
export function computeHadithHash(hadith: Partial<Hadith>): string {
  const canonical = {
    arabic_text: hadith.arabic_text?.trim(),
    collection: hadith.collection,
    hadith_number: hadith.hadith_number,
    narrator_chain: hadith.narrator_chain
  }
  return computeContentHash(canonical)
}

/**
 * Compute HMAC-SHA256 signature for verification
 * Ensures authenticity of verification claim
 */
export function signContent(
  contentHash: string,
  sourceHash: string = '',
  verifiedAt: string = new Date().toISOString()
): string {
  const message = `${contentHash}:${sourceHash}:${verifiedAt}`
  const signature = createHmac('sha256', VERIFICATION_SECRET)
  signature.update(message, 'utf8')
  return signature.digest('hex')
}

/**
 * Verify signature authenticity
 */
export function verifySignature(
  signature: string,
  contentHash: string,
  sourceHash: string = '',
  verifiedAt: string = new Date().toISOString()
): boolean {
  const expected = signContent(contentHash, sourceHash, verifiedAt)
  return signature === expected
}

// ============================================================================
// VERIFICATION PRIMITIVES
// ============================================================================

/**
 * Create a verification primitive for a piece of content
 * This is the foundation of all truth claims
 */
export function createVerificationPrimitive(
  contentHash: string,
  sourceId: string,
  sourceHash: string,
  method: VerificationMethod = 'system_generated'
): VerificationPrimitive {
  const verifiedAt = new Date().toISOString()
  const verifiedBy = method === 'system_generated' ? 'system' : `${method}:manual`

  return {
    content_hash: contentHash,
    content_version: 1,
    source_id: sourceId,
    source_hash: sourceHash,
    verification_method: method,
    verified_at: verifiedAt,
    verified_by: verifiedBy,
    verification_signature: signContent(contentHash, sourceHash, verifiedAt),
    previous_hash: undefined
  }
}

/**
 * Create an initial verification for imported hadith
 */
export function createHadithVerification(
  hadith: Partial<Hadith>,
  sourceId: string,
  sourceHash: string
): VerificationPrimitive {
  const contentHash = computeHadithHash(hadith)

  return createVerificationPrimitive(
    contentHash,
    sourceId,
    sourceHash,
    'source_import'
  )
}

/**
 * Update verification after content changes
 * Creates a new version with link to previous
 */
export function updateVerification(
  oldVerification: VerificationPrimitive,
  newContentHash: string,
  method: VerificationMethod = 'system_generated'
): VerificationPrimitive {
  const verifiedAt = new Date().toISOString()

  return {
    content_hash: newContentHash,
    content_version: oldVerification.content_version + 1,
    source_id: oldVerification.source_id,
    source_hash: oldVerification.source_hash,
    source_page: oldVerification.source_page,
    verification_method: method,
    verified_at: verifiedAt,
    verified_by: method === 'system_generated' ? 'system' : `${method}:manual`,
    verification_signature: signContent(
      newContentHash,
      oldVerification.source_hash,
      verifiedAt
    ),
    previous_hash: oldVerification.content_hash
  }
}

// ============================================================================
// VERIFICATION VALIDATION
// ============================================================================

/**
 * Verify that a piece of content matches its claimed hash
 * This is the core integrity check
 */
export function verifyContentIntegrity(
  content: unknown,
  claimedHash: string
): boolean {
  const computedHash = computeContentHash(content)
  return computedHash === claimedHash
}

/**
 * Verify entire verification primitive
 * Check: hash is correct, signature is valid, no tampering
 */
export function verifyVerificationPrimitive(
  content: unknown,
  verification: VerificationPrimitive
): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check 1: Content hash matches
  if (!verifyContentIntegrity(content, verification.content_hash)) {
    errors.push('Content hash mismatch - content may be corrupted')
  }

  // Check 2: Signature is valid
  if (!verifySignature(
    verification.verification_signature,
    verification.content_hash,
    verification.source_hash,
    verification.verified_at
  )) {
    errors.push('Verification signature invalid - content may be tampered')
  }

  // Check 3: Verification method is recognized
  const validMethods = ['source_import', 'scholar_reviewed', 'cross_referenced', 'system_generated', 'user_contributed']
  if (!validMethods.includes(verification.verification_method)) {
    errors.push(`Unknown verification method: ${verification.verification_method}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Verify hadith integrity
 */
export function verifyHadithIntegrity(hadith: Hadith): {
  valid: boolean
  errors: string[]
} {
  const canonical = {
    arabic_text: hadith.arabic_text?.trim(),
    collection: hadith.collection,
    hadith_number: hadith.hadith_number,
    narrator_chain: hadith.narrator_chain
  }

  return verifyVerificationPrimitive(canonical, hadith)
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
    VerificationMethod, VerificationPrimitive
} from './types'

