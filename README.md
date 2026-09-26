# RelayMD — Enterprise Clinical AI Copilot & Grounded RAG Platform

> **Clinical Decision Support, Role-Based Bedside Directives & Tamper-Evident SHA-256 Audit Chaining**  
> *Developed for Healthcare Enterprise Environments | Track 04: ClinicalRelay RAG (P-02)*

---

## 🏥 Executive Overview

**RelayMD** is an enterprise-grade clinical decision support and hospital collaboration platform designed to eliminate hallucinations, enforce role-based document access, and safeguard clinician workflow.

Unlike generic chatbot interfaces, RelayMD treats clinical retrieval as a strictly audited, safety-critical medical process:
- **Retrieval-Stage RBAC:** Clinician roles (Attending Physician vs. Bedside Nurse) gate document access *before* passages enter the context window, defending against prompt injection and privilege escalation.
- **Cross-Version Contradiction Engine:** Automatically surfaces conflicting medical protocols (e.g., 2021 legacy trough dosing vs. 2024 AUC-guided vancomycin guidelines) with explicit supersession notices.
- **Loud Clinical Refusal:** Explicitly halts when evidence is missing or investigational, generating structured checklists of required trial data before an order can be drafted.
- **Closed-Loop Doctor-to-Nurse Handover:** Doctors evaluate RAG recommendations, sign tamper-evident prescription orders, and dispatch real-time bedside directives directly to assigned nurses for Medication Administration Record (MAR) sign-off.
- **Persistent PostgreSQL Architecture:** Patient EHR cases, institutional PDF guidelines, prescriptions, and communication logs are backed by a robust PostgreSQL relational schema.
- **Cryptographic Audit Chain:** Every prompt, retrieval filter, human approval, and bedside administration is bound in an append-only, SHA-256 hash-chained audit ledger.

---

## 📐 System Architecture

```mermaid
flowchart TB
    subgraph UI ["Clinician Frontend (Next.js 15 App Router)"]
        DOC["🩺 Attending Physician View<br/>• Clinical RAG Inquiries<br/>• 1-Click Grounded Citations<br/>• Directives Dispatch"]
        NURSE["👩‍⚕️ Bedside Nurse View<br/>• Patient Presentation<br/>• MAR Orders Dropdown<br/>• 1-Click Dose Administration"]
        AUDIT_UI["🛡️ Audit & Safety Ledger<br/>• SHA-256 Hash Verification<br/>• Cryptographic Bundle Export"]
    end

    subgraph API ["Application & Security Middleware"]
        RBAC["🔐 Retrieval-Stage RBAC & Delimiter Defense<br/>• Role Enforcement (PHYSICIAN vs NURSE)<br/>• Prompt Isolation Delimiters"]
        RAG_ENGINE["🧠 Clinical RAG Pipeline<br/>• Multi-Document Fusion (Guidelines + Formulary)<br/>• Cross-Version Contradiction Detection<br/>• Loud Refusal on Missing Evidence"]
        API_ROUTES["⚡ RESTful API Endpoints<br/>• /api/foundation/cases<br/>• /api/foundation/corpus<br/>• /api/foundation/prescriptions<br/>• /api/foundation/messages"]
    end

    subgraph DB ["PostgreSQL Relational Storage (healthcareapp)"]
        T_CASES[("cases<br/>• Patient Intake<br/>• Clinical Context<br/>• AI Synthesis")]
        T_CORPUS[("corpus_documents<br/>• Clinical Guidelines (PDFs)<br/>• Formulary Tables<br/>• ICU SOPs")]
        T_RX[("prescriptions<br/>• Medication & Dosage<br/>• SHA-256 Seals<br/>• Administration Logs")]
        T_MSG[("doctor_messages<br/>• Bedside Directives<br/>• Target Nurse Name<br/>• Acknowledgment Receipts")]
    end

    subgraph AUDIT ["Cryptographic Audit Chain"]
        HASH_CHAIN["🔗 Append-Only SHA-256 Ledger<br/>Hash(N) = SHA256(Event_N + Hash_{N-1})<br/>• QUERY_SUBMITTED<br/>• RETRIEVAL_FILTERED<br/>• AI_RESULT_GENERATED<br/>• HUMAN_APPROVED<br/>• FINAL_ACTION_RECORDED"]
    end

    DOC -->|Clinical Query| API_ROUTES
    NURSE -->|Acknowledge / Administer| API_ROUTES
    API_ROUTES --> RBAC
    RBAC --> RAG_ENGINE
    RAG_ENGINE <--> T_CORPUS
    API_ROUTES <--> T_CASES
    API_ROUTES <--> T_RX
    API_ROUTES <--> T_MSG
    API_ROUTES --> HASH_CHAIN
    HASH_CHAIN --> AUDIT_UI
```

