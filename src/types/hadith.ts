/**
 * Core type definitions for Authentic Hadith
 */

export type HadithGrade = 'sahih' | 'hasan' | 'daif' | 'mawdu';
export type HadithStatus = 'draft' | 'verified' | 'published' | 'deleted';
export type UserRole = 'admin' | 'scholar' | 'moderator' | 'viewer';
export type AuthenticityTier = 'A' | 'B' | 'C';

export interface Hadith {
  id: string;
  text_arabic: string;
  text_translation?: string;
  source_id: string;
  chain_of_narration?: string;
  grade: HadithGrade;
  status: HadithStatus;
  imported_by: string;
  imported_at: string;
  published_at?: string;
  metadata?: Record<string, any>;
  source?: Source;
  verifications?: Verification[];
}

export interface Source {
  id: string;
  name: string;
  book_number?: number;
  hadith_number?: number;
  volume?: number;
  authenticity_tier: AuthenticityTier;
}

export interface Verification {
  id: string;
  hadith_id: string;
  scholar_id: string;
  grade: HadithGrade;
  methodology: string;
  reasoning?: string;
  verified_at: string;
  receipt_id?: string;
  scholar?: User;
}

export interface Narrator {
  id: string;
  name_arabic: string;
  name_latin: string;
  reliability_grade: string;
  birth_year?: number;
  death_year?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  qbos_session_token?: string;
}

export interface HadithSearchParams {
  query?: string;
  source_id?: string;
  grade?: HadithGrade;
  status?: HadithStatus;
  limit?: number;
  offset?: number;
}

export interface HadithImportRequest {
  text_arabic: string;
  text_translation?: string;
  source_id: string;
  chain_of_narration?: string;
  metadata?: Record<string, any>;
}

export interface VerificationRequest {
  hadith_id: string;
  grade: HadithGrade;
  methodology: string;
  reasoning?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  receiptId?: string;
  _proof?: {
    operation: string;
    verified_at: string;
    verification_method: string;
    [key: string]: any;
  };
}
