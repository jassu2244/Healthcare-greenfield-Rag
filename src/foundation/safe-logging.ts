/**
 * Safe Logging & Redaction — Antigravity Healthcare Foundation
 * Strictly avoids leaking sensitive healthcare data or PII into stdout/telemetry.
 */

export const SENSITIVE_KEYS = new Set([
  'name',
  'patientname',
  'fullname',
  'dob',
  'dateofbirth',
  'birthdate',
  'phone',
  'phonenumber',
  'email',
  'emailaddress',
  'address',
  'street',
  'postalcode',
  'zip',
  'freetext',
  'notes',
  'clinicalnotes',
  'symptoms',
  'diagnosis',
  'medications',
  'medicalhistory',
  'ssn',
  'mrn',
  'identity'
]);

/**
 * Deeply redacts any sensitive keys from an object before logging or export.
 */
export function redact<T = any>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => redact(item)) as unknown as T;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, '');
    if (SENSITIVE_KEYS.has(normalizedKey)) {
      result[key] = '[REDACTED_SENSITIVE_CONTENT]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redact(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

export interface SafeLogMetadata {
  id?: string;
  caseId?: string;
  eventId?: string;
  keysCount?: number;
  keys?: string[];
  status?: string;
  durationMs?: number;
  actorRole?: string;
  mode?: string;
  [key: string]: any;
}

/**
 * Safe logging utility that strictly sanitizes and limits logging to metadata.
 */
export function safeLog(eventName: string, metadata: SafeLogMetadata = {}): void {
  const sanitized = redact(metadata);
  const payload = {
    event: eventName,
    timestamp: new Date().toISOString(),
    ...sanitized
  };
  // In development/server console, output structured non-sensitive log
  console.log(`[SAFE_LOG][${eventName}]`, JSON.stringify(payload));
}
