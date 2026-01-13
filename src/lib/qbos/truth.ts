/**
 * QBos TruthSerum™ Gateway Integration
 * Connects Authentic Hadith to QBos backend for constitutional enforcement
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const QBOS_BACKEND_URL = process.env.QBOS_BACKEND_URL || 'http://localhost:3001';
const PROOF_DIR = path.join(process.cwd(), 'proof');

// Ensure proof directory exists
if (typeof window === 'undefined') {
  if (!fs.existsSync(PROOF_DIR)) {
    fs.mkdirSync(PROOF_DIR, { recursive: true });
  }
}

export interface GateContext {
  userId?: string;
  sessionId?: string;
  userRole?: 'admin' | 'scholar' | 'moderator' | 'viewer';
  metadata?: Record<string, any>;
}

export interface GateEvaluation {
  allowed: boolean;
  truthState: 'Verified' | 'Unknown' | 'Denied';
  reason?: string;
  missingProofs?: string[];
  receiptId?: string;
}

export interface ReceiptData {
  step: string;
  data: Record<string, any>;
  sessionId?: string;
}

export interface Receipt {
  id: string;
  sessionId: string;
  type: string;
  timestamp: string;
  details: Record<string, any>;
  verified: boolean;
}

/**
 * Gates an action through QBos TruthSerum
 * Returns evaluation with allowed/denied status
 */
export async function gateAction(
  intent: string,
  context: GateContext
): Promise<GateEvaluation> {
  try {
    // Check role-based permissions
    const roleCheck = checkRolePermission(intent, context.userRole);
    if (!roleCheck.allowed) {
      return roleCheck;
    }

    // Call QBos TruthSerum backend
    const response = await axios.post(
      `${QBOS_BACKEND_URL}/api/truth/evaluate`,
      {
        intent,
        context,
      },
      {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      allowed: response.data.truthState === 'Verified',
      truthState: response.data.truthState,
      reason: response.data.reason,
      missingProofs: response.data.missingProofs,
    };
  } catch (error) {
    console.error('TruthSerum gate error:', error);
    
    // Fail-safe: deny if QBos is unreachable
    return {
      allowed: false,
      truthState: 'Unknown',
      reason: 'Cannot verify with QBos backend. Constitutional enforcement required.',
    };
  }
}

/**
 * Writes a receipt for an operation
 * Stores locally and attempts to sync with QBos backend
 */
export async function writeReceipt(
  step: string,
  data: Record<string, any>
): Promise<Receipt> {
  const receipt: Receipt = {
    id: uuidv4(),
    sessionId: data.sessionId || 'unknown',
    type: step,
    timestamp: new Date().toISOString(),
    details: data,
    verified: true,
  };

  // Write locally first (fail-safe)
  if (typeof window === 'undefined') {
    const receiptPath = path.join(PROOF_DIR, `${receipt.id}.json`);
    fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
  }

  // Attempt to sync with QBos backend
  try {
    await axios.post(
      `${QBOS_BACKEND_URL}/api/receipts/write`,
      receipt,
      {
        timeout: 3000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.warn('Could not sync receipt with QBos backend (local copy saved):', error);
  }

  return receipt;
}

/**
 * Retrieves receipts for a session
 */
export async function getReceipts(sessionId: string): Promise<Receipt[]> {
  try {
    const response = await axios.get(
      `${QBOS_BACKEND_URL}/api/receipts?sessionId=${sessionId}`,
      {
        timeout: 5000,
      }
    );
    return response.data.receipts || [];
  } catch (error) {
    console.error('Error fetching receipts:', error);
    
    // Fallback to local receipts
    if (typeof window === 'undefined') {
      return getLocalReceipts(sessionId);
    }
    
    return [];
  }
}

/**
 * Reads local receipts from proof directory
 */
function getLocalReceipts(sessionId: string): Receipt[] {
  try {
    const files = fs.readdirSync(PROOF_DIR);
    const receipts: Receipt[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(PROOF_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const receipt = JSON.parse(content) as Receipt;
        
        if (receipt.sessionId === sessionId) {
          receipts.push(receipt);
        }
      }
    }

    return receipts.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  } catch (error) {
    console.error('Error reading local receipts:', error);
    return [];
  }
}

/**
 * Role-based permission checks
 */
function checkRolePermission(
  intent: string,
  role?: string
): GateEvaluation {
  const permissions: Record<string, string[]> = {
    'hadith.import': ['admin', 'scholar', 'moderator'],
    'hadith.verify': ['admin', 'scholar'],
    'hadith.publish': ['admin', 'moderator'],
    'hadith.delete': ['admin'],
    'hadith.search': ['admin', 'scholar', 'moderator', 'viewer'],
    'hadith.view': ['admin', 'scholar', 'moderator', 'viewer'],
  };

  const allowedRoles = permissions[intent];
  
  if (!allowedRoles) {
    return {
      allowed: false,
      truthState: 'Unknown',
      reason: `Unknown intent: ${intent}`,
    };
  }

  if (!role) {
    return {
      allowed: false,
      truthState: 'Denied',
      reason: 'Authentication required',
    };
  }

  if (!allowedRoles.includes(role)) {
    return {
      allowed: false,
      truthState: 'Denied',
      reason: `Role '${role}' does not have permission for '${intent}'`,
    };
  }

  return {
    allowed: true,
    truthState: 'Verified',
    reason: 'Role permission verified',
  };
}

/**
 * Health check for QBos backend connection
 */
export async function checkQBosConnection(): Promise<boolean> {
  try {
    const response = await axios.get(`${QBOS_BACKEND_URL}/api/health`, {
      timeout: 3000,
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}