---

## 🔄 End-to-End Clinical Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor Dr as 🩺 Dr. Sarah Rivera (Doctor)
    participant UI as 💻 RelayMD Frontend
    participant API as ⚙️ API / RAG Engine
    participant DB as 🐘 PostgreSQL DB
    actor Nurse as 👩‍⚕️ Nurse Priya Sharma (Nurse)

    Note over UI: Patient Condition & Intake displayed (EHR Baseline)
    Dr->>UI: Submits Clinical Query ("Recommended sepsis bundle...")
    UI->>API: POST /cases/{id}/run-ai (Role: PHYSICIAN)
    API->>DB: Query corpus_documents (Filter by Role RBAC)
    DB-->>API: Return 2024 Guidelines + Formulary Table
    API->>API: Evaluate evidence, check contradictions, cite clauses
    API-->>UI: Grounded AI Output + 1-Click Citations + Verified Seal
    
    Dr->>UI: Reviews output & clicks "Approve & Prescribe"
    UI->>API: POST /cases/{id}/final-action (Signed Order)
    API->>DB: Insert into prescriptions & doctor_messages
    API->>DB: Record SHA-256 Audit Event (HUMAN_APPROVED)
    
    Note over Nurse,UI: Nurse switches role to "Nurse Priya"
    UI->>UI: Bedside Orders Dropdown alerts: 1 Pending Dose + 1 Directive
    Nurse->>UI: Opens "Bedside Orders & MAR" Floating Dropdown
    Nurse->>UI: Clicks "✓ Acknowledge Directive"
    UI->>API: POST /messages (action: markRead)
    Nurse->>UI: Clicks "💉 Administer & Sign Off"
    UI->>API: POST /prescriptions/{id}/administer
    API->>DB: Update prescriptions (Status: ADMINISTERED, AdministeredBy: Nurse Priya)
    UI-->>Nurse: Green Verification Stamp: "✓ Administered at 02:45 PM"
