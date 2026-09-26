/**
 * PostgreSQL Database Connection & Auto-Migration
 * RelayMD Healthcare Foundation — Track 04
 *
 * Creates a connection pool and auto-creates tables on startup if they don't exist.
 */

import { Pool } from 'pg';

// ─── Connection Pool (Singleton) ────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL || '';

let pool: Pool;

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
} else {
  // Fallback: construct from individual env vars or hard defaults
  pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Pinglan@821',
    database: process.env.PGDATABASE || 'healthcareapp',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

export { pool };

// ─── Auto-Migration: Create Tables If Not Exist ─────────────────────────────

const MIGRATION_SQL = `
-- Clinical Guidelines / PDF Corpus
CREATE TABLE IF NOT EXISTS corpus_documents (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  doc_type        TEXT NOT NULL DEFAULT 'guideline',
  version         TEXT NOT NULL DEFAULT 'v1.0',
  effective_date  TEXT,
  is_superseded   BOOLEAN DEFAULT FALSE,
  superseding_doc TEXT,
  access_level    TEXT NOT NULL DEFAULT 'CLINICAL_STAFF',
  min_required_role TEXT[] NOT NULL DEFAULT '{"NURSE","PHYSICIAN","PHARMACIST","SUBMITTER","REVIEWER"}',
  summary         TEXT,
  sections        JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Doctor Prescriptions & Nurse Administration Records
CREATE TABLE IF NOT EXISTS prescriptions (
  id              TEXT PRIMARY KEY,
  case_id         TEXT NOT NULL,
  patient_name    TEXT NOT NULL,
  medication      TEXT NOT NULL,
  dosage          TEXT NOT NULL,
  instructions    TEXT,
  prescribed_by   TEXT NOT NULL,
  prescribed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          TEXT NOT NULL DEFAULT 'PENDING_ADMINISTRATION',
  administered_by TEXT,
  administered_at TIMESTAMPTZ,
  sha256_seal     TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Patient Cases
CREATE TABLE IF NOT EXISTS cases (
  id              TEXT PRIMARY KEY,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          TEXT NOT NULL DEFAULT 'SUBMITTED',
  inputs          JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_results      JSONB NOT NULL DEFAULT '[]'::jsonb,
  review          JSONB,
  final_action    JSONB,
  metadata        JSONB
);

-- Doctor Messages (Doctor writes → Nurse reads)
CREATE TABLE IF NOT EXISTS doctor_messages (
  id              SERIAL PRIMARY KEY,
  case_id         TEXT NOT NULL,
  patient_name    TEXT,
  doctor_name     TEXT NOT NULL,
  target_nurse    TEXT DEFAULT 'Nurse Priya Sharma, RN',
  message         TEXT NOT NULL,
  message_type    TEXT NOT NULL DEFAULT 'PRESCRIPTION_ORDER',
  prescription_id TEXT REFERENCES prescriptions(id),
  read_by_nurse   BOOLEAN DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure target_nurse exists if table was previously created
ALTER TABLE doctor_messages ADD COLUMN IF NOT EXISTS target_nurse TEXT DEFAULT 'Nurse Priya Sharma, RN';

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_prescriptions_case_id ON prescriptions(case_id);
CREATE INDEX IF NOT EXISTS idx_doctor_messages_case_id ON doctor_messages(case_id);
CREATE INDEX IF NOT EXISTS idx_doctor_messages_unread ON doctor_messages(read_by_nurse) WHERE read_by_nurse = FALSE;
CREATE INDEX IF NOT EXISTS idx_corpus_doc_type ON corpus_documents(doc_type);
`;

let migrationDone = false;

export async function ensureTables(): Promise<void> {
  if (migrationDone) return;
  try {
    await pool.query(MIGRATION_SQL);
    migrationDone = true;
    console.log('[DB] PostgreSQL tables verified/created successfully.');
  } catch (err) {
    console.error('[DB] Migration error:', err);
    throw err;
  }
}

// Run migration immediately on import (best-effort, non-blocking)
ensureTables().catch((err) => {
  console.error('[DB] Auto-migration failed on startup:', err);
});
