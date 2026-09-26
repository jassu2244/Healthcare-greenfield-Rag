/**
 * Audit Trail & Tamper-Evident Hash Chain — Antigravity Healthcare Foundation
 * Implements an append-only, SHA-256 hash-chained audit trail per case.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { AuditAction, AuditEvent, Role } from './types';
import { redact, safeLog } from './safe-logging';

const RUNTIME_DIR = path.join(process.cwd(), 'data', 'runtime');
const AUDIT_FILE = path.join(RUNTIME_DIR, 'audit.json');

// In-memory cache for fast lookups
let inMemoryAuditEvents: AuditEvent[] = [];

function ensureRuntimeDir(): void {
  if (!fs.existsSync(RUNTIME_DIR)) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  }
}

function loadAuditEventsFromFile(): void {
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      const data = fs.readFileSync(AUDIT_FILE, 'utf-8');
      inMemoryAuditEvents = JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading audit events:', err);
    inMemoryAuditEvents = [];
  }
}

function persistAuditEvents(): void {
  try {
    ensureRuntimeDir();
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(inMemoryAuditEvents, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting audit events:', err);
  }
}

// Initial load
loadAuditEventsFromFile();

/**
 * Calculates SHA-256 hash for an event.
 */
export function calculateEventHash(eventWithoutHash: Omit<AuditEvent, 'hash'>): string {
  const contentToHash = JSON.stringify({
    eventId: eventWithoutHash.eventId,
    sequence: eventWithoutHash.sequence,
    timestamp: eventWithoutHash.timestamp,
    caseId: eventWithoutHash.caseId,
    actor: eventWithoutHash.actor,
    action: eventWithoutHash.action,
    resource: eventWithoutHash.resource,
    dataAccessed: eventWithoutHash.dataAccessed,
    ai: eventWithoutHash.ai,
    status: eventWithoutHash.status,
    details: eventWithoutHash.details,
    prevHash: eventWithoutHash.prevHash
  });

  return crypto.createHash('sha256').update(contentToHash).digest('hex');
}

export interface RecordAuditParams {
  caseId: string;
  actor: {
    id: string;
    role: Role;
    displayName?: string;
  };
  action: AuditAction;
  resource: string;
  dataAccessed?: string[]; // Field keys ONLY
  ai?: {
    mode: 'LIVE' | 'MOCK' | 'FALLBACK';
    provider: string;
    model: string;
    promptVersion: string;
  };
  status?: 'SUCCESS' | 'FAILURE' | 'WARNING';
  details?: Record<string, any>;
}

/**
 * Appends a new audit event to the tamper-evident hash chain for the given case.
 */
export function recordAuditEvent(params: RecordAuditParams): AuditEvent {
  const caseEvents = inMemoryAuditEvents.filter(e => e.caseId === params.caseId);
  const sequence = caseEvents.length + 1;
  const prevHash = caseEvents.length > 0 ? caseEvents[caseEvents.length - 1].hash : 'GENESIS_0000000000000000000000000000000000000000000000000000000000000000';

  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const timestamp = new Date().toISOString();

  // Sanitize details to strictly avoid sensitive raw data
  const sanitizedDetails = redact(params.details || {});

  const partialEvent: Omit<AuditEvent, 'hash'> = {
    eventId,
    sequence,
    timestamp,
    caseId: params.caseId,
    actor: params.actor,
    action: params.action,
    resource: params.resource,
    dataAccessed: params.dataAccessed || [],
    ai: params.ai,
    status: params.status || 'SUCCESS',
    details: sanitizedDetails,
    prevHash
  };

  const hash = calculateEventHash(partialEvent);
  const fullEvent: AuditEvent = {
    ...partialEvent,
    hash
  };

  inMemoryAuditEvents.push(fullEvent);
  persistAuditEvents();

  safeLog('AUDIT_EVENT_RECORDED', {
    eventId,
    caseId: params.caseId,
    action: params.action,
    sequence,
    hash: hash.substring(0, 10) + '...'
  });

  return fullEvent;
}

/**
 * Lists chronological audit events for a case.
 */
export function listAuditEvents(caseId: string): AuditEvent[] {
  return inMemoryAuditEvents
    .filter(e => e.caseId === caseId)
    .sort((a, b) => a.sequence - b.sequence);
}

export interface ChainVerificationResult {
  valid: boolean;
  eventCount: number;
  caseId: string;
  verifiedAt: string;
  error?: string;
  brokenAtSequence?: number;
}

/**
 * Verifies the integrity of the audit hash chain for a specific case.
 */
export function verifyAuditChain(caseId: string, events?: AuditEvent[]): ChainVerificationResult {
  const caseEvents = (events || listAuditEvents(caseId)).sort((a, b) => a.sequence - b.sequence);
  const verifiedAt = new Date().toISOString();

  if (caseEvents.length === 0) {
    return {
      valid: true,
      eventCount: 0,
      caseId,
      verifiedAt
    };
  }

  let expectedPrevHash = 'GENESIS_0000000000000000000000000000000000000000000000000000000000000000';

  for (let i = 0; i < caseEvents.length; i++) {
    const event = caseEvents[i];

    // Check sequence continuity
    if (event.sequence !== i + 1) {
      return {
        valid: false,
        eventCount: caseEvents.length,
        caseId,
        verifiedAt,
        error: `Sequence mismatch at index ${i}: expected ${i + 1}, found ${event.sequence}`,
        brokenAtSequence: event.sequence
      };
    }

    // Check prevHash pointer
    if (event.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        eventCount: caseEvents.length,
        caseId,
        verifiedAt,
        error: `Previous hash mismatch at sequence ${event.sequence}`,
        brokenAtSequence: event.sequence
      };
    }

    // Recompute event hash
    const { hash, ...unhashed } = event;
    const computedHash = calculateEventHash(unhashed);

    if (computedHash !== hash) {
      return {
        valid: false,
        eventCount: caseEvents.length,
        caseId,
        verifiedAt,
        error: `Tampered hash at sequence ${event.sequence}: stored ${hash}, computed ${computedHash}`,
        brokenAtSequence: event.sequence
      };
    }

    expectedPrevHash = hash;
  }

  return {
    valid: true,
    eventCount: caseEvents.length,
    caseId,
    verifiedAt
  };
}

/**
 * Exports complete audit trail with verification signature.
 */
export function exportAuditTrail(caseId: string): {
  caseId: string;
  exportedAt: string;
  verification: ChainVerificationResult;
  events: AuditEvent[];
} {
  const events = listAuditEvents(caseId);
  const verification = verifyAuditChain(caseId, events);

  recordAuditEvent({
    caseId,
    actor: { id: 'auditor', role: 'SYSTEM', displayName: 'Audit Exporter' },
    action: 'AUDIT_EXPORTED',
    resource: `case_${caseId}/audit_export`,
    details: { eventCount: events.length, chainValid: verification.valid }
  });

  return {
    caseId,
    exportedAt: new Date().toISOString(),
    verification,
    events
  };
}

/**
 * Resets audit events for demo purposes.
 */
export function clearAuditEvents(): void {
  inMemoryAuditEvents = [];
  persistAuditEvents();
}
