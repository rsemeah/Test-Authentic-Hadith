/**
 * TruthSerum Receipt System
 * Emit, store, and verify proof receipts for all operations
 */

import { createHmac, randomUUID } from 'crypto'
import {
    AuditLogEntry,
    ConfidenceLevel,
    OperationType,
    ProofReceipt,
    TamperedReceiptError
} from './types'
import { computeContentHash } from './verification'

const RECEIPT_SECRET = process.env.TRUTHSERUM_SECRET || 'default-secret-change-in-production'

// ============================================================================
// RECEIPT CREATION
// ============================================================================

interface ReceiptParams<TInput = unknown, TOutput = unknown> {
  operation: OperationType
  inputs: TInput
  outputs: TOutput & { entity_ids: string[] }
  verified_count: number
  unverified_count?: number
  verification_failures?: { entity_id: string; reason: string }[]
  request_id: string
  duration_ms: number
}

/**
 * Create and sign a proof receipt
 * Every truth-bearing operation must emit one
 */
export function createProofReceipt<TInput = unknown, TOutput = unknown>(
  params: ReceiptParams<TInput, TOutput>
): Omit<ProofReceipt<TInput, TOutput>, 'audit_log_id'> {
  const receiptId = randomUUID()
  const timestamp = new Date().toISOString()

  // Compute hashes
  const inputsHash = computeContentHash(params.inputs)
  const outputsHash = computeContentHash(params.outputs)

  // Determine confidence
  const confidence = determineConfidence(params.verified_count, params.unverified_count || 0)

  // Create receipt
  const receipt: Omit<ProofReceipt<TInput, TOutput>, 'audit_log_id'> = {
    receipt_id: receiptId,
    operation: params.operation,
    operation_version: 'v1.0.0',
    request_id: params.request_id,
    timestamp,
    duration_ms: params.duration_ms,
    inputs: {
      hash: inputsHash,
      params: params.inputs
    },
    outputs: {
      hash: outputsHash,
      count: (params.outputs.entity_ids || []).length,
      entity_ids: params.outputs.entity_ids || []
    },
    verification: {
      all_verified: (params.unverified_count || 0) === 0,
      verified_count: params.verified_count,
      unverified_count: params.unverified_count || 0,
      verification_failures: params.verification_failures
    },
    attestation: {
      signature: signReceipt(receiptId, inputsHash, outputsHash, timestamp),
      signer: 'service:api',
      confidence
    }
  }

  return receipt
}

/**
 * Sign a proof receipt with HMAC
 * Ensures receipt cannot be tampered with
 */
function signReceipt(
  receiptId: string,
  inputsHash: string,
  outputsHash: string,
  timestamp: string
): string {
  const message = `${receiptId}:${inputsHash}:${outputsHash}:${timestamp}`
  const signature = createHmac('sha256', RECEIPT_SECRET)
  signature.update(message, 'utf8')
  return signature.digest('hex')
}

/**
 * Determine confidence level based on verification results
 */
function determineConfidence(
  verifiedCount: number,
  unverifiedCount: number
): ConfidenceLevel {
  const total = verifiedCount + unverifiedCount
  if (total === 0) return 'unverified'

  const verifiedPercentage = (verifiedCount / total) * 100

  if (verifiedPercentage === 100) return 'verified'
  if (verifiedPercentage >= 95) return 'high'
  if (verifiedPercentage >= 80) return 'medium'
  if (verifiedPercentage > 0) return 'low'
  return 'unverified'
}

// ============================================================================
// RECEIPT VERIFICATION
// ============================================================================

/**
 * Verify receipt signature hasn't been tampered with
 */
export function verifyReceiptSignature(receipt: ProofReceipt): boolean {
  const expectedSignature = signReceipt(
    receipt.receipt_id,
    receipt.inputs.hash,
    receipt.outputs.hash,
    receipt.timestamp
  )

  return receipt.attestation.signature === expectedSignature
}

/**
 * Retrieve and verify a receipt from audit log
 * Checks: exists, signature valid, no tampering
 */
export async function retrieveAndVerifyReceipt(
  receiptId: string,
  auditLogFetcher: (id: string) => Promise<AuditLogEntry | null>
): Promise<ProofReceipt> {
  const entry = await auditLogFetcher(receiptId)

  if (!entry) {
    throw new TamperedReceiptError(receiptId)
  }

  // Verify signature
  if (!verifyReceiptSignature(entry.receipt)) {
    throw new TamperedReceiptError(receiptId)
  }

  return entry.receipt
}

// ============================================================================
// RECEIPT HELPERS
// ============================================================================

/**
 * Extract receipts for a specific operation type from audit log
 */
export async function getReceiptsByOperation(
  operation: OperationType,
  auditLogQuery: (filter: { operation: OperationType }) => Promise<AuditLogEntry[]>
): Promise<ProofReceipt[]> {
  const entries = await auditLogQuery({ operation })
  return entries
    .map(e => e.receipt)
    .filter(r => verifyReceiptSignature(r))
}

/**
 * Get receipts for a specific entity
 */
export async function getReceiptsForEntity(
  entityId: string,
  auditLogQuery: (filter: { entity_id: string }) => Promise<AuditLogEntry[]>
): Promise<ProofReceipt[]> {
  const entries = await auditLogQuery({ entity_id: entityId })
  return entries
    .map(e => e.receipt)
    .filter(r =>
      r.outputs.entity_ids.includes(entityId) &&
      verifyReceiptSignature(r)
    )
}

/**
 * Calculate cumulative verification from receipts
 */
export function calculateVerificationStats(receipts: ProofReceipt[]): {
  total_operations: number
  total_entities_returned: number
  total_verified: number
  total_unverified: number
  average_confidence: ConfidenceLevel
} {
  const confidenceLevels: Record<ConfidenceLevel, number> = {
    verified: 4,
    high: 3,
    medium: 2,
    low: 1,
    unverified: 0
  }

  let totalOperations = 0
  let totalEntitiesReturned = 0
  let totalVerified = 0
  let totalUnverified = 0
  let confidenceSum = 0

  for (const receipt of receipts) {
    totalOperations++
    totalEntitiesReturned += receipt.outputs.count
    totalVerified += receipt.verification.verified_count
    totalUnverified += receipt.verification.unverified_count
    confidenceSum += confidenceLevels[receipt.attestation.confidence]
  }

  const averageConfidenceScore = receipts.length > 0 ? confidenceSum / receipts.length : 0
  let averageConfidence: ConfidenceLevel = 'unverified'

  if (averageConfidenceScore >= 3.5) averageConfidence = 'verified'
  else if (averageConfidenceScore >= 2.5) averageConfidence = 'high'
  else if (averageConfidenceScore >= 1.5) averageConfidence = 'medium'
  else if (averageConfidenceScore > 0) averageConfidence = 'low'

  return {
    total_operations: totalOperations,
    total_entities_returned: totalEntitiesReturned,
    total_verified: totalVerified,
    total_unverified: totalUnverified,
    average_confidence: averageConfidence
  }
}

/**
 * Export receipt as JSON for external verification
 */
export function exportReceipt(receipt: ProofReceipt): string {
  return JSON.stringify(receipt, null, 2)
}

/**
 * Parse exported receipt JSON
 */
export function parseReceipt(json: string): ProofReceipt {
  try {
    return JSON.parse(json) as ProofReceipt
  } catch (e) {
    throw new Error(`Failed to parse receipt JSON: ${e}`)
  }
}

export type { ConfidenceLevel, OperationType, ProofReceipt } from './types'

