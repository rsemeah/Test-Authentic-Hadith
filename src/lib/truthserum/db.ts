/**
 * TruthSerum Database Helpers
 * Functions for storing audit logs, fetching verified counts, etc.
 */

import { createClient } from '@supabase/supabase-js'
import { createCountResult, type CountResult } from './enforcement'
import type { ProofReceipt } from './types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// ============================================================================
// AUDIT LOG STORAGE
// ============================================================================

/**
 * Store proof receipt in append-only audit log
 * Returns the audit_log ID
 */
export async function storeAuditLogEntry(
  receipt: Omit<ProofReceipt, 'audit_log_id'>
): Promise<string> {
  const { data, error } = await supabase
    .from('audit_log')
    .insert({
      receipt: {
        ...receipt,
        audit_log_id: ''  // Will be set to the returned ID
      }
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to store audit log: ${error.message}`)
  }

  return data.id
}

/**
 * Retrieve receipt from audit log
 */
export async function getAuditLogEntry(receiptId: string): Promise<ProofReceipt | null> {
  const { data, error } = await supabase
    .from('audit_log')
    .select('receipt')
    .eq('receipt->receipt_id', receiptId)
    .single()

  if (error && error.code !== 'PGRST116') {  // PGRST116 = no rows returned
    throw new Error(`Failed to fetch audit log: ${error.message}`)
  }

  return data ? (data.receipt as ProofReceipt) : null
}

/**
 * Get all audit log entries for an operation type
 */
export async function getAuditLogByOperation(
  operation: string,
  limit: number = 100
): Promise<ProofReceipt[]> {
  const { data, error } = await supabase
    .from('audit_log')
    .select('receipt')
    .eq('receipt->operation', `"${operation}"`)  // JSON string comparison
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch audit log: ${error.message}`)
  }

  return data ? (data.map(d => d.receipt) as ProofReceipt[]) : []
}

// ============================================================================
// SAFETY DECISION LOGGING
// ============================================================================

/**
 * Store a safety decision for tracking effectiveness
 */
export async function storeSafetyDecision(
  query: string,
  queryHash: string,
  decision: 'allowed' | 'blocked',
  patternsMatched: any[],
  totalPatternsChecked: number,
  userId?: string,
  sessionId?: string
): Promise<string> {
  const { data, error } = await supabase
    .from('safety_decisions')
    .insert({
      query,
      query_hash: queryHash,
      decision,
      confidence: decision === 'blocked' ? 0.95 : 0.9,  // High confidence for now
      patterns_matched: patternsMatched,
      total_patterns_checked: totalPatternsChecked,
      false_positive_flagged: false,
      reviewed_by_human: false,
      user_id: userId,
      session_id: sessionId
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to store safety decision: ${error.message}`)
  }

  return data.id
}

/**
 * Get safety metrics for a date
 */
export async function getSafetyMetrics(date: string): Promise<any> {
  const { data, error } = await supabase
    .from('safety_metrics')
    .select('*')
    .eq('metric_date', date)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch safety metrics: ${error.message}`)
  }

  return data || null
}

/**
 * Get safety metrics for last N days
 */
export async function getSafetyMetricsRange(
  days: number = 7
): Promise<any[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('safety_metrics')
    .select('*')
    .gte('metric_date', startDate.toISOString().split('T')[0])
    .order('metric_date', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch safety metrics: ${error.message}`)
  }

  return data || []
}

// ============================================================================
// VERIFIED COUNT QUERIES
// ============================================================================

/**
 * Get the actual count of verified hadith from database
 * NEVER hardcode this number - always query the database
 */
export async function getVerifiedHadithCount(): Promise<CountResult> {
  const { count, error } = await supabase
    .from('hadith')
    .select('*', { count: 'exact', head: true })
    .not('verification->content_hash', 'is', null)

  if (error) {
    throw new Error(`Failed to count verified hadith: ${error.message}`)
  }

  return createCountResult(count || 0)
}

/**
 * Get count of hadith by collection
 */
export async function getHadithCountByCollection(
  collection: string
): Promise<CountResult> {
  const { count, error } = await supabase
    .from('hadith')
    .select('*', { count: 'exact', head: true })
    .eq('collection', collection)
    .not('verification->content_hash', 'is', null)

  if (error) {
    throw new Error(`Failed to count hadith by collection: ${error.message}`)
  }

  return createCountResult(count || 0)
}

/**
 * Get count of hadith by grade
 */
export async function getHadithCountByGrade(grade: string): Promise<CountResult> {
  const { count, error } = await supabase
    .from('hadith')
    .select('*', { count: 'exact', head: true })
    .eq('grade', grade)
    .not('verification->content_hash', 'is', null)

  if (error) {
    throw new Error(`Failed to count hadith by grade: ${error.message}`)
  }

  return createCountResult(count || 0)
}

// ============================================================================
// AUDIT STATISTICS
// ============================================================================

/**
 * Get statistics about audit log
 */
export async function getAuditLogStats(): Promise<{
  total_entries: number
  operations_count: Record<string, number>
  date_range: { earliest: string; latest: string }
}> {
  // Get total count
  const { count: totalCount } = await supabase
    .from('audit_log')
    .select('*', { count: 'exact', head: true })

  // Get operations breakdown
  const { data: entries } = await supabase
    .from('audit_log')
    .select('receipt')
    .limit(10000)  // Sample for performance

  const operationsCount: Record<string, number> = {}
  const timestamps: string[] = []

  for (const entry of entries || []) {
    const op = entry.receipt.operation
    operationsCount[op] = (operationsCount[op] || 0) + 1
    timestamps.push(entry.receipt.timestamp)
  }

  const sortedTimestamps = timestamps.sort()
  const dateRange = {
    earliest: sortedTimestamps[0] || new Date().toISOString(),
    latest: sortedTimestamps[sortedTimestamps.length - 1] || new Date().toISOString()
  }

  return {
    total_entries: totalCount || 0,
    operations_count: operationsCount,
    date_range: dateRange
  }
}

/**
 * Calculate recall and precision from safety decisions
 * Requires human review data
 */
export async function calculateSafetyEffectiveness(): Promise<{
  precision: number
  recall: number
  f1_score: number
  total_reviewed: number
}> {
  const { data: reviewed } = await supabase
    .from('safety_decisions')
    .select('*')
    .eq('reviewed_by_human', true)

  if (!reviewed || reviewed.length === 0) {
    return {
      precision: 0,
      recall: 0,
      f1_score: 0,
      total_reviewed: 0
    }
  }

  let truePositives = 0
  let falsePositives = 0
  let falseNegatives = 0

  for (const decision of reviewed) {
    if (decision.decision === 'blocked' && decision.review_outcome === 'correct') {
      truePositives++
    } else if (decision.decision === 'blocked' && decision.review_outcome === 'incorrect') {
      falsePositives++
    } else if (decision.decision === 'allowed' && decision.review_outcome === 'incorrect') {
      falseNegatives++
    }
  }

  const precision =
    truePositives + falsePositives > 0
      ? truePositives / (truePositives + falsePositives)
      : 0

  const recall =
    truePositives + falseNegatives > 0
      ? truePositives / (truePositives + falseNegatives)
      : 0

  const f1Score =
    precision + recall > 0
      ? (2 * (precision * recall)) / (precision + recall)
      : 0

  return {
    precision,
    recall,
    f1_score: f1Score,
    total_reviewed: reviewed.length
  }
}

export type { CountResult, ProofReceipt }