```

---

## 🗄️ PostgreSQL Database Schema

The system persists all clinical state across 4 core relational tables:

```sql
-- 1. Patient Cases Table (EHR records & synthesis)
CREATE TABLE IF NOT EXISTS cases (
    id VARCHAR(64) PRIMARY KEY,
    status VARCHAR(32) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    inputs JSONB NOT NULL DEFAULT '[]',
    ai_results JSONB NOT NULL DEFAULT '[]',
    human_reviews JSONB NOT NULL DEFAULT '[]',
    final_action JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Institutional Clinical Corpus (Guidelines, SOPs & Formularies)
CREATE TABLE IF NOT EXISTS corpus_documents (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    version VARCHAR(32) NOT NULL,
    allowed_roles JSONB NOT NULL,
    passages JSONB NOT NULL DEFAULT '[]',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Doctor Prescriptions & MAR Sign-Offs
CREATE TABLE IF NOT EXISTS prescriptions (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL REFERENCES cases(id),
    patient_name VARCHAR(255) NOT NULL,
    medication TEXT NOT NULL,
    dosage VARCHAR(255) NOT NULL,
    instructions TEXT NOT NULL,
    prescribed_by VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING_ADMINISTRATION',
    administered_by VARCHAR(255),
    administered_at TIMESTAMP WITH TIME ZONE,
    audit_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Closed-Loop Doctor-to-Nurse Bedside Directives
CREATE TABLE IF NOT EXISTS doctor_messages (
    id SERIAL PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL REFERENCES cases(id),
    patient_name VARCHAR(255) NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    target_nurse VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(32) NOT NULL DEFAULT 'INSTRUCTION',
    prescription_id VARCHAR(64),
    read_by_nurse BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🛡️ Clinical Safety & Governance Pillars

| Safety Guardrail | Implementation | Clinical Rationale |
| :--- | :--- | :--- |
| **Retrieval-Stage RBAC** | Document filtering applied before prompt assembly | Prevents nurses or unauthorized roles from accessing restricted ICU narcotics protocols (e.g. SEC-901 policy). |
| **Loud Clinical Refusal** | Structured refusal schema with missing info breakdown | Refuses to guess when clinical trials or formulary rows are unverified, preventing lethal off-label dosage advice. |
| **Contradiction Detection** | Cross-version comparative evaluation | Identifies when legacy 2021 guidance (Trough target) conflicts with 2024 guidance (AUC target) and surfaces supersession alerts. |
| **Tamper-Evident Audit Chain** | Continuous SHA-256 rolling hash chain | Creates legally admissible, cryptographically verifiable records for malpractice defense and hospital compliance. |
| **Delimiter Containment** | Non-executable token framing | Immunizes the clinical RAG prompt against indirect adversarial prompt injection inside clinical notes. |

---

## 🧪 Acceptance Test Suite (26/26 Passing)

The solution is verified by an automated test suite ([`scripts/test-clinical-rag.mjs`](scripts/test-clinical-rag.mjs)) covering all acceptance criteria:

```text
=== RUNNING CLINICALRELAY RAG ACCEPTANCE TESTS (P-02) ===

Test 1: Task Registry Verification
  ✓ PASS: clinical_enterprise_rag task is registered in registry
  ✓ PASS: Prompt version is v2.0.0-rag
  ✓ PASS: Allowed input fields include query

Test 2: Happy Path Retrieval & Grounded 1-Click Citations
  ✓ PASS: Happy path output strictly validates against ClinicalRAGOutput schema
  ✓ PASS: Happy path does not trigger refusal
  ✓ PASS: Happy path produces at least 2 grounded citations
  ✓ PASS: Cites 2024 Sepsis Guideline
  ✓ PASS: Cites Antimicrobial Formulary Table
  ✓ PASS: Happy path yields LOW uncertainty

Test 3: Cross-Version Guideline Contradiction Surfacing
  ✓ PASS: Explicitly flags guideline contradiction
  ✓ PASS: Lists both conflicting guideline sources
  ✓ PASS: Provides supersession resolution guidance
  ✓ PASS: Includes citation to superseded clause for transparency

Test 4: Loud Clinical Refusal on Evidence Gaps
  ✓ PASS: Refusal is triggered loudly
  ✓ PASS: Refusal reason explains lack of validated evidence
  ✓ PASS: Enumerates missing clinical trial & formulary data
  ✓ PASS: Uncertainty is rated HIGH

Test 5: Retrieval-Stage RBAC & Prompt Containment
  ✓ PASS: Retrieval engine blocks restricted document for role NURSE
  ✓ PASS: ICU SEC-901 policy is withheld from passages
  ✓ PASS: Access boundary violation triggers refusal
  ✓ PASS: Warns about credential boundary and prompt injection
  ✓ PASS: Provides access boundary notice

Test 6: Tamper-Evident SHA-256 Audit Chain
  ✓ PASS: Audit chain passes cryptographic SHA-256 hash verification
  ✓ PASS: Exact sequence of 5 events verified
  ✓ PASS: Export bundle includes all 5 events
  ✓ PASS: Export bundle includes verified integrity stamp

=========================================
  Tests Passed: 26 | Tests Failed: 0
=========================================
ALL CLINICALRELAY RAG TESTS PASSED CLEANLY.
```

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14+ running locally or in the cloud (default port: `5432`)
- **Package Manager**: `npm` or `pnpm`

### 2. Environment Configuration
Create a `.env.local` file in the root directory (refer to [`.env.example`](.env.example)):

```bash
# AI Execution Mode ('auto', 'mock', 'live')
AI_MODE=auto
USE_MOCK_AI=false

# PostgreSQL Connection String
DATABASE_URL=postgresql://postgres:password@localhost:5432/healthcareapp

# Optional LLM API Keys (for live inference; offline mock mode operates without keys)
GEMINI_API_KEY=
OPENAI_API_KEY=
```

### 3. Installation & Seeding
```bash
# 1. Install dependencies
npm install

# 2. Seed clinical patient cases into PostgreSQL
node scripts/seed-patients-db.mjs

# 3. Ingest sample PDF guidelines into PostgreSQL
node scripts/generate-deliverables.mjs
```

### 4. Running the Test Suite
```bash
# Execute the comprehensive 26-test acceptance verification
npx tsx scripts/test-clinical-rag.mjs
```

### 5. Starting the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📂 Project Structure

```text
├── context/                             # Architecture specifications & clinical directives
├── deliverables/                        # Track 04 compliance artifacts
│   ├── audit-trail-clinical-sepsis-rag.json  # Cryptographic audit export
│   ├── audit-trail-clinical-sepsis-rag.md    # Human-readable audit log
│   └── privacy-threat-sketch.md              # Threat model & data touchpoint analysis
├── public/                              # Static icons & problem statement specifications
├── scripts/
│   ├── generate-deliverables.mjs        # Deliverables generator script
│   ├── seed-patients-db.mjs             # PostgreSQL patient database seeder
│   └── test-clinical-rag.mjs            # 26-step automated acceptance test suite
├── src/
│   ├── app/                             # Next.js 15 App Router routes
│   │   ├── api/foundation/cases/        # Patient case intake & review endpoints
│   │   ├── api/foundation/corpus/       # PDF & guideline ingestion endpoint
│   │   ├── api/foundation/messages/     # Doctor-to-Nurse messaging endpoint
│   │   ├── api/foundation/prescriptions/# Prescription & MAR administration endpoints
│   │   ├── api/foundation/reset/        # Database & session state reset
│   │   └── foundation/page.tsx          # Main RelayMD clinical consultation workspace
│   └── foundation/                      # Core Clinical Engine
│       ├── ai-service.ts                # Grounded prompt construction & LLM integration
│       ├── audit.ts                     # Tamper-evident SHA-256 audit chaining
│       ├── components/                  # UI components
│       │   ├── ClinicalCopilotChat.tsx  # Interactive chat with floating MAR dropdown
│       │   ├── Header.tsx               # One-click Doctor / Nurse role switcher
│       │   ├── IngestDataModal.tsx      # PDF / Guideline parser & DB uploader
│       │   └── AuditTimeline.tsx        # Cryptographic verification viewer
│       ├── corpus.ts                    # Clinical guidelines & formulary records
│       ├── db.ts                        # PostgreSQL connection pool & schema migrations
│       ├── retrieval.ts                 # Lexical/vector retrieval with RBAC enforcement
│       ├── store.ts                     # Dual-layer store (PostgreSQL + memory cache)
│       └── task-registry.ts             # Schema validation, contradiction & refusal rules
└── README.md
```

---

## ⚖️ Compliance & AI Assistant Declaration

- **AI Coding Assistant Declaration:** In accordance with hackathon guidelines, this system was developed utilizing **Google Antigravity** as an AI pair-programming assistant for rapid scaffolding, database synchronization, and UI optimization.
- **Human-in-the-Loop Guarantee:** Under hospital policy and Section B8 of the Hackathon Governance Framework, AI outputs are strictly treated as non-binding drafts; all clinical actions require mandatory physician authorization and nurse sign-off.
