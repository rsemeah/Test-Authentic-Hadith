/**
 * TruthSerum Middleware
 * Automatically enforces verification, receipt emission, and safety logging
 */

import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import {
    createProofReceipt,
    enforceAICitations,
    enforceHadithVerification,
    enforceHadithVerificationBatch
} from './index'

export type TruthSerumContext = {
  request_id: string
  start_time: number
  receipt_data?: {
    operation: string
    inputs: unknown
    verified_count: number
    unverified_count: number
  }
}

export async function withTruthSerumContext(
  req: NextRequest,
  handler: (req: NextRequest, context: TruthSerumContext) => Promise<Response>
): Promise<Response> {
  const context: TruthSerumContext = {
    request_id: randomUUID(),
    start_time: Date.now(),
  }

  return await handler(req, context)
}

export function withHadithVerification<T extends { id: string }>(
  hadith: T | null,
  context: TruthSerumContext
): T {
  if (!hadith) {
    throw new Error('Hadith not found')
  }

  const verified = enforceHadithVerification(hadith as any)

  context.receipt_data = {
    operation: context.receipt_data?.operation || 'HADITH_VERIFICATION',
    inputs: context.receipt_data?.inputs || {},
    verified_count: 1,
    unverified_count: 0,
  }

  return verified as unknown as T
}

export function withHadithVerificationBatch<T extends { id: string }>(
  hadith: (T | null)[],
  context: TruthSerumContext
): { verified: T[]; failed_count: number } {
  const result = enforceHadithVerificationBatch(hadith.filter(h => h) as any)

  const failed_count = result.failures?.length || 0

  context.receipt_data = {
    operation: context.receipt_data?.operation || 'HADITH_BATCH_VERIFICATION',
    inputs: context.receipt_data?.inputs || {},
    verified_count: result.verified.length,
    unverified_count: failed_count,
  }

  return {
    verified: result.verified as unknown as T[],
    failed_count,
  }
}

export function withAIVerification(
  explanation: any,
  context: TruthSerumContext
) {
  if (!explanation) {
    throw new Error('Explanation not found')
  }

  const verified = enforceAICitations(explanation)

  context.receipt_data = {
    operation: context.receipt_data?.operation || 'AI_VERIFICATION',
    inputs: context.receipt_data?.inputs || {},
    verified_count: 1,
    unverified_count: 0,
  }

  return verified
}

export async function withReceiptEmission(
  context: TruthSerumContext,
  operation: string,
  inputs: unknown,
  outputs: any,
  auditLogStore?: (receipt: any) => Promise<string>
): Promise<any> {
  const duration = Date.now() - context.start_time

  const receipt = createProofReceipt({
    operation: operation as any,
    inputs,
    outputs: {
      ...outputs,
      entity_ids: outputs.entity_ids || []
    },
    verified_count: context.receipt_data?.verified_count || 0,
    unverified_count: context.receipt_data?.unverified_count || 0,
    request_id: context.request_id,
    duration_ms: duration
  })

  if (auditLogStore) {
    (receipt as any).audit_log_id = await auditLogStore(receipt)
  }

  return receipt
}

export async function withSafetyLogging(
  query: string,
  decision: 'allowed' | 'blocked',
  patterns: any[],
  totalPatternsChecked: number,
  safetyLogStore?: (decision: any) => Promise<string>
): Promise<string> {
  const safetyDecision = {
    query,
    decision,
    patterns_matched: patterns,
    total_patterns_checked: totalPatternsChecked,
    created_at: new Date().toISOString()
  }

  if (safetyLogStore) {
    return await safetyLogStore(safetyDecision)
  }

  return 'logged'
}

export function withTruthSerum(
  handler: (
    req: NextRequest,
    context: TruthSerumContext
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      return await withTruthSerumContext(req, handler)
    } catch (error) {
      console.error('[TruthSerum] Error:', error)
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          request_id: req.headers.get('x-request-id') || 'unknown'
        },
        { status: 500 }
      )
    }
  }
}
