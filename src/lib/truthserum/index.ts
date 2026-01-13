/**
 * TruthSerum Index
 * Main exports for verification, receipts, and enforcement
 */

// Core types
export type {
    AIExplanation, AuditLogEntry, Citation, ConfidenceLevel,
    Hadith, OperationType, PatternMatch, ProofReceipt, SafetyDecision, SafetyMetrics, VerificationMethod, VerificationPrimitive
} from './types'

// Custom error types
export {
    IntegrityViolationError,
    NoCitationError,
    ReceiptNotFoundError,
    TamperedReceiptError, UnverifiedContentError
} from './types'

// Verification functions
export {
    computeContentHash,
    computeHadithHash, createHadithVerification, createVerificationPrimitive, signContent, updateVerification,
    verifyContentIntegrity, verifyHadithIntegrity, verifySignature, verifyVerificationPrimitive
} from './verification'

// Receipt system
export {
    calculateVerificationStats, createProofReceipt, exportReceipt, getReceiptsByOperation,
    getReceiptsForEntity, parseReceipt, retrieveAndVerifyReceipt, verifyReceiptSignature
} from './receipts'

// Enforcement rules
export {
    calculateCitationCoverage, createCountResult, enforceAICitations, enforceHadithVerification,
    enforceHadithVerificationBatch, enforceSafetyDecisionLogging, extractAndValidateCitations, validateCountResult, validateDataFreshness,
    type CountResult
} from './enforcement'

// Middleware
export {
    withAIVerification, withHadithVerification,
    withHadithVerificationBatch, withReceiptEmission,
    withSafetyLogging,
    withTruthSerum, withTruthSerumContext, type TruthSerumContext
} from './middleware'

// Database helpers
export {
    calculateSafetyEffectiveness, getAuditLogByOperation, getAuditLogEntry, getAuditLogStats, getHadithCountByCollection,
    getHadithCountByGrade, getSafetyMetrics,
    getSafetyMetricsRange,
    getVerifiedHadithCount, storeAuditLogEntry, storeSafetyDecision
} from './db'

